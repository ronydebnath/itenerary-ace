/**
 * @fileoverview This file houses the core logic for calculating costs related to itinerary items.
 * It includes functions to determine costs for transfers, activities, hotel stays, meals, and
 * miscellaneous items. It considers factors like participating travelers, pricing modes (ticket vs. vehicle),
 * seasonal rates for hotels, and different cost assignment methods. The main exported function,
 * `calculateAllCosts`, aggregates these individual calculations to provide a comprehensive
 * cost summary for the entire trip, including per-person totals and detailed item breakdowns.
 *
 * @bangla এই ফাইলটিতে ভ্রমণপথের আইটেমগুলির সাথে সম্পর্কিত খরচ গণনার মূল যুক্তি রয়েছে।
 * এটিতে ট্রান্সফার, কার্যকলাপ, হোটেল থাকা, খাবার এবং বিভিন্ন আইটেমের খরচ নির্ধারণ করার
 * ফাংশন অন্তর্ভুক্ত রয়েছে। এটি অংশগ্রহণকারী ভ্রমণকারী, মূল্যের ধরণ (টিকিট বনাম যান),
 * হোটেলের জন্য মরশুমি হার এবং বিভিন্ন খরচ নির্ধারণ পদ্ধতি বিবেচনা করে। প্রধান এক্সপোর্ট করা ফাংশন,
 * `calculateAllCosts`, এই পৃথক গণনাগুলিকে একত্রিত করে পুরো ভ্রমণের জন্য একটি ব্যাপক
 * খরচ সারাংশ প্রদান করে, যার মধ্যে প্রতি-ব্যক্তি মোট এবং বিস্তারিত আইটেম ব্রেকডাউন অন্তর্ভুক্ত।
 */
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
  SelectedHotelRoomConfiguration,
  SurchargePeriod,
  CurrencyCode
} from '@/types/itinerary';
import { formatCurrency } from './utils';
import { addDays, isWithinInterval, parseISO, format, isValid, startOfDay } from 'date-fns'; 

function getParticipatingTravelers(item: ItineraryItem, allTravelers: Traveler[]) {
  const participatingTravelers = allTravelers.filter(t => !item.excludedTravelerIds.includes(t.id));
  return {
    adultCount: participatingTravelers.filter(t => t.type === 'adult').length,
    childCount: participatingTravelers.filter(t => t.type === 'child').length,
    participatingIds: participatingTravelers.map(t => t.id),
    excludedTravelerLabels: allTravelers.filter(t => item.excludedTravelerIds.includes(t.id)).map(t => t.label),
  };
}

