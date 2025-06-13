
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, HotelDefinition, CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries } from './useCountries'; 

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';
const currentYear = new Date().getFullYear();
const DEFAULT_THAI_COUNTRY_NAME = "Thailand";
const DEFAULT_MALAYSIAN_COUNTRY_NAME = "Malaysia";


const createDemoHotelDefinitionsForServices = (thaiCountryId?: string, malaysianCountryId?: string): HotelDefinition[] => {
  const definitions: HotelDefinition[] = [];
  if (thaiCountryId) {
    definitions.push(
      {
        id: "hd_bkk_grand_riverside", name: "Grand Bangkok Riverside Hotel", countryId: thaiCountryId, province: "Bangkok",
        roomTypes: [ { id: "rt_bkk_gr_deluxe_city", name: "Deluxe City View", extraBedAllowed: true, notes: "Modern room with city views, 32 sqm.", seasonalPrices: [{ id: generateGUID(), seasonName: "Low Season", startDate: `${currentYear}-05-01`, endDate: `${currentYear}-10-31`, rate: 2500, extraBedRate: 800 },{ id: generateGUID(), seasonName: "High Season", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-04-30`, rate: 3500, extraBedRate: 1000 }], characteristics: [{ id: generateGUID(), key: "Size", value: "32 sqm" },{ id: generateGUID(), key: "Bed", value: "King or Twin" },{ id: generateGUID(), key: "View", value: "City" }] }, { id: "rt_bkk_gr_suite_river", name: "River View Suite", extraBedAllowed: false, notes: "Spacious suite, 60 sqm.", seasonalPrices: [{ id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 6000 }], characteristics: [{ id: generateGUID(), key: "Size", value: "60 sqm" }] } ]
      },
      {
        id: "hd_pty_jomtien_luxury", name: "Jomtien Luxury Condotel", countryId: thaiCountryId, province: "Pattaya",
        roomTypes: [ { id: "rt_pty_jl_one_bedroom", name: "One Bedroom Seaview Condo", extraBedAllowed: false, notes: "Apartment-style, 55sqm.", seasonalPrices: [{ id: generateGUID(), seasonName: "Monthly Rate (Low)", startDate: `${currentYear}-05-01`, endDate: `${currentYear}-10-31`, rate: Math.round(25000/30) },{ id: generateGUID(), seasonName: "Daily Rate (High)", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-04-30`, rate: 1800 }], characteristics: [{ id: generateGUID(), key: "Size", value: "55 sqm" }] } ]
      }
    );
  }
  if (malaysianCountryId) {
    definitions.push(
        {
        id: "hd_kul_city_center_grand", name: "Kuala Lumpur City Center Grand", countryId: malaysianCountryId, province: "Kuala Lumpur",
        roomTypes: [ { id: "rt_kul_ccg_deluxe_twin", name: "Deluxe Twin Towers View", extraBedAllowed: true, notes: "Stunning views of Petronas Towers, 35 sqm.", seasonalPrices: [{ id: generateGUID(), seasonName: "Regular Season", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 450, extraBedRate: 150 }], characteristics: [{ id: generateGUID(), key: "Size", value: "35 sqm" },{ id: generateGUID(), key: "Bed", value: "Twin" },{ id: generateGUID(), key: "View", value: "Petronas Towers" }] }, { id: "rt_kul_ccg_club_king", name: "Club King Room", extraBedAllowed: false, notes: "Access to Club Lounge, 40 sqm.", seasonalPrices: [{ id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 650 }], characteristics: [{ id: generateGUID(), key: "Size", value: "40 sqm" },{ id: generateGUID(), key: "Bed", value: "King" },{ id: generateGUID(), key: "Access", value: "Club Lounge" }] } ]
      }
    );
  }
  return definitions;
};

