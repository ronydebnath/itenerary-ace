
import * as React from 'react';
import type { ProvinceItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const PROVINCES_STORAGE_KEY = 'itineraryAceProvinces';

// Predefined list of famous Thai provinces
const FAMOUS_THAI_PROVINCES: string[] = [
    "Bangkok",
    "Pattaya",
    "Phuket",
    "Chiang Mai",
    "Krabi",
    "Surat Thani" // For Samui/Phangan/Tao
];

export function useProvinces() {
  const [provinces, setProvinces] = React.useState<ProvinceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const storedProvincesString = localStorage.getItem(PROVINCES_STORAGE_KEY);
      let loadedProvinces: ProvinceItem[] = [];
      if (storedProvincesString) {
        const parsedData = JSON.parse(storedProvincesString);
        if (Array.isArray(parsedData)) {
            loadedProvinces = parsedData.map(p => ({
            id: p.id || generateGUID(),
            name: p.name || "Unnamed Province",
          } as ProvinceItem));
        }
      }

      const existingNames = new Set(loadedProvinces.map(p => p.name));
      const provincesToAdd = FAMOUS_THAI_PROVINCES
        .filter(name => !existingNames.has(name))
        .map(name => ({ id: generateGUID(), name }));

      let finalProvinces = [...loadedProvinces, ...provincesToAdd];
      
      if (finalProvinces.length === 0 && FAMOUS_THAI_PROVINCES.length > 0) {
        finalProvinces = FAMOUS_THAI_PROVINCES.map(name => ({ id: generateGUID(), name }));
      }
      
      finalProvinces.sort((a, b) => a.name.localeCompare(b.name));
      setProvinces(finalProvinces);
      
      if (provincesToAdd.length > 0 || (!storedProvincesString && FAMOUS_THAI_PROVINCES.length > 0)) {
         localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(finalProvinces));
      } else if (!storedProvincesString && FAMOUS_THAI_PROVINCES.length === 0 && finalProvinces.length === 0) {
        localStorage.removeItem(PROVINCES_STORAGE_KEY); 
      }


    } catch (error) {
      console.error("Failed to load or initialize provinces from localStorage:", error);
      const predefined = FAMOUS_THAI_PROVINCES.map(name => ({ id: generateGUID(), name }));
      predefined.sort((a, b) => a.name.localeCompare(b.name));
      setProvinces(predefined);
      if (predefined.length === 0) {
        localStorage.removeItem(PROVINCES_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const getProvinces = React.useCallback((): ProvinceItem[] => {
    if (isLoading) return [];
    return provinces;
  }, [provinces, isLoading]);
  
  const getProvinceById = React.useCallback(
    (id: string): ProvinceItem | undefined => {
      if (isLoading) return undefined;
      return provinces.find(p => p.id === id);
    },
    [provinces, isLoading]
  );

  return { isLoading, provinces, getProvinces, getProvinceById };
}

