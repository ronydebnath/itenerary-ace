
import * as React from 'react';
import type { CountryItem, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface DefaultCountryInfo {
  name: string;
  defaultCurrency: CurrencyCode;
}

const DEFAULT_COUNTRIES_INFO: DefaultCountryInfo[] = [
  { name: "Thailand", defaultCurrency: "THB" },
  { name: "Malaysia", defaultCurrency: "MYR" },
  { name: "Singapore", defaultCurrency: "USD" },
  { name: "Vietnam", defaultCurrency: "USD" },
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
        console.error("Supabase client is not available or not configured.");
        setError("Database connection failed. Please check configuration.");
        setIsLoading(false);
        setCountries([]); // Ensure countries is an empty array on error
        return;
    }

    const { data: existingCountries, error: fetchError } = await supabase
      .from('countries')
      .select('id, name, defaultCurrency');

    if (fetchError) {
      console.error("Error fetching countries:", fetchError);
      setError(`Failed to fetch countries: ${fetchError.message}. Ensure the 'countries' table exists and RLS is permissive for reads.`);
      setCountries([]);
      setIsLoading(false);
      return;
    }

    let countriesToSet: CountryItem[] = existingCountries || [];

    if (countriesToSet.length === 0 && DEFAULT_COUNTRIES_INFO.length > 0) {
      console.log("No countries found in database, attempting to seed default countries...");
      const defaultCountriesToSeed = DEFAULT_COUNTRIES_INFO.map(dc => ({
        id: generateGUID(), // Generate new UUID for Supabase
        name: dc.name,
        defaultCurrency: dc.defaultCurrency,
      }));

      const { data: seededCountries, error: seedError } = await supabase
        .from('countries')
        .insert(defaultCountriesToSeed)
        .select();

      if (seedError) {
        console.error("Error seeding default countries:", seedError);
        setError(`Failed to seed default countries: ${seedError.message}`);
        // Continue with an empty list or existing (which is empty)
      } else {
        console.log("Default countries seeded successfully.");
        countriesToSet = seededCountries || [];
      }
    }
    
    countriesToSet.sort((a,b) => a.name.localeCompare(b.name));
    setCountries(countriesToSet as CountryItem[]);
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
    const newCountryWithId = { ...countryData, id: generateGUID() }; // Ensure ID is generated client-side if table doesn't auto-generate or if needed for optimistic update
    const { data, error: insertError } = await supabase
      .from('countries')
      .insert(newCountryWithId)
      .select()
      .single();

    if (insertError) {
      console.error("Error adding country:", insertError);
      setError(`Failed to add country: ${insertError.message}`);
    } else if (data) {
      setCountries(prev => [...prev, data as CountryItem].sort((a,b) => a.name.localeCompare(b.name)));
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
      .select()
      .single();

    if (updateError) {
      console.error("Error updating country:", updateError);
      setError(`Failed to update country: ${updateError.message}`);
    } else if (data) {
      setCountries(prev => prev.map(c => c.id === data.id ? data as CountryItem : c).sort((a,b) => a.name.localeCompare(b.name)));
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
