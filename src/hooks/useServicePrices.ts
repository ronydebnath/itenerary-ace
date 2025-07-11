
/**
 * @fileoverview This custom React hook is responsible for managing service price data.
 * It loads service prices from localStorage, seeds default prices if none exist (including
 * prices derived from hotel definitions), and provides functions to retrieve all prices
 * or filter them by category, location, or currency.
 *
 * @bangla এই কাস্টম রিঅ্যাক্ট হুকটি পরিষেবা মূল্য ডেটা পরিচালনার জন্য দায়ী।
 * এটি localStorage থেকে পরিষেবা মূল্য লোড করে, কোনোটি না থাকলে ডিফল্ট মূল্য (হোটেল
 * সংজ্ঞা থেকে প্রাপ্ত মূল্য সহ) বীজ করে এবং সমস্ত মূল্য পুনরুদ্ধার বা বিভাগ, অবস্থান,
 * বা মুদ্রা দ্বারা ফিল্টার করার জন্য ফাংশন সরবরাহ করে।
 */
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, HotelDefinition, CountryItem, ActivityPackageDefinition, VehicleOption, SurchargePeriod } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries, DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID, DEFAULT_BANGLADESH_ID } from './useCountries';
import { useHotelDefinitions } from './useHotelDefinitions';
import { addDays, format } from 'date-fns';
import { useToast } from './use-toast';


const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';
const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;

