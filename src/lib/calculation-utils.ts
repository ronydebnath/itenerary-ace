
import type {
  TripData,
  ItineraryItem,
  TransferItem,
  ActivityItem,
  HotelItem, // Now the new HotelItem type
  MealItem,
  MiscItem,
  CostSummary,
  DetailedSummaryItem,
  HotelOccupancyDetail, // Updated type
  Traveler,
  ServicePriceItem, 
  TripSettings,
  HotelDefinition, // New type for hotel definitions
  HotelRoomTypeDefinition,
  RoomTypeSeasonalPrice,
  SelectedHotelRoomConfiguration
} from '@/types/itinerary';
import { formatCurrency } from './utils';
import { addDays, isWithinInterval, parseISO, format } from 'date-fns'; 

function getParticipatingTravelers(item: ItineraryItem, allTravelers: Traveler[]) {
  const participatingTravelers = allTravelers.filter(t => !item.excludedTravelerIds.includes(t.id));
  return {
    adultCount: participatingTravelers.filter(t => t.type === 'adult').length,
    childCount: participatingTravelers.filter(t => t.type === 'child').length,
    participatingIds: participatingTravelers.map(t => t.id),
    excludedTravelerLabels: allTravelers.filter(t => item.excludedTravelerIds.includes(t.id)).map(t => t.label),
  };
}

function calculateTransferCost(item: TransferItem, allTravelers: Traveler[], currency: string) {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  let adultCost = 0;
  let childCost = 0;
  let totalCost = 0;
  let specificDetails = `Mode: ${item.mode}`;
  if (item.province) specificDetails = `Prov: ${item.province}; ${specificDetails}`;
  const individualContributions: { [travelerId: string]: number } = {};

  if (item.mode === 'ticket') {
    const adultPrice = item.adultTicketPrice || 0;
    const childPrice = item.childTicketPrice ?? adultPrice; 
    
    adultCost = adultCount * adultPrice;
    childCost = childCount * childPrice;
    totalCost = adultCost + childCost;
    specificDetails += `; Ad: ${formatCurrency(adultPrice, currency)}, Ch: ${formatCurrency(childPrice, currency)}`;
    participatingIds.forEach(id => {
      individualContributions[id] = (allTravelers.find(t=>t.id===id)?.type === 'adult' ? adultPrice : childPrice);
    });
  } else { 
    const costPerVehicle = item.costPerVehicle || 0;
    const numVehicles = item.vehicles || 1;
    const vehicleTotalCost = costPerVehicle * numVehicles;
    totalCost = vehicleTotalCost;
    specificDetails += `; Type: ${item.vehicleType || 'N/A'}; #Veh: ${numVehicles}; Cost/V: ${formatCurrency(costPerVehicle, currency)}; Total: ${formatCurrency(vehicleTotalCost, currency)}`;
    
    const totalParticipants = adultCount + childCount;
    if (totalParticipants > 0) {
      const perPersonShare = vehicleTotalCost / totalParticipants;
      adultCost = perPersonShare * adultCount;
      childCost = perPersonShare * childCount;
      participatingIds.forEach(id => {
        individualContributions[id] = perPersonShare;
      });
    }
  }
  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions, province: item.province };
}

function calculateActivityCost(item: ActivityItem, allTravelers: Traveler[], currency: string) {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  const adultPrice = item.adultPrice || 0;
  const childPrice = item.childPrice ?? adultPrice;

  const adultCost = adultCount * adultPrice;
  const childCost = childCount * childPrice;
  const totalCost = adultCost + childCost;
  
  const startDay = item.day;
  const endDay = item.endDay || startDay;
  const duration = Math.max(1, endDay - startDay + 1);

  let specificDetails = `Day ${startDay}${duration > 1 ? '-' + endDay : ''} (Dur: ${duration}d). Ad: ${formatCurrency(adultPrice, currency)}, Ch: ${formatCurrency(childPrice, currency)}. Fixed Price.`;
  if (item.province) specificDetails = `Prov: ${item.province}; ${specificDetails}`;

  const individualContributions: { [travelerId: string]: number } = {};
  participatingIds.forEach(id => {
    individualContributions[id] = (allTravelers.find(t=>t.id===id)?.type === 'adult' ? adultPrice : childPrice);
  });

  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions, province: item.province };
}