function calculateTransferCost(
  item: TransferItem, 
  allTravelers: Traveler[], 
  currency: CurrencyCode,
  tripSettings: TripSettings,
  allServicePrices: ServicePriceItem[]
) {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  let adultCost = 0;
  let childCost = 0;
  let totalCost = 0;
  let specificDetails = `Mode: ${item.mode}`;
  if (item.province) specificDetails += `; Prov: ${item.province}`;
  const individualContributions: { [travelerId: string]: number } = {};

  const serviceDefinition = item.selectedServicePriceId ? allServicePrices.find(sp => sp.id === item.selectedServicePriceId) : undefined;
  const selectedVehicleOption = serviceDefinition?.vehicleOptions?.find(vo => vo.id === item.selectedVehicleOptionId);


  if (item.mode === 'ticket') {
    const adultPrice = (serviceDefinition?.price1 ?? item.adultTicketPrice) || 0;
    const childPrice = serviceDefinition?.price2 ?? item.childTicketPrice ?? adultPrice; 
    
    adultCost = adultCount * adultPrice;
    childCost = childCount * childPrice;
    totalCost = adultCost + childCost;
    specificDetails += `; Ticket Based`; // Removed price details
    participatingIds.forEach(id => {
      individualContributions[id] = (allTravelers.find(t=>t.id===id)?.type === 'adult' ? adultPrice : childPrice);
    });
  } else { // vehicle mode
    const numVehicles = item.vehicles || 1;
    
    let baseCostPerVehicle = item.costPerVehicle || 0;
    let vehicleTypeDisplay = item.vehicleType || 'N/A';

    if (selectedVehicleOption) {
      baseCostPerVehicle = selectedVehicleOption.price;
      vehicleTypeDisplay = selectedVehicleOption.vehicleType;
    } else if (serviceDefinition && (!serviceDefinition.vehicleOptions || serviceDefinition.vehicleOptions.length === 0)) {
      baseCostPerVehicle = serviceDefinition.price1 ?? item.costPerVehicle ?? 0;
    }
    
    let appliedSurcharge = 0;
    let surchargeName = "";

    if (tripSettings.startDate && serviceDefinition?.surchargePeriods?.length) {
      try {
        const transferDate = addDays(parseISO(tripSettings.startDate), item.day - 1);
        const surchargePeriods = serviceDefinition.surchargePeriods || [];
        
        for (const period of surchargePeriods) {
          if (period.startDate && period.endDate) {
             const periodStartDate = parseISO(period.startDate);
             const periodEndDate = parseISO(period.endDate);
            if (isValid(periodStartDate) && isValid(periodEndDate) && isWithinInterval(transferDate, { start: periodStartDate, end: periodEndDate })) {
              appliedSurcharge = period.surchargeAmount;
              surchargeName = period.name;
              break; 
            }
          }
        }
      } catch (e) {
        console.error("Error calculating transfer surcharge date:", e);
      }
    }
    
    const finalCostPerVehicle = baseCostPerVehicle + appliedSurcharge;
    const vehicleTotalCost = finalCostPerVehicle * numVehicles;
    totalCost = vehicleTotalCost;
    
    specificDetails += `; Type: ${vehicleTypeDisplay}; #Veh: ${numVehicles}`; // Removed price details
    if (appliedSurcharge > 0) {
        specificDetails += `; Surcharge Applied: ${surchargeName}`;
    }
    
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

function calculateActivityCost(item: ActivityItem, allTravelers: Traveler[], currency: CurrencyCode) {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  const adultPrice = item.adultPrice || 0;
  const childPrice = item.childPrice ?? adultPrice;

  const adultCost = adultCount * adultPrice;
  const childCost = childCount * childPrice;
  const totalCost = adultCost + childCost;
  
  const startDay = item.day;
  const endDay = item.endDay || startDay;
  const duration = Math.max(1, endDay - startDay + 1);

  let specificDetails = `Day ${startDay}${duration > 1 ? '-' + endDay : ''} (Dur: ${duration}d). Fixed Price.`; // Removed price details
  if (item.province) specificDetails += `; Prov: ${item.province}`;

  const individualContributions: { [travelerId: string]: number } = {};
  participatingIds.forEach(id => {
    individualContributions[id] = (allTravelers.find(t=>t.id===id)?.type === 'adult' ? adultPrice : childPrice);
  });

  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions, province: item.province };
}

function calculateHotelCost(
  item: HotelItem,
  allTravelers: Traveler[],
  currency: CurrencyCode, 
  tripSettings: TripSettings,
  allHotelDefinitionsSafe: HotelDefinition[]
) {
  const { participatingIds: itemOverallParticipatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  
  const checkinDay = item.day;
  const checkoutDay = item.checkoutDay; 
  const nights = Math.max(0, checkoutDay - checkinDay);

  const hotelDefinition = allHotelDefinitionsSafe.find(hd => hd.id === item.hotelDefinitionId);

  let baseSpecificDetails = `Hotel: ${hotelDefinition?.name || item.name || 'Unknown Hotel'}`;
  if (item.province) baseSpecificDetails += ` (${item.province})`;
  baseSpecificDetails += `. Check-in: Day ${checkinDay}, Check-out: Day ${checkoutDay} (${nights} nights).`;

  if (!hotelDefinition) {
    console.warn(`Hotel definition not found for ID: ${item.hotelDefinitionId}. Item name: ${item.name}`);
    return { 
      adultCost: 0, childCost: 0, totalCost: 0, 
      participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, 
      specificDetails: `${baseSpecificDetails} Error: Hotel definition not found. Ensure hotel is selected and definition exists.`, 
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
  const individualContributions: { [travelerId: string]: number } = {};


  (item.selectedRooms || []).forEach((selectedRoom: SelectedHotelRoomConfiguration) => {
    const roomTypeDef = hotelDefinition.roomTypes.find(rt => rt.id === selectedRoom.roomTypeDefinitionId);
    if (!roomTypeDef) {
      console.warn(`Room type definition ${selectedRoom.roomTypeDefinitionId} (cache: ${selectedRoom.roomTypeNameCache}) not found for hotel ${hotelDefinition.name}. Skipping cost for this room block.`);
      occupancyDetailsForSummary.push({
        roomTypeName: selectedRoom.roomTypeNameCache || "Unknown Room Type",
        numRooms: selectedRoom.numRooms,
        nights,
        characteristics: "Error: Room type definition missing.",
        assignedTravelerLabels: selectedRoom.assignedTravelerIds.map(id => allTravelers.find(t => t.id === id)?.label || id).join(", ") || "None",
        totalRoomBlockCost: 0,
        extraBedAdded: selectedRoom.addExtraBed,
      });
      return; 
    }

    let costForThisRoomBlock = 0;
    for (let currentNightIndex = 0; currentNightIndex < nights; currentNightIndex++) {
      const dayNumberOfStay = checkinDay + currentNightIndex;
      let currentDateOfStay: Date;
      try {
         currentDateOfStay = startOfDay(addDays(parseISO(tripSettings.startDate), dayNumberOfStay - 1));
      } catch (e) {
        console.error("Error parsing tripSettings.startDate in nightly loop for hotel cost:", tripSettings.startDate, e);
        continue; 
      }
      
      let nightlyRateForRoomType = 0;
      let extraBedRateForNight = 0;
      let foundSeasonalRate = false;

      for (const seasonalPrice of roomTypeDef.seasonalPrices) {
        if (seasonalPrice.startDate && seasonalPrice.endDate && typeof seasonalPrice.startDate === 'string' && typeof seasonalPrice.endDate === 'string') {
          try {
            const seasonStartDate = startOfDay(parseISO(seasonalPrice.startDate));
            const seasonEndDate = startOfDay(parseISO(seasonalPrice.endDate));
            
            if (isValid(seasonStartDate) && isValid(seasonEndDate)) {
              if (isWithinInterval(currentDateOfStay, { start: seasonStartDate, end: seasonEndDate })) {
                nightlyRateForRoomType = seasonalPrice.rate;
                if (selectedRoom.addExtraBed && roomTypeDef.extraBedAllowed && seasonalPrice.extraBedRate !== undefined) {
                  extraBedRateForNight = seasonalPrice.extraBedRate;
                }
                foundSeasonalRate = true;
                break; 
              }
            } else {
              console.warn(`Invalid parsed season dates for ${seasonalPrice.seasonName || 'Unnamed'} (Room: ${roomTypeDef.name}). Start: ${seasonalPrice.startDate}, End: ${seasonalPrice.endDate}`);
            }
          } catch (dateParseError) {
            console.warn(`Skipping seasonal rate due to invalid date format: Start='${seasonalPrice.startDate}', End='${seasonalPrice.endDate}' for room type '${roomTypeDef.name}'`, dateParseError);
          }
        } else {
           console.warn(`Skipping seasonal rate due to missing or invalid date strings for room type '${roomTypeDef.name}'`);
        }
      }
      
      if (!foundSeasonalRate) {
        console.warn(`No seasonal rate found for room type '${roomTypeDef.name}' on ${format(currentDateOfStay, 'yyyy-MM-dd')}. Assuming 0 rate for this night.`);
        nightlyRateForRoomType = 0; 
        extraBedRateForNight = 0;
      }
      costForThisRoomBlock += (nightlyRateForRoomType + extraBedRateForNight) * selectedRoom.numRooms;
    }
    overallHotelTotalCost += costForThisRoomBlock;

    occupancyDetailsForSummary.push({
      roomTypeName: roomTypeDef.name,
      numRooms: selectedRoom.numRooms,
      nights,
      characteristics: (roomTypeDef.characteristics || []).map(c => `${c.key}: ${c.value}`).join('; ') || 'N/A',
      assignedTravelerLabels: selectedRoom.assignedTravelerIds.map(id => allTravelers.find(t => t.id === id)?.label || id).join(", ") || "None",
      totalRoomBlockCost: costForThisRoomBlock,
      extraBedAdded: selectedRoom.addExtraBed && roomTypeDef.extraBedAllowed,
    });

    const assignedParticipants = allTravelers.filter(t => selectedRoom.assignedTravelerIds.includes(t.id));
    if (assignedParticipants.length > 0 && costForThisRoomBlock > 0) {
        const costPerAssignedPerson = costForThisRoomBlock / assignedParticipants.length;
        assignedParticipants.forEach(p => {
            individualContributions[p.id] = (individualContributions[p.id] || 0) + costPerAssignedPerson;
        });
    } else if (costForThisRoomBlock > 0 && itemOverallParticipatingIds.length > 0) {
        const costPerOverallParticipant = costForThisRoomBlock / itemOverallParticipatingIds.length;
         itemOverallParticipatingIds.forEach(id => {
            individualContributions[id] = (individualContributions[id] || 0) + costPerOverallParticipant;
        });
    }
  });
  
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


function calculateMealCost(item: MealItem, allTravelers: Traveler[], currency: CurrencyCode) {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  const adultPrice = item.adultMealPrice || 0;
  const childPrice = item.childMealPrice ?? adultPrice;
  const numMeals = item.totalMeals || 0;

  const adultCost = adultCount * adultPrice * numMeals;
  const childCost = childCount * childPrice * numMeals;
  const totalCost = adultCost + childCost;

  let specificDetails = `# Meals: ${numMeals}`; // Removed price details
  if (item.province) specificDetails += `; Prov: ${item.province}`;
  const individualContributions: { [travelerId: string]: number } = {};
  const adultMealTotal = adultPrice * numMeals;
  const childMealTotal = childPrice * numMeals;

  participatingIds.forEach(id => {
    individualContributions[id] = (allTravelers.find(t=>t.id===id)?.type === 'adult' ? adultMealTotal : childMealTotal);
  });
  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions, province: item.province };
}

function calculateMiscCost(item: MiscItem, allTravelers: Traveler[], currency: CurrencyCode) {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  const unitCost = item.unitCost || 0;
  const quantity = item.quantity || 1;
  const itemTotalForCalculation = unitCost * quantity;
  
  let adultCost = 0;
  let childCost = 0;
  let totalCost = 0;
  let specificDetails = `Assign: ${item.costAssignment}, Qty: ${quantity}`; // Removed price details
  if (item.province) specificDetails += `; Prov: ${item.province}`;
  const individualContributions: { [travelerId: string]: number } = {};

  if (item.costAssignment === 'perPerson') {
    adultCost = adultCount * itemTotalForCalculation;
    childCost = childCount * itemTotalForCalculation;
    totalCost = adultCost + childCost;
    // specificDetails += `; Total: ${formatCurrency(totalCost, currency)} (Per Pers)`; // Removed price details
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
    // specificDetails += `; Total Shared: ${formatCurrency(totalCost, currency)}`; // Removed price details
  }
  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions, province: item.province };
}


export function calculateAllCosts(
  tripData: TripData, 
  allServicePricesInput?: ServicePriceItem[], 
  allHotelDefinitionsInput?: HotelDefinition[] 
): CostSummary {
  const allServicePrices = Array.isArray(allServicePricesInput) ? allServicePricesInput : [];
  const allHotelDefinitions = Array.isArray(allHotelDefinitionsInput) ? allHotelDefinitionsInput : [];

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
          calculationResult = calculateTransferCost(item, tripData.travelers, currency, tripData.settings, allServicePrices);
          break;
        case 'activity':
          calculationResult = calculateActivityCost(item, tripData.travelers, currency);
          break;
        case 'hotel':
          calculationResult = calculateHotelCost(item, tripData.travelers, currency, tripData.settings, allHotelDefinitions);
          break;
        case 'meal':
          calculationResult = calculateMealCost(item, tripData.travelers, currency);
          break;
        case 'misc':
          calculationResult = calculateMiscCost(item, tripData.travelers, currency);
          break;
        default:
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
        countryName: item.countryName,
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
