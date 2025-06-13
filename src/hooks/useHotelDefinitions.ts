
import * as React from 'react';
import type { HotelDefinition, CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries } from './useCountries'; 

const HOTEL_DEFINITIONS_STORAGE_KEY = 'itineraryAceHotelDefinitions';
// const currentYear = new Date().getFullYear(); // No longer needed for defaults
// const DEFAULT_THAI_COUNTRY_NAME = "Thailand"; // No longer needed for defaults
// const DEFAULT_MALAYSIAN_COUNTRY_NAME = "Malaysia"; // No longer needed for defaults

// createDemoHotelDefinitions function has been removed

export function useHotelDefinitions() {
  const { countries, isLoading: isLoadingCountries, getCountryByName } = useCountries();
  const [allHotelDefinitions, setAllHotelDefinitions] = React.useState<HotelDefinition[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isLoadingCountries) return;

    let definitionsToSet: HotelDefinition[] = [];
    // DEMO_HOTELS creation logic removed

    try {
      const storedDefinitionsString = localStorage.getItem(HOTEL_DEFINITIONS_STORAGE_KEY);
      if (storedDefinitionsString) {
        const parsedDefinitions = JSON.parse(storedDefinitionsString) as HotelDefinition[];
        if (Array.isArray(parsedDefinitions)) { // Simplified check
          const validatedDefinitions = parsedDefinitions.filter(
            h => h.id && h.name && h.countryId && h.province && Array.isArray(h.roomTypes) && 
                 h.roomTypes.every((rt: any) => rt.id && rt.name && Array.isArray(rt.seasonalPrices) && rt.seasonalPrices.every((sp: any) => sp.id && sp.startDate && sp.endDate && typeof sp.rate === 'number'))
          );
          definitionsToSet = validatedDefinitions;
        } else {
          // If not an array or parsing failed, start with empty
          definitionsToSet = [];
          localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY);
        }
      } else {
        // No stored definitions, start empty
        definitionsToSet = [];
      }
    } catch (error) {
      console.error("Failed to load or initialize hotel definitions:", error);
      definitionsToSet = []; // Start empty on error
      localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY); // Clear potentially corrupted data
    }
    setAllHotelDefinitions(definitionsToSet);
    setIsLoading(false);
  }, [isLoadingCountries, getCountryByName, countries]);

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
