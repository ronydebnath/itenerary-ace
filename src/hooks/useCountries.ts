
/**
 * @fileoverview This custom React hook manages country data for the application.
 * It loads country information from localStorage, seeds default country data if none exists,
 * and provides functions to add, update, delete, and retrieve country items.
 * This hook is crucial for location-based filtering and data entry across the app.
 *
 * @bangla এই কাস্টম রিঅ্যাক্ট হুক অ্যাপ্লিকেশনের জন্য দেশ সম্পর্কিত ডেটা পরিচালনা করে।
 * এটি localStorage থেকে দেশের তথ্য লোড করে, কোনোটি না থাকলে ডিফল্ট দেশের ডেটা বীজ করে,
 * এবং দেশ আইটেম যোগ, আপডেট, মুছে ফেলা এবং পুনরুদ্ধার করার জন্য ফাংশন সরবরাহ করে।
 * এই হুকটি অ্যাপ জুড়ে অবস্থান-ভিত্তিক ফিল্টারিং এবং ডেটা এন্ট্রির জন্য অত্যন্ত গুরুত্বপূর্ণ।
 */
import * as React from 'react';
import type { CountryItem, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const COUNTRIES_STORAGE_KEY = 'itineraryAceCountries';

const DEFAULT_COUNTRY_DATA: Omit<CountryItem, 'id'>[] = [
  { name: "Thailand", defaultCurrency: "THB" },
  { name: "Malaysia", defaultCurrency: "MYR" },
  { name: "Bangladesh", defaultCurrency: "BDT" },
];

// Fixed IDs for default countries for consistent demo data generation
export const DEFAULT_THAILAND_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
export const DEFAULT_MALAYSIA_ID = "986a76d0-9490-4e0f-806a-1a3e9728a708";
export const DEFAULT_BANGLADESH_ID = "bd010101-0000-0000-0000-000000000001";


const assignFixedIds = (data: Omit<CountryItem, 'id'>[]): CountryItem[] => {
  return data.map(country => {
    let id = generateGUID();
    if (country.name === "Thailand") id = DEFAULT_THAILAND_ID;
    else if (country.name === "Malaysia") id = DEFAULT_MALAYSIA_ID;
    else if (country.name === "Bangladesh") id = DEFAULT_BANGLADESH_ID;
    return { ...country, id };
  });
};

const loadCountriesFromStorage = (): CountryItem[] | null => {
  try {
    const storedCountries = localStorage.getItem(COUNTRIES_STORAGE_KEY);
    if (storedCountries) {
      return JSON.parse(storedCountries) as CountryItem[];
    }
  } catch (e) {
    console.warn("Error reading countries from localStorage:", e);
    localStorage.removeItem(COUNTRIES_STORAGE_KEY); // Clear corrupted data
  }
  return null;
};

const saveCountriesToStorage = (countriesToSave: CountryItem[]): void => {
  try {
    localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(countriesToSave));
  } catch (e) {
    console.error("Error saving countries to localStorage:", e);
    // Optionally: Notify user or implement more robust error handling
  }
};

export function useCountries() {
  const [countries, setCountries] = React.useState<CountryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAndSeedCountries = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let countriesToSet: CountryItem[] = loadCountriesFromStorage() || [];
      
      if (countriesToSet.length === 0) { // If storage is empty or parsing failed
        countriesToSet = assignFixedIds(DEFAULT_COUNTRY_DATA);
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
      saveCountriesToStorage(countriesToSet); // Save potentially updated/seeded list
    } catch (e: any) {
      console.error("Error initializing countries:", e);
      setError("Failed to load countries.");
      const defaultCountries = assignFixedIds(DEFAULT_COUNTRY_DATA);
      setCountries(defaultCountries); // Fallback to defaults
      saveCountriesToStorage(defaultCountries);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchAndSeedCountries();
  }, [fetchAndSeedCountries]);

  const addCountry = React.useCallback((countryData: Omit<CountryItem, 'id'>) => {
    setCountries(prevCountries => {
      const newCountryWithId: CountryItem = { ...countryData, id: generateGUID() };
      const updatedCountries = [...prevCountries, newCountryWithId].sort((a, b) => a.name.localeCompare(b.name));
      saveCountriesToStorage(updatedCountries);
      return updatedCountries;
    });
  }, []);

  const updateCountry = React.useCallback((updatedCountry: CountryItem) => {
    setCountries(prevCountries => {
      const updatedCountries = prevCountries.map(c => c.id === updatedCountry.id ? updatedCountry : c).sort((a, b) => a.name.localeCompare(b.name));
      saveCountriesToStorage(updatedCountries);
      return updatedCountries;
    });
  }, []);

  const deleteCountry = React.useCallback((countryId: string) => {
    setCountries(prevCountries => {
      const updatedCountries = prevCountries.filter(c => c.id !== countryId);
      saveCountriesToStorage(updatedCountries);
      return updatedCountries;
    });
  }, []);
  
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
