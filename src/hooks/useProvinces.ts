
import * as React from 'react';
import type { ProvinceItem, CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries } from './useCountries'; // Import useCountries

const PROVINCES_STORAGE_KEY = 'itineraryAceProvinces';

const FAMOUS_THAI_PROVINCES_FOR_DEFAULT_COUNTRY: string[] = [
    "Bangkok", "Pattaya", "Phuket", "Chiang Mai", "Krabi", "Surat Thani"
];
const DEFAULT_THAI_COUNTRY_NAME = "Thailand";

const FAMOUS_MALAYSIAN_LOCATIONS: string[] = [ // Using "Locations" as some are Federal Territories
    "Kuala Lumpur", "Penang", "Langkawi", "Malacca", "Sabah (Kota Kinabalu)", "Sarawak (Kuching)", "Johor Bahru"
];
const DEFAULT_MALAYSIAN_COUNTRY_NAME = "Malaysia";


export function useProvinces() {
  const { countries, isLoading: isLoadingCountries, getCountryByName } = useCountries();
  const [provinces, setProvinces] = React.useState<ProvinceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isLoadingCountries) return; // Wait for countries to load

    let loadedProvinces: ProvinceItem[] = [];
    try {
      const storedProvincesString = localStorage.getItem(PROVINCES_STORAGE_KEY);
      if (storedProvincesString) {
        const parsedData = JSON.parse(storedProvincesString);
        if (Array.isArray(parsedData)) {
            loadedProvinces = parsedData.map(p => ({
            id: p.id || generateGUID(),
            name: p.name || "Unnamed Province",
            countryId: p.countryId || "", 
          } as ProvinceItem)).filter(p => p.countryId); 
        }
      }
    } catch (error) {
      console.error("Failed to load provinces from localStorage:", error);
    }
    
    let provincesToAdd: ProvinceItem[] = [];
    let localStorageNeedsUpdate = false;

    // Add default Thai provinces
    const thaiCountry = getCountryByName(DEFAULT_THAI_COUNTRY_NAME);
    if (thaiCountry) {
      const existingThaiProvinces = new Set(
        loadedProvinces.filter(p => p.countryId === thaiCountry.id).map(p => p.name)
      );
      const newThaiProvinces = FAMOUS_THAI_PROVINCES_FOR_DEFAULT_COUNTRY
        .filter(name => !existingThaiProvinces.has(name))
        .map(name => ({ id: generateGUID(), name, countryId: thaiCountry.id }));
      if (newThaiProvinces.length > 0) {
        provincesToAdd.push(...newThaiProvinces);
        localStorageNeedsUpdate = true;
      }
    }

    // Add default Malaysian provinces/locations
    const malaysianCountry = getCountryByName(DEFAULT_MALAYSIAN_COUNTRY_NAME);
    if (malaysianCountry) {
      const existingMalaysianProvinces = new Set(
        loadedProvinces.filter(p => p.countryId === malaysianCountry.id).map(p => p.name)
      );
      const newMalaysianProvinces = FAMOUS_MALAYSIAN_LOCATIONS
        .filter(name => !existingMalaysianProvinces.has(name))
        .map(name => ({ id: generateGUID(), name, countryId: malaysianCountry.id }));
      if (newMalaysianProvinces.length > 0) {
        provincesToAdd.push(...newMalaysianProvinces);
        localStorageNeedsUpdate = true;
      }
    }
    
    let finalProvinces = [...loadedProvinces, ...provincesToAdd];
    
    // Fallback: if storage was empty and we added defaults, ensure they are set
    if (!localStorage.getItem(PROVINCES_STORAGE_KEY) && finalProvinces.length > 0) {
        localStorageNeedsUpdate = true;
    } else if (!localStorage.getItem(PROVINCES_STORAGE_KEY) && finalProvinces.length === 0) {
        localStorage.removeItem(PROVINCES_STORAGE_KEY); // Clean up if it was set to empty
    }
    
    finalProvinces.sort((a, b) => {
      const countryA = countries.find(c=>c.id === a.countryId)?.name || '';
      const countryB = countries.find(c=>c.id === b.countryId)?.name || '';
      if (countryA.localeCompare(countryB) !== 0) {
        return countryA.localeCompare(countryB);
      }
      return a.name.localeCompare(b.name);
    });
    setProvinces(finalProvinces);
    
    if (localStorageNeedsUpdate) {
       localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(finalProvinces));
    }

    setIsLoading(false);
  }, [isLoadingCountries, countries, getCountryByName]);

  const saveProvinces = (updatedProvinces: ProvinceItem[]) => {
    updatedProvinces.sort((a, b) => {
      const countryA = countries.find(c=>c.id === a.countryId)?.name || '';
      const countryB = countries.find(c=>c.id === b.countryId)?.name || '';
      if (countryA.localeCompare(countryB) !== 0) {
        return countryA.localeCompare(countryB);
      }
      return a.name.localeCompare(b.name);
    });
    setProvinces(updatedProvinces);
    localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(updatedProvinces));
  };

  const addProvince = (provinceData: Omit<ProvinceItem, 'id'>) => {
    const newProvince: ProvinceItem = { ...provinceData, id: generateGUID() };
    saveProvinces([...provinces, newProvince]);
  };

  const updateProvince = (updatedProvince: ProvinceItem) => {
    saveProvinces(provinces.map(p => p.id === updatedProvince.id ? updatedProvince : p));
  };

  const deleteProvince = (provinceId: string) => {
    saveProvinces(provinces.filter(p => p.id !== provinceId));
  };

  const getProvincesByCountry = React.useCallback(
    (countryId: string): ProvinceItem[] => {
      if (isLoading) return [];
      return provinces.filter(p => p.countryId === countryId);
    },
    [provinces, isLoading]
  );
  
  const getProvinceById = React.useCallback(
    (id: string): ProvinceItem | undefined => {
        if (isLoading) return undefined;
        return provinces.find(p => p.id === id);
    },
    [provinces, isLoading]
  );

  return { 
    isLoading, 
    provinces, 
    addProvince, 
    updateProvince, 
    deleteProvince, 
    getProvincesByCountry,
    getProvinceById
  };
}
