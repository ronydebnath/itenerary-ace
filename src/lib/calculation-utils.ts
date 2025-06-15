
/**
 * @fileoverview This file houses the core logic for calculating costs related to itinerary items.
 * It includes functions to determine costs for transfers, activities, hotel stays, meals, and
 * miscellaneous items. It considers factors like participating travelers, pricing modes (ticket vs. vehicle),
 * seasonal rates for hotels, and different cost assignment methods. The main exported function,
 * `calculateAllCosts`, aggregates these individual calculations and converts them to a single
 * billing currency to provide a comprehensive cost summary for the entire trip.
 *
 * @bangla এই ফাইলটিতে ভ্রমণপথের আইটেমগুলির সাথে সম্পর্কিত খরচ গণনার মূল যুক্তি রয়েছে।
 * এটিতে ট্রান্সফার, কার্যকলাপ, হোটেল থাকা, খাবার এবং বিভিন্ন আইটেমের খরচ নির্ধারণ করার
 * ফাংশন অন্তর্ভুক্ত রয়েছে। এটি অংশগ্রহণকারী ভ্রমণকারী, মূল্যের ধরণ (টিকিট বনাম যান),
 * হোটেলের জন্য মরশুমি হার এবং বিভিন্ন খরচ নির্ধারণ পদ্ধতি বিবেচনা করে। প্রধান এক্সপোর্ট করা ফাংশন,
 * `calculateAllCosts`, এই পৃথক গণনাগুলিকে একত্রিত করে এবং একটি একক বিলিং মুদ্রায় রূপান্তরিত
 * করে পুরো ভ্রমণের জন্য একটি ব্যাপক খরচ সারাংশ প্রদান করে।
 */
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
  ServicePriceItem,
  TripSettings,
  HotelDefinition,
  CurrencyCode,
  CountryItem
} from '@/types/itinerary';
import { formatCurrency } from './utils';
import { addDays, isWithinInterval, parseISO, format, isValid, startOfDay } from 'date-fns';
import type { ConversionRateDetails } from '@/hooks/useExchangeRates';

// Helper to get participating travelers and their counts
function getParticipatingTravelers(item: ItineraryItem, allTravelers: Traveler[]) {
  const participatingTravelers = allTravelers.filter(t => !item.excludedTravelerIds.includes(t.id));
  return {
    adultCount: participatingTravelers.filter(t => t.type === 'adult').length,
    childCount: participatingTravelers.filter(t => t.type === 'child').length,
    participatingIds: participatingTravelers.map(t => t.id),
    excludedTravelerLabels: allTravelers.filter(t => item.excludedTravelerIds.includes(t.id)).map(t => t.label),
  };
}

// --- Individual Item Cost Calculation Functions (Return costs in their source currency) ---

