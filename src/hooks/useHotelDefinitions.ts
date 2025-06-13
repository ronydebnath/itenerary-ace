
import * as React from 'react';
import type { HotelDefinition, CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries } from './useCountries'; 

const HOTEL_DEFINITIONS_STORAGE_KEY = 'itineraryAceHotelDefinitions';
const currentYear = new Date().getFullYear();
const DEFAULT_THAI_COUNTRY_NAME = "Thailand";
const DEFAULT_MALAYSIAN_COUNTRY_NAME = "Malaysia";


const createDemoHotelDefinitions = (thaiCountryId?: string, malaysianCountryId?: string): HotelDefinition[] => {
  const definitions: HotelDefinition[] = [];

  if (thaiCountryId) {
    definitions.push(
      {
        id: "hd_bkk_grand_riverside",
        name: "Grand Bangkok Riverside Hotel",
        countryId: thaiCountryId,
        province: "Bangkok",
        roomTypes: [
          {
            id: "rt_bkk_gr_deluxe_city", name: "Deluxe City View", extraBedAllowed: true, notes: "Modern room with city views, 32 sqm.",
            seasonalPrices: [
              { id: generateGUID(), seasonName: "Low Season", startDate: `${currentYear}-05-01`, endDate: `${currentYear}-10-31`, rate: 2500, extraBedRate: 800 },
              { id: generateGUID(), seasonName: "High Season", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-04-30`, rate: 3500, extraBedRate: 1000 }
            ],
            characteristics: [{ id: generateGUID(), key: "Size", value: "32 sqm" }, { id: generateGUID(), key: "Bed", value: "King or Twin" }, { id: generateGUID(), key: "View", value: "City" }]
          },
          {
            id: "rt_bkk_gr_suite_river", name: "River View Suite", extraBedAllowed: false, notes: "Spacious suite, 60 sqm.",
            seasonalPrices: [{ id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 6000 }],
            characteristics: [{ id: generateGUID(), key: "Size", value: "60 sqm" }]
          }
        ]
      },
      {
        id: "hd_pty_jomtien_luxury", name: "Jomtien Luxury Condotel", countryId: thaiCountryId, province: "Pattaya",
        roomTypes: [
          {
            id: "rt_pty_jl_one_bedroom", name: "One Bedroom Seaview Condo", extraBedAllowed: false, notes: "Apartment-style, 55sqm.",
            seasonalPrices: [
              { id: generateGUID(), seasonName: "Monthly Rate (Low)", startDate: `${currentYear}-05-01`, endDate: `${currentYear}-10-31`, rate: Math.round(25000/30) },
              { id: generateGUID(), seasonName: "Daily Rate (High)", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-04-30`, rate: 1800 }
            ],
            characteristics: [{ id: generateGUID(), key: "Size", value: "55 sqm" }]
          }
        ]
      }
    );
  }

  if (malaysianCountryId) {
    definitions.push(
      {
        id: "hd_kul_city_center_grand",
        name: "Kuala Lumpur City Center Grand",
        countryId: malaysianCountryId,
        province: "Kuala Lumpur",
        roomTypes: [
          {
            id: "rt_kul_ccg_deluxe_twin", name: "Deluxe Twin Towers View", extraBedAllowed: true, notes: "Stunning views of Petronas Towers, 35 sqm.",
            seasonalPrices: [
              { id: generateGUID(), seasonName: "Regular Season", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 450, extraBedRate: 150 } // Assuming MYR
            ],
            characteristics: [{ id: generateGUID(), key: "Size", value: "35 sqm" }, { id: generateGUID(), key: "Bed", value: "Twin" }, { id: generateGUID(), key: "View", value: "Petronas Towers" }]
          },
          {
            id: "rt_kul_ccg_club_king", name: "Club King Room", extraBedAllowed: false, notes: "Access to Club Lounge, 40 sqm.",
            seasonalPrices: [
              { id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 650 } // Assuming MYR
            ],
            characteristics: [{ id: generateGUID(), key: "Size", value: "40 sqm" }, { id: generateGUID(), key: "Bed", value: "King" }, { id: generateGUID(), key: "Access", value: "Club Lounge" }]
          }
        ]
      },
      {
        id: "hd_pen_beachfront_retreat",
        name: "Penang Beachfront Retreat",
        countryId: malaysianCountryId,
        province: "Penang",
        roomTypes: [
          {
            id: "rt_pen_br_seafacing", name: "Seafacing Balcony Room", extraBedAllowed: true, notes: "Direct sea view, balcony, 30 sqm.",
            seasonalPrices: [
              { id: generateGUID(), seasonName: "Peak Season", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-02-28`, rate: 380, extraBedRate: 100 }, // Assuming MYR
              { id: generateGUID(), seasonName: "Off-Peak", startDate: `${currentYear}-03-01`, endDate: `${currentYear}-10-31`, rate: 300, extraBedRate: 80 } // Assuming MYR
            ],
            characteristics: [{id: generateGUID(), key: "Size", value: "30sqm"}, {id: generateGUID(), key: "Feature", value: "Balcony"}]
          }
        ]
      }
    );
  }
  return definitions;
};

export function useHotelDefinitions() {
  const { countries, isLoading: isLoadingCountries, getCountryByName } = useCountries();
  const [allHotelDefinitions, setAllHotelDefinitions] = React.useState<HotelDefinition[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isLoadingCountries) return;

    let definitionsToSet: HotelDefinition[] = [];
    const thaiCountry = getCountryByName(DEFAULT_THAI_COUNTRY_NAME);
    const malaysianCountry = getCountryByName(DEFAULT_MALAYSIAN_COUNTRY_NAME);
    const DEMO_HOTELS = createDemoHotelDefinitions(thaiCountry?.id, malaysianCountry?.id);

    try {
      const storedDefinitionsString = localStorage.getItem(HOTEL_DEFINITIONS_STORAGE_KEY);
      if (storedDefinitionsString) {
        const parsedDefinitions = JSON.parse(storedDefinitionsString) as HotelDefinition[];
        if (Array.isArray(parsedDefinitions) && parsedDefinitions.length > 0) {
          const validatedDefinitions = parsedDefinitions.filter(
            h => h.id && h.name && h.countryId && h.province && Array.isArray(h.roomTypes) && 
                 h.roomTypes.every((rt: any) => rt.id && rt.name && Array.isArray(rt.seasonalPrices) && rt.seasonalPrices.every((sp: any) => sp.id && sp.startDate && sp.endDate && typeof sp.rate === 'number'))
          );
          if (validatedDefinitions.length > 0) {
            definitionsToSet = validatedDefinitions;
          } else {
            definitionsToSet = DEMO_HOTELS;
            if (DEMO_HOTELS.length > 0) localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTELS));
            else localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY);
          }
        } else {
          definitionsToSet = DEMO_HOTELS;
          if (DEMO_HOTELS.length > 0) localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTELS));
          else localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY);
        }
      } else if (DEMO_HOTELS.length > 0) {
        definitionsToSet = DEMO_HOTELS;
        localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTELS));
      }
    } catch (error) {
      console.error("Failed to load or initialize hotel definitions:", error);
      definitionsToSet = DEMO_HOTELS;
      if (DEMO_HOTELS.length > 0) {
        try { localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTELS)); } 
        catch (saveError) { console.error("Failed to save demo hotel definitions after load error:", saveError); }
      } else {
        localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY);
      }
    }
    setAllHotelDefinitions(definitionsToSet);
    setIsLoading(false);
  }, [isLoadingCountries, getCountryByName, countries]); // Added countries dependency

  const getHotelDefinitionsByLocation = React.useCallback(
    (countryId?: string, provinceName?: string): HotelDefinition[] => {
      if (isLoading) return [];
      let filtered = allHotelDefinitions;
      if (countryId) {
        filtered = filtered.filter(hd => hd.countryId === countryId);
      }
      if (provinceName) {
        filtered = filtered.filter(hd => hd.province === provinceName);
      }
      return filtered.sort((a,b) => a.name.localeCompare(b.name));
    },
    [allHotelDefinitions, isLoading]
  );
  
  const getHotelDefinitionById = React.useCallback(
    (id: string): HotelDefinition | undefined => {
      if (isLoading) return undefined;
      return allHotelDefinitions.find(hd => hd.id === id);
    }, [allHotelDefinitions, isLoading]);

  const getRoomTypeDefinitionByIds = React.useCallback(
    (hotelDefId: string, roomTypeDefId: string) => {
      const hotelDef = getHotelDefinitionById(hotelDefId);
      return hotelDef?.roomTypes.find(rt => rt.id === roomTypeDefId);
    }, [getHotelDefinitionById]);


  return { isLoading, allHotelDefinitions, getHotelDefinitionsByLocation, getHotelDefinitionById, getRoomTypeDefinitionByIds };
}