function calculateHotelCost(
  item: HotelItem,
  allTravelers: Traveler[],
  currency: string, // Currency is for display in specificDetails, rates are assumed to be in this currency from definition
  tripSettings: TripSettings,
  allHotelDefinitions: HotelDefinition[] // New parameter
) {
  const { participatingIds: itemOverallParticipatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  
  const checkinDay = item.day;
  const checkoutDay = item.checkoutDay; // This is the day number OF checkout.
  const nights = Math.max(0, checkoutDay - checkinDay);

  const hotelDefinition = allHotelDefinitions.find(hd => hd.id === item.hotelDefinitionId);

  let baseSpecificDetails = `Hotel: ${hotelDefinition?.name || 'Unknown Hotel'} (ID: ${item.hotelDefinitionId || 'N/A'})`;
  if (item.province) baseSpecificDetails += `; Prov: ${item.province}`;
  baseSpecificDetails += `. Check-in: Day ${checkinDay}, Check-out: Day ${checkoutDay} (${nights} nights).`;

  if (!hotelDefinition) {
    return { 
      adultCost: 0, childCost: 0, totalCost: 0, 
      participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, 
      specificDetails: `${baseSpecificDetails} Error: Hotel definition not found.`, 
      occupancyDetails: [], individualContributions: {}, province: item.province 
    };
  }

  if (nights <= 0) {
    return { 
      adultCost: 0, childCost: 0, totalCost: 0, 
      participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, 
      specificDetails: `${baseSpecificDetails} Invalid nights: ${nights}. No cost.`, 
      occupancyDetails: [], individualContributions: {}, province: item.province 
    };
  }

  if (!tripSettings.startDate || typeof tripSettings.startDate !== 'string' || tripSettings.startDate.trim() === '') {
    console.error("CRITICAL: Invalid tripSettings.startDate in calculateHotelCost:", tripSettings.startDate);
    return { 
      adultCost: 0, childCost: 0, totalCost: 0, 
      participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, 
      specificDetails: `${baseSpecificDetails} Error: Invalid trip start date for cost calculation.`, 
      occupancyDetails: [], individualContributions: {}, province: item.province 
    };
  }
  
  let overallHotelTotalCost = 0;
  const occupancyDetailsForSummary: HotelOccupancyDetail[] = [];
  // Cost distribution per traveler needs to be re-evaluated based on the new structure.
  // For now, sum total cost. Per-person distribution is complex if rooms have different occupancies.
  // Let's simplify for now and attribute total cost to adults primarily, or distribute among participants.
  const individualContributions: { [travelerId: string]: number } = {};


  item.selectedRooms.forEach((selectedRoom: SelectedHotelRoomConfiguration) => {
    const roomTypeDef = hotelDefinition.roomTypes.find(rt => rt.id === selectedRoom.roomTypeDefinitionId);
    if (!roomTypeDef) {
      console.warn(`Room type definition ${selectedRoom.roomTypeDefinitionId} not found for hotel ${hotelDefinition.name}. Skipping cost.`);
      return; // Skip this selected room configuration
    }

    let costForThisRoomBlock = 0;
    for (let currentNightIndex = 0; currentNightIndex < nights; currentNightIndex++) {
      const dayNumberOfStay = checkinDay + currentNightIndex;
      let currentDateOfStay: Date;
      try {
         currentDateOfStay = addDays(parseISO(tripSettings.startDate), dayNumberOfStay - 1);
      } catch (e) {
        console.error("Error parsing tripSettings.startDate in nightly loop for hotel cost:", tripSettings.startDate, e);
        continue; // Skip this night if date is invalid
      }

      let nightlyRateForRoomType = 0;
      let foundSeasonalRate = false;

      // Find the applicable seasonal rate for the current date of stay
      for (const seasonalPrice of roomTypeDef.seasonalPrices) {
        if (seasonalPrice.startDate && seasonalPrice.endDate && typeof seasonalPrice.startDate === 'string' && typeof seasonalPrice.endDate === 'string') {
          try {
            const seasonStartDate = parseISO(seasonalPrice.startDate);
            const seasonEndDate = parseISO(seasonalPrice.endDate);
            if (isWithinInterval(currentDateOfStay, { start: seasonStartDate, end: seasonEndDate })) {
              nightlyRateForRoomType = seasonalPrice.rate;
              foundSeasonalRate = true;
              break; 
            }
          } catch (dateParseError) {
            console.warn(`Skipping seasonal rate due to invalid date format: Start='${seasonalPrice.startDate}', End='${seasonalPrice.endDate}' for room type '${roomTypeDef.name}'`, dateParseError);
          }
        } else {
           console.warn(`Skipping seasonal rate due to missing or invalid date strings for room type '${roomTypeDef.name}'`);
        }
      }
      
      if (!foundSeasonalRate) {
        // Fallback logic if no seasonal rate covers the date - could be an error, or use a default if defined
        // For now, if no rate is found for a night, it means 0 cost for that night (or could be an error state)
        console.warn(`No seasonal rate found for room type '${roomTypeDef.name}' on ${format(currentDateOfStay, 'yyyy-MM-dd')}. Assuming 0 rate for this night.`);
        nightlyRateForRoomType = 0; 
      }
      costForThisRoomBlock += nightlyRateForRoomType * selectedRoom.numRooms;
    }
    overallHotelTotalCost += costForThisRoomBlock;

    occupancyDetailsForSummary.push({
      roomTypeName: roomTypeDef.name,
      numRooms: selectedRoom.numRooms,
      nights,
      characteristics: roomTypeDef.characteristics.map(c => `${c.key}: ${c.value}`).join('; '),
      assignedTravelerLabels: selectedRoom.assignedTravelerIds.map(id => allTravelers.find(t => t.id === id)?.label || id).join(", ") || "None",
      totalRoomBlockCost: costForThisRoomBlock,
    });

    // Simplified cost distribution for this room block among its assigned travelers
    const assignedParticipants = allTravelers.filter(t => selectedRoom.assignedTravelerIds.includes(t.id));
    if (assignedParticipants.length > 0 && costForThisRoomBlock > 0) {
        const costPerAssignedPerson = costForThisRoomBlock / assignedParticipants.length;
        assignedParticipants.forEach(p => {
            individualContributions[p.id] = (individualContributions[p.id] || 0) + costPerAssignedPerson;
        });
    } else if (costForThisRoomBlock > 0 && itemOverallParticipatingIds.length > 0) {
        // If no one assigned to this specific room, or if cost remains, distribute among all item participants
        const costPerOverallParticipant = costForThisRoomBlock / itemOverallParticipatingIds.length;
         itemOverallParticipatingIds.forEach(id => {
            individualContributions[id] = (individualContributions[id] || 0) + costPerOverallParticipant;
        });
    }
  });
  
  // Consolidate adult/child costs from individualContributions
  let itemTotalAdultCost = 0;
  let itemTotalChildCost = 0;
  itemOverallParticipatingIds.forEach(id => {
    const traveler = allTravelers.find(t => t.id === id);
    if (traveler && individualContributions[id]) {
      if (traveler.type === 'adult') {
        itemTotalAdultCost += individualContributions[id];
      } else {
        itemTotalChildCost += individualContributions[id];
      }
    }
  });


  return { 
    adultCost: itemTotalAdultCost, 
    childCost: itemTotalChildCost, 
    totalCost: overallHotelTotalCost, 
    participatingIds: itemOverallParticipatingIds, 
    excludedTravelerLabels, 
    specificDetails: baseSpecificDetails, 
    occupancyDetails: occupancyDetailsForSummary, 
    individualContributions, 
    province: item.province 
  };
}


function calculateMealCost(item: MealItem, allTravelers: Traveler[], currency: string) {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  const adultPrice = item.adultMealPrice || 0;
  const childPrice = item.childMealPrice ?? adultPrice;
  const numMeals = item.totalMeals || 0;

  const adultCost = adultCount * adultPrice * numMeals;
  const childCost = childCount * childPrice * numMeals;
  const totalCost = adultCost + childCost;

  let specificDetails = `# Meals: ${numMeals}, Ad: ${formatCurrency(adultPrice, currency)}, Ch: ${formatCurrency(childPrice, currency)}`;
  if (item.province) specificDetails = `Prov: ${item.province}; ${specificDetails}`;
  const individualContributions: { [travelerId: string]: number } = {};
  const adultMealTotal = adultPrice * numMeals;
  const childMealTotal = childPrice * numMeals;

  participatingIds.forEach(id => {
    individualContributions[id] = (allTravelers.find(t=>t.id===id)?.type === 'adult' ? adultMealTotal : childMealTotal);
  });
  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions, province: item.province };
}

