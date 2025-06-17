
/**
 * @fileoverview This custom React hook manages master hotel definitions.
 * It loads hotel data from localStorage, seeds default/demo hotel definitions if none exist,
 * and provides functions to retrieve hotel definitions, potentially filtered by location.
 * This data is used to populate hotel selection options in the itinerary planner and pricing forms.
 *
 * @bangla এই কাস্টম রিঅ্যাক্ট হুক মাস্টার হোটেল সংজ্ঞা পরিচালনা করে।
 * এটি localStorage থেকে হোটেল ডেটা লোড করে, কোনোটি না থাকলে ডিফল্ট/ডেমো হোটেল সংজ্ঞা বীজ করে
 * এবং হোটেলের সংজ্ঞা পুনরুদ্ধার করার জন্য ফাংশন সরবরাহ করে, যা অবস্থান অনুসারে ফিল্টার করা যেতে পারে।
 * এই ডেটা ভ্রমণপথ পরিকল্পনাকারী এবং মূল্য নির্ধারণ ফর্মগুলিতে হোটেল নির্বাচন বিকল্পগুলি পূরণ করতে ব্যবহৃত হয়।
 */
import * as React from 'react';
import type { HotelDefinition, CountryItem, HotelRoomTypeDefinition, RoomTypeSeasonalPrice } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries, DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID, DEFAULT_BANGLADESH_ID } from './useCountries';
import { addDays, format, getYear, setYear } from 'date-fns';

const HOTEL_DEFINITIONS_STORAGE_KEY = 'itineraryAceHotelDefinitions';

const createGenericSeasonalPrices = (baseRate: number, baseExtraBed: number | undefined, prefix: string): RoomTypeSeasonalPrice[] => {
  const currentActualYear = getYear(new Date());
  const yearsToCover = [currentActualYear, currentActualYear + 1, currentActualYear + 2]; // Cover current, next, and year after
  const seasons: RoomTypeSeasonalPrice[] = [];

  yearsToCover.forEach(year => {
    seasons.push(
      { id: generateGUID(), seasonName: `${prefix} Low ${year}`, startDate: format(new Date(year, 0, 1), 'yyyy-MM-dd'), endDate: format(new Date(year, 3, 30), 'yyyy-MM-dd'), rate: baseRate, extraBedRate: baseExtraBed }, // Jan 1 - Apr 30
      { id: generateGUID(), seasonName: `${prefix} Mid ${year}`, startDate: format(new Date(year, 4, 1), 'yyyy-MM-dd'), endDate: format(new Date(year, 8, 30), 'yyyy-MM-dd'), rate: Math.round(baseRate * 1.2), extraBedRate: baseExtraBed ? Math.round(baseExtraBed * 1.2) : undefined }, // May 1 - Sep 30
      { id: generateGUID(), seasonName: `${prefix} High ${year}`, startDate: format(new Date(year, 9, 1), 'yyyy-MM-dd'), endDate: format(new Date(year, 11, 31), 'yyyy-MM-dd'), rate: Math.round(baseRate * 1.5), extraBedRate: baseExtraBed ? Math.round(baseExtraBed * 1.5) : undefined } // Oct 1 - Dec 31
    );
  });
  return seasons;
};


