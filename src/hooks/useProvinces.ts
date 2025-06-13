
import * as React from 'react';
import type { ProvinceItem, CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries } from './useCountries';

const PROVINCES_STORAGE_KEY = 'itineraryAceProvinces';

const FAMOUS_THAI_PROVINCES_FOR_DEFAULT_COUNTRY: string[] = [
    "Bangkok", "Pattaya", "Phuket", "Chiang Mai", "Krabi", "Surat Thani"
];
// This ID must match the ID in DEFAULT_COUNTRIES_INFO in useCountries.ts
const DEFAULT_THAI_COUNTRY_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479"; 

const FAMOUS_MALAYSIAN_LOCATIONS: string[] = [
    "Kuala Lumpur", "Penang", "Langkawi", "Malacca", "Sabah (Kota Kinabalu)", "Sarawak (Kuching)", "Johor Bahru"
];
// This ID must match the ID in DEFAULT_COUNTRIES_INFO in useCountries.ts
const DEFAULT_MALAYSIAN_COUNTRY_ID = "986a76d0-9490-4e0f-806a-1a3e9728a708";

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
          console.error("Error parsing provinces from localStorage, resetting:", parseError);
          localStorage.removeItem(PROVINCES_STORAGE_KEY); // Clear corrupted data
        }
      }

      let provincesWereSeeded = false;
      if (provincesToSet.length === 0) {
        console.log("No provinces found in localStorage, attempting to seed default provinces...");
        let defaultProvincesToSeed: ProvinceItem[] = [];
        
        const thaiCountry = getCountryById(DEFAULT_THAI_COUNTRY_ID);
        if (thaiCountry) {
          FAMOUS_THAI_PROVINCES_FOR_DEFAULT_COUNTRY.forEach(name => {
            defaultProvincesToSeed.push({ id: generateGUID(), name, countryId: thaiCountry.id });
          });
        }
        
        const malaysianCountry = getCountryById(DEFAULT_MALAYSIAN_COUNTRY_ID);
        if (malaysianCountry) {
          FAMOUS_MALAYSIAN_LOCATIONS.forEach(name => {
            defaultProvincesToSeed.push({ id: generateGUID(), name, countryId: malaysianCountry.id });
          });
        }

        if (defaultProvincesToSeed.length > 0) {
            provincesToSet = defaultProvincesToSeed;
            localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(provincesToSet));
            provincesWereSeeded = true;
            console.log("Default provinces seeded to localStorage.");
        }
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
      setProvinces([]); // Fallback to empty if error
    }
    setIsLoading(false);
  }, [isLoadingCountries, getCountryById, countries]); // Added countries dependency

  React.useEffect(() => {
    fetchAndSeedProvinces();
  }, [fetchAndSeedProvinces]);

  const addProvince = async (provinceData: Omit<ProvinceItem, 'id'>) => {
    setIsLoading(true);
    try {
      const newProvinceWithId: ProvinceItem = { ...provinceData, id: generateGUID() };
      const currentProvinces = provinces ? [...provinces] : [];
      currentProvinces.push(newProvinceWithId);
      currentProvinces.sort((a, b) => { /* same sort as fetch */ 
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
      currentProvinces.sort((a, b) => { /* same sort as fetch */
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
