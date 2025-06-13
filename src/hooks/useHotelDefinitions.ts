
import * as React from 'react';
import type { HotelDefinition, CountryItem, HotelRoomTypeDefinition, RoomTypeSeasonalPrice } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries, DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID, DEFAULT_SINGAPORE_ID, DEFAULT_VIETNAM_ID } from './useCountries';
import { addDays, format } from 'date-fns';

const HOTEL_DEFINITIONS_STORAGE_KEY = 'itineraryAceHotelDefinitions';
const currentYear = new Date().getFullYear();

const createDemoHotelDefinitions = (countries: CountryItem[]): HotelDefinition[] => {
  const thailand = countries.find(c => c.id === DEFAULT_THAILAND_ID);
  const malaysia = countries.find(c => c.id === DEFAULT_MALAYSIA_ID);
  const singapore = countries.find(c => c.id === DEFAULT_SINGAPORE_ID);
  const vietnam = countries.find(c => c.id === DEFAULT_VIETNAM_ID);

  const today = new Date();
  const nextMonth = addDays(today, 30);
  const monthAfterNext = addDays(today, 60);

  const defaultSeasonalPrices: RoomTypeSeasonalPrice[] = [
    { id: generateGUID(), seasonName: "Low Season", startDate: format(today, 'yyyy-MM-dd'), endDate: format(addDays(nextMonth, -1), 'yyyy-MM-dd'), rate: 100, extraBedRate: 20 },
    { id: generateGUID(), seasonName: "High Season", startDate: format(nextMonth, 'yyyy-MM-dd'), endDate: format(monthAfterNext, 'yyyy-MM-dd'), rate: 150, extraBedRate: 30 },
  ];

  const deluxeSeasonalPrices: RoomTypeSeasonalPrice[] = [
    { id: generateGUID(), seasonName: "Low Season", startDate: format(today, 'yyyy-MM-dd'), endDate: format(addDays(nextMonth, -1), 'yyyy-MM-dd'), rate: 180, extraBedRate: 35 },
    { id: generateGUID(), seasonName: "High Season", startDate: format(nextMonth, 'yyyy-MM-dd'), endDate: format(monthAfterNext, 'yyyy-MM-dd'), rate: 250, extraBedRate: 50 },
  ];
  
  const standardRoom: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Standard Room", extraBedAllowed: true, notes: "Comfortable standard room with city or garden view.", seasonalPrices: defaultSeasonalPrices, characteristics: [{id: generateGUID(), key: "View", value: "City/Garden"}, {id: generateGUID(), key: "Bed", value: "King or Twin"}]
  };
  const deluxeRoom: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Deluxe Room", extraBedAllowed: true, notes: "Spacious deluxe room with premium amenities.", seasonalPrices: deluxeSeasonalPrices, characteristics: [{id: generateGUID(), key: "View", value: "Pool/Sea"}, {id: generateGUID(), key: "Size", value: "40sqm"}]
  };

  const demoHotels: HotelDefinition[] = [];

  if (thailand) {
    demoHotels.push(
      { id: generateGUID(), name: "Bangkok Central Hotel", countryId: thailand.id, province: "Bangkok", roomTypes: [standardRoom, deluxeRoom] },
      { id: generateGUID(), name: "Phuket Paradise Resort", countryId: thailand.id, province: "Phuket", roomTypes: [{...deluxeRoom, seasonalPrices: deluxeSeasonalPrices.map(p=>({...p, rate: p.rate * 1.2})) }] } // Slightly different prices
    );
  }
  if (malaysia) {
    demoHotels.push(
      { id: generateGUID(), name: "Kuala Lumpur Towers Hotel", countryId: malaysia.id, province: "Kuala Lumpur", roomTypes: [standardRoom, {...deluxeRoom, seasonalPrices: deluxeSeasonalPrices.map(p=>({...p, rate: p.rate * 0.9}))}] },
      { id: generateGUID(), name: "Langkawi Beachfront Villa", countryId: malaysia.id, province: "Langkawi", roomTypes: [deluxeRoom] }
    );
  }
  if (singapore) {
    demoHotels.push(
      { id: generateGUID(), name: "Singapore Marina Sands View", countryId: singapore.id, province: "Singapore", roomTypes: [{...deluxeRoom, seasonalPrices: deluxeSeasonalPrices.map(p=>({...p, rate: p.rate * 1.5}))}] }
    );
  }
  if (vietnam) {
     demoHotels.push(
      { id: generateGUID(), name: "Hanoi Old Quarter Inn", countryId: vietnam.id, province: "Hanoi", roomTypes: [standardRoom] }
    );
  }
  return demoHotels;
};


export function useHotelDefinitions() {
  const { countries, isLoading: isLoadingCountries } = useCountries();
  const [allHotelDefinitions, setAllHotelDefinitions] = React.useState<HotelDefinition[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isLoadingCountries) return;

    let definitionsToSet: HotelDefinition[] = [];
    const DEMO_HOTELS = createDemoHotelDefinitions(countries);

    try {
      const storedDefinitionsString = localStorage.getItem(HOTEL_DEFINITIONS_STORAGE_KEY);
      if (storedDefinitionsString) {
        try {
          const parsedDefinitions = JSON.parse(storedDefinitionsString) as HotelDefinition[];
          if (Array.isArray(parsedDefinitions)) {
            const validatedDefinitions = parsedDefinitions.filter(
              h => h.id && h.name && h.countryId && h.province && Array.isArray(h.roomTypes) &&
                   h.roomTypes.every((rt: any) => rt.id && rt.name && Array.isArray(rt.seasonalPrices) && rt.seasonalPrices.every((sp: any) => sp.id && sp.startDate && sp.endDate && typeof sp.rate === 'number'))
            );
            definitionsToSet = validatedDefinitions;
            // Ensure demo hotels are present if user has existing data
            DEMO_HOTELS.forEach(demoHotel => {
              if (!definitionsToSet.find(def => def.name === demoHotel.name && def.province === demoHotel.province)) {
                definitionsToSet.push(demoHotel);
              }
            });
          } else {
            definitionsToSet = DEMO_HOTELS;
            localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(definitionsToSet));
          }
        } catch (parseError) {
          console.warn("Error parsing hotel definitions from localStorage, seeding defaults:", parseError);
          localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY);
          definitionsToSet = DEMO_HOTELS;
          localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(definitionsToSet));
        }
      } else {
        definitionsToSet = DEMO_HOTELS;
        localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(definitionsToSet));
      }
    } catch (error) {
      console.error("Failed to load or initialize hotel definitions:", error);
      definitionsToSet = DEMO_HOTELS; // Fallback to demo on significant error
      if (localStorage.getItem(HOTEL_DEFINITIONS_STORAGE_KEY)) { // Attempt to clear if problematic
          localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY);
      }
    }
    setAllHotelDefinitions(definitionsToSet.sort((a,b) => a.name.localeCompare(b.name)));
    setIsLoading(false);
  }, [isLoadingCountries, countries]);

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
