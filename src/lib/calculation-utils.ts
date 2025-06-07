
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
  Traveler
} from '@/types/itinerary';
import { formatCurrency } from './utils';

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
  const individualContributions: { [travelerId: string]: number } = {};

  if (item.mode === 'ticket') {
    const adultPrice = item.adultTicketPrice || 0;
    const childPrice = item.childTicketPrice ?? adultPrice; // Child price defaults to adult price if not specified
    
    adultCost = adultCount * adultPrice;
    childCost = childCount * childPrice;
    totalCost = adultCost + childCost;
    specificDetails += `; Ad: ${formatCurrency(adultPrice, currency)}, Ch: ${formatCurrency(childPrice, currency)}`;
    participatingIds.forEach(id => {
      individualContributions[id] = (allTravelers.find(t=>t.id===id)?.type === 'adult' ? adultPrice : childPrice);
    });
  } else { // vehicle mode
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
  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions };
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

  const specificDetails = `Day ${startDay}${duration > 1 ? '-' + endDay : ''} (Dur: ${duration}d). Ad: ${formatCurrency(adultPrice, currency)}, Ch: ${formatCurrency(childPrice, currency)}. Fixed Price.`;
  const individualContributions: { [travelerId: string]: number } = {};
  participatingIds.forEach(id => {
    individualContributions[id] = (allTravelers.find(t=>t.id===id)?.type === 'adult' ? adultPrice : childPrice);
  });

  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions };
}

function calculateHotelCost(item: HotelItem, allTravelers: Traveler[], currency: string) {
  const { participatingIds: itemOverallParticipatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  
  const checkinDay = item.day;
  const checkoutDay = item.checkoutDay;
  const nights = Math.max(0, checkoutDay - checkinDay);

  if (nights <= 0) {
    return { adultCost: 0, childCost: 0, totalCost: 0, participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, specificDetails: `In: Day ${checkinDay}, Out: Day ${checkoutDay}. Invalid nights: ${nights}. No cost.`, occupancyDetails: [], individualContributions: {} };
  }

  let overallHotelTotalCost = 0;
  let itemTotalAdultCost = 0;
  let itemTotalChildCost = 0;
  const individualContributions: { [travelerId: string]: number } = {};
  const occupancyDetails: HotelOccupancyDetail[] = [];
  
  let unassignedRoomCostPool = 0;
  const assignedTravelerIdsInHotel = new Set<string>();

  item.rooms.forEach(roomConfig => {
    const roomRate = roomConfig.roomRate || 0;
    const numRooms = roomConfig.numRooms || 0;
    const extraBeds = roomConfig.extraBeds || 0;
    const extraBedRate = roomConfig.extraBedRate || 0;

    const roomConfigurationTotalCost = (roomRate + (extraBeds * extraBedRate)) * nights * numRooms;
    overallHotelTotalCost += roomConfigurationTotalCost;

    occupancyDetails.push({
      roomCategory: roomConfig.category || "N/A",
      roomType: roomConfig.roomType,
      adults: roomConfig.adultsInRoom,
      children: roomConfig.childrenInRoom,
      extraBeds,
      nights,
      numRooms,
      roomRate,
      extraBedRate,
      totalOccupancyCost: roomConfigurationTotalCost,
      assignedTravelerLabels: roomConfig.assignedTravelerIds.map(id => allTravelers.find(t => t.id === id)?.label || id).join(", ") || "None",
    });

    const assignedAdultsInRoom = roomConfig.assignedTravelerIds.filter(id => allTravelers.find(t=>t.id===id)?.type === 'adult');
    
    if (assignedAdultsInRoom.length > 0 && roomConfigurationTotalCost > 0) {
      const costPerAssignedAdult = roomConfigurationTotalCost / assignedAdultsInRoom.length;
      assignedAdultsInRoom.forEach(id => {
        individualContributions[id] = (individualContributions[id] || 0) + costPerAssignedAdult;
        assignedTravelerIdsInHotel.add(id);
      });
      itemTotalAdultCost += roomConfigurationTotalCost; // All cost assigned to adults in this room
    } else if (roomConfigurationTotalCost > 0) {
      // If no adults assigned to this specific room config, add cost to pool
      unassignedRoomCostPool += roomConfigurationTotalCost;
    }
  });
  
  // Distribute unassignedRoomCostPool among remaining participating travelers
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
    } else { // If no specific pool payers, distribute amongst all participating adults, then children
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

  const specificDetails = `In: Day ${checkinDay}, Out: Day ${checkoutDay} (${nights}n). Child Share: ${item.childrenSharingBed ? "Yes" : "No"}`;
  return { adultCost: itemTotalAdultCost, childCost: itemTotalChildCost, totalCost: overallHotelTotalCost, participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, specificDetails, occupancyDetails, individualContributions };
}


function calculateMealCost(item: MealItem, allTravelers: Traveler[], currency: string) {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  const adultPrice = item.adultMealPrice || 0;
  const childPrice = item.childMealPrice ?? adultPrice;
  const numMeals = item.totalMeals || 0;

  const adultCost = adultCount * adultPrice * numMeals;
  const childCost = childCount * childPrice * numMeals;
  const totalCost = adultCost + childCost;

  const specificDetails = `# Meals: ${numMeals}, Ad: ${formatCurrency(adultPrice, currency)}, Ch: ${formatCurrency(childPrice, currency)}`;
  const individualContributions: { [travelerId: string]: number } = {};
  const adultMealTotal = adultPrice * numMeals;
  const childMealTotal = childPrice * numMeals;

  participatingIds.forEach(id => {
    individualContributions[id] = (allTravelers.find(t=>t.id===id)?.type === 'adult' ? adultMealTotal : childMealTotal);
  });
  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions };
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
  const individualContributions: { [travelerId: string]: number } = {};

  if (item.costAssignment === 'perPerson') {
    adultCost = adultCount * itemTotalForCalculation;
    childCost = childCount * itemTotalForCalculation;
    totalCost = adultCost + childCost;
    specificDetails += `; Total: ${formatCurrency(totalCost, currency)} (Per Pers)`;
    participatingIds.forEach(id => {
      individualContributions[id] = itemTotalForCalculation;
    });
  } else { // 'total' or shared
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
  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions };
}


export function calculateAllCosts(tripData: TripData): CostSummary {
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
          calculationResult = calculateHotelCost(item, tripData.travelers, currency);
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
        type: item.type.charAt(0).toUpperCase() + item.type.slice(1) + 's', // Capitalize and pluralize
        day: tripData.settings.numDays > 1 ? item.day : undefined,
        name: item.name,
        note: item.note,
        configurationDetails: calculationResult.specificDetails,
        excludedTravelers: calculationResult.excludedTravelerLabels.join(', ') || 'None',
        adultCost: calculationResult.adultCost,
        childCost: calculationResult.childCost,
        totalCost: calculationResult.totalCost,
        occupancyDetails: (item.type === 'hotel' ? (calculationResult as any).occupancyDetails : undefined) as HotelOccupancyDetail[] | undefined,
      });
    });
  });
  
  // Round totals at the very end to avoid compounding floating point issues
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
        });
    }
  });


  return { grandTotal, perPersonTotals, detailedItems };
}

