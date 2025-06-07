
import * as React from 'react';
import type { ProvinceItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const PROVINCES_STORAGE_KEY = 'itineraryAceProvinces';

// Predefined list of famous Thai provinces
const FAMOUS_THAI_PROVINCES = [
  "Bangkok", "Chiang Mai", "Phuket", "Pattaya (Chonburi)", "Krabi", 
  "Surat Thani (Koh Samui, Koh Phangan)", "Ayutthaya", "Sukhothai", 
  "Chiang Rai", "Kanchanaburi"
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

      // Ensure predefined provinces are present
      const existingNames = new Set(loadedProvinces.map(p => p.name));
      const provincesToAdd = FAMOUS_THAI_PROVINCES
        .filter(name => !existingNames.has(name))
        .map(name => ({ id: generateGUID(), name }));

      const finalProvinces = [...loadedProvinces, ...provincesToAdd];
      
      // Sort provinces alphabetically by name
      finalProvinces.sort((a, b) => a.name.localeCompare(b.name));

      setProvinces(finalProvinces);
      
      // Save back to localStorage if new predefined provinces were added
      if (provincesToAdd.length > 0 || !storedProvincesString) {
         localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(finalProvinces));
      }

    } catch (error) {
      console.error("Failed to load or initialize provinces from localStorage:", error);
      // Fallback to predefined if storage fails completely
      const predefined = FAMOUS_THAI_PROVINCES.map(name => ({ id: generateGUID(), name }));
      predefined.sort((a, b) => a.name.localeCompare(b.name));
      setProvinces(predefined);
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