const createDemoServicePrices = (
  countries: CountryItem[],
  hotelDefinitions: HotelDefinition[]
): ServicePriceItem[] => {
  const thailand = countries.find(c => c.id === DEFAULT_THAILAND_ID);
  const malaysia = countries.find(c => c.id === DEFAULT_MALAYSIA_ID);
  const bangladesh = countries.find(c => c.id === DEFAULT_BANGLADESH_ID);


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
      isFavorite: false,
    });
  });

  // Thailand Services
  if (thailand) {
    const bkkGrandPalaceTourPackages: ActivityPackageDefinition[] = [
      { id: generateGUID(), name: "Morning Tour (No Lunch)", price1: 1200, price2: 800, notes: "Includes guide and entrance fees. Approx 4 hours.", validityStartDate: format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'), validityEndDate: format(new Date(currentYear, 11, 31), 'yyyy-MM-dd') },
      { id: generateGUID(), name: "Full Day Tour (With Lunch)", price1: 2500, price2: 1500, notes: "Includes guide, fees, and Thai set lunch. Approx 8 hours.", validityStartDate: format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'), validityEndDate: format(new Date(currentYear, 5, 30), 'yyyy-MM-dd'), closedWeekdays: [1] /* Monday */, specificClosedDates: [format(new Date(currentYear, 3, 13), 'yyyy-MM-dd'), format(new Date(currentYear, 3, 14), 'yyyy-MM-dd')] /* Songkran Example */ },
    ];
    demoPrices.push(
      { id: "sp-bkk-grand-palace-demo", name: "Bangkok Grand Palace & Temples Tour", countryId: thailand.id, province: "Bangkok", category: 'activity', activityPackages: bkkGrandPalaceTourPackages, currency: "THB", unitDescription: "per person", notes: "Explore the magnificent Grand Palace and key temples.", isFavorite: true },
      { id: generateGUID(), name: "Chao Phraya River Dinner Cruise", countryId: thailand.id, province: "Bangkok", category: 'activity', activityPackages: [
          {id: generateGUID(), name: "Standard Cruise", price1: 1800, price2: 1000, notes: "International buffet, live music."},
          {id: generateGUID(), name: "Luxury Cruise (Window Seat)", price1: 2800, price2: 1600, notes: "Guaranteed window seat, premium buffet."}
        ], currency: "THB", unitDescription: "per person", notes: "Evening cruise with city views.", isFavorite: false },

      { id: "sp-bkk-airport-sedan-demo", name: "Suvarnabhumi Airport (BKK) to Bangkok City (Sedan)", countryId: thailand.id, province: "Bangkok", category: 'transfer', transferMode: 'vehicle', currency: "THB", unitDescription: "per service", vehicleOptions: [{ id: generateGUID(), vehicleType: 'Sedan', price: 900, maxPassengers: 3, notes: "Comfortable sedan for up to 3 pax with luggage." }], surchargePeriods: [{ id: generateGUID(), name: "Late Night Surcharge (00:00-05:00)", startDate: format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'), endDate: format(new Date(nextYear, 11, 31), 'yyyy-MM-dd'), surchargeAmount: 200 }], isFavorite: true },
      { id: generateGUID(), name: "Suvarnabhumi Airport (BKK) to Bangkok City (Shared Van Ticket)", countryId: thailand.id, province: "Bangkok", category: 'transfer', transferMode: 'ticket', price1: 150, currency: "THB", unitDescription: "per person", subCategory: "ticket", notes: "Seat in shared van, drops at major hotels.", isFavorite: false },

      { id: generateGUID(), name: "Phuket Phi Phi Islands & Maya Bay (Speedboat)", countryId: thailand.id, province: "Phuket", category: 'activity', activityPackages: [
          {id: generateGUID(), name: "Shared Speedboat Tour", price1: 2200, price2: 1500, notes: "Full day, includes lunch, snorkeling."},
        ], currency: "THB", unitDescription: "per person/service", notes: "Explore iconic islands.", isFavorite: false },

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
        ],
        isFavorite: false,
      },

      { id: generateGUID(), name: "Hotel International Buffet Lunch (Bangkok)", countryId: thailand.id, province: "Bangkok", category: 'meal', price1: 950, price2: 475, currency: "THB", subCategory: "Buffet", unitDescription: "per person", isFavorite: false },
      { id: generateGUID(), name: "Seafood BBQ Dinner on the Beach (Phuket)", countryId: thailand.id, province: "Phuket", category: 'meal', price1: 1500, currency: "THB", subCategory: "Special Dinner", unitDescription: "per person", notes: "Fresh seafood buffet.", isFavorite: false },

      { id: generateGUID(), name: "Thai Cooking Class Materials Fee (Bangkok)", countryId: thailand.id, province: "Bangkok", category: 'misc', price1: 500, currency: "THB", unitDescription: "per person", subCategory: "Class Fee", notes: "Ingredients for cooking class.", isFavorite: false },
      { id: generateGUID(), name: "VIP Airport Fast Track (Bangkok BKK)", countryId: thailand.id, province: "Bangkok", category: 'misc', price1: 1500, currency: "THB", unitDescription: "per person", subCategory: "Airport Service", notes: "Arrival or Departure fast track service.", isFavorite: false }
    );
  }

  // Malaysia Services
  if (malaysia) {
    demoPrices.push(
      { id: generateGUID(), name: "Kuala Lumpur City Highlights Tour", countryId: malaysia.id, province: "Kuala Lumpur", category: 'activity', price1: 120, price2: 80, currency: "MYR", unitDescription: "per person", isFavorite: false },
      { id: generateGUID(), name: "KLIA Express Train Ticket", countryId: malaysia.id, province: "Kuala Lumpur", category: 'transfer', transferMode: 'ticket', price1: 55, currency: "MYR", unitDescription: "per person", subCategory: "ticket", isFavorite: false },
      { id: generateGUID(), name: "Buffet Lunch at Revolving Tower KL", countryId: malaysia.id, province: "Kuala Lumpur", category: 'meal', price1: 90, price2: 50, currency: "MYR", subCategory: "Buffet", unitDescription: "per person", isFavorite: false }
    );
  }
  // Bangladesh Services
  if (bangladesh) {
    demoPrices.push(
      { id: generateGUID(), name: "Dhaka City Rickshaw Tour", countryId: bangladesh.id, province: "Dhaka", category: 'activity', price1: 1000, currency: "BDT", unitDescription: "per person", notes: "Half-day guided tour.", isFavorite: false },
      { id: generateGUID(), name: "Hazrat Shahjalal Airport (DAC) to Dhaka City (Sedan)", countryId: bangladesh.id, province: "Dhaka", category: 'transfer', transferMode: 'vehicle', currency: "BDT", vehicleOptions: [{id: generateGUID(), vehicleType: "Sedan", price: 2500, maxPassengers: 3}], unitDescription: "per service", isFavorite: false },
      { id: generateGUID(), name: "Traditional Bengali Thali Dinner", countryId: bangladesh.id, province: "Dhaka", category: 'meal', price1: 800, currency: "BDT", subCategory: "Set Menu", unitDescription: "per person", isFavorite: false }
    );
  }
  return demoPrices;
};

// --- Helper functions for localStorage ---
const loadServicePricesFromStorage = (): ServicePriceItem[] | null => {
  try {
    const storedPricesString = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
    if (storedPricesString) {
      return JSON.parse(storedPricesString) as ServicePriceItem[];
    }
  } catch (e) {
    console.warn("Error reading service prices from localStorage:", e);
    localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY); // Clear corrupted data
  }
  return null;
};

const saveServicePricesToStorage = (pricesToSave: ServicePriceItem[]): void => {
  try {
    pricesToSave.sort((a, b) => a.name.localeCompare(b.name)); // Keep them sorted for consistency
    localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(pricesToSave));
  } catch (e) {
    console.error("Error saving service prices to localStorage:", e);
    // Optionally notify user or implement more robust error handling
  }
};
// --- End helper functions ---

