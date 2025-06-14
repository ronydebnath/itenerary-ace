
/**
 * @fileoverview This custom React hook is responsible for managing province data.
 * It loads province information from localStorage, seeds default province data (linked to
 * default countries from `useCountries`) if none exists, and provides functions to add,
 * update, delete, and retrieve provinces, often filtered by country.
 *
 * @bangla এই কাস্টম রিঅ্যাক্ট হুক প্রদেশ সম্পর্কিত ডেটা পরিচালনার জন্য দায়ী।
 * এটি localStorage থেকে প্রদেশের তথ্য লোড করে, কোনোটি না থাকলে ডিফল্ট প্রদেশের ডেটা
 * (`useCountries` থেকে ডিফল্ট দেশগুলির সাথে লিঙ্ক করা) বীজ করে, এবং প্রদেশ যোগ, আপডেট,
 * মুছে ফেলা এবং পুনরুদ্ধার করার জন্য ফাংশন সরবরাহ করে, যা প্রায়শই দেশ অনুসারে ফিল্টার করা হয়।
 */
import * as React from 'react';
import type { ProvinceItem, CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries, DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID, DEFAULT_BANGLADESH_ID } from './useCountries';

const PROVINCES_STORAGE_KEY = 'itineraryAceProvinces';

const DEFAULT_PROVINCE_DATA: Omit<ProvinceItem, 'id'>[] = [
  // Thailand
  { name: "Bangkok", countryId: DEFAULT_THAILAND_ID },
  { name: "Pattaya", countryId: DEFAULT_THAILAND_ID },
  { name: "Phuket", countryId: DEFAULT_THAILAND_ID },
  { name: "Chiang Mai", countryId: DEFAULT_THAILAND_ID },
  { name: "Krabi", countryId: DEFAULT_THAILAND_ID },
  { name: "Surat Thani (Samui/Phangan/Tao)", countryId: DEFAULT_THAILAND_ID },
  // Malaysia
  { name: "Kuala Lumpur", countryId: DEFAULT_MALAYSIA_ID },
  { name: "Penang", countryId: DEFAULT_MALAYSIA_ID },
  { name: "Langkawi", countryId: DEFAULT_MALAYSIA_ID },
  { name: "Malacca", countryId: DEFAULT_MALAYSIA_ID },
  // Bangladesh
  { name: "Dhaka", countryId: DEFAULT_BANGLADESH_ID },
  { name: "Chittagong", countryId: DEFAULT_BANGLADESH_ID },
  { name: "Sylhet", countryId: DEFAULT_BANGLADESH_ID },
  { name: "Cox's Bazar", countryId: DEFAULT_BANGLADESH_ID },
];


