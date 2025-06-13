
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, HotelDefinition, CountryItem, ActivityPackageDefinition, VehicleOption, SurchargePeriod } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries, DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID, DEFAULT_SINGAPORE_ID, DEFAULT_VIETNAM_ID } from './useCountries';
import { useHotelDefinitions } from './useHotelDefinitions'; // To link hotel services
import { addDays, format } from 'date-fns';

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';
const currentYear = new Date().getFullYear();

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
      id: generateGUID(),
      name: hotelDef.name,
      countryId: hotelDef.countryId,
      province: hotelDef.province,
      category: 'hotel',
      currency: countries.find(c => c.id === hotelDef.countryId)?.defaultCurrency || 'USD',
      hotelDetails: hotelDef, // Embed the full hotel definition
      unitDescription: "per night",
    });
  });

  // Thailand Services
  if (thailand) {
    const thaiActivityPackages: ActivityPackageDefinition[] = [
      { id: generateGUID(), name: "Standard Entry", price1: 1200, price2: 800, notes: "Includes guide", validityStartDate: format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'), validityEndDate: format(new Date(currentYear, 11, 31), 'yyyy-MM-dd') },
      { id: generateGUID(), name: "VIP Access + Lunch", price1: 2500, price2: 1500, notes: "Skip the line, includes lunch buffet", validityStartDate: format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'), validityEndDate: format(new Date(currentYear, 11, 31), 'yyyy-MM-dd'), closedWeekdays: [1] /* Monday */ },
    ];
    demoPrices.push(
      { id: generateGUID(), name: "Bangkok Grand Palace Tour", countryId: thailand.id, province: "Bangkok", category: 'activity', activityPackages: thaiActivityPackages, currency: "THB", unitDescription: "per person" },
      { id: generateGUID(), name: "Phuket Phi Phi Island Speedboat", countryId: thailand.id, province: "Phuket", category: 'activity', price1: 1800, price2: 1200, currency: "THB", unitDescription: "per person", notes: "Includes snorkel gear and lunch." },
      { id: generateGUID(), name: "Chiang Mai Elephant Sanctuary Visit", countryId: thailand.id, province: "Chiang Mai", category: 'activity', price1: 1500, price2: 1000, currency: "THB", unitDescription: "per person", notes: "Ethical elephant interaction." },
      { id: generateGUID(), name: "BKK Airport to City Center (Sedan)", countryId: thailand.id, province: "Bangkok", category: 'transfer', transferMode: 'vehicle', currency: "THB", unitDescription: "per service", vehicleOptions: [{ id: generateGUID(), vehicleType: 'Sedan', price: 800, maxPassengers: 3, notes: "Comfortable sedan" }], surchargePeriods: [{ id: generateGUID(), name: "New Year Peak", startDate: format(new Date(currentYear, 11, 28), 'yyyy-MM-dd'), endDate: format(new Date(currentYear + 1, 0, 2), 'yyyy-MM-dd'), surchargeAmount: 200 }] },
      { id: generateGUID(), name: "Ferry Ticket to Koh Samui", countryId: thailand.id, province: "Surat Thani (Samui/Phangan/Tao)", category: 'transfer', transferMode: 'ticket', price1: 600, price2: 400, currency: "THB", unitDescription: "per person", subCategory: "ticket" },
      { id: generateGUID(), name: "Thai Set Dinner at Hotel", countryId: thailand.id, province: "Bangkok", category: 'meal', price1: 750, currency: "THB", subCategory: "Set Menu", unitDescription: "per person" },
      { id: generateGUID(), name: "SIM Card (Thailand)", countryId: thailand.id, category: 'misc', price1: 300, currency: "THB", unitDescription: "per item", subCategory: "Communication" }
    );
  }

  // Malaysia Services
  if (malaysia) {
    demoPrices.push(
      { id: generateGUID(), name: "Kuala Lumpur City Highlights Tour", countryId: malaysia.id, province: "Kuala Lumpur", category: 'activity', price1: 120, price2: 80, currency: "MYR", unitDescription: "per person" },
      { id: generateGUID(), name: "Langkawi Mangrove Kayaking", countryId: malaysia.id, province: "Langkawi", category: 'activity', price1: 180, currency: "MYR", unitDescription: "per person", notes: "Guided tour, includes equipment." },
      { id: generateGUID(), name: "Penang Street Food Tour", countryId: malaysia.id, province: "Penang", category: 'activity', price1: 90, currency: "MYR", unitDescription: "per person", notes: "Evening tour, food costs extra." },
      { id: generateGUID(), name: "KLIA Express Train Ticket", countryId: malaysia.id, province: "Kuala Lumpur", category: 'transfer', transferMode: 'ticket', price1: 55, currency: "MYR", unitDescription: "per person", subCategory: "ticket" },
      { id: generateGUID(), name: "Private Van KL Airport to City (Van)", countryId: malaysia.id, province: "Kuala Lumpur", category: 'transfer', transferMode: 'vehicle', currency: "MYR", unitDescription: "per service", vehicleOptions: [{id: generateGUID(), vehicleType: "Van", price: 150, maxPassengers: 7}]},
      { id: generateGUID(), name: "Buffet Lunch at Revolving Tower", countryId: malaysia.id, province: "Kuala Lumpur", category: 'meal', price1: 90, price2: 50, currency: "MYR", subCategory: "Buffet", unitDescription: "per person" }
    );
  }
  // Singapore Services
  if (singapore) {
    demoPrices.push(
      { id: generateGUID(), name: "Singapore Night Safari Admission", countryId: singapore.id, province: "Singapore", category: 'activity', price1: 55, price2: 38, currency: "SGD", unitDescription: "per person" },
      { id: generateGUID(), name: "Gardens by the Bay (2 Domes)", countryId: singapore.id, province: "Singapore", category: 'activity', price1: 53, price2: 40, currency: "SGD", unitDescription: "per person" },
      { id: generateGUID(), name: "Changi Airport to City (Taxi)", countryId: singapore.id, province: "Singapore", category: 'transfer', transferMode: 'vehicle', currency: "SGD", unitDescription: "per service (approx)", vehicleOptions: [{id: generateGUID(), vehicleType: "Sedan", price: 30, maxPassengers: 4, notes: "Metered fare estimate"}]}
    );
  }
  // Vietnam Services
  if (vietnam) {
    demoPrices.push(
      { id: generateGUID(), name: "Ha Long Bay Day Cruise", countryId: vietnam.id, province: "Hanoi", category: 'activity', price1: 1200000, price2: 900000, currency: "VND", unitDescription: "per person", notes: "Includes lunch and cave visit. (From Hanoi)" },
      { id: generateGUID(), name: "Cu Chi Tunnels Half-Day Tour", countryId: vietnam.id, province: "Ho Chi Minh City", category: 'activity', price1: 500000, currency: "VND", unitDescription: "per person" },
      { id: generateGUID(), name: "Hanoi Airport to Old Quarter (Private Car)", countryId: vietnam.id, province: "Hanoi", category: 'transfer', transferMode: 'vehicle', currency: "VND", unitDescription: "per service", vehicleOptions: [{id: generateGUID(), vehicleType: "Sedan", price: 350000, maxPassengers: 3}]}
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
            // Basic validation for existing stored prices
            const validatedPrices = parsedPrices.filter(p => p.id && p.name && p.category && p.currency);
            pricesToSet = validatedPrices;

            // Ensure demo prices are present if user has existing data, avoid duplicates by name+province+category
            DEMO_SERVICE_PRICES.forEach(demoPrice => {
                const exists = pricesToSet.some(existingPrice =>
                existingPrice.name === demoPrice.name &&
                existingPrice.province === demoPrice.province &&
                existingPrice.category === demoPrice.category &&
                existingPrice.countryId === demoPrice.countryId
                );
                if (!exists) {
                pricesToSet.push(demoPrice);
                }
            });
            } else {
                pricesToSet = DEMO_SERVICE_PRICES; // If not array, use demo
                localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(pricesToSet));
            }
        } catch (parseError) {
            console.warn("Error parsing service prices from localStorage, seeding defaults:", parseError);
            localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY);
            pricesToSet = DEMO_SERVICE_PRICES;
            localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(pricesToSet));
        }
      } else {
        pricesToSet = DEMO_SERVICE_PRICES;
        localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(pricesToSet));
      }
    } catch (error) {
      console.error("Failed to load or initialize service prices:", error);
      pricesToSet = DEMO_SERVICE_PRICES; // Fallback to demo on significant error
      if(localStorage.getItem(SERVICE_PRICES_STORAGE_KEY)) {
        localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY); // Attempt to clear if problematic
      }
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
            // For hotels, countryId is on hotelDetails. For others, it's directly on the service or undefined.
            if (service.category === 'hotel') {
                if (!service.hotelDetails || service.hotelDetails.countryId !== filters.countryId) return false;
            } else if (service.countryId && service.countryId !== filters.countryId) {
                return false; // If service has a countryId, it must match
            } else if (!service.countryId && filters.category !== 'misc') { // Generic non-misc services without countryId shouldn't match specific country filter
                // Allow misc items without countryId to pass through if no specific countryId is set on them
            }
        }
        
        if (filters.provinceName) {
             if (service.category === 'hotel') {
                if (!service.hotelDetails || service.hotelDetails.province !== filters.provinceName) return false;
            } else if (service.province && service.province !== filters.provinceName) {
                return false;
            } else if (!service.province && service.category !== 'misc') {
                 // Allow misc items without province to pass through
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