export function useServicePrices() {
  const { countries, isLoading: isLoadingCountries } = useCountries();
  const { allHotelDefinitions, isLoading: isLoadingHotelDefs } = useHotelDefinitions();
  const [allServicePrices, setAllServicePrices] = React.useState<ServicePriceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isLoadingCountries || isLoadingHotelDefs) return;

    let pricesToSet: ServicePriceItem[] = [];
    const DEMO_SERVICE_PRICES = createDemoServicePrices(countries, allHotelDefinitions);

    try {
      const storedPrices = loadServicePricesFromStorage();
      if (storedPrices) {
        const validatedPrices = storedPrices
          .map(p => ({ ...p, isFavorite: p.isFavorite || false }))
          .filter(p => p.id && p.name && p.category && p.currency);
        pricesToSet = validatedPrices;

        DEMO_SERVICE_PRICES.forEach(demoPrice => {
          const exists = pricesToSet.some(existingPrice =>
            existingPrice.id === demoPrice.id ||
            (existingPrice.name === demoPrice.name &&
             existingPrice.province === demoPrice.province &&
             existingPrice.category === demoPrice.category &&
             existingPrice.countryId === demoPrice.countryId)
          );
          if (!exists) {
            pricesToSet.push(demoPrice);
          } else {
            if (demoPrice.id && demoPrice.id.includes("-demo")) {
              const existingIndex = pricesToSet.findIndex(p => p.id === demoPrice.id);
              if (existingIndex !== -1) {
                pricesToSet[existingIndex] = demoPrice;
              } else {
                const oldDemoByName = pricesToSet.findIndex(p =>
                  p.name === demoPrice.name && p.province === demoPrice.province &&
                  p.category === demoPrice.category && p.countryId === demoPrice.countryId &&
                  p.id && !p.id.includes("-demo")
                );
                if (oldDemoByName === -1) pricesToSet.push(demoPrice);
              }
            }
          }
        });
      } else {
        pricesToSet = DEMO_SERVICE_PRICES;
      }
      saveServicePricesToStorage(pricesToSet);
    } catch (error) {
      console.error("Failed to load or initialize service prices:", error);
      pricesToSet = DEMO_SERVICE_PRICES;
      saveServicePricesToStorage(pricesToSet); // Save defaults if error
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

  const toggleFavoriteServicePrice = React.useCallback((serviceId: string) => {
    setAllServicePrices(prevPrices => {
        const updatedPrices = prevPrices.map(p =>
            p.id === serviceId ? { ...p, isFavorite: !p.isFavorite } : p
        );
        saveServicePricesToStorage(updatedPrices); // Persist change
        return updatedPrices;
    });
    const service = allServicePrices.find(p => p.id === serviceId);
    if (service) {
        toast({
            title: "Favorite Status Updated",
            description: `"${service.name}" is now ${!service.isFavorite ? 'a favorite' : 'not a favorite'}.`,
        });
    }
  }, [allServicePrices, toast]);

  return { isLoading: isLoading || isLoadingCountries || isLoadingHotelDefs, allServicePrices, getServicePrices: getServicePricesFiltered, getServicePriceById, toggleFavoriteServicePrice };
}