function calculateTransferCostInternal(
  item: TransferItem,
  allTravelers: Traveler[],
  sourceCurrency: CurrencyCode,
  tripSettings: TripSettings,
  serviceDefinition: ServicePriceItem | undefined,
  showCosts: boolean
): { adultCost: number, childCost: number, totalCost: number, participatingIds: string[], excludedTravelerLabels: string[], specificDetails: string, individualContributions: { [travelerId: string]: number }, province?: string } {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  let adultCost = 0;
  let childCost = 0;
  let totalCost = 0;
  let specificDetails = `Mode: ${item.mode}`;
  if (item.province) specificDetails += `; Prov: ${item.province}`;
  const individualContributions: { [travelerId: string]: number } = {};

  const selectedVehicleOption = serviceDefinition?.vehicleOptions?.find(vo => vo.id === item.selectedVehicleOptionId);

  if (item.mode === 'ticket') {
    const adultPrice = (serviceDefinition?.price1 ?? item.adultTicketPrice) || 0;
    const childPrice = serviceDefinition?.price2 ?? item.childTicketPrice ?? adultPrice;

    adultCost = adultCount * adultPrice;
    childCost = childCount * childPrice;
    totalCost = adultCost + childCost;
    specificDetails += `; Ticket.`;
    if (showCosts) {
        specificDetails += ` Ad: ${formatCurrency(adultPrice, sourceCurrency)}, Ch: ${formatCurrency(childPrice, sourceCurrency)}`;
    }
    participatingIds.forEach(id => {
      individualContributions[id] = (allTravelers.find(t => t.id === id)?.type === 'adult' ? adultPrice : childPrice);
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
      if (serviceDefinition.subCategory && serviceDefinition.subCategory !== 'ticket') vehicleTypeDisplay = serviceDefinition.subCategory;
    }

    let appliedSurcharge = 0;
    let surchargeName = "";

    if (tripSettings.startDate && serviceDefinition?.surchargePeriods?.length) {
      try {
        const transferDate = addDays(parseISO(tripSettings.startDate), item.day - 1);
        for (const period of serviceDefinition.surchargePeriods) {
          if (period.startDate && period.endDate) {
             const periodStartDate = typeof period.startDate === 'string' ? parseISO(period.startDate) : period.startDate;
             const periodEndDate = typeof period.endDate === 'string' ? parseISO(period.endDate) : period.endDate;
            if (isValid(periodStartDate) && isValid(periodEndDate) && isWithinInterval(transferDate, { start: periodStartDate, end: periodEndDate })) {
              appliedSurcharge = period.surchargeAmount;
              surchargeName = period.name;
              break;
            }
          }
        }
      } catch (e) { console.error("Error calculating transfer surcharge date:", e); }
    }

    const finalCostPerVehicle = baseCostPerVehicle + appliedSurcharge;
    const vehicleTotalCost = finalCostPerVehicle * numVehicles;
    totalCost = vehicleTotalCost;

    specificDetails += `; Type: ${vehicleTypeDisplay}; #Veh: ${numVehicles}`;
    if (showCosts) {
        specificDetails += `; Cost/V (base): ${formatCurrency(baseCostPerVehicle, sourceCurrency)}`;
        if (appliedSurcharge > 0) {
          specificDetails += `; Surcharge (${surchargeName}): ${formatCurrency(appliedSurcharge, sourceCurrency)}`;
        }
        specificDetails += `; Total/V: ${formatCurrency(finalCostPerVehicle, sourceCurrency)}`;
    }

    const totalParticipants = adultCount + childCount;
    if (totalParticipants > 0) {
      const perPersonShare = vehicleTotalCost / totalParticipants;
      adultCost = perPersonShare * adultCount;
      childCost = perPersonShare * childCount;
      participatingIds.forEach(id => { individualContributions[id] = perPersonShare; });
    }
  }
  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions, province: item.province };
}

function calculateActivityCostInternal(
  item: ActivityItem,
  allTravelers: Traveler[],
  sourceCurrency: CurrencyCode,
  showCosts: boolean
): { adultCost: number, childCost: number, totalCost: number, participatingIds: string[], excludedTravelerLabels: string[], specificDetails: string, individualContributions: { [travelerId: string]: number }, province?: string } {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  const adultPrice = item.adultPrice || 0;
  const childPrice = item.childPrice ?? adultPrice;

  const adultCost = adultCount * adultPrice;
  const childCost = childCount * childPrice;
  const totalCost = adultCost + childCost;

  const startDay = item.day;
  const endDay = item.endDay || startDay;
  const duration = Math.max(1, endDay - startDay + 1);

  let specificDetails = `Day ${startDay}${duration > 1 ? '-' + endDay : ''} (Dur: ${duration}d).`;
  if (showCosts) {
    specificDetails += ` Ad: ${formatCurrency(adultPrice, sourceCurrency)}, Ch: ${formatCurrency(childPrice, sourceCurrency)}. Fixed Price.`;
  } else {
    specificDetails += ` Fixed Price.`;
  }
  if (item.province) specificDetails += `; Prov: ${item.province}`;

  const individualContributions: { [travelerId: string]: number } = {};
  participatingIds.forEach(id => {
    individualContributions[id] = (allTravelers.find(t => t.id === id)?.type === 'adult' ? adultPrice : childPrice);
  });

  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions, province: item.province };
}