const createDemoHotelDefinitions = (countries: CountryItem[]): HotelDefinition[] => {
  const thailand = countries.find(c => c.id === DEFAULT_THAILAND_ID);
  const malaysia = countries.find(c => c.id === DEFAULT_MALAYSIA_ID);
  const bangladesh = countries.find(c => c.id === DEFAULT_BANGLADESH_ID);

  // --- Shared Room Type Definitions ---
  const standardCityRoom: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Standard City View", extraBedAllowed: true, notes: "Comfortable 30sqm room with city view, en-suite bathroom, Wi-Fi, and mini-bar.", seasonalPrices: createGenericSeasonalPrices(2800, 700, "Std City"), characteristics: [{id: generateGUID(), key: "View", value: "City"}, {id: generateGUID(), key: "Bed", value: "King or Twin"}, {id: generateGUID(), key: "Size", value: "30sqm"}]
  };
  const deluxeRiverRoom: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Deluxe River View", extraBedAllowed: true, notes: "Spacious 40sqm room with stunning river views, balcony, premium amenities, and bathtub.", seasonalPrices: createGenericSeasonalPrices(4500, 1000, "Dlx River"), characteristics: [{id: generateGUID(), key: "View", value: "River"}, {id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "40sqm"}, {id: generateGUID(), key: "Features", value: "Balcony, Bathtub"}]
  };
   const familySuiteCity: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Family Suite City View", extraBedAllowed: true, notes: "60sqm two-bedroom suite ideal for families, kitchenette, living area.", seasonalPrices: createGenericSeasonalPrices(7000, 1500, "Fam Suite City"), characteristics: [{id: generateGUID(), key: "View", value: "City"}, {id: generateGUID(), key: "Bed", value: "1 King, 2 Twin"}, {id: generateGUID(), key: "Size", value: "60sqm"}, {id: generateGUID(), key: "Features", value: "Two Bedrooms, Kitchenette"}]
  };

  const superiorPoolAccessRoom: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Superior Pool Access", extraBedAllowed: true, notes: "35sqm room with direct access to the resort's lagoon pool from your private terrace.", seasonalPrices: createGenericSeasonalPrices(5800, 1200, "Sup Pool"), characteristics: [{id: generateGUID(), key: "Feature", value: "Direct Pool Access"}, {id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "35sqm"}]
  };
  const beachfrontVilla: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Beachfront Villa", extraBedAllowed: false, notes: "Luxurious 70sqm villa with private plunge pool, direct beach access, and personalized butler service.", seasonalPrices: createGenericSeasonalPrices(12000 * 1.5, undefined, "Beach Villa"), characteristics: [{id: generateGUID(), key: "Feature", value: "Private Plunge Pool, Beach Access"}, {id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "70sqm"}, {id: generateGUID(), key: "Service", value: "Butler Service"}]
  };
   const twoBedroomFamilyVilla: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Two-Bedroom Family Villa", extraBedAllowed: true, notes: "100sqm villa with two separate bedrooms, living area, kitchenette and garden.", seasonalPrices: createGenericSeasonalPrices(9000 * 1.8, 2000 * 1.8, "2BR Fam Villa"), characteristics: [{id: generateGUID(), key: "Feature", value: "Two Bedrooms, Garden"}, {id: generateGUID(), key: "Bed", value: "1 King, 2 Twin"}, {id: generateGUID(), key: "Size", value: "100sqm"}]
  };

  // --- New Room Types for Bangkok Hotels ---
  const superiorQueenBKK: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Superior Queen", extraBedAllowed: true, notes: "Modern 25sqm room with a comfortable queen bed and city outlook.",
    seasonalPrices: createGenericSeasonalPrices(1800, 500, "Sup Queen BKK"),
    characteristics: [{id: generateGUID(), key: "Bed", value: "Queen"}, {id: generateGUID(), key: "Size", value: "25sqm"}]
  };

  const deluxeKingBalconyBKK: HotelRoomTypeDefinition = {
    id: generateGUID(), name: "Deluxe King with Balcony", extraBedAllowed: true, notes: "Elegant 35sqm room featuring a king-size bed, private balcony with city views.",
    seasonalPrices: createGenericSeasonalPrices(2500, 600, "Dlx King Balc BKK"),
    characteristics: [{id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "35sqm"}, {id: generateGUID(), key: "Feature", value: "Balcony"}]
  };
  
  const deluxeKingBalconyGrandChaoPhraya: HotelRoomTypeDefinition = {
    id: "060fa81f-8c45-46bd-a4bb-7b564aaab977", 
    name: "Deluxe King with Balcony", 
    extraBedAllowed: true, 
    notes: "Elegant 35sqm room featuring a king-size bed, private balcony with city views, premium amenities.",
    seasonalPrices: createGenericSeasonalPrices(4500, 1200, "Grand Dlx Balc"),
    characteristics: [{id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "35sqm"}, {id: generateGUID(), key: "Feature", value: "Balcony, Premium Amenities"}]
  };

  const executiveSuiteGrandChaoPhraya: HotelRoomTypeDefinition = {
    id: "ceec7c4e-9010-4c82-b88b-e61786523957", // Preserve ID from user's example if it's stable
    name: "Executive Suite River View", 
    extraBedAllowed: true, 
    notes: "Luxurious 55sqm suite with king bed, separate living area, panoramic river views, and executive club lounge access.",
    seasonalPrices: createGenericSeasonalPrices(7000, 1800, "Grand Exec Suite"),
    characteristics: [{id: generateGUID(), key: "Bed", value: "King"}, {id: generateGUID(), key: "Size", value: "55sqm"}, {id: generateGUID(), key: "Feature", value: "Separate Living Area, River View, Club Access"}]
  };

  const twoBedroomFamilyGrandChaoPhraya: HotelRoomTypeDefinition = {
    id: generateGUID(), 
    name: "Two-Bedroom Family Residence", 
    extraBedAllowed: true, 
    notes: "Spacious 80sqm two-bedroom residence with one king and two twin beds, living room, and city/river views. Ideal for families.",
    seasonalPrices: createGenericSeasonalPrices(10000, 2000, "Grand 2BR Fam Res"),
    characteristics: [{id: generateGUID(), key: "Bed", value: "1 King, 2 Twin"}, {id: generateGUID(), key: "Size", value: "80sqm"}, {id: generateGUID(), key: "Feature", value: "Two Bedrooms, Living Room"}]
  };


  const demoHotels: HotelDefinition[] = [];

  if (thailand) {
    demoHotels.push(
      { id: "hotel-bkk-central-demo", name: "Bangkok Central Hotel", countryId: thailand.id, province: "Bangkok", starRating: 4, roomTypes: [standardCityRoom, deluxeRiverRoom, familySuiteCity] },
      { id: "hotel-phuket-paradise-demo", name: "Phuket Paradise Resort", countryId: thailand.id, province: "Phuket", starRating: 5, roomTypes: [superiorPoolAccessRoom, beachfrontVilla, twoBedroomFamilyVilla] },
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
  if (bangladesh) {
    demoHotels.push(
      { id: generateGUID(), name: "Dhaka Regency Hotel & Resort", countryId: bangladesh.id, province: "Dhaka", starRating: 5, roomTypes: [standardCityRoom, deluxeRiverRoom] },
      { id: generateGUID(), name: "Cox's Bazar Seagull Hotel", countryId: bangladesh.id, province: "Cox's Bazar", starRating: 4, roomTypes: [standardCityRoom] }
    );
  }

  return demoHotels;
};

// --- Helper functions for localStorage ---
const loadHotelDefinitionsFromStorage = (): HotelDefinition[] | null => {
  try {
    const storedDefinitionsString = localStorage.getItem(HOTEL_DEFINITIONS_STORAGE_KEY);
    if (storedDefinitionsString) {
      return JSON.parse(storedDefinitionsString) as HotelDefinition[];
    }
  } catch (e) {
    console.warn("Error reading hotel definitions from localStorage:", e);
    localStorage.removeItem(HOTEL_DEFINITIONS_STORAGE_KEY); // Clear corrupted data
  }
  return null;
};

const saveHotelDefinitionsToStorage = (definitionsToSave: HotelDefinition[]): void => {
  try {
    localStorage.setItem(HOTEL_DEFINITIONS_STORAGE_KEY, JSON.stringify(definitionsToSave));
  } catch (e) {
    console.error("Error saving hotel definitions to localStorage:", e);
    // Optionally notify user
  }
};
// --- End helper functions ---

export function useHotelDefinitions() {
  const { countries, isLoading: isLoadingCountries } = useCountries();
  const [allHotelDefinitions, setAllHotelDefinitions] = React.useState<HotelDefinition[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isLoadingCountries) return;

    let definitionsToSet: HotelDefinition[] = [];
    const DEMO_HOTELS = createDemoHotelDefinitions(countries);

    try {
      const storedDefinitions = loadHotelDefinitionsFromStorage();
      if (storedDefinitions) {
        const validatedDefinitions = storedDefinitions.filter(
          h => h.id && h.name && h.countryId && h.province && Array.isArray(h.roomTypes) &&
               (h.starRating === undefined || h.starRating === null || (typeof h.starRating === 'number' && h.starRating >= 1 && h.starRating <= 5)) &&
               h.roomTypes.every((rt: any) => rt.id && rt.name && Array.isArray(rt.seasonalPrices) && rt.seasonalPrices.every((sp: any) => sp.id && sp.startDate && sp.endDate && typeof sp.rate === 'number'))
        );
        definitionsToSet = validatedDefinitions;
        
        DEMO_HOTELS.forEach(demoHotel => {
          const existingDemoHotelIndex = definitionsToSet.findIndex(def => def.id === demoHotel.id);
          if (existingDemoHotelIndex !== -1) {
             definitionsToSet[existingDemoHotelIndex] = {
               ...demoHotel,
               name: definitionsToSet[existingDemoHotelIndex].name, 
               province: definitionsToSet[existingDemoHotelIndex].province,
               countryId: definitionsToSet[existingDemoHotelIndex].countryId,
               starRating: definitionsToSet[existingDemoHotelIndex].starRating,
             };
          } else {
            const existingByName = definitionsToSet.find(def => def.name === demoHotel.name && def.province === demoHotel.province && def.countryId === demoHotel.countryId);
            if (!existingByName) {
                definitionsToSet.push(demoHotel); 
            } else if (existingByName.id !== demoHotel.id && demoHotel.id && demoHotel.id.includes("-demo")) {
                definitionsToSet = definitionsToSet.filter(d => d.id !== existingByName.id);
                definitionsToSet.push(demoHotel);
            }
          }
        });
      } else {
        definitionsToSet = DEMO_HOTELS;
      }
      saveHotelDefinitionsToStorage(definitionsToSet);
    } catch (error) {
      console.error("Failed to load or initialize hotel definitions:", error);
      definitionsToSet = DEMO_HOTELS; 
      saveHotelDefinitionsToStorage(definitionsToSet);
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
