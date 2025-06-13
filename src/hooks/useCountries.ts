
import * as React from 'react';
import type { CountryItem, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const COUNTRIES_STORAGE_KEY = 'itineraryAceCountries';

const DEFAULT_COUNTRY_DATA: Omit<CountryItem, 'id'>[] = [
  { name: "Thailand", defaultCurrency: "THB" },
  { name: "Malaysia", defaultCurrency: "MYR" },
  { name: "Singapore", defaultCurrency: "SGD" },
  { name: "Vietnam", defaultCurrency: "VND" },
];

// Fixed IDs for default countries for consistent demo data generation
export const DEFAULT_THAILAND_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
export const DEFAULT_MALAYSIA_ID = "986a76d0-9490-4e0f-806a-1a3e9728a708";
export const DEFAULT_SINGAPORE_ID = "a1b2c3d4-e5f6-7890-1234-567890abcdef";
export const DEFAULT_VIETNAM_ID = "b2c3d4e5-f6a7-8901-2345-67890abcdeff";


const assignFixedIds = (data: Omit<CountryItem, 'id'>[]): CountryItem[] => {
  return data.map(country => {
    let id = generateGUID();
    if (country.name === "Thailand") id = DEFAULT_THAILAND_ID;
    else if (country.name === "Malaysia") id = DEFAULT_MALAYSIA_ID;
    else if (country.name === "Singapore") id = DEFAULT_SINGAPORE_ID;
    else if (country.name === "Vietnam") id = DEFAULT_VIETNAM_ID;
    return { ...country, id };
  });
};


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
          console.warn("Error parsing countries from localStorage, seeding defaults:", parseError);
          localStorage.removeItem(COUNTRIES_STORAGE_KEY);
          countriesToSet = assignFixedIds(DEFAULT_COUNTRY_DATA);
          localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(countriesToSet));
        }
      } else {
        countriesToSet = assignFixedIds(DEFAULT_COUNTRY_DATA);
        localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(countriesToSet));
      }
      
      if (!Array.isArray(countriesToSet) || countriesToSet.length === 0) {
          console.warn("Countries list is invalid or empty after load, attempting to re-seed.");
          countriesToSet = assignFixedIds(DEFAULT_COUNTRY_DATA);
          localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(countriesToSet));
      } else {
        // Ensure default countries exist with correct IDs if other data is present
        const defaultCountriesWithFixedIds = assignFixedIds(DEFAULT_COUNTRY_DATA);
        defaultCountriesWithFixedIds.forEach(dc => {
          const existing = countriesToSet.find(c => c.name === dc.name);
          if (existing) {
            if (existing.id !== dc.id) { // Correct ID if mismatched
              existing.id = dc.id;
            }
          } else { // Add if missing
            countriesToSet.push(dc);
          }
        });
      }

      countriesToSet.sort((a, b) => a.name.localeCompare(b.name));
      setCountries(countriesToSet);
    } catch (e: any) {
      console.error("Error initializing countries from localStorage:", e);
      setError("Failed to load countries from local storage.");
      setCountries([]); 
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
