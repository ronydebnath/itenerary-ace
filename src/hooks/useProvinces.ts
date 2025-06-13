
import * as React from 'react';
import type { ProvinceItem, CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries } from './useCountries'; // Import useCountries

const PROVINCES_STORAGE_KEY = 'itineraryAceProvinces';

// Predefined list of famous Thai provinces
const FAMOUS_THAI_PROVINCES_FOR_DEFAULT_COUNTRY: string[] = [
    "Bangkok", "Pattaya", "Phuket", "Chiang Mai", "Krabi", "Surat Thani"
];
const DEFAULT_COUNTRY_FOR_PROVINCES = "Thailand";

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
            countryId: p.countryId || "", // Ensure countryId exists
          } as ProvinceItem)).filter(p => p.countryId); // Filter out provinces without countryId
        }
      }
    } catch (error) {
      console.error("Failed to load provinces from localStorage:", error);
    }
    
    const defaultCountry = getCountryByName(DEFAULT_COUNTRY_FOR_PROVINCES);
    let provincesToAdd: ProvinceItem[] = [];

    if (defaultCountry) {
      const existingNamesInDefaultCountry = new Set(
        loadedProvinces.filter(p => p.countryId === defaultCountry.id).map(p => p.name)
      );
      provincesToAdd = FAMOUS_THAI_PROVINCES_FOR_DEFAULT_COUNTRY
        .filter(name => !existingNamesInDefaultCountry.has(name))
        .map(name => ({ id: generateGUID(), name, countryId: defaultCountry.id }));
    }
    
    let finalProvinces = [...loadedProvinces, ...provincesToAdd];
    
    if (finalProvinces.length === 0 && defaultCountry && FAMOUS_THAI_PROVINCES_FOR_DEFAULT_COUNTRY.length > 0) {
        finalProvinces = FAMOUS_THAI_PROVINCES_FOR_DEFAULT_COUNTRY.map(name => ({ id: generateGUID(), name, countryId: defaultCountry.id }));
    }
    
    finalProvinces.sort((a, b) => a.name.localeCompare(b.name));
    setProvinces(finalProvinces);
    
    if (provincesToAdd.length > 0 || (!localStorage.getItem(PROVINCES_STORAGE_KEY) && finalProvinces.length > 0)) {
       localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(finalProvinces));
    } else if (!localStorage.getItem(PROVINCES_STORAGE_KEY) && finalProvinces.length === 0) {
      localStorage.removeItem(PROVINCES_STORAGE_KEY);
    }

    setIsLoading(false);
  }, [isLoadingCountries, countries, getCountryByName]); // Depend on countries from useCountries

  const saveProvinces = (updatedProvinces: ProvinceItem[]) => {
    updatedProvinces.sort((a, b) => a.name.localeCompare(b.name));
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