const createDemoServicePrices = (thaiCountryId?: string, malaysianCountryId?: string): ServicePriceItem[] => {
  const demoHotels = createDemoHotelDefinitionsForServices(thaiCountryId, malaysianCountryId);
  const hotelServiceItems = demoHotels.map((hd): ServicePriceItem => ({
    id: generateGUID(), name: hd.name, countryId: hd.countryId, province: hd.province, category: "hotel", currency: hd.countryId === malaysianCountryId ? "MYR" : "THB", unitDescription: "per night", notes: `Details for ${hd.name}.`, hotelDetails: hd,
  }));

  const otherServices: ServicePriceItem[] = [];
  if (thaiCountryId) {
    otherServices.push(
      { id: generateGUID(), name: "BKK Airport to Bangkok Hotel", countryId: thaiCountryId, province: "Bangkok", category: "transfer", transferMode: "vehicle", vehicleOptions: [{ id: generateGUID(), vehicleType: "Sedan", price: 1000, maxPassengers: 3 },{ id: generateGUID(), vehicleType: "Van", price: 1500, maxPassengers: 8 }], surchargePeriods: [{ id: generateGUID(), name: "New Year Peak", startDate: `${currentYear}-12-28`, endDate: `${currentYear + 1}-01-03`, surchargeAmount: 300 }], currency: "THB", unitDescription: "per service" },
      { id: generateGUID(), name: "Grand Palace & Temples Tour", countryId: thaiCountryId, province: "Bangkok", category: "activity", activityPackages: [{ id: generateGUID(), name: "Half-Day Tour", price1: 1200, price2: 800, notes: "Includes guide, entrance fees.", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31` }], currency: "THB", unitDescription: "per person"},
      { id: generateGUID(), name: "Riverside Thai Dinner Set", countryId: thaiCountryId, province: "Bangkok", category: "meal", price1: 800, subCategory: "Set Menu", currency: "THB", unitDescription: "per person" },
      { id: generateGUID(), name: "Coral Island Speedboat Tour", countryId: thaiCountryId, province: "Pattaya", category: "activity", activityPackages: [{ id: generateGUID(), name: "Full Day with Lunch", price1: 1500, notes: "Incl. hotel transfer, speedboat, lunch.", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31` }], currency: "THB", unitDescription: "per person"}
    );
  }
  if (malaysianCountryId) {
    otherServices.push(
      { id: generateGUID(), name: "KLIA Airport to KL Hotel", countryId: malaysianCountryId, province: "Kuala Lumpur", category: "transfer", transferMode: "vehicle", vehicleOptions: [{ id: generateGUID(), vehicleType: "Sedan", price: 90, maxPassengers: 3 }, {id: generateGUID(), vehicleType: "MPV", price: 150, maxPassengers: 6}], currency: "MYR", unitDescription: "per service" },
      { id: generateGUID(), name: "Petronas Towers Visit", countryId: malaysianCountryId, province: "Kuala Lumpur", category: "activity", activityPackages: [{ id: generateGUID(), name: "Observation Deck Ticket", price1: 80, notes: "Standard entry.", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31` }], currency: "MYR", unitDescription: "per person"},
      { id: generateGUID(), name: "Penang Street Food Tour", countryId: malaysianCountryId, province: "Penang", category: "activity", activityPackages: [{id: generateGUID(), name: "Evening Food Hunt", price1: 120, notes: "4 hours, includes multiple food stops", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31`}], currency: "MYR", unitDescription: "per person"}
    );
  }
  
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
    const thaiCountry = getCountryByName(DEFAULT_THAI_COUNTRY_NAME);
    const malaysianCountry = getCountryByName(DEFAULT_MALAYSIAN_COUNTRY_NAME);
    const DEMO_SERVICE_PRICES = createDemoServicePrices(thaiCountry?.id, malaysianCountry?.id);

    try {
      const storedPricesString = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      if (storedPricesString) {
        const parsedPrices = JSON.parse(storedPricesString) as ServicePriceItem[];
        if (Array.isArray(parsedPrices) && parsedPrices.length > 0) {
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
  }, [isLoadingCountries, getCountryByName, countries]); // Added countries

  const getServicePricesFiltered = React.useCallback(
    (filters: { category?: ItineraryItemType; countryId?: string; provinceName?: string; currency?: string } = {}): ServicePriceItem[] => {
      if (isLoading) return [];
      return allServicePrices.filter(service => {
        if (filters.category && service.category !== filters.category) return false;
        
        // For country filtering:
        // - If a countryId filter is provided, the service must match it OR be a misc item (generic)
        // - A service with NO countryId is considered "generic" and should pass this filter if no specific country is asked for,
        //   unless it's a hotel, which MUST have a countryId.
        if (filters.countryId) {
            if (service.category === 'hotel' && service.hotelDetails?.countryId !== filters.countryId) return false;
            if (service.category !== 'hotel' && service.category !== 'misc' && service.countryId && service.countryId !== filters.countryId) return false;
            if (service.category !== 'hotel' && service.category !== 'misc' && !service.countryId) return false; // Non-misc, non-hotel items without a country don't match if a country filter is active
        }
        
        // For province filtering:
        // - If a provinceName filter is provided, the service must match it OR be a misc item.
        // - A service with NO province is considered "generic" for that country (if country is set) or globally generic.
        if (filters.provinceName) {
            if (service.category === 'misc' && service.province !== filters.provinceName && service.province) return false; // Misc can be specific, but if no province, passes
            if (service.category !== 'misc' && service.province !== filters.provinceName) return false;
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

  return { isLoading, allServicePrices, getServicePrices: getServicePricesFiltered, getServicePriceById };
}

