
import * as React from 'react';
import type { CountryItem, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const COUNTRIES_STORAGE_KEY = 'itineraryAceCountries';

// Define default countries with fixed IDs for consistent province linking
const DEFAULT_COUNTRIES_INFO: CountryItem[] = [
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d479", name: "Thailand", defaultCurrency: "THB" },
  { id: "986a76d0-9490-4e0f-806a-1a3e9728a708", name: "Malaysia", defaultCurrency: "MYR" },
  { id: "69a1a2b4-4c7d-4b2f-b8a9-9e76c5d4e3f2", name: "Singapore", defaultCurrency: "USD" },
  { id: "0e6f0a8b-8b1e-4b2f-8d3a-1a2b3c4d5e6f", name: "Vietnam", defaultCurrency: "USD" },
];


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
        countriesToSet = JSON.parse(storedCountries);
      }
      
      if (countriesToSet.length === 0) {
        console.log("No countries found in localStorage, seeding default countries...");
        countriesToSet = [...DEFAULT_COUNTRIES_INFO]; // Use a copy
        localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(countriesToSet));
      }
      
      countriesToSet.sort((a, b) => a.name.localeCompare(b.name));
      setCountries(countriesToSet);
    } catch (e: any) {
      console.error("Error initializing countries from localStorage:", e);
      setError("Failed to load countries from local storage. Using defaults.");
      // Fallback to defaults if parsing fails or any other error
      const defaultData = [...DEFAULT_COUNTRIES_INFO].sort((a, b) => a.name.localeCompare(b.name));
      setCountries(defaultData);
      try {
        localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(defaultData));
      } catch (saveError) {
        console.error("Failed to save default countries to localStorage after error:", saveError);
      }
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
