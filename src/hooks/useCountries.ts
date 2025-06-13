
import * as React from 'react';
import type { CountryItem, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface DefaultCountryInfo {
  id: string;
  name: string;
  defaultCurrency: CurrencyCode;
}

const DEFAULT_COUNTRIES_INFO: DefaultCountryInfo[] = [
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
    const supabase = getSupabaseClient();
    if (!supabase || typeof supabase.from !== 'function') {
        console.error("Supabase client is not available or not configured in useCountries.");
        setError("Database connection failed. Please check configuration.");
        setIsLoading(false);
        setCountries([]);
        return;
    }

    const { data: existingCountries, error: fetchError } = await supabase
      .from('countries')
      .select('id, name, "defaultCurrency"'); // Ensure column name matches DB

    if (fetchError) {
      console.error("Error fetching countries:", fetchError);
      setError(`Failed to fetch countries: ${fetchError.message}. Ensure the 'countries' table exists and RLS is permissive for reads.`);
      setCountries([]);
      setIsLoading(false);
      return;
    }
    
    let countriesToSet: CountryItem[] = (existingCountries || []).map(c => ({
        id: c.id,
        name: c.name,
        defaultCurrency: c.defaultCurrency as CurrencyCode // Explicit cast
    }));


    if (countriesToSet.length === 0 && DEFAULT_COUNTRIES_INFO.length > 0) {
      console.log("No countries found in database, attempting to seed default countries...");
      
      const defaultCountriesToSeed = DEFAULT_COUNTRIES_INFO.map(dc => ({
        id: dc.id, // Use pre-defined IDs from the CSV/constants
        name: dc.name,
        defaultCurrency: dc.defaultCurrency,
      }));

      const { data: seededCountries, error: seedError } = await supabase
        .from('countries')
        .insert(defaultCountriesToSeed)
        .select('id, name, "defaultCurrency"');

      if (seedError) {
        console.error("Error seeding default countries:", seedError);
        setError(`Failed to seed default countries: ${seedError.message}`);
      } else {
        console.log("Default countries seeded successfully.");
        countriesToSet = (seededCountries || []).map(c => ({
            id: c.id,
            name: c.name,
            defaultCurrency: c.defaultCurrency as CurrencyCode
        }));
      }
    }
    
    countriesToSet.sort((a,b) => a.name.localeCompare(b.name));
    setCountries(countriesToSet);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchAndSeedCountries();
  }, [fetchAndSeedCountries]);

  const addCountry = async (countryData: Omit<CountryItem, 'id'>) => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
     if (!supabase || typeof supabase.from !== 'function') {
        setError("Database not configured for add.");
        setIsLoading(false);
        return;
    }
    const newCountryWithId: CountryItem = { ...countryData, id: generateGUID() };
    const { data, error: insertError } = await supabase
      .from('countries')
      .insert({
          id: newCountryWithId.id,
          name: newCountryWithId.name,
          defaultCurrency: newCountryWithId.defaultCurrency
      })
      .select('id, name, "defaultCurrency"')
      .single();

    if (insertError) {
      console.error("Error adding country:", insertError);
      setError(`Failed to add country: ${insertError.message}`);
    } else if (data) {
      const addedCountry = { id: data.id, name: data.name, defaultCurrency: data.defaultCurrency as CurrencyCode };
      setCountries(prev => [...prev, addedCountry].sort((a,b) => a.name.localeCompare(b.name)));
      setError(null);
    }
    setIsLoading(false);
  };

  const updateCountry = async (updatedCountry: CountryItem) => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
     if (!supabase || typeof supabase.from !== 'function') {
        setError("Database not configured for update.");
        setIsLoading(false);
        return;
    }
    const { data, error: updateError } = await supabase
      .from('countries')
      .update({ name: updatedCountry.name, defaultCurrency: updatedCountry.defaultCurrency })
      .eq('id', updatedCountry.id)
      .select('id, name, "defaultCurrency"')
      .single();

    if (updateError) {
      console.error("Error updating country:", updateError);
      setError(`Failed to update country: ${updateError.message}`);
    } else if (data) {
      const modifiedCountry = { id: data.id, name: data.name, defaultCurrency: data.defaultCurrency as CurrencyCode };
      setCountries(prev => prev.map(c => c.id === data.id ? modifiedCountry : c).sort((a,b) => a.name.localeCompare(b.name)));
      setError(null);
    }
    setIsLoading(false);
  };

  const deleteCountry = async (countryId: string) => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase || typeof supabase.from !== 'function') {
        setError("Database not configured for delete.");
        setIsLoading(false);
        return;
    }
    const { error: deleteError } = await supabase
      .from('countries')
      .delete()
      .eq('id', countryId);

    if (deleteError) {
      console.error("Error deleting country:", deleteError);
      setError(`Failed to delete country: ${deleteError.message}`);
    } else {
      setCountries(prev => prev.filter(c => c.id !== countryId));
      setError(null);
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
