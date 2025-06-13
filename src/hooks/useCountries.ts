
import * as React from 'react';
import type { CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const COUNTRIES_STORAGE_KEY = 'itineraryAceCountries';
const DEFAULT_COUNTRY_NAME = "Thailand";

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

    // Ensure default "Thailand" country exists if no countries are loaded
    const defaultCountryExists = loadedCountries.some(c => c.name === DEFAULT_COUNTRY_NAME);
    if (!defaultCountryExists) {
      const thailand: CountryItem = { id: generateGUID(), name: DEFAULT_COUNTRY_NAME };
      loadedCountries.push(thailand);
      try {
        localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(loadedCountries));
      } catch (saveError) {
        console.error("Failed to save default country:", saveError);
      }
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
