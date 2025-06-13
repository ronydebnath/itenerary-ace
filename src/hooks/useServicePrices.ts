
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, HotelDefinition, CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries } from './useCountries'; // Import useCountries

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';
const currentYear = new Date().getFullYear();
const DEFAULT_COUNTRY_NAME_FOR_DEMO_SERVICES = "Thailand";

const createDemoHotelDefinitions = (thailandCountryId?: string): HotelDefinition[] => {
  if (!thailandCountryId) return [];
  return [
    {
      id: "hd_bkk_grand_riverside", name: "Grand Bangkok Riverside Hotel", countryId: thailandCountryId, province: "Bangkok",
      roomTypes: [
        { id: "rt_bkk_gr_deluxe_city", name: "Deluxe City View", extraBedAllowed: true, notes: "Modern room with city views, 32 sqm.", seasonalPrices: [{ id: generateGUID(), seasonName: "Low Season", startDate: `${currentYear}-05-01`, endDate: `${currentYear}-10-31`, rate: 2500, extraBedRate: 800 },{ id: generateGUID(), seasonName: "High Season", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-04-30`, rate: 3500, extraBedRate: 1000 }], characteristics: [{ id: generateGUID(), key: "Size", value: "32 sqm" },{ id: generateGUID(), key: "Bed", value: "King or Twin" },{ id: generateGUID(), key: "View", value: "City" }] },
        { id: "rt_bkk_gr_suite_river", name: "River View Suite", extraBedAllowed: false, notes: "Spacious suite, 60 sqm.", seasonalPrices: [{ id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 6000 }], characteristics: [{ id: generateGUID(), key: "Size", value: "60 sqm" }] }
      ]
    },
    // ... (other demo hotel definitions with countryId: thailandCountryId) ...
    {
      id: "hd_pty_jomtien_luxury", name: "Jomtien Luxury Condotel", countryId: thailandCountryId, province: "Pattaya",
      roomTypes: [
        { id: "rt_pty_jl_one_bedroom", name: "One Bedroom Seaview Condo", extraBedAllowed: false, notes: "Apartment-style, 55sqm.", seasonalPrices: [{ id: generateGUID(), seasonName: "Monthly Rate (Low)", startDate: `${currentYear}-05-01`, endDate: `${currentYear}-10-31`, rate: Math.round(25000/30) },{ id: generateGUID(), seasonName: "Daily Rate (High)", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-04-30`, rate: 1800 }], characteristics: [{ id: generateGUID(), key: "Size", value: "55 sqm" }] }
      ]
    }
  ];
};

const createDemoServicePrices = (thailandCountryId?: string): ServicePriceItem[] => {
  const demoHotels = createDemoHotelDefinitions(thailandCountryId);
  const hotelServiceItems = demoHotels.map((hd): ServicePriceItem => ({
    id: generateGUID(), name: hd.name, countryId: hd.countryId, province: hd.province, category: "hotel", currency: "THB", unitDescription: "per night", notes: `Details for ${hd.name}.`, hotelDetails: hd,
  }));

  const otherServices: ServicePriceItem[] = thailandCountryId ? [
    { id: generateGUID(), name: "BKK Airport to Bangkok Hotel", countryId: thailandCountryId, province: "Bangkok", category: "transfer", transferMode: "vehicle", vehicleOptions: [{ id: generateGUID(), vehicleType: "Sedan", price: 1000, maxPassengers: 3 },{ id: generateGUID(), vehicleType: "Van", price: 1500, maxPassengers: 8 }], surchargePeriods: [{ id: generateGUID(), name: "New Year Peak", startDate: `${currentYear}-12-28`, endDate: `${currentYear + 1}-01-03`, surchargeAmount: 300 }], currency: "THB", unitDescription: "per service" },
    { id: generateGUID(), name: "Grand Palace & Temples Tour", countryId: thailandCountryId, province: "Bangkok", category: "activity", activityPackages: [{ id: generateGUID(), name: "Half-Day Tour", price1: 1200, price2: 800, notes: "Includes guide, entrance fees.", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31` }], currency: "THB", unitDescription: "per person"},
    { id: generateGUID(), name: "Riverside Thai Dinner Set", countryId: thailandCountryId, province: "Bangkok", category: "meal", price1: 800, subCategory: "Set Menu", currency: "THB", unitDescription: "per person" },
    { id: generateGUID(), name: "Coral Island Speedboat Tour", countryId: thailandCountryId, province: "Pattaya", category: "activity", activityPackages: [{ id: generateGUID(), name: "Full Day with Lunch", price1: 1500, notes: "Incl. hotel transfer, speedboat, lunch.", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31` }], currency: "THB", unitDescription: "per person"},
  ] : [];
  
  const genericServices: ServicePriceItem[] = [
    { id: generateGUID(), name: "Basic Travel Insurance", category: "misc", price1: 500, subCategory: "Insurance Fee", currency: "THB", unitDescription: "per person for trip" },
  ];

  return [...hotelServiceItems, ...otherServices, ...genericServices];
};

