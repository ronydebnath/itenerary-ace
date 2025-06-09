
import * as React from 'react';
import type { HotelDefinition, HotelRoomTypeDefinition, HotelCharacteristic, RoomTypeSeasonalPrice } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const HOTEL_DEFINITIONS_STORAGE_KEY = 'itineraryAceHotelDefinitions';

const DEMO_HOTEL_DEFINITIONS: HotelDefinition[] = [
  // All demo data removed
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
                 h.roomTypes.every((rt: any) => rt.id && rt.name && Array.isArray(rt.seasonalPrices))
          );
          if (validatedDefinitions.length > 0) {
            definitionsToSet = validatedDefinitions;
          } else {
            definitionsToSet = DEMO_HOTEL_DEFINITIONS;
            if (DEMO_HOTEL_DEFINITIONS.length > 0) {
                localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTEL_DEFINITIONS));
            } else {
                localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY);
            }
          }
        } else {
          definitionsToSet = DEMO_HOTEL_DEFINITIONS;
          if (DEMO_HOTEL_DEFINITIONS.length > 0) {
            localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTEL_DEFINITIONS));
          } else {
            localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY);
          }
        }
      } else {
        definitionsToSet = DEMO_HOTEL_DEFINITIONS;
        if (DEMO_HOTEL_DEFINITIONS.length > 0) {
            localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTEL_DEFINITIONS));
        }
      }
    } catch (error) {
      console.error("Failed to load or initialize hotel definitions from localStorage:", error);
      definitionsToSet = DEMO_HOTEL_DEFINITIONS;
      if (DEMO_HOTEL_DEFINITIONS.length > 0) {
        try {
          localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(DEMO_HOTEL_DEFINITIONS));
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