function calculateMiscCost(item: MiscItem, allTravelers: Traveler[], currency: string) {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  const unitCost = item.unitCost || 0;
  const quantity = item.quantity || 1;
  const itemTotalForCalculation = unitCost * quantity;
  
  let adultCost = 0;
  let childCost = 0;
  let totalCost = 0;
  let specificDetails = `Assign: ${item.costAssignment}, Cost: ${formatCurrency(unitCost, currency)}, Qty: ${quantity}`;
  if (item.province) specificDetails = `Prov: ${item.province}; ${specificDetails}`;
  const individualContributions: { [travelerId: string]: number } = {};

  if (item.costAssignment === 'perPerson') {
    adultCost = adultCount * itemTotalForCalculation;
    childCost = childCount * itemTotalForCalculation;
    totalCost = adultCost + childCost;
    specificDetails += `; Total: ${formatCurrency(totalCost, currency)} (Per Pers)`;
    participatingIds.forEach(id => {
      individualContributions[id] = itemTotalForCalculation;
    });
  } else { 
    totalCost = itemTotalForCalculation;
    const totalParticipants = adultCount + childCount;
    if (totalParticipants > 0) {
      const perPersonShare = itemTotalForCalculation / totalParticipants;
      adultCost = perPersonShare * adultCount;
      childCost = perPersonShare * childCount;
      participatingIds.forEach(id => {
        individualContributions[id] = perPersonShare;
      });
    }
    specificDetails += `; Total Shared: ${formatCurrency(totalCost, currency)}`;
  }
  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions, province: item.province };
}


