
import * as React from 'react';
import type { CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const COUNTRIES_STORAGE_KEY = 'itineraryAceCountries';
const DEFAULT_COUNTRY_NAMES = ["Thailand", "Malaysia"]; // Added Malaysia

export function useCountries() {
  const [countries, setCountries] = React.useState<CountryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let loadedCountries: CountryItem[] = [];
    try {
      const storedCountriesString = localStorage.getItem(COUNTRIES_STORAGE_KEY);
      if (storedCountriesString) {
        const parsedData = JSON.parse(storedCountriesString);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          loadedCountries = parsedData.map(c => ({
            id: c.id || generateGUID(),
            name: c.name || "Unnamed Country",
          } as CountryItem));
        }
      }
    } catch (error) {
      console.error("Failed to load countries from localStorage:", error);
    }

    // Ensure default countries exist if no countries are loaded or specific defaults are missing
    let defaultsChangedLocalStorage = false;
    DEFAULT_COUNTRY_NAMES.forEach(defaultName => {
      const defaultCountryExists = loadedCountries.some(c => c.name === defaultName);
      if (!defaultCountryExists) {
        loadedCountries.push({ id: generateGUID(), name: defaultName });
        defaultsChangedLocalStorage = true;
      }
    });
    
    if (defaultsChangedLocalStorage || (!localStorage.getItem(COUNTRIES_STORAGE_KEY) && loadedCountries.length > 0)) {
      try {
        localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(loadedCountries));
      } catch (saveError) {
        console.error("Failed to save default country list:", saveError);
      }
    } else if (!localStorage.getItem(COUNTRIES_STORAGE_KEY) && loadedCountries.length === 0) {
        // This case should ideally not happen if defaults are always added,
        // but as a fallback, ensure we don't store an empty array if it was never stored.
        // localStorage.removeItem(COUNTRIES_STORAGE_KEY); // Or initialize with defaults
    }
    
    loadedCountries.sort((a,b) => a.name.localeCompare(b.name));
    setCountries(loadedCountries);
    setIsLoading(false);
  }, []);

  const saveCountries = (updatedCountries: CountryItem[]) => {
    updatedCountries.sort((a,b) => a.name.localeCompare(b.name));
    setCountries(updatedCountries);
    localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(updatedCountries));
  };

  const addCountry = (countryData: Omit<CountryItem, 'id'>) => {
    const newCountry: CountryItem = { ...countryData, id: generateGUID() };
    saveCountries([...countries, newCountry]);
  };

  const updateCountry = (updatedCountry: CountryItem) => {
    saveCountries(countries.map(c => c.id === updatedCountry.id ? updatedCountry : c));
  };

  const deleteCountry = (countryId: string) => {
    saveCountries(countries.filter(c => c.id !== countryId));
    // Note: You might want to add logic here to also delete/disassociate provinces of this country.
  };
  
  const getCountryById = React.useCallback(
    (id: string): CountryItem | undefined => {
      if (isLoading) return undefined;
      return countries.find(c => c.id === id);
    },
    [countries, isLoading]
  );
  
  const getCountryByName = React.useCallback(
    (name: string): CountryItem | undefined => {
      if (isLoading) return undefined;
      return countries.find(c => c.name.toLowerCase() === name.toLowerCase());
    },
    [countries, isLoading]
  );


  return { countries, isLoading, addCountry, updateCountry, deleteCountry, getCountryById, getCountryByName };
}

