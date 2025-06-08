
import type {
  TripData,
  ItineraryItem,
  TransferItem,
  ActivityItem,
  HotelItem,
  MealItem,
  MiscItem,
  CostSummary,
  DetailedSummaryItem,
  HotelOccupancyDetail,
  Traveler,
  ServicePriceItem, // Added
  TripSettings // Added
} from '@/types/itinerary';
import { formatCurrency } from './utils';
import { addDays, isWithinInterval, parseISO } from 'date-fns'; // Added

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
  currency: string,
  tripSettings: TripSettings, // Added
  allServicePrices: ServicePriceItem[] // Added
) {
  const { participatingIds: itemOverallParticipatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  
  const checkinDay = item.day;
  const checkoutDay = item.checkoutDay;
  const nights = Math.max(0, checkoutDay - checkinDay);

  let baseSpecificDetails = `In: Day ${checkinDay}, Out: Day ${checkoutDay} (${nights}n). Child Share: ${item.childrenSharingBed ? "Yes" : "No"}`;
  if (item.province) baseSpecificDetails = `Prov: ${item.province}; ${baseSpecificDetails}`;

  if (nights <= 0) {
    return { adultCost: 0, childCost: 0, totalCost: 0, participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, specificDetails: `${baseSpecificDetails}. Invalid nights: ${nights}. No cost.`, occupancyDetails: [], individualContributions: {}, province: item.province };
  }

  let overallHotelTotalCost = 0;
  let itemTotalAdultCost = 0;
  let itemTotalChildCost = 0;
  const individualContributions: { [travelerId: string]: number } = {};
  const occupancyDetails: HotelOccupancyDetail[] = [];
  
  let unassignedRoomCostPool = 0;
  const assignedTravelerIdsInHotel = new Set<string>();

  const selectedService = item.selectedServicePriceId 
    ? allServicePrices.find(sp => sp.id === item.selectedServicePriceId) 
    : undefined;

  item.rooms.forEach(roomConfig => {
    let roomConfigurationTotalCost = 0;
    const numRoomsInConfig = roomConfig.numRooms || 0;
    const extraBedsInConfig = roomConfig.extraBeds || 0;

    for (let currentNight = 0; currentNight < nights; currentNight++) {
      const currentDayOfStay = checkinDay + currentNight;
      const currentDateOfStay = addDays(parseISO(tripSettings.startDate), currentDayOfStay - 1);
      
      let nightlyRoomRate = roomConfig.roomRate || 0;
      let nightlyExtraBedRate = roomConfig.extraBedRate || 0;

      if (selectedService && selectedService.seasonalRates && selectedService.seasonalRates.length > 0) {
        for (const sr of selectedService.seasonalRates) {
          const seasonalStartDate = parseISO(sr.startDate);
          const seasonalEndDate = parseISO(sr.endDate);
          if (isWithinInterval(currentDateOfStay, { start: seasonalStartDate, end: seasonalEndDate })) {
            nightlyRoomRate = sr.roomRate;
            nightlyExtraBedRate = sr.extraBedRate ?? 0; // Use seasonal extra bed rate if available
            break; 
          }
        }
      }
      // If no applicable seasonal rate, nightlyRoomRate and nightlyExtraBedRate remain as roomConfig.roomRate/extraBedRate

      const costForThisNightForOneRoom = nightlyRoomRate + (extraBedsInConfig * nightlyExtraBedRate);
      roomConfigurationTotalCost += costForThisNightForOneRoom * numRoomsInConfig;
    }
    
    overallHotelTotalCost += roomConfigurationTotalCost;

    // Occupancy details use the base rates from roomConfig for display simplicity
    occupancyDetails.push({
      roomCategory: roomConfig.category || "N/A",
      roomType: roomConfig.roomType,
      adults: roomConfig.adultsInRoom,
      children: roomConfig.childrenInRoom,
      extraBeds: extraBedsInConfig,
      nights,
      numRooms: numRoomsInConfig,
      roomRate: roomConfig.roomRate || 0, // Base rate for display
      extraBedRate: roomConfig.extraBedRate || 0, // Base extra bed rate for display
      totalOccupancyCost: roomConfigurationTotalCost, // This is the accurately calculated total for this config
      assignedTravelerLabels: roomConfig.assignedTravelerIds.map(id => allTravelers.find(t => t.id === id)?.label || id).join(", ") || "None",
    });

    const assignedAdultsInRoom = roomConfig.assignedTravelerIds.filter(id => allTravelers.find(t=>t.id===id)?.type === 'adult');
    
    if (assignedAdultsInRoom.length > 0 && roomConfigurationTotalCost > 0) {
      const costPerAssignedAdult = roomConfigurationTotalCost / assignedAdultsInRoom.length;
      assignedAdultsInRoom.forEach(id => {
        individualContributions[id] = (individualContributions[id] || 0) + costPerAssignedAdult;
        assignedTravelerIdsInHotel.add(id);
      });
      itemTotalAdultCost += roomConfigurationTotalCost; 
    } else if (roomConfigurationTotalCost > 0) {
      unassignedRoomCostPool += roomConfigurationTotalCost;
    }
  });
  
  if (unassignedRoomCostPool > 0) {
    const potentialPayers = itemOverallParticipatingIds.filter(id => !assignedTravelerIdsInHotel.has(id));
    const adultPotentialPayers = potentialPayers.filter(id => allTravelers.find(t=>t.id===id)?.type === 'adult');
    const childPotentialPayers = potentialPayers.filter(id => allTravelers.find(t=>t.id===id)?.type === 'child');

    let numPoolPayers = adultPotentialPayers.length;
    let childrenPayFromPool = false;

    if (!item.childrenSharingBed || adultPotentialPayers.length === 0) {
      if (childPotentialPayers.length > 0) {
        numPoolPayers += childPotentialPayers.length;
        childrenPayFromPool = true;
      }
    }
    
    if (numPoolPayers > 0) {
      const perPoolPayerShare = unassignedRoomCostPool / numPoolPayers;
      adultPotentialPayers.forEach(id => {
        individualContributions[id] = (individualContributions[id] || 0) + perPoolPayerShare;
        itemTotalAdultCost += perPoolPayerShare;
      });
      if (childrenPayFromPool) {
        childPotentialPayers.forEach(id => {
          individualContributions[id] = (individualContributions[id] || 0) + perPoolPayerShare;
          itemTotalChildCost += perPoolPayerShare;
        });
      }
    } else { 
        const allParticipatingAdults = itemOverallParticipatingIds.filter(id => allTravelers.find(t => t.id === id)?.type === 'adult');
        const allParticipatingChildren = itemOverallParticipatingIds.filter(id => allTravelers.find(t => t.id === id)?.type === 'child');
        if (allParticipatingAdults.length > 0) {
            const share = unassignedRoomCostPool / allParticipatingAdults.length;
            allParticipatingAdults.forEach(id => {
                individualContributions[id] = (individualContributions[id] || 0) + share;
            });
            itemTotalAdultCost += unassignedRoomCostPool;
        } else if (allParticipatingChildren.length > 0 && !item.childrenSharingBed) {
             const share = unassignedRoomCostPool / allParticipatingChildren.length;
            allParticipatingChildren.forEach(id => {
                individualContributions[id] = (individualContributions[id] || 0) + share;
            });
            itemTotalChildCost += unassignedRoomCostPool;
        }
    }
  }

  return { adultCost: itemTotalAdultCost, childCost: itemTotalChildCost, totalCost: overallHotelTotalCost, participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, specificDetails: baseSpecificDetails, occupancyDetails, individualContributions, province: item.province };
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


export function calculateAllCosts(tripData: TripData, allServicePrices: ServicePriceItem[]): CostSummary {
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
          calculationResult = calculateHotelCost(item, tripData.travelers, currency, tripData.settings, allServicePrices);
          break;
        case 'meal':
          calculationResult = calculateMealCost(item, tripData.travelers, currency);
          break;
        case 'misc':
          calculationResult = calculateMiscCost(item, tripData.travelers, currency);
          break;
        default:
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
  detailedItems.forEach(item => {
    item.adultCost = parseFloat(item.adultCost.toFixed(2));
    item.childCost = parseFloat(item.childCost.toFixed(2));
    item.totalCost = parseFloat(item.totalCost.toFixed(2));
    if (item.occupancyDetails) {
        item.occupancyDetails.forEach(od => {
            od.totalOccupancyCost = parseFloat(od.totalOccupancyCost.toFixed(2));
            // Ensure roomRate and extraBedRate in occupancyDetails are also rounded if displayed directly
            od.roomRate = parseFloat(od.roomRate.toFixed(2));
            od.extraBedRate = parseFloat(od.extraBedRate.toFixed(2));
        });
    }
  });


  return { grandTotal, perPersonTotals, detailedItems };
}