function calculateHotelCostInternal(
  item: HotelItem,
  allTravelers: Traveler[],
  sourceCurrency: CurrencyCode,
  tripSettings: TripSettings,
  allHotelDefinitionsSafe: HotelDefinition[],
  showCosts: boolean
): { adultCost: number, childCost: number, totalCost: number, participatingIds: string[], excludedTravelerLabels: string[], specificDetails: string, occupancyDetails: HotelOccupancyDetail[], individualContributions: { [travelerId: string]: number }, province?: string } {
  const { participatingIds: itemOverallParticipatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);

  const checkinDay = item.day;
  const checkoutDay = item.checkoutDay;
  const nights = Math.max(0, checkoutDay - checkinDay);

  const hotelDefinition = allHotelDefinitionsSafe.find(hd => hd.id === item.hotelDefinitionId);

  let baseSpecificDetails = `Hotel: ${hotelDefinition?.name || item.name || 'Unknown Hotel'}`;
  if (item.province) baseSpecificDetails += ` (${item.province})`;
  baseSpecificDetails += `. In: Day ${checkinDay}, Out: Day ${checkoutDay} (${nights}n).`;


  if (!hotelDefinition) {
    return { adultCost: 0, childCost: 0, totalCost: 0, participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, specificDetails: `${baseSpecificDetails} Error: Hotel definition not found.`, occupancyDetails: [], individualContributions: {}, province: item.province };
  }
  if (nights <= 0) {
    return { adultCost: 0, childCost: 0, totalCost: 0, participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, specificDetails: `${baseSpecificDetails} Invalid nights: ${nights}. No cost.`, occupancyDetails: [], individualContributions: {}, province: item.province };
  }
  if (!tripSettings.startDate) {
    return { adultCost: 0, childCost: 0, totalCost: 0, participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, specificDetails: `${baseSpecificDetails} Error: Trip start date missing.`, occupancyDetails: [], individualContributions: {}, province: item.province };
  }

  let overallHotelTotalCost = 0;
  const occupancyDetailsForSummary: HotelOccupancyDetail[] = [];
  const individualContributions: { [travelerId: string]: number } = {};

  (item.selectedRooms || []).forEach((selectedRoom: SelectedHotelRoomConfiguration) => {
    const roomTypeDef = hotelDefinition.roomTypes.find(rt => rt.id === selectedRoom.roomTypeDefinitionId);
    if (!roomTypeDef) {
      occupancyDetailsForSummary.push({ roomTypeName: selectedRoom.roomTypeNameCache || "Unknown Room Type", numRooms: selectedRoom.numRooms, nights, characteristics: "Error: Room type definition missing.", assignedTravelerLabels: selectedRoom.assignedTravelerIds.map(id => allTravelers.find(t => t.id === id)?.label || id).join(", ") || "None", totalRoomBlockCost: 0, extraBedAdded: selectedRoom.addExtraBed });
      return;
    }

    let costForThisRoomBlock = 0;
    for (let currentNightIndex = 0; currentNightIndex < nights; currentNightIndex++) {
      const dayNumberOfStay = checkinDay + currentNightIndex;
      let currentDateOfStay: Date;
      try {
        currentDateOfStay = startOfDay(addDays(parseISO(tripSettings.startDate as string), dayNumberOfStay - 1));
      } catch (e) { continue; }

      let nightlyRateForRoomType = 0;
      let extraBedRateForNight = 0;
      let foundSeasonalRate = false;

      for (const seasonalPrice of roomTypeDef.seasonalPrices) {
        if (seasonalPrice.startDate && seasonalPrice.endDate && typeof seasonalPrice.startDate === 'string' && typeof seasonalPrice.endDate === 'string') {
          try {
            const seasonStartDate = startOfDay(parseISO(seasonalPrice.startDate));
            const seasonEndDate = startOfDay(parseISO(seasonalPrice.endDate));
            if (isValid(seasonStartDate) && isValid(seasonEndDate) && isWithinInterval(currentDateOfStay, { start: seasonStartDate, end: seasonEndDate })) {
              nightlyRateForRoomType = seasonalPrice.rate;
              if (selectedRoom.addExtraBed && roomTypeDef.extraBedAllowed && seasonalPrice.extraBedRate !== undefined) {
                extraBedRateForNight = seasonalPrice.extraBedRate;
              }
              foundSeasonalRate = true;
              break;
            }
          } catch (dateParseError) { /* console.warn for invalid date in definition */ }
        }
      }
      if (!foundSeasonalRate) { nightlyRateForRoomType = 0; extraBedRateForNight = 0; }
      costForThisRoomBlock += (nightlyRateForRoomType + extraBedRateForNight) * selectedRoom.numRooms;
    }
    overallHotelTotalCost += costForThisRoomBlock;

    occupancyDetailsForSummary.push({
      roomTypeName: roomTypeDef.name, numRooms: selectedRoom.numRooms, nights,
      characteristics: (roomTypeDef.characteristics || []).map(c => `${c.key}: ${c.value}`).join('; ') || 'N/A',
      assignedTravelerLabels: selectedRoom.assignedTravelerIds.map(id => allTravelers.find(t => t.id === id)?.label || id).join(", ") || "None",
      totalRoomBlockCost: costForThisRoomBlock, extraBedAdded: selectedRoom.addExtraBed && roomTypeDef.extraBedAllowed,
    });

    const assignedParticipants = allTravelers.filter(t => selectedRoom.assignedTravelerIds.includes(t.id));
    if (assignedParticipants.length > 0 && costForThisRoomBlock > 0) {
      const costPerAssignedPerson = costForThisRoomBlock / assignedParticipants.length;
      assignedParticipants.forEach(p => { individualContributions[p.id] = (individualContributions[p.id] || 0) + costPerAssignedPerson; });
    } else if (costForThisRoomBlock > 0 && itemOverallParticipatingIds.length > 0) {
      const costPerOverallParticipant = costForThisRoomBlock / itemOverallParticipatingIds.length;
      itemOverallParticipatingIds.forEach(id => { individualContributions[id] = (individualContributions[id] || 0) + costPerOverallParticipant; });
    }
  });

  let itemTotalAdultCost = 0;
  let itemTotalChildCost = 0;
  itemOverallParticipatingIds.forEach(id => {
    const traveler = allTravelers.find(t => t.id === id);
    if (traveler && individualContributions[id]) {
      if (traveler.type === 'adult') itemTotalAdultCost += individualContributions[id];
      else itemTotalChildCost += individualContributions[id];
    }
  });

  return { adultCost: itemTotalAdultCost, childCost: itemTotalChildCost, totalCost: overallHotelTotalCost, participatingIds: itemOverallParticipatingIds, excludedTravelerLabels, specificDetails: baseSpecificDetails, occupancyDetails: occupancyDetailsForSummary, individualContributions, province: item.province };
}

