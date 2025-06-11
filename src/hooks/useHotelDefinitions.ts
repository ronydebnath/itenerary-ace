
import * as React from 'react';
import type { HotelDefinition, HotelRoomTypeDefinition, HotelCharacteristic, RoomTypeSeasonalPrice } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const HOTEL_DEFINITIONS_STORAGE_KEY = 'itineraryAceHotelDefinitions';
const currentYear = new Date().getFullYear();

const DEFAULT_DEMO_HOTEL_DEFINITIONS: HotelDefinition[] = [
  {
    id: "hd_bkk_grand_riverside",
    name: "Grand Bangkok Riverside Hotel",
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
      }
    ]
  },
  {
    id: "hd_pty_beach_resort",
    name: "Pattaya Beach Resort & Spa",
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
      }
    ]
  }
];

export function useHotelDefinitions() {
  const [allHotelDefinitions, setAllHotelDefinitions] = React.useState<HotelDefinition[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let definitionsToSet: HotelDefinition[] = [];
    try {
      const storedDefinitionsString = localStorage.getItem(HOTEL_DEFINITIONS_STORAGE_KEY);
      if (storedDefinitionsString) {
        const parsedDefinitions = JSON.parse(storedDefinitionsString);
        if (Array.isArray(parsedDefinitions) && parsedDefinitions.length > 0) {
          const validatedDefinitions = parsedDefinitions.filter(
            h => h.id && h.name && Array.isArray(h.roomTypes) && 
                 h.roomTypes.every((rt: any) => rt.id && rt.name && Array.isArray(rt.seasonalPrices) && rt.seasonalPrices.every((sp: any) => sp.id && sp.startDate && sp.endDate && typeof sp.rate === 'number'))
          );
          if (validatedDefinitions.length > 0) {
            definitionsToSet = validatedDefinitions;
          } else {
            definitionsToSet = DEFAULT_DEMO_HOTEL_DEFINITIONS;
            if (DEFAULT_DEMO_HOTEL_DEFINITIONS.length > 0) {
                localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_HOTEL_DEFINITIONS));
            } else {
                localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY);
            }
          }
        } else {
          definitionsToSet = DEFAULT_DEMO_HOTEL_DEFINITIONS;
          if (DEFAULT_DEMO_HOTEL_DEFINITIONS.length > 0) {
            localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_HOTEL_DEFINITIONS));
          } else {
            localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY);
          }
        }
      } else {
        definitionsToSet = DEFAULT_DEMO_HOTEL_DEFINITIONS;
        if (DEFAULT_DEMO_HOTEL_DEFINITIONS.length > 0) {
            localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_HOTEL_DEFINITIONS));
        }
      }
    } catch (error) {
      console.error("Failed to load or initialize hotel definitions from localStorage:", error);
      definitionsToSet = DEFAULT_DEMO_HOTEL_DEFINITIONS;
      if (DEFAULT_DEMO_HOTEL_DEFINITIONS.length > 0) {
        try {
          localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_HOTEL_DEFINITIONS));
        } catch (saveError) {
          console.error("Failed to save demo hotel definitions to localStorage after load error:", saveError);
        }
      } else {
          localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY);
      }
    }
    setAllHotelDefinitions(definitionsToSet);
    setIsLoading(false);
  }, []);

  const getHotelDefinitions = React.useCallback(
    (province?: string): HotelDefinition[] => {
      if (isLoading) return [];
      if (province) {
        return allHotelDefinitions.filter(hd => hd.province === province);
      }
      return allHotelDefinitions;
    },
    [allHotelDefinitions, isLoading]
  );
  
  const getHotelDefinitionById = React.useCallback(
    (id: string): HotelDefinition | undefined => {
      if (isLoading) return undefined;
      return allHotelDefinitions.find(hd => hd.id === id);
    },
    [allHotelDefinitions, isLoading]
  );

  const getRoomTypeDefinitionByIds = React.useCallback(
    (hotelDefId: string, roomTypeDefId: string): HotelRoomTypeDefinition | undefined => {
      if (isLoading) return undefined;
      const hotelDef = allHotelDefinitions.find(hd => hd.id === hotelDefId);
      return hotelDef?.roomTypes.find(rt => rt.id === roomTypeDefId);
    },
    [allHotelDefinitions, isLoading]
  );


  return { isLoading, allHotelDefinitions, getHotelDefinitions, getHotelDefinitionById, getRoomTypeDefinitionByIds };
}