export function useProvinces() {
  const { countries, isLoading: isLoadingCountries, getCountryById } = useCountries();
  const [provinces, setProvinces] = React.useState<ProvinceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAndSeedProvinces = React.useCallback(async () => {
    if (isLoadingCountries) return; 

    setIsLoading(true);
    setError(null);
    
    try {
      const storedProvinces = localStorage.getItem(PROVINCES_STORAGE_KEY);
      let provincesToSet: ProvinceItem[] = [];

      if (storedProvinces) {
        try {
          provincesToSet = JSON.parse(storedProvinces);
        } catch (parseError) {
          console.warn("Error parsing provinces from localStorage, seeding defaults:", parseError);
          localStorage.removeItem(PROVINCES_STORAGE_KEY);
          provincesToSet = DEFAULT_PROVINCE_DATA.map(p => ({ ...p, id: generateGUID() }));
          localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(provincesToSet));
        }
      } else {
        provincesToSet = DEFAULT_PROVINCE_DATA.map(p => ({ ...p, id: generateGUID() }));
        localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(provincesToSet));
      }
      
      if (!Array.isArray(provincesToSet) || provincesToSet.length === 0) {
        console.warn("Provinces list is invalid or empty after load, attempting to re-seed.");
        provincesToSet = DEFAULT_PROVINCE_DATA.map(p => ({ ...p, id: generateGUID() }));
        localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(provincesToSet));
      } else {
        // Ensure default provinces exist and are linked correctly
        const defaultProvincesWithGuids = DEFAULT_PROVINCE_DATA.map(p => ({...p, id: generateGUID()})); // Generate IDs here for comparison
        defaultProvincesWithGuids.forEach(dp => {
          const existing = provincesToSet.find(p => p.name === dp.name && p.countryId === dp.countryId);
          if (!existing) {
            provincesToSet.push(dp); // Add if missing
          } else if (existing.countryId !== dp.countryId) { // Correct countryId if mismatched
            existing.countryId = dp.countryId;
          }
        });
      }
      
      provincesToSet.sort((a, b) => {
        const countryAName = getCountryById(a.countryId)?.name || '';
        const countryBName = getCountryById(b.countryId)?.name || '';
        if (countryAName.localeCompare(countryBName) !== 0) {
          return countryAName.localeCompare(countryBName);
        }
        return a.name.localeCompare(b.name);
      });
      setProvinces(provincesToSet);

    } catch (e: any) {
      console.error("Error initializing provinces from localStorage:", e);
      setError("Failed to load provinces from local storage.");
      setProvinces([]);
    }
    setIsLoading(false);
  }, [isLoadingCountries, getCountryById, countries]); // Added countries to dependency array

  React.useEffect(() => {
    fetchAndSeedProvinces();
  }, [fetchAndSeedProvinces]);

  const addProvince = async (provinceData: Omit<ProvinceItem, 'id'>) => {
    setIsLoading(true);
    try {
      const newProvinceWithId: ProvinceItem = { ...provinceData, id: generateGUID() };
      const currentProvinces = provinces ? [...provinces] : [];
      currentProvinces.push(newProvinceWithId);
      currentProvinces.sort((a, b) => { 
        const countryAName = getCountryById(a.countryId)?.name || '';
        const countryBName = getCountryById(b.countryId)?.name || '';
        if (countryAName.localeCompare(countryBName) !== 0) return countryAName.localeCompare(countryBName);
        return a.name.localeCompare(b.name);
      });
      localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(currentProvinces));
      setProvinces(currentProvinces);
      setError(null);
    } catch (e: any) {
      console.error("Error adding province to localStorage:", e);
      setError(`Failed to add province: ${e.message}`);
    }
    setIsLoading(false);
  };

  const updateProvince = async (updatedProvince: ProvinceItem) => {
    setIsLoading(true);
    try {
      const currentProvinces = provinces ? provinces.map(p => p.id === updatedProvince.id ? updatedProvince : p) : [updatedProvince];
      currentProvinces.sort((a, b) => {
        const countryAName = getCountryById(a.countryId)?.name || '';
        const countryBName = getCountryById(b.countryId)?.name || '';
        if (countryAName.localeCompare(countryBName) !== 0) return countryAName.localeCompare(countryBName);
        return a.name.localeCompare(b.name);
      });
      localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(currentProvinces));
      setProvinces(currentProvinces);
      setError(null);
    } catch (e: any) {
      console.error("Error updating province in localStorage:", e);
      setError(`Failed to update province: ${e.message}`);
    }
    setIsLoading(false);
  };

  const deleteProvince = async (provinceId: string) => {
    setIsLoading(true);
    try {
      const currentProvinces = provinces ? provinces.filter(p => p.id !== provinceId) : [];
      localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(currentProvinces));
      setProvinces(currentProvinces);
      setError(null);
    } catch (e: any) {
      console.error("Error deleting province from localStorage:", e);
      setError(`Failed to delete province: ${e.message}`);
    }
    setIsLoading(false);
  };
  
  const getProvincesByCountry = React.useCallback(
    (countryId: string): ProvinceItem[] => {
      if (isLoading || isLoadingCountries) return [];
      return provinces.filter(p => p.countryId === countryId).sort((a,b) => a.name.localeCompare(b.name));
    },
    [provinces, isLoading, isLoadingCountries]
  );
  
  const getProvinceById = React.useCallback(
    (id: string): ProvinceItem | undefined => {
        if (isLoading || isLoadingCountries) return undefined;
        return provinces.find(p => p.id === id);
    },
    [provinces, isLoading, isLoadingCountries]
  );

  return { 
    isLoading: isLoading || isLoadingCountries, 
    provinces, 
    error,
    addProvince, 
    updateProvince, 
    deleteProvince, 
    getProvincesByCountry,
    getProvinceById,
    refreshProvinces: fetchAndSeedProvinces,
  };
}
