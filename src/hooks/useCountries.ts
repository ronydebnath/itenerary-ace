
import * as React from 'react';
import type { CountryItem, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const COUNTRIES_STORAGE_KEY = 'itineraryAceCountries';

// DEFAULT_COUNTRIES_INFO has been removed

export function useCountries() {
  const [countries, setCountries] = React.useState<CountryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAndSeedCountries = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedCountries = localStorage.getItem(COUNTRIES_STORAGE_KEY);
      let countriesToSet: CountryItem[] = [];
      if (storedCountries) {
        try {
          countriesToSet = JSON.parse(storedCountries);
        } catch (parseError) {
          console.error("Error parsing countries from localStorage, starting fresh:", parseError);
          localStorage.removeItem(COUNTRIES_STORAGE_KEY); // Clear corrupted data
        }
      }
      
      // No longer seeding default countries if localStorage is empty.
      // It will just start with an empty array.
      if (!Array.isArray(countriesToSet)) {
          countriesToSet = [];
      }

      countriesToSet.sort((a, b) => a.name.localeCompare(b.name));
      setCountries(countriesToSet);
    } catch (e: any) {
      console.error("Error initializing countries from localStorage:", e);
      setError("Failed to load countries from local storage.");
      setCountries([]); // Fallback to empty array
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchAndSeedCountries();
  }, [fetchAndSeedCountries]);

  const addCountry = async (countryData: Omit<CountryItem, 'id'>) => {
    setIsLoading(true);
    try {
      const newCountryWithId: CountryItem = { ...countryData, id: generateGUID() };
      const currentCountries = countries ? [...countries] : [];
      currentCountries.push(newCountryWithId);
      currentCountries.sort((a, b) => a.name.localeCompare(b.name));
      localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(currentCountries));
      setCountries(currentCountries);
      setError(null);
    } catch (e: any) {
      console.error("Error adding country to localStorage:", e);
      setError(`Failed to add country: ${e.message}`);
    }
    setIsLoading(false);
  };

  const updateCountry = async (updatedCountry: CountryItem) => {
    setIsLoading(true);
    try {
      const currentCountries = countries ? countries.map(c => c.id === updatedCountry.id ? updatedCountry : c) : [updatedCountry];
      currentCountries.sort((a, b) => a.name.localeCompare(b.name));
      localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(currentCountries));
      setCountries(currentCountries);
      setError(null);
    } catch (e: any) {
      console.error("Error updating country in localStorage:", e);
      setError(`Failed to update country: ${e.message}`);
    }
    setIsLoading(false);
  };

  const deleteCountry = async (countryId: string) => {
    setIsLoading(true);
    try {
      const currentCountries = countries ? countries.filter(c => c.id !== countryId) : [];
      localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(currentCountries));
      setCountries(currentCountries);
      setError(null);
    } catch (e: any) {
      console.error("Error deleting country from localStorage:", e);
      setError(`Failed to delete country: ${e.message}`);
    }
    setIsLoading(false);
  };
  
  const getCountryById = React.useCallback(
    (id?: string): CountryItem | undefined => {
      if (!id || isLoading) return undefined;
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

  return { countries, isLoading, error, addCountry, updateCountry, deleteCountry, getCountryById, getCountryByName, refreshCountries: fetchAndSeedCountries };
}
