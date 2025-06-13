
import * as React from 'react';
import type { HotelDefinition, CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries } from './useCountries'; // Import useCountries

const HOTEL_DEFINITIONS_STORAGE_KEY = 'itineraryAceHotelDefinitions';
const currentYear = new Date().getFullYear();
const DEFAULT_COUNTRY_NAME_FOR_DEMO_HOTELS = "Thailand";


const createDemoHotelDefinitions = (thailandCountryId?: string): HotelDefinition[] => {
  if (!thailandCountryId) return []; // Don't create demo hotels if default country ID isn't found

  return [
  {
    id: "hd_bkk_grand_riverside",
    name: "Grand Bangkok Riverside Hotel",
    countryId: thailandCountryId,
    province: "Bangkok",
    roomTypes: [
      {
        id: "rt_bkk_gr_deluxe_city",
        name: "Deluxe City View",
        extraBedAllowed: true,
        notes: "Modern room with city views, 32 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Low Season", startDate: `${currentYear}-05-01`, endDate: `${currentYear}-10-31`, rate: 2500, extraBedRate: 800 },
          { id: generateGUID(), seasonName: "High Season", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-04-30`, rate: 3500, extraBedRate: 1000 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "32 sqm" },
          { id: generateGUID(), key: "Bed", value: "King or Twin" },
          { id: generateGUID(), key: "View", value: "City" }
        ]
      },
      {
        id: "rt_bkk_gr_suite_river",
        name: "River View Suite",
        extraBedAllowed: false,
        notes: "Spacious suite with panoramic river views, separate living area, 60 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 6000 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "60 sqm" },
          { id: generateGUID(), key: "Bed", value: "King" },
          { id: generateGUID(), key: "View", value: "River (Panoramic)" },
          { id: generateGUID(), key: "Features", value: "Separate Living Room, Bathtub" }
        ]
      }
    ]
  },
  {
    id: "hd_bkk_urban_oasis",
    name: "Urban Oasis Boutique Hotel",
    countryId: thailandCountryId,
    province: "Bangkok",
    roomTypes: [
      {
        id: "rt_bkk_uo_superior",
        name: "Superior Room",
        extraBedAllowed: false,
        notes: "Cozy room with essential amenities, 25 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Standard Rate", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 1800 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "25 sqm" },
          { id: generateGUID(), key: "Bed", value: "Queen" }
        ]
      },
      {
        id: "rt_bkk_uo_deluxe_balcony",
        name: "Deluxe Balcony Room",
        extraBedAllowed: true,
        notes: "Room with private balcony, 30 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Standard Rate", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 2200, extraBedRate: 700 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "30 sqm" },
          { id: generateGUID(), key: "Bed", value: "King" },
          { id: generateGUID(), key: "Feature", value: "Private Balcony" }
        ]
      }
    ]
  },
  {
    id: "hd_bkk_sukhumvit_modern",
    name: "Sukhumvit Modern Living",
    countryId: thailandCountryId,
    province: "Bangkok",
    roomTypes: [
      {
        id: "rt_bkk_sm_studio",
        name: "Executive Studio",
        extraBedAllowed: false,
        notes: "Stylish studio with kitchenette, 40 sqm. Near BTS.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 2800 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "40 sqm" },
          { id: generateGUID(), key: "Bed", value: "King" },
          { id: generateGUID(), key: "Feature", value: "Kitchenette, BTS Access" }
        ]
      }
    ]
  },
  {
    id: "hd_pty_beach_resort",
    name: "Pattaya Beach Resort & Spa",
    countryId: thailandCountryId,
    province: "Pattaya",
    roomTypes: [
      {
        id: "rt_pty_br_garden_view",
        name: "Superior Garden View",
        extraBedAllowed: true,
        notes: "Comfortable room overlooking lush gardens, 28 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Standard Rate", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 2000, extraBedRate: 600 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "28 sqm" },
          { id: generateGUID(), key: "Bed", value: "King or Twin" },
          { id: generateGUID(), key: "View", value: "Garden" }
        ]
      },
      {
        id: "rt_pty_br_oceanfront_dlx",
        name: "Oceanfront Deluxe",
        extraBedAllowed: false,
        notes: "Stunning ocean views from private balcony, 35 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Peak Season", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-03-31`, rate: 4000 },
          { id: generateGUID(), seasonName: "Regular Season", startDate: `${currentYear}-04-01`, endDate: `${currentYear}-10-31`, rate: 3200 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "35 sqm" },
          { id: generateGUID(), key: "Bed", value: "King" },
          { id: generateGUID(), key: "View", value: "Oceanfront with Balcony" }
        ]
      }
    ]
  },
  {
    id: "hd_pty_seaview_inn",
    name: "Seaview Inn Pattaya",
    countryId: thailandCountryId,
    province: "Pattaya",
    roomTypes: [
      {
        id: "rt_pty_si_standard",
        name: "Standard Seaview",
        extraBedAllowed: false,
        notes: "Budget-friendly room with partial sea view, 22 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 1500 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "22 sqm" },
          { id: generateGUID(), key: "Bed", value: "Double" },
          { id: generateGUID(), key: "View", value: "Partial Sea View" }
        ]
      },
      {
        id: "rt_pty_si_family",
        name: "Family Room Garden Access",
        extraBedAllowed: true,
        notes: "Spacious room for families, direct garden access, 40 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 2800, extraBedRate: 500 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "40 sqm" },
          { id: generateGUID(), key: "Bed", value: "King + Bunk Bed" },
          { id: generateGUID(), key: "Feature", value: "Direct Garden Access" }
        ]
      }
    ]
  },
  {
    id: "hd_pty_jomtien_luxury",
    name: "Jomtien Luxury Condotel",
    countryId: thailandCountryId,
    province: "Pattaya",
    roomTypes: [
      {
        id: "rt_pty_jl_one_bedroom",
        name: "One Bedroom Seaview Condo",
        extraBedAllowed: false,
        notes: "Apartment-style with kitchen, living area, balcony, 55sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Monthly Rate (Low)", startDate: `${currentYear}-05-01`, endDate: `${currentYear}-10-31`, rate: Math.round(25000/30) },
          { id: generateGUID(), seasonName: "Daily Rate (High)", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-04-30`, rate: 1800 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "55 sqm" },
          { id: generateGUID(), key: "Bed", value: "King" },
          { id: generateGUID(), key: "View", value: "Seaview" },
          { id: generateGUID(), key: "Features", value: "Kitchen, Living Area, Balcony, Pool Access" }
        ]
      }
    ]
  }
];
}

export function useHotelDefinitions() {
  const { countries, isLoading: isLoadingCountries, getCountryByName } = useCountries();
  const [allHotelDefinitions, setAllHotelDefinitions] = React.useState<HotelDefinition[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isLoadingCountries) return;

    let definitionsToSet: HotelDefinition[] = [];
    const defaultCountry = getCountryByName(DEFAULT_COUNTRY_NAME_FOR_DEMO_HOTELS);
    const DEMO_HOTELS = createDemoHotelDefinitions(defaultCountry?.id);

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
  }, [isLoadingCountries, getCountryByName]);

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
      return filtered;
    },
    [allHotelDefinitions, isLoading]
  );
  
  const getHotelDefinitionById = React.useCallback( /* ... unchanged ... */ );
  const getRoomTypeDefinitionByIds = React.useCallback( /* ... unchanged ... */ );

  return { isLoading, allHotelDefinitions, getHotelDefinitionsByLocation, getHotelDefinitionById, getRoomTypeDefinitionByIds };
}
