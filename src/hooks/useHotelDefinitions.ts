
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
  const threeMonthsLater = addDays(today, 90);

  // --- Shared Seasonal Price Sets ---
  const standardLowSeason: RoomTypeSeasonalPrice = { id: generateGUID(), seasonName: "Green Season Special", startDate: format(today, 'yyyy-MM-dd'), endDate: format(addDays(nextMonth, -1), 'yyyy-MM-dd'), rate: 2800, extraBedRate: 700 };
  const standardHighSeason: RoomTypeSeasonalPrice = { id: generateGUID(), seasonName: "High Season Rate", startDate: format(nextMonth, 'yyyy-MM-dd'), endDate: format(monthAfterNext, 'yyyy-MM-dd'), rate: 3500, extraBedRate: 900 };
  const standardPeakSeason: RoomTypeSeasonalPrice = { id: generateGUID(), seasonName: "Peak Holiday Rate", startDate: format(addDays(monthAfterNext,1), 'yyyy-MM-dd'), endDate: format(threeMonthsLater, 'yyyy-MM-dd'), rate: 4200, extraBedRate: 1000 };

  const deluxeLowSeason: RoomTypeSeasonalPrice = { id: generateGUID(), seasonName: "Deluxe Off-Peak", startDate: format(today, 'yyyy-MM-dd'), endDate: format(addDays(nextMonth, -1), 'yyyy-MM-dd'), rate: 4500, extraBedRate: 1000 };
  const deluxeHighSeason: RoomTypeSeasonalPrice = { id: generateGUID(), seasonName: "Deluxe High Season", startDate: format(nextMonth, 'yyyy-MM-dd'), endDate: format(monthAfterNext, 'yyyy-MM-dd'), rate: 5800, extraBedRate: 1200 };
  const deluxePeakSeason: RoomTypeSeasonalPrice = { id: generateGUID(), seasonName: "Deluxe Peak Holiday", startDate: format(addDays(monthAfterNext,1), 'yyyy-MM-dd'), endDate: format(threeMonthsLater, 'yyyy-MM-dd'), rate: 6500, extraBedRate: 1500 };

  const suiteLowSeason: RoomTypeSeasonalPrice = { id: generateGUID(), seasonName: "Suite Saver", startDate: format(today, 'yyyy-MM-dd'), endDate: format(addDays(nextMonth, -1), 'yyyy-MM-dd'), rate: 7000, extraBedRate: 1500 };
  const suiteHighSeason: RoomTypeSeasonalPrice = { id: generateGUID(), seasonName: "Suite High Season", startDate: format(nextMonth, 'yyyy-MM-dd'), endDate: format(monthAfterNext, 'yyyy-MM-dd'), rate: 9000, extraBedRate: 2000 };
  const suitePeakSeason: RoomTypeSeasonalPrice = { id: generateGUID(), seasonName: "Suite Peak Holiday", startDate: format(addDays(monthAfterNext,1), 'yyyy-MM-dd'), endDate: format(threeMonthsLater, 'yyyy-MM-dd'), rate: 12000, extraBedRate: 2500 };

  // --- Shared Room Type Definitions ---
  const standardCityRoom: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Standard City View", extraBedAllowed: true, notes: "Comfortable 30sqm room with city view, en-suite bathroom, Wi-Fi, and mini-bar.", seasonalPrices: [standardLowSeason, standardHighSeason, standardPeakSeason], characteristics: [{id: generateGUID(), key: "View", value: "City"}, {id: generateGUID(), key: "Bed", value: "King or Twin"}, {id: generateGUID(), key: "Size", value: "30sqm"}]
  };
  const deluxeRiverRoom: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Deluxe River View", extraBedAllowed: true, notes: "Spacious 40sqm room with stunning river views, balcony, premium amenities, and bathtub.", seasonalPrices: [deluxeLowSeason, deluxeHighSeason, deluxePeakSeason], characteristics: [{id: generateGUID(), key: "View", value: "River"}, {id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "40sqm"}, {id: generateGUID(), key: "Features", value: "Balcony, Bathtub"}]
  };
   const familySuiteCity: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Family Suite City View", extraBedAllowed: true, notes: "60sqm two-bedroom suite ideal for families, kitchenette, living area.", seasonalPrices: [suiteLowSeason, suiteHighSeason, suitePeakSeason], characteristics: [{id: generateGUID(), key: "View", value: "City"}, {id: generateGUID(), key: "Bed", value: "1 King, 2 Twin"}, {id: generateGUID(), key: "Size", value: "60sqm"}, {id: generateGUID(), key: "Features", value: "Two Bedrooms, Kitchenette"}]
  };

  const superiorPoolAccessRoom: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Superior Pool Access", extraBedAllowed: true, notes: "35sqm room with direct access to the resort's lagoon pool from your private terrace.", seasonalPrices: [deluxeLowSeason, deluxeHighSeason, {...deluxePeakSeason, rate: deluxePeakSeason.rate * 1.1}], characteristics: [{id: generateGUID(), key: "Feature", value: "Direct Pool Access"}, {id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "35sqm"}]
  };
  const beachfrontVilla: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Beachfront Villa", extraBedAllowed: false, notes: "Luxurious 70sqm villa with private plunge pool, direct beach access, and personalized butler service.", seasonalPrices: [suiteLowSeason, suiteHighSeason, {...suitePeakSeason, rate: suitePeakSeason.rate * 1.3}].map(sp => ({...sp, rate: sp.rate * 1.5, extraBedRate: sp.extraBedRate ? sp.extraBedRate * 1.5 : undefined})), characteristics: [{id: generateGUID(), key: "Feature", value: "Private Plunge Pool, Beach Access"}, {id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "70sqm"}, {id: generateGUID(), key: "Service", value: "Butler Service"}]
  };
   const twoBedroomFamilyVilla: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Two-Bedroom Family Villa", extraBedAllowed: true, notes: "100sqm villa with two separate bedrooms, living area, kitchenette and garden.", seasonalPrices: [suiteLowSeason, suiteHighSeason, suitePeakSeason].map(sp => ({...sp, rate: sp.rate * 1.8, extraBedRate: sp.extraBedRate ? sp.extraBedRate * 1.8 : undefined})), characteristics: [{id: generateGUID(), key: "Feature", value: "Two Bedrooms, Garden"}, {id: generateGUID(), key: "Bed", value: "1 King, 2 Twin"}, {id: generateGUID(), key: "Size", value: "100sqm"}]
  };

  // --- New Room Types for Bangkok Hotels ---
  const superiorQueenBKK: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Superior Queen", extraBedAllowed: true, notes: "Modern 25sqm room with a comfortable queen bed and city outlook.",
    seasonalPrices: [
      { ...standardLowSeason, rate: 1800, extraBedRate: 500, id: generateGUID(), seasonName: "BKK Superior Low" },
      { ...standardHighSeason, rate: 2200, extraBedRate: 600, id: generateGUID(), seasonName: "BKK Superior High" },
      { ...standardPeakSeason, rate: 2800, extraBedRate: 700, id: generateGUID(), seasonName: "BKK Superior Peak" }
    ],
    characteristics: [{id: generateGUID(), key: "Bed", value: "Queen"}, {id: generateGUID(), key: "Size", value: "25sqm"}]
  };

  const deluxeKingBalconyBKK: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Deluxe King with Balcony", extraBedAllowed: true, notes: "Elegant 35sqm room featuring a king-size bed, private balcony with city views.",
    seasonalPrices: [
      { ...standardLowSeason, rate: 2500, extraBedRate: 600, id: generateGUID(), seasonName: "BKK Deluxe Balcony Low" },
      { ...standardHighSeason, rate: 3000, extraBedRate: 700, id: generateGUID(), seasonName: "BKK Deluxe Balcony High" },
      { ...standardPeakSeason, rate: 3800, extraBedRate: 800, id: generateGUID(), seasonName: "BKK Deluxe Balcony Peak" }
    ],
    characteristics: [{id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "35sqm"}, {id: generateGUID(), key: "Feature", value: "Balcony"}]
  };
  
  const deluxeKingBalconyGrandChaoPhraya: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Deluxe King with Balcony", extraBedAllowed: true, notes: "Elegant 35sqm room featuring a king-size bed, private balcony with city views, premium amenities.",
    seasonalPrices: [
      { ...deluxeLowSeason, id: generateGUID(), seasonName: "Grand Deluxe Balcony Low" },
      { ...deluxeHighSeason, id: generateGUID(), seasonName: "Grand Deluxe Balcony High" },
      { ...deluxePeakSeason, id: generateGUID(), seasonName: "Grand Deluxe Balcony Peak" }
    ],
    characteristics: [{id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "35sqm"}, {id: generateGUID(), key: "Feature", value: "Balcony, Premium Amenities"}]
  };

  const executiveSuiteGrandChaoPhraya: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Executive Suite River View", extraBedAllowed: true, notes: "Luxurious 55sqm suite with king bed, separate living area, panoramic river views, and executive club lounge access.",
    seasonalPrices: [
      { ...suiteLowSeason, id: generateGUID(), seasonName: "Grand Executive Suite Low" },
      { ...suiteHighSeason, id: generateGUID(), seasonName: "Grand Executive Suite High" },
      { ...suitePeakSeason, id: generateGUID(), seasonName: "Grand Executive Suite Peak" }
    ],
    characteristics: [{id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "55sqm"}, {id: generateGUID(), key: "Feature", value: "Separate Living Area, River View, Club Access"}]
  };

  const twoBedroomFamilyGrandChaoPhraya: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Two-Bedroom Family Residence", extraBedAllowed: true, notes: "Spacious 80sqm two-bedroom residence with one king and two twin beds, living room, and city/river views. Ideal for families.",
    seasonalPrices: [
      { ...suiteLowSeason, rate: 10000, extraBedRate: 2000, id: generateGUID(), seasonName: "Grand Family Residence Low" },
      { ...suiteHighSeason, rate: 13000, extraBedRate: 2500, id: generateGUID(), seasonName: "Grand Family Residence High" },
      { ...suitePeakSeason, rate: 16000, extraBedRate: 3000, id: generateGUID(), seasonName: "Grand Family Residence Peak" }
    ],
    characteristics: [{id: generateGUID(), key: "Bed", value: "1 King, 2 Twin"}, {id: generateGUID(), key: "Size", value: "80sqm"}, {id: generateGUID(), key: "Feature", value: "Two Bedrooms, Living Room"}]
  };


  const demoHotels: HotelDefinition[] = [];

  if (thailand) {
    demoHotels.push(
      { id: "hotel-bkk-central-demo", name: "Bangkok Central Hotel", countryId: thailand.id, province: "Bangkok", starRating: 4, roomTypes: [standardCityRoom, deluxeRiverRoom, familySuiteCity] },
      { id: "hotel-phuket-paradise-demo", name: "Phuket Paradise Resort", countryId: thailand.id, province: "Phuket", starRating: 5, roomTypes: [superiorPoolAccessRoom, beachfrontVilla, twoBedroomFamilyVilla] },
      // New Bangkok Hotels
      { id: "hotel-bkk-cityhub-3star-demo", name: "Bangkok City Hub Hotel", countryId: thailand.id, province: "Bangkok", starRating: 3, roomTypes: [superiorQueenBKK, deluxeKingBalconyBKK] },
      { id: "hotel-bkk-grandchao-5star-demo", name: "The Grand Chao Phraya Residence", countryId: thailand.id, province: "Bangkok", starRating: 5, roomTypes: [deluxeKingBalconyGrandChaoPhraya, executiveSuiteGrandChaoPhraya, twoBedroomFamilyGrandChaoPhraya] }
    );
  }
  if (malaysia) { 
    demoHotels.push(
      { id: generateGUID(), name: "Kuala Lumpur Towers Hotel", countryId: malaysia.id, province: "Kuala Lumpur", starRating: 4, roomTypes: [standardCityRoom] },
      { id: generateGUID(), name: "Langkawi Beachfront Villa Basic", countryId: malaysia.id, province: "Langkawi", starRating: 3, roomTypes: [deluxeRiverRoom] }
    );
  }
  if (singapore) {
    demoHotels.push(
      { id: generateGUID(), name: "Singapore Marina View Basic", countryId: singapore.id, province: "Singapore", starRating: 5, roomTypes: [deluxeRiverRoom] }
    );
  }
  if (vietnam) {
     demoHotels.push(
      { id: generateGUID(), name: "Hanoi Old Quarter Inn Basic", countryId: vietnam.id, province: "Hanoi", starRating: 3, roomTypes: [standardCityRoom] }
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
                   (h.starRating === undefined || h.starRating === null || (typeof h.starRating === 'number' && h.starRating >= 1 && h.starRating <= 5)) &&
                   h.roomTypes.every((rt: any) => rt.id && rt.name && Array.isArray(rt.seasonalPrices) && rt.seasonalPrices.every((sp: any) => sp.id && sp.startDate && sp.endDate && typeof sp.rate === 'number'))
            );
            definitionsToSet = validatedDefinitions;
            
            DEMO_HOTELS.forEach(demoHotel => {
              const existingDemoHotelIndex = definitionsToSet.findIndex(def => def.id === demoHotel.id);
              if (existingDemoHotelIndex !== -1) {
                 definitionsToSet[existingDemoHotelIndex] = demoHotel; 
              } else {
                const existingByName = definitionsToSet.find(def => def.name === demoHotel.name && def.province === demoHotel.province && def.countryId === demoHotel.countryId);
                if (!existingByName) {
                    definitionsToSet.push(demoHotel); 
                } else if (existingByName.id !== demoHotel.id && demoHotel.id.includes("-demo")) {
                    // If a demo hotel (with -demo in ID) exists by name/location but with a different (likely older user-generated) ID,
                    // replace the old one with the new demo structure to ensure demo data consistency.
                    definitionsToSet = definitionsToSet.filter(d => d.id !== existingByName.id);
                    definitionsToSet.push(demoHotel);
                }
              }
            });
          } else {
            definitionsToSet = DEMO_HOTELS;
          }
        } catch (parseError) {
          console.warn("Error parsing hotel definitions from localStorage, seeding defaults:", parseError);
          definitionsToSet = DEMO_HOTELS;
        }
      } else {
        definitionsToSet = DEMO_HOTELS;
      }
      localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(definitionsToSet));
    } catch (error) {
      console.error("Failed to load or initialize hotel definitions:", error);
      definitionsToSet = DEMO_HOTELS; 
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

