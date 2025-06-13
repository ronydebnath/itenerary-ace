
import * as React from 'react';
import type { ProvinceItem, CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries } from './useCountries';
import { getSupabaseClient } from '@/lib/supabaseClient';

const FAMOUS_THAI_PROVINCES_FOR_DEFAULT_COUNTRY: string[] = [
    "Bangkok", "Pattaya", "Phuket", "Chiang Mai", "Krabi", "Surat Thani"
];
const DEFAULT_THAI_COUNTRY_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479"; // Provided by user

const FAMOUS_MALAYSIAN_LOCATIONS: string[] = [
    "Kuala Lumpur", "Penang", "Langkawi", "Malacca", "Sabah (Kota Kinabalu)", "Sarawak (Kuching)", "Johor Bahru"
];
const DEFAULT_MALAYSIAN_COUNTRY_ID = "986a76d0-9490-4e0f-806a-1a3e9728a708"; // Provided by user


export function useProvinces() {
  const { countries, isLoading: isLoadingCountries, getCountryById } = useCountries();
  const [provinces, setProvinces] = React.useState<ProvinceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAndSeedProvinces = React.useCallback(async () => {
    if (isLoadingCountries) return; // Wait for countries to be loaded/available

    setIsLoading(true);
    setError(null);
    const supabase = getSupabaseClient();

    if (!supabase || typeof supabase.from !== 'function') {
        console.error("Supabase client is not available or not configured in useProvinces.");
        setError("Database connection failed for provinces. Please check configuration.");
        setIsLoading(false);
        setProvinces([]);
        return;
    }

    const { data: existingProvinces, error: fetchError } = await supabase
      .from('provinces')
      .select('id, name, country_id');

    if (fetchError) {
      console.error("Error fetching provinces:", fetchError);
      setError(`Failed to fetch provinces: ${fetchError.message}. Ensure the 'provinces' table exists, RLS is permissive, and 'country_id' column is correctly named.`);
      setProvinces([]);
      setIsLoading(false);
      return;
    }

    let provincesToSet: ProvinceItem[] = (existingProvinces || []).map(p => ({
        id: p.id,
        name: p.name,
        country_id: p.country_id, // Keep original column name from DB for consistency here
    })).map(dbItem => ({ // Map to application's ProvinceItem structure
        id: dbItem.id,
        name: dbItem.name,
        countryId: dbItem.country_id,
    }));

    let provincesToSeed: ProvinceItem[] = [];

    // Check and prepare Thai provinces for seeding
    const thaiCountry = getCountryById(DEFAULT_THAI_COUNTRY_ID);
    if (thaiCountry) {
        const existingThaiProvinceNames = new Set(
            provincesToSet.filter(p => p.countryId === thaiCountry.id).map(p => p.name)
        );
        FAMOUS_THAI_PROVINCES_FOR_DEFAULT_COUNTRY.forEach(name => {
            if (!existingThaiProvinceNames.has(name)) {
            provincesToSeed.push({ id: generateGUID(), name, countryId: thaiCountry.id });
            }
        });
    }

    // Check and prepare Malaysian provinces for seeding
    const malaysianCountry = getCountryById(DEFAULT_MALAYSIAN_COUNTRY_ID);
    if (malaysianCountry) {
        const existingMalaysianProvinceNames = new Set(
            provincesToSet.filter(p => p.countryId === malaysianCountry.id).map(p => p.name)
        );
        FAMOUS_MALAYSIAN_LOCATIONS.forEach(name => {
            if (!existingMalaysianProvinceNames.has(name)) {
            provincesToSeed.push({ id: generateGUID(), name, countryId: malaysianCountry.id });
            }
        });
    }

    if (provincesToSet.length === 0 && provincesToSeed.length > 0) {
      console.log("No provinces found in database, attempting to seed default provinces...");
      const provincesForSupabaseInsert = provincesToSeed.map(p => ({
        id: p.id,
        name: p.name,
        country_id: p.countryId, // Use DB column name for insert
      }));

      const { data: seededProvincesData, error: seedError } = await supabase
        .from('provinces')
        .insert(provincesForSupabaseInsert)
        .select('id, name, country_id');

      if (seedError) {
        console.error("Error seeding default provinces:", seedError);
        setError(`Failed to seed default provinces: ${seedError.message}`);
      } else {
        console.log("Default provinces seeded successfully.");
        provincesToSet = (seededProvincesData || []).map(p => ({
            id: p.id,
            name: p.name,
            countryId: p.country_id,
        }));
      }
    } else if (provincesToSeed.length > 0 && existingProvinces && existingProvinces.length > 0) {
        // If there are some provinces in DB, but not all defaults, seed the missing ones
        const provincesForSupabaseInsert = provincesToSeed.map(p => ({
            id: p.id, name: p.name, country_id: p.countryId
        }));
        const { data: additionallySeeded, error: additionalSeedError } = await supabase
            .from('provinces')
            .insert(provincesForSupabaseInsert)
            .select('id, name, country_id');
        if (additionalSeedError) {
            console.error("Error seeding additional default provinces:", additionalSeedError);
        } else if (additionallySeeded) {
            provincesToSet = [...provincesToSet, ...additionallySeeded.map(p => ({id: p.id, name: p.name, countryId: p.country_id}))];
        }
    }
    
    provincesToSet.sort((a, b) => {
      const countryAName = getCountryById(a.countryId)?.name || '';
      const countryBName = getCountryById(b.countryId)?.name || '';
      if (countryAName.localeCompare(countryBName) !== 0) {
        return countryAName.localeCompare(countryBName);
      }
      return a.name.localeCompare(b.name);
    });
    setProvinces(provincesToSet);
    setIsLoading(false);
  }, [isLoadingCountries, getCountryById, countries]);

  React.useEffect(() => {
    fetchAndSeedProvinces();
  }, [fetchAndSeedProvinces]);

  const addProvince = async (provinceData: Omit<ProvinceItem, 'id'>) => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase || typeof supabase.from !== 'function') {
        setError("Database not configured for add province.");
        setIsLoading(false);
        return;
    }
    const newProvinceWithId: ProvinceItem = { ...provinceData, id: generateGUID() };
    const { data, error: insertError } = await supabase
      .from('provinces')
      .insert({
          id: newProvinceWithId.id,
          name: newProvinceWithId.name,
          country_id: newProvinceWithId.countryId // Use DB column name
      })
      .select('id, name, country_id')
      .single();

    if (insertError) {
      console.error("Error adding province:", insertError);
      setError(`Failed to add province: ${insertError.message}`);
    } else if (data) {
      const addedProvince = { id: data.id, name: data.name, countryId: data.country_id };
      setProvinces(prev => [...prev, addedProvince].sort((a,b) => a.name.localeCompare(b.name)));
      setError(null);
    }
    setIsLoading(false);
  };

  const updateProvince = async (updatedProvince: ProvinceItem) => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase || typeof supabase.from !== 'function') {
        setError("Database not configured for update province.");
        setIsLoading(false);
        return;
    }
    const { data, error: updateError } = await supabase
      .from('provinces')
      .update({ name: updatedProvince.name, country_id: updatedProvince.countryId })
      .eq('id', updatedProvince.id)
      .select('id, name, country_id')
      .single();

    if (updateError) {
      console.error("Error updating province:", updateError);
      setError(`Failed to update province: ${updateError.message}`);
    } else if (data) {
      const modifiedProvince = { id: data.id, name: data.name, countryId: data.country_id };
      setProvinces(prev => prev.map(p => p.id === data.id ? modifiedProvince : p).sort((a,b) => a.name.localeCompare(b.name)));
      setError(null);
    }
    setIsLoading(false);
  };

  const deleteProvince = async (provinceId: string) => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
     if (!supabase || typeof supabase.from !== 'function') {
        setError("Database not configured for delete province.");
        setIsLoading(false);
        return;
    }
    const { error: deleteError } = await supabase
      .from('provinces')
      .delete()
      .eq('id', provinceId);

    if (deleteError) {
      console.error("Error deleting province:", deleteError);
      setError(`Failed to delete province: ${deleteError.message}`);
    } else {
      setProvinces(prev => prev.filter(p => p.id !== provinceId));
      setError(null);
    }
    setIsLoading(false);
  };
  
  const getProvincesByCountry = React.useCallback(
    (countryId: string): ProvinceItem[] => {
      if (isLoading || isLoadingCountries) return [];
      return provinces.filter(p => p.countryId === countryId);
    },
    [provinces, isLoading, isLoadingCountries]
  );
  
  const getProvinceById = React.useCallback(
    (id: string): ProvinceItem | undefined => {
        if (isLoading || isLoadingCountries) return undefined;
        return provinces.find(p => p.id === id);
    },
    [provinces, isLoading, isLoadingCountries]
  );

  return { 
    isLoading: isLoading || isLoadingCountries, 
    provinces, 
    error,
    addProvince, 
    updateProvince, 
    deleteProvince, 
    getProvincesByCountry,
    getProvinceById,
    refreshProvinces: fetchAndSeedProvinces,
  };
}
