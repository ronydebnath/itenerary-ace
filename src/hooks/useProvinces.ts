
import * as React from 'react';
import type { ProvinceItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const PROVINCES_STORAGE_KEY = 'itineraryAceProvinces';

// Predefined list of famous Thai provinces - now empty
const FAMOUS_THAI_PROVINCES: string[] = [
    // All demo data removed
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

      // Ensure predefined provinces are present (if any)
      // Since FAMOUS_THAI_PROVINCES is now empty, this will add nothing unless the array had items.
      const existingNames = new Set(loadedProvinces.map(p => p.name));
      const provincesToAdd = FAMOUS_THAI_PROVINCES
        .filter(name => !existingNames.has(name))
        .map(name => ({ id: generateGUID(), name }));

      let finalProvinces = [...loadedProvinces, ...provincesToAdd];
      
      if (finalProvinces.length === 0 && FAMOUS_THAI_PROVINCES.length > 0) {
        // This case should ideally not be hit if FAMOUS_THAI_PROVINCES is empty.
        // Kept for theoretical future if demo data is re-added and localStorage is somehow empty.
        finalProvinces = FAMOUS_THAI_PROVINCES.map(name => ({ id: generateGUID(), name }));
      }
      
      finalProvinces.sort((a, b) => a.name.localeCompare(b.name));
      setProvinces(finalProvinces);
      
      // Save back to localStorage if new predefined provinces were added, or if the initial list was empty
      // and demo data (if it existed) was meant to populate it.
      if (provincesToAdd.length > 0 || (!storedProvincesString && FAMOUS_THAI_PROVINCES.length > 0)) {
         localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(finalProvinces));
      } else if (!storedProvincesString && FAMOUS_THAI_PROVINCES.length === 0 && finalProvinces.length === 0) {
        // If everything is empty, ensure localStorage reflects that (or is at least not stale)
        localStorage.removeItem(PROVINCES_STORAGE_KEY); 
      }


    } catch (error) {
      console.error("Failed to load or initialize provinces from localStorage:", error);
      // Fallback to predefined (now empty) if storage fails completely
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
