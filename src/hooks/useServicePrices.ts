
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, HotelDefinition, CountryItem, ActivityPackageDefinition, VehicleOption, SurchargePeriod } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries, DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID, DEFAULT_SINGAPORE_ID, DEFAULT_VIETNAM_ID } from './useCountries';
import { useHotelDefinitions } from './useHotelDefinitions'; 
import { addDays, format } from 'date-fns';

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';
const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;

const createDemoServicePrices = (
  countries: CountryItem[],
  hotelDefinitions: HotelDefinition[]
): ServicePriceItem[] => {
  const thailand = countries.find(c => c.id === DEFAULT_THAILAND_ID);
  const malaysia = countries.find(c => c.id === DEFAULT_MALAYSIA_ID);
  const singapore = countries.find(c => c.id === DEFAULT_SINGAPORE_ID);
  const vietnam = countries.find(c => c.id === DEFAULT_VIETNAM_ID);

  const demoPrices: ServicePriceItem[] = [];

  // Link HotelDefinitions to ServicePriceItems
  hotelDefinitions.forEach(hotelDef => {
    demoPrices.push({
      id: generateGUID(), // Ensure unique service price ID, different from hotelDef.id
      name: hotelDef.name,
      countryId: hotelDef.countryId,
      province: hotelDef.province,
      category: 'hotel',
      currency: countries.find(c => c.id === hotelDef.countryId)?.defaultCurrency || 'USD',
      hotelDetails: hotelDef, 
      unitDescription: "per night",
      notes: `Rates for ${hotelDef.name} in ${hotelDef.province}.`,
    });
  });

  // Thailand Services
  if (thailand) {
    const bkkGrandPalaceTourPackages: ActivityPackageDefinition[] = [
      { id: generateGUID(), name: "Morning Tour (No Lunch)", price1: 1200, price2: 800, notes: "Includes guide and entrance fees. Approx 4 hours.", validityStartDate: format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'), validityEndDate: format(new Date(currentYear, 11, 31), 'yyyy-MM-dd') },
      { id: generateGUID(), name: "Full Day Tour (With Lunch)", price1: 2500, price2: 1500, notes: "Includes guide, fees, and Thai set lunch. Approx 8 hours.", validityStartDate: format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'), validityEndDate: format(new Date(currentYear, 5, 30), 'yyyy-MM-dd'), closedWeekdays: [1] /* Monday */, specificClosedDates: [format(new Date(currentYear, 3, 13), 'yyyy-MM-dd'), format(new Date(currentYear, 3, 14), 'yyyy-MM-dd')] /* Songkran Example */ },
    ];
    demoPrices.push(
      { id: generateGUID(), name: "Bangkok Grand Palace & Temples Tour", countryId: thailand.id, province: "Bangkok", category: 'activity', activityPackages: bkkGrandPalaceTourPackages, currency: "THB", unitDescription: "per person", notes: "Explore the magnificent Grand Palace and key temples." },
      { id: generateGUID(), name: "Chao Phraya River Dinner Cruise", countryId: thailand.id, province: "Bangkok", category: 'activity', activityPackages: [
          {id: generateGUID(), name: "Standard Cruise", price1: 1800, price2: 1000, notes: "International buffet, live music."},
          {id: generateGUID(), name: "Luxury Cruise (Window Seat)", price1: 2800, price2: 1600, notes: "Guaranteed window seat, premium buffet."}
        ], currency: "THB", unitDescription: "per person", notes: "Evening cruise with city views." },
      { id: generateGUID(), name: "Ayutthaya Ancient Capital Day Trip", countryId: thailand.id, province: "Bangkok", category: 'activity', price1: 2200, price2: 1500, currency: "THB", unitDescription: "per person", notes: "Full day trip from Bangkok to Ayutthaya by coach." },
      
      { id: "transfer-bkk-airport-sedan-demo", name: "Suvarnabhumi Airport (BKK) to Bangkok City (Sedan)", countryId: thailand.id, province: "Bangkok", category: 'transfer', transferMode: 'vehicle', currency: "THB", unitDescription: "per service", vehicleOptions: [{ id: generateGUID(), vehicleType: 'Sedan', price: 900, maxPassengers: 3, notes: "Comfortable sedan for up to 3 pax with luggage." }], surchargePeriods: [{ id: generateGUID(), name: "Late Night Surcharge (00:00-05:00)", startDate: format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'), endDate: format(new Date(nextYear, 11, 31), 'yyyy-MM-dd'), surchargeAmount: 200 }] },
      { 
        id: generateGUID(), 
        name: "Bangkok Hotel to Grand Palace (Various)", 
        countryId: thailand.id, 
        province: "Bangkok", 
        category: 'transfer', 
        transferMode: 'vehicle', 
        currency: "THB", 
        unitDescription: "per service", 
        vehicleOptions: [
          { id: generateGUID(), vehicleType: 'Sedan', price: 500, maxPassengers: 3, notes: "One-way hotel to Grand Palace area." },
          { id: generateGUID(), vehicleType: 'MPV', price: 800, maxPassengers: 5, notes: "One-way hotel to Grand Palace area." }
        ],
        notes: "City transfer to major attraction."
      },
      { 
        id: generateGUID(), 
        name: "Bangkok City Tour (8 hours Van with Driver)", 
        countryId: thailand.id, 
        province: "Bangkok", 
        category: 'transfer', 
        transferMode: 'vehicle', 
        currency: "THB", 
        unitDescription: "per service (8 hours)", 
        vehicleOptions: [{ id: generateGUID(), vehicleType: 'Van', price: 3500, maxPassengers: 8, notes: "Includes driver, fuel. Excludes entrance fees." }],
        surchargePeriods: [{id: generateGUID(), name: "Songkran Festival Peak", startDate: format(new Date(currentYear, 3, 12), 'yyyy-MM-dd'), endDate: format(new Date(currentYear, 3, 16), 'yyyy-MM-dd'), surchargeAmount: 500}]
      },
      { id: generateGUID(), name: "Suvarnabhumi Airport (BKK) to Bangkok City (Shared Van Ticket)", countryId: thailand.id, province: "Bangkok", category: 'transfer', transferMode: 'ticket', price1: 150, currency: "THB", unitDescription: "per person", subCategory: "ticket", notes: "Seat in shared van, drops at major hotels." },

      { id: generateGUID(), name: "Phuket Phi Phi Islands & Maya Bay (Speedboat)", countryId: thailand.id, province: "Phuket", category: 'activity', activityPackages: [
          {id: generateGUID(), name: "Shared Speedboat Tour", price1: 2200, price2: 1500, notes: "Full day, includes lunch, snorkeling."},
          {id: generateGUID(), name: "Private Longtail (4 hrs, Islands near Phuket)", price1: 3500, notes: "Price per boat, max 6 pax. Does not go to Phi Phi."}
        ], currency: "THB", unitDescription: "per person/service", notes: "Explore iconic islands." },
      { id: generateGUID(), name: "Phuket Fantasea Show & Dinner", countryId: thailand.id, province: "Phuket", category: 'activity', price1: 2200, price2: 2000, currency: "THB", unitDescription: "per person", notes: "Gold seat, includes buffet dinner." },
      { id: generateGUID(), name: "James Bond Island Canoe Trip", countryId: thailand.id, province: "Phuket", category: 'activity', price1: 1800, currency: "THB", unitDescription: "per person", notes: "Full day, includes sea canoeing and lunch." },

      { 
        id: generateGUID(), 
        name: "Phuket Airport (HKT) to Patong Beach (Various)", 
        countryId: thailand.id, 
        province: "Phuket", 
        category: 'transfer', 
        transferMode: 'vehicle', 
        currency: "THB", 
        unitDescription: "per service", 
        vehicleOptions: [
          { id: generateGUID(), vehicleType: 'Sedan', price: 800, maxPassengers: 3, notes: "Private car transfer." },
          { id: generateGUID(), vehicleType: 'Minibus', price: 1200, maxPassengers: 10, notes: "Private minibus transfer." }
        ]
      },
      { id: generateGUID(), name: "Patong to Phi Phi Pier (Ferry Ticket)", countryId: thailand.id, province: "Phuket", category: 'transfer', transferMode: 'ticket', price1: 700, currency: "THB", unitDescription: "per person (one-way)", subCategory: "ticket" },
      
      { id: generateGUID(), name: "Rooftop Bar Sky-High Dinner Set (Bangkok)", countryId: thailand.id, province: "Bangkok", category: 'meal', price1: 2500, currency: "THB", subCategory: "Set Menu", unitDescription: "per person", notes: "Includes 3-course Western set dinner, excludes drinks." },
      { id: generateGUID(), name: "Hotel International Buffet Lunch (Bangkok)", countryId: thailand.id, province: "Bangkok", category: 'meal', price1: 950, price2: 475, currency: "THB", subCategory: "Buffet", unitDescription: "per person" },
      { id: generateGUID(), name: "Seafood BBQ Dinner on the Beach (Phuket)", countryId: thailand.id, province: "Phuket", category: 'meal', price1: 1500, currency: "THB", subCategory: "Special Dinner", unitDescription: "per person", notes: "Fresh seafood buffet." },

      { id: generateGUID(), name: "Thai Cooking Class Materials Fee (Bangkok)", countryId: thailand.id, province: "Bangkok", category: 'misc', unitCost: 500, quantity: 1, costAssignment: 'perPerson', currency: "THB", unitDescription: "per person", subCategory: "Class Fee", notes: "Ingredients for cooking class." },
      { id: generateGUID(), name: "Snorkeling Gear Rental - Full Day (Phuket)", countryId: thailand.id, province: "Phuket", category: 'misc', unitCost: 250, quantity: 1, costAssignment: 'perPerson', currency: "THB", unitDescription: "per set", subCategory: "Rental", notes: "Mask, snorkel, fins." },
      { id: generateGUID(), name: "Travel Insurance - Basic (Thailand)", countryId: thailand.id, category: 'misc', unitCost: 400, quantity: 1, costAssignment: 'perPerson', currency: "THB", unitDescription: "per person", subCategory: "Insurance", notes: "Basic coverage for duration of stay in Thailand." },
      { id: generateGUID(), name: "VIP Airport Fast Track (Bangkok BKK)", countryId: thailand.id, province: "Bangkok", category: 'misc', unitCost: 1500, quantity: 1, costAssignment: 'perPerson', currency: "THB", unitDescription: "per person", subCategory: "Airport Service", notes: "Arrival or Departure fast track service." }
    );
  }

  // Malaysia Services (Keeping these simpler for now)
  if (malaysia) {
    demoPrices.push(
      { id: generateGUID(), name: "Kuala Lumpur City Highlights Tour", countryId: malaysia.id, province: "Kuala Lumpur", category: 'activity', price1: 120, price2: 80, currency: "MYR", unitDescription: "per person" },
      { id: generateGUID(), name: "KLIA Express Train Ticket", countryId: malaysia.id, province: "Kuala Lumpur", category: 'transfer', transferMode: 'ticket', price1: 55, currency: "MYR", unitDescription: "per person", subCategory: "ticket" },
      { id: generateGUID(), name: "Buffet Lunch at Revolving Tower KL", countryId: malaysia.id, province: "Kuala Lumpur", category: 'meal', price1: 90, price2: 50, currency: "MYR", subCategory: "Buffet", unitDescription: "per person" }
    );
  }
  // Singapore Services
  if (singapore) {
    demoPrices.push(
      { id: generateGUID(), name: "Singapore Night Safari Admission", countryId: singapore.id, province: "Singapore", category: 'activity', price1: 55, price2: 38, currency: "SGD", unitDescription: "per person" },
      { id: generateGUID(), name: "Changi Airport to City (Taxi Estimate)", countryId: singapore.id, province: "Singapore", category: 'transfer', transferMode: 'vehicle', currency: "SGD", unitDescription: "per service (approx)", vehicleOptions: [{id: generateGUID(), vehicleType: "Sedan", price: 30, maxPassengers: 4, notes: "Metered fare estimate"}]}
    );
  }
  // Vietnam Services
  if (vietnam) {
    demoPrices.push(
      { id: generateGUID(), name: "Ha Long Bay Day Cruise from Hanoi", countryId: vietnam.id, province: "Hanoi", category: 'activity', price1: 1200000, price2: 900000, currency: "VND", unitDescription: "per person", notes: "Includes lunch and cave visit." }
    );
  }

  return demoPrices;
};


export function useServicePrices() {
  const { countries, isLoading: isLoadingCountries } = useCountries();
  const { allHotelDefinitions, isLoading: isLoadingHotelDefs } = useHotelDefinitions();
  const [allServicePrices, setAllServicePrices] = React.useState<ServicePriceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isLoadingCountries || isLoadingHotelDefs) return;

    let pricesToSet: ServicePriceItem[] = [];
    const DEMO_SERVICE_PRICES = createDemoServicePrices(countries, allHotelDefinitions);

    try {
      const storedPricesString = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      if (storedPricesString) {
        try {
            const parsedPrices = JSON.parse(storedPricesString) as ServicePriceItem[];
            if (Array.isArray(parsedPrices)) {
            const validatedPrices = parsedPrices.filter(p => p.id && p.name && p.category && p.currency);
            pricesToSet = validatedPrices;

            DEMO_SERVICE_PRICES.forEach(demoPrice => {
                const exists = pricesToSet.some(existingPrice =>
                  existingPrice.id === demoPrice.id || // Check for fixed demo ID first
                  ( existingPrice.name === demoPrice.name &&
                    existingPrice.province === demoPrice.province &&
                    existingPrice.category === demoPrice.category &&
                    existingPrice.countryId === demoPrice.countryId )
                );
                if (!exists) {
                  pricesToSet.push(demoPrice);
                } else {
                  // If a demo item might have been updated (e.g. new fields added to schema), overwrite with latest.
                  // This is specifically for demo items that might have fixed IDs.
                  if (demoPrice.id.includes("-demo")) { 
                    const existingIndex = pricesToSet.findIndex(p => p.id === demoPrice.id);
                    if (existingIndex !== -1) {
                      pricesToSet[existingIndex] = demoPrice;
                    } else {
                       const oldDemoByName = pricesToSet.findIndex(p => 
                            p.name === demoPrice.name && p.province === demoPrice.province && 
                            p.category === demoPrice.category && p.countryId === demoPrice.countryId &&
                            !p.id.includes("-demo") // Avoid re-adding if a user created a custom one with same name
                        );
                        if(oldDemoByName === -1) pricesToSet.push(demoPrice); // Add if new demo structure for an old demo name
                    }
                  }
                }
            });
            } else {
                pricesToSet = DEMO_SERVICE_PRICES;
            }
        } catch (parseError) {
            console.warn("Error parsing service prices from localStorage, seeding defaults:", parseError);
            pricesToSet = DEMO_SERVICE_PRICES;
        }
      } else {
        pricesToSet = DEMO_SERVICE_PRICES;
      }
      localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(pricesToSet));
    } catch (error) {
      console.error("Failed to load or initialize service prices:", error);
      pricesToSet = DEMO_SERVICE_PRICES; 
    }
    setAllServicePrices(pricesToSet.sort((a,b) => a.name.localeCompare(b.name)));
    setIsLoading(false);
  }, [isLoadingCountries, countries, isLoadingHotelDefs, allHotelDefinitions]);

  const getServicePricesFiltered = React.useCallback(
    (filters: { category?: ItineraryItemType; countryId?: string; provinceName?: string; currency?: string } = {}): ServicePriceItem[] => {
      if (isLoading) return [];
      return allServicePrices.filter(service => {
        if (filters.category && service.category !== filters.category) return false;
        
        if (filters.countryId) {
            if (service.category === 'hotel') {
                if (!service.hotelDetails || service.hotelDetails.countryId !== filters.countryId) return false;
            } else if (service.countryId && service.countryId !== filters.countryId) {
                return false; 
            } else if (!service.countryId && filters.category !== 'misc' && service.category !== 'hotel' ) { 
                return false;
            }
        }
        
        if (filters.provinceName) {
             if (service.category === 'hotel') {
                if (!service.hotelDetails || service.hotelDetails.province !== filters.provinceName) return false;
            } else if (service.province && service.province !== filters.provinceName) {
                return false;
            } else if (!service.province && service.category !== 'misc' && service.category !== 'hotel') {
                return false;
            }
        }

        if (filters.currency && service.currency !== filters.currency) return false;
        return true;
      }).sort((a,b) => a.name.localeCompare(b.name));
    },
    [allServicePrices, isLoading]
  );
  
  const getServicePriceById = React.useCallback(
    (id: string): ServicePriceItem | undefined => {
      if (isLoading) return undefined;
      return allServicePrices.find(sp => sp.id === id);
    }, [allServicePrices, isLoading]);

  return { isLoading: isLoading || isLoadingCountries || isLoadingHotelDefs, allServicePrices, getServicePrices: getServicePricesFiltered, getServicePriceById };
}