function calculateMealCostInternal(
  item: MealItem,
  allTravelers: Traveler[],
  sourceCurrency: CurrencyCode,
  showCosts: boolean
): { adultCost: number, childCost: number, totalCost: number, participatingIds: string[], excludedTravelerLabels: string[], specificDetails: string, individualContributions: { [travelerId: string]: number }, province?: string } {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  const adultPrice = item.adultMealPrice || 0;
  const childPrice = item.childMealPrice ?? adultPrice;
  const numMeals = item.totalMeals || 0;

  const adultCost = adultCount * adultPrice * numMeals;
  const childCost = childCount * childPrice * numMeals;
  const totalCost = adultCost + childCost;

  let specificDetails = `# Meals: ${numMeals}`;
  if (showCosts) {
    specificDetails += `, Ad: ${formatCurrency(adultPrice, sourceCurrency)}, Ch: ${formatCurrency(childPrice, sourceCurrency)}`;
  }
  if (item.province) specificDetails += `; Prov: ${item.province}`;

  const individualContributions: { [travelerId: string]: number } = {};
  const adultMealTotal = adultPrice * numMeals;
  const childMealTotal = childPrice * numMeals;

  participatingIds.forEach(id => {
    individualContributions[id] = (allTravelers.find(t => t.id === id)?.type === 'adult' ? adultMealTotal : childMealTotal);
  });
  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions, province: item.province };
}