export function useServicePrices() {
  const { countries, isLoading: isLoadingCountries, getCountryByName } = useCountries();
  const [allServicePrices, setAllServicePrices] = React.useState<ServicePriceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isLoadingCountries) return;

    let pricesToSet: ServicePriceItem[] = [];
    const defaultCountry = getCountryByName(DEFAULT_COUNTRY_NAME_FOR_DEMO_SERVICES);
    const DEMO_SERVICE_PRICES = createDemoServicePrices(defaultCountry?.id);

    try {
      const storedPricesString = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      if (storedPricesString) {
        const parsedPrices = JSON.parse(storedPricesString) as ServicePriceItem[];
        if (Array.isArray(parsedPrices) && parsedPrices.length > 0) {
          // Basic validation for critical fields
          const validatedPrices = parsedPrices.filter(p => p.id && p.name && p.category && p.currency && (p.category === 'hotel' ? p.hotelDetails?.countryId : true));
          if (validatedPrices.length > 0) {
            pricesToSet = validatedPrices;
          } else {
            pricesToSet = DEMO_SERVICE_PRICES;
            if (DEMO_SERVICE_PRICES.length > 0) localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEMO_SERVICE_PRICES));
            else localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY);
          }
        } else {
          pricesToSet = DEMO_SERVICE_PRICES;
          if (DEMO_SERVICE_PRICES.length > 0) localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEMO_SERVICE_PRICES));
          else localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY);
        }
      } else if (DEMO_SERVICE_PRICES.length > 0) {
        pricesToSet = DEMO_SERVICE_PRICES;
        localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEMO_SERVICE_PRICES));
      }
    } catch (error) {
      console.error("Failed to load or initialize service prices:", error);
      pricesToSet = DEMO_SERVICE_PRICES;
      if (DEMO_SERVICE_PRICES.length > 0) {
        try { localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEMO_SERVICE_PRICES)); }
        catch (saveError) { console.error("Failed to save demo service prices after load error:", saveError); }
      } else {
        localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY);
      }
    }
    setAllServicePrices(pricesToSet);
    setIsLoading(false);
  }, [isLoadingCountries, getCountryByName]);

  const getServicePricesFiltered = React.useCallback(
    (filters: { category?: ItineraryItemType; countryId?: string; provinceName?: string; currency?: string } = {}): ServicePriceItem[] => {
      if (isLoading) return [];
      return allServicePrices.filter(service => {
        if (filters.category && service.category !== filters.category) return false;
        if (filters.countryId && service.countryId !== filters.countryId && service.category !== 'misc') return false; // Misc items can be generic
        if (filters.provinceName && service.province !== filters.provinceName && service.category !== 'misc') return false;
        if (filters.currency && service.currency !== filters.currency) return false;
        return true;
      });
    },
    [allServicePrices, isLoading]
  );
  
  const getServicePriceById = React.useCallback( /* ... unchanged ... */ );

  return { isLoading, allServicePrices, getServicePrices: getServicePricesFiltered, getServicePriceById };
}
