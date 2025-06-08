
import * as React from 'react';
import type { HotelDefinition, HotelRoomTypeDefinition, HotelCharacteristic, RoomTypeSeasonalPrice } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const HOTEL_DEFINITIONS_STORAGE_KEY = 'itineraryAceHotelDefinitions';

const DEMO_HOTEL_DEFINITIONS: HotelDefinition[] = [
  {
    id: 'hotel_bkk_grand_riverside',
    name: 'Grand Riverside Hotel',
    province: 'Bangkok',
    roomTypes: [
      {
        id: 'roomtype_bkk_gr_std',
        name: 'Standard Room',
        characteristics: [
          { id: generateGUID(), key: 'Bed Type', value: 'Queen' },
          { id: generateGUID(), key: 'View', value: 'City View' },
          { id: generateGUID(), key: 'Size', value: '25 m²' },
          { id: generateGUID(), key: 'Amenities', value: 'Wi-Fi, Air Conditioning, TV' },
        ],
        notes: 'Popular for solo travelers',
        seasonalPrices: [
          { id: generateGUID(), seasonName: 'High Season', startDate: '2024-12-01', endDate: '2025-02-28', rate: 2500 },
          { id: generateGUID(), seasonName: 'Low Season', startDate: '2025-03-01', endDate: '2025-11-30', rate: 1800 },
          // Fallback for current year testing if needed
          { id: generateGUID(), seasonName: 'High Season (Current Year Fallback)', startDate: '2023-12-01', endDate: '2024-02-29', rate: 2500 },
          { id: generateGUID(), seasonName: 'Low Season (Current Year Fallback)', startDate: '2024-03-01', endDate: '2024-11-30', rate: 1800 },
        ],
      },
      {
        id: 'roomtype_bkk_gr_dlx',
        name: 'Deluxe Room',
        characteristics: [
          { id: generateGUID(), key: 'Bed Type', value: 'King' },
          { id: generateGUID(), key: 'View', value: 'River View' },
          { id: generateGUID(), key: 'Size', value: '35 m²' },
          { id: generateGUID(), key: 'Amenities', value: 'Wi-Fi, Air Conditioning, TV, Bathtub' },
        ],
        notes: 'Best seller for couples',
        seasonalPrices: [
          { id: generateGUID(), seasonName: 'High Season', startDate: '2024-12-01', endDate: '2025-02-28', rate: 3200 },
          { id: generateGUID(), seasonName: 'Low Season', startDate: '2025-03-01', endDate: '2025-11-30', rate: 2400 },
          { id: generateGUID(), seasonName: 'High Season (Current Year Fallback)', startDate: '2023-12-01', endDate: '2024-02-29', rate: 3200 },
          { id: generateGUID(), seasonName: 'Low Season (Current Year Fallback)', startDate: '2024-03-01', endDate: '2024-11-30', rate: 2400 },
        ],
      },
      {
        id: 'roomtype_bkk_gr_fam',
        name: 'Family Suite',
        characteristics: [
          { id: generateGUID(), key: 'Bed Type', value: '2 Queen Beds' },
          { id: generateGUID(), key: 'View', value: 'City & Garden View' },
          { id: generateGUID(), key: 'Size', value: '50 m²' },
          { id: generateGUID(), key: 'Amenities', value: 'Wi-Fi, Kitchenette, 2 TVs, Sofa Bed' },
        ],
        notes: 'Ideal for families of 4+',
        seasonalPrices: [
          { id: generateGUID(), seasonName: 'Peak Season', startDate: '2024-12-20', endDate: '2025-01-10', rate: 4800 },
          { id: generateGUID(), seasonName: 'High Season', startDate: '2025-01-11', endDate: '2025-02-28', rate: 4000 },
          { id: generateGUID(), seasonName: 'Low Season', startDate: '2025-03-01', endDate: '2025-11-30', rate: 3000 },
          // Fallback
          { id: generateGUID(), seasonName: 'Peak Season (Current Year Fallback)', startDate: '2023-12-20', endDate: '2024-01-10', rate: 4800 },
          { id: generateGUID(), seasonName: 'High Season (Current Year Fallback)', startDate: '2024-01-11', endDate: '2024-02-29', rate: 4000 },
          { id: generateGUID(), seasonName: 'Low Season (Current Year Fallback)', startDate: '2024-03-01', endDate: '2024-11-30', rate: 3000 },
        ],
      },
    ],
  },
  {
    id: 'hotel_pty_beachfront',
    name: 'Pattaya Bay Hotel',
    province: 'Pattaya (Chonburi)',
    roomTypes: [
      {
        id: 'roomtype_pty_bf_sup',
        name: 'Superior Sea View',
        characteristics: [
          { id: generateGUID(), key: 'Bed Type', value: 'King or 2 Twins' },
          { id: generateGUID(), key: 'View', value: 'Sea View' },
          { id: generateGUID(), key: 'Size', value: '30 m²' },
          { id: generateGUID(), key: 'Amenities', value: 'Wi-Fi, AC, TV, Balcony' },
        ],
        notes: 'Great views, centrally located.',
        seasonalPrices: [
          { id: generateGUID(), seasonName: 'Peak Season', startDate: '2024-12-15', endDate: '2025-01-15', rate: 3800 },
          { id: generateGUID(), seasonName: 'High Season', startDate: '2025-01-16', endDate: '2025-04-30', rate: 3000 },
          { id: generateGUID(), seasonName: 'Low Season', startDate: '2025-05-01', endDate: '2025-11-14', rate: 2200 },
           // Fallback
          { id: generateGUID(), seasonName: 'Peak Season (Current Year Fallback)', startDate: '2023-12-15', endDate: '2024-01-15', rate: 3800 },
          { id: generateGUID(), seasonName: 'High Season (Current Year Fallback)', startDate: '2024-01-16', endDate: '2024-04-30', rate: 3000 },
          { id: generateGUID(), seasonName: 'Low Season (Current Year Fallback)', startDate: '2024-05-01', endDate: '2024-11-14', rate: 2200 },
        ],
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
          // Basic validation: check for id and name on hotel, and id/name on room types
          const validatedDefinitions = parsedDefinitions.filter(
            h => h.id && h.name && Array.isArray(h.roomTypes) && 
                 h.roomTypes.every((rt: any) => rt.id && rt.name && Array.isArray(rt.seasonalPrices))
          );
          if (validatedDefinitions.length > 0) {
            definitionsToSet = validatedDefinitions;
          } else {
            definitionsToSet = DEMO_HOTEL_DEFINITIONS;
            localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTEL_DEFINITIONS));
          }
        } else {
          definitionsToSet = DEMO_HOTEL_DEFINITIONS;
          localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTEL_DEFINITIONS));
        }
      } else {
        definitionsToSet = DEMO_HOTEL_DEFINITIONS;
        localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTEL_DEFINITIONS));
      }
    } catch (error) {
      console.error("Failed to load or initialize hotel definitions from localStorage:", error);
      definitionsToSet = DEMO_HOTEL_DEFINITIONS;
      try {
        localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTEL_DEFINITIONS));
      } catch (saveError) {
        console.error("Failed to save demo hotel definitions to localStorage after load error:", saveError);
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
