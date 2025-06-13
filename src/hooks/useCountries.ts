
import * as React from 'react';
import type { CountryItem, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const COUNTRIES_STORAGE_KEY = 'itineraryAceCountries';

interface DefaultCountryInfo {
  name: string;
  defaultCurrency: CurrencyCode;
}

const DEFAULT_COUNTRIES_INFO: DefaultCountryInfo[] = [
  { name: "Thailand", defaultCurrency: "THB" },
  { name: "Malaysia", defaultCurrency: "MYR" },
  { name: "Singapore", defaultCurrency: "USD" }, // Example, Singapore often uses SGD, but USD is common for tourism
  { name: "Vietnam", defaultCurrency: "USD" },   // Example, VND is local, USD common for quotes
];

export function useCountries() {
  const [countries, setCountries] = React.useState<CountryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let loadedCountries: CountryItem[] = [];
    try {
      const storedCountriesString = localStorage.getItem(COUNTRIES_STORAGE_KEY);
      if (storedCountriesString) {
        const parsedData = JSON.parse(storedCountriesString) as Partial<CountryItem>[]; // Allow partial for migration
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          loadedCountries = parsedData.map(c => ({
            id: c.id || generateGUID(),
            name: c.name || "Unnamed Country",
            defaultCurrency: c.defaultCurrency || (CURRENCIES.includes('USD') ? 'USD' : CURRENCIES[0]), // Fallback currency
          } as CountryItem));
        }
      }
    } catch (error) {
      console.error("Failed to load countries from localStorage:", error);
    }

    let defaultsChangedLocalStorage = false;
    DEFAULT_COUNTRIES_INFO.forEach(defaultInfo => {
      const defaultCountryExists = loadedCountries.some(c => c.name === defaultInfo.name);
      if (!defaultCountryExists) {
        loadedCountries.push({ id: generateGUID(), name: defaultInfo.name, defaultCurrency: defaultInfo.defaultCurrency });
        defaultsChangedLocalStorage = true;
      } else {
        // Ensure existing default countries have a currency
        const existing = loadedCountries.find(c => c.name === defaultInfo.name);
        if (existing && !existing.defaultCurrency) {
          existing.defaultCurrency = defaultInfo.defaultCurrency;
          defaultsChangedLocalStorage = true;
        }
      }
    });
    
    if (defaultsChangedLocalStorage || (!localStorage.getItem(COUNTRIES_STORAGE_KEY) && loadedCountries.length > 0)) {
      try {
        localStorage.setItem(COUNTRIES_STORAGE_KEY, JSON.stringify(loadedCountries));
      } catch (saveError) {
        console.error("Failed to save default country list:", saveError);
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

  return { countries, isLoading, addCountry, updateCountry, deleteCountry, getCountryById, getCountryByName };
}