function calculateMiscCostInternal(
  item: MiscItem,
  allTravelers: Traveler[],
  sourceCurrency: CurrencyCode,
  showCosts: boolean
): { adultCost: number, childCost: number, totalCost: number, participatingIds: string[], excludedTravelerLabels: string[], specificDetails: string, individualContributions: { [travelerId: string]: number }, province?: string } {
  const { adultCount, childCount, participatingIds, excludedTravelerLabels } = getParticipatingTravelers(item, allTravelers);
  const unitCost = item.unitCost || 0;
  const quantity = item.quantity || 1;
  const itemTotalForCalculation = unitCost * quantity;

  let adultCost = 0;
  let childCost = 0;
  let totalCost = 0;
  let specificDetails = `Assign: ${item.costAssignment}, Qty: ${quantity}`;
  if (showCosts) {
    specificDetails += `, Unit Cost: ${formatCurrency(unitCost, sourceCurrency)}`;
  }
  if (item.province) specificDetails += `; Prov: ${item.province}`;
  const individualContributions: { [travelerId: string]: number } = {};

  if (item.costAssignment === 'perPerson') {
    adultCost = adultCount * itemTotalForCalculation;
    childCost = childCount * itemTotalForCalculation;
    totalCost = adultCost + childCost;
    participatingIds.forEach(id => { individualContributions[id] = itemTotalForCalculation; });
  } else {
    totalCost = itemTotalForCalculation;
    const totalParticipants = adultCount + childCount;
    if (totalParticipants > 0) {
      const perPersonShare = itemTotalForCalculation / totalParticipants;
      adultCost = perPersonShare * adultCount;
      childCost = perPersonShare * childCount;
      participatingIds.forEach(id => { individualContributions[id] = perPersonShare; });
    }
  }
  return { adultCost, childCost, totalCost, participatingIds, excludedTravelerLabels, specificDetails, individualContributions, province: item.province };
}