export function calculateAllCosts(
  tripData: TripData, 
  allServicePrices: ServicePriceItem[], // For non-hotel items
  allHotelDefinitions: HotelDefinition[] // For hotel items
): CostSummary {
  let grandTotal = 0;
  const perPersonTotals: { [travelerId: string]: number } = {};
  tripData.travelers.forEach(t => perPersonTotals[t.id] = 0);
  const detailedItems: DetailedSummaryItem[] = [];
  const currency = tripData.pax.currency;

  Object.values(tripData.days).forEach(dayItinerary => {
    dayItinerary.items.forEach(item => {
      let calculationResult;
      switch (item.type) {
        case 'transfer':
          calculationResult = calculateTransferCost(item, tripData.travelers, currency);
          break;
        case 'activity':
          calculationResult = calculateActivityCost(item, tripData.travelers, currency);
          break;
        case 'hotel':
          // Pass allHotelDefinitions to calculateHotelCost
          calculationResult = calculateHotelCost(item, tripData.travelers, currency, tripData.settings, allHotelDefinitions);
          break;
        case 'meal':
          calculationResult = calculateMealCost(item, tripData.travelers, currency);
          break;
        case 'misc':
          calculationResult = calculateMiscCost(item, tripData.travelers, currency);
          break;
        default:
          // Should not happen with TypeScript, but good for safety
          console.warn("Unknown item type encountered in calculation:", (item as any).type);
          return; 
      }
      
      grandTotal += calculationResult.totalCost;
      Object.entries(calculationResult.individualContributions).forEach(([travelerId, cost]) => {
        if (perPersonTotals[travelerId] !== undefined) {
          perPersonTotals[travelerId] += cost;
        }
      });

      detailedItems.push({
        id: item.id,
        type: item.type.charAt(0).toUpperCase() + item.type.slice(1) + 's', 
        day: tripData.settings.numDays > 1 ? item.day : undefined,
        name: item.name,
        note: item.note,
        province: calculationResult.province,
        configurationDetails: calculationResult.specificDetails,
        excludedTravelers: calculationResult.excludedTravelerLabels.join(', ') || 'None',
        adultCost: calculationResult.adultCost,
        childCost: calculationResult.childCost,
        totalCost: calculationResult.totalCost,
        occupancyDetails: (item.type === 'hotel' ? (calculationResult as any).occupancyDetails : undefined) as HotelOccupancyDetail[] | undefined,
      });
    });
  });
  
  grandTotal = parseFloat(grandTotal.toFixed(2));
  Object.keys(perPersonTotals).forEach(id => {
    perPersonTotals[id] = parseFloat(perPersonTotals[id].toFixed(2));
  });
  detailedItems.forEach(dItem => {
    dItem.adultCost = parseFloat(dItem.adultCost.toFixed(2));
    dItem.childCost = parseFloat(dItem.childCost.toFixed(2));
    dItem.totalCost = parseFloat(dItem.totalCost.toFixed(2));
    if (dItem.occupancyDetails) {
        dItem.occupancyDetails.forEach(od => {
            od.totalRoomBlockCost = parseFloat(od.totalRoomBlockCost.toFixed(2));
        });
    }
  });

  return { grandTotal, perPersonTotals, detailedItems };
}