// --- Main Cost Calculation Function ---
export function calculateAllCosts(
  tripData: TripData,
  countries: CountryItem[],
  allServicePricesInput?: ServicePriceItem[],
  allHotelDefinitionsInput?: HotelDefinition[],
  getRateForConversion?: (from: CurrencyCode, to: CurrencyCode) => ConversionRateDetails | null,
  showCosts: boolean = true // Default to true if not provided
): CostSummary {
  const allServicePrices = Array.isArray(allServicePricesInput) ? allServicePricesInput : [];
  const allHotelDefinitions = Array.isArray(allHotelDefinitionsInput) ? allHotelDefinitionsInput : [];
  const billingCurrency = tripData.pax.currency;

  let grandTotal = 0;
  const perPersonTotals: { [travelerId: string]: number } = {};
  tripData.travelers.forEach(t => perPersonTotals[t.id] = 0);
  const detailedItems: DetailedSummaryItem[] = [];

  Object.values(tripData.days).forEach(dayItinerary => {
    dayItinerary.items.forEach(item => {
      let sourceCurrency: CurrencyCode = billingCurrency; 
      let serviceDefinition: ServicePriceItem | undefined = undefined;
      const itemCountryForContext = item.countryId || (tripData.settings.selectedCountries.length === 1 ? tripData.settings.selectedCountries[0] : undefined);

      if (item.selectedServicePriceId) {
          serviceDefinition = allServicePrices.find(sp => sp.id === item.selectedServicePriceId);
          if (serviceDefinition) {
              sourceCurrency = serviceDefinition.currency;
          } else {
              const itemCountryDef = itemCountryForContext ? countries.find(c => c.id === itemCountryForContext) : undefined;
              if (itemCountryDef?.defaultCurrency) sourceCurrency = itemCountryDef.defaultCurrency;
          }
      } else if (item.type === 'hotel' && item.hotelDefinitionId) {
          const hotelServicePriceDef = allServicePrices.find(sp => sp.category === 'hotel' && sp.hotelDetails?.id === item.hotelDefinitionId);
          if (hotelServicePriceDef) {
              sourceCurrency = hotelServicePriceDef.currency;
          } else {
              const hotelItemCountryDef = itemCountryForContext ? countries.find(c => c.id === itemCountryForContext) : undefined;
              if (hotelItemCountryDef?.defaultCurrency) {
                  sourceCurrency = hotelItemCountryDef.defaultCurrency;
              }
          }
      } else { 
          const itemCountryDef = itemCountryForContext ? countries.find(c => c.id === itemCountryForContext) : undefined;
          if (itemCountryDef?.defaultCurrency) {
              sourceCurrency = itemCountryDef.defaultCurrency;
          }
      }


      let calcResult;
      switch (item.type) {
        case 'transfer':
          calcResult = calculateTransferCostInternal(item, tripData.travelers, sourceCurrency, tripData.settings, serviceDefinition, showCosts);
          break;
        case 'activity':
          calcResult = calculateActivityCostInternal(item, tripData.travelers, sourceCurrency, showCosts);
          break;
        case 'hotel':
          calcResult = calculateHotelCostInternal(item, tripData.travelers, sourceCurrency, tripData.settings, allHotelDefinitions, showCosts);
          break;
        case 'meal':
          calcResult = calculateMealCostInternal(item, tripData.travelers, sourceCurrency, showCosts);
          break;
        case 'misc':
          calcResult = calculateMiscCostInternal(item, tripData.travelers, sourceCurrency, showCosts);
          break;
        default:
          return;
      }

      let { totalCost, adultCost, childCost, individualContributions, ...otherDetails } = calcResult;
      
      let conversionFactor = 1;
      if (sourceCurrency !== billingCurrency && getRateForConversion) {
        const conversionDetails = getRateForConversion(sourceCurrency, billingCurrency);
        if (conversionDetails) {
          conversionFactor = conversionDetails.finalRate;
        } else {
          console.error(`FATAL: Cannot convert item "${item.name}" from ${sourceCurrency} to ${billingCurrency}. Cost will be inaccurate.`);
          conversionFactor = 0; 
        }
      }

      totalCost *= conversionFactor;
      adultCost *= conversionFactor;
      childCost *= conversionFactor;
      Object.keys(individualContributions).forEach(travelerId => {
        individualContributions[travelerId] *= conversionFactor;
      });

      grandTotal += totalCost;
      Object.entries(individualContributions).forEach(([travelerId, cost]) => {
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
        province: otherDetails.province,
        configurationDetails: otherDetails.specificDetails, 
        excludedTravelers: otherDetails.excludedTravelerLabels.join(', ') || 'None',
        adultCost, 
        childCost, 
        totalCost, 
        occupancyDetails: (item.type === 'hotel' ? (otherDetails as any).occupancyDetails : undefined) as HotelOccupancyDetail[] | undefined,
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

    if (dItem.occupancyDetails && dItem.type === 'Hotels' && dItem.day !== undefined) {
      const parentHotelItem = tripData.days[dItem.day]?.items.find(i => i.id === dItem.id && i.type === 'hotel') as HotelItem | undefined;
      let hotelSourceCurrency = billingCurrency;

      if (parentHotelItem) {
          if (parentHotelItem.selectedServicePriceId) {
              const hotelSp = allServicePrices.find(sp => sp.id === parentHotelItem.selectedServicePriceId);
              if (hotelSp) hotelSourceCurrency = hotelSp.currency;
          } else if (parentHotelItem.hotelDefinitionId) {
              const hotelSpFromDef = allServicePrices.find(sp => sp.category === 'hotel' && sp.hotelDetails?.id === parentHotelItem.hotelDefinitionId);
              if (hotelSpFromDef) {
                  hotelSourceCurrency = hotelSpFromDef.currency;
              } else {
                  const hotelItemCountryDef = parentHotelItem.countryId ? countries.find(c => c.id === parentHotelItem.countryId) : undefined;
                  if (hotelItemCountryDef?.defaultCurrency) hotelSourceCurrency = hotelItemCountryDef.defaultCurrency;
              }
          } else { // Custom hotel item pricing
              const hotelItemCountryDef = parentHotelItem.countryId ? countries.find(c => c.id === parentHotelItem.countryId) : undefined;
              if (hotelItemCountryDef?.defaultCurrency) hotelSourceCurrency = hotelItemCountryDef.defaultCurrency;
          }
      }

      dItem.occupancyDetails.forEach(od => {
        if (od.totalRoomBlockCost) {
          if (hotelSourceCurrency !== billingCurrency && getRateForConversion) {
            const conv = getRateForConversion(hotelSourceCurrency, billingCurrency);
            od.totalRoomBlockCost = parseFloat((od.totalRoomBlockCost * (conv?.finalRate || 0)).toFixed(2));
          } else {
            od.totalRoomBlockCost = parseFloat(od.totalRoomBlockCost.toFixed(2));
          }
        }
      });
    }
  });

  return { grandTotal, perPersonTotals, detailedItems };
}
