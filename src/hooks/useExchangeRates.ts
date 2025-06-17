
/**
 * @fileoverview This custom React hook manages exchange rates for currency conversion.
 * It loads rates from localStorage, attempts to fetch fresh rates from ExchangeRate-API
 * (once daily or on manual trigger), saves API-fetched rates, falls back to last saved
 * rates or default USD-centric rates if API fails, and provides functions to add, update,
 * delete, and retrieve exchange rates. It includes logic for applying a configurable markup
 * (global or specific to a currency pair) when converting.
 *
 * @bangla এই কাস্টম রিঅ্যাক্ট হুক মুদ্রা রূপান্তরের জন্য বিনিময় হার পরিচালনা করে।
 * এটি localStorage থেকে হার লোড করে, ExchangeRate-API থেকে নতুন হার আনার চেষ্টা করে
 * (தினமும் একবার বা ম্যানুয়াল ট্রিগারে), API-থেকে আনা হারগুলি সংরক্ষণ করে, API ব্যর্থ হলে
 * সর্বশেষ সংরক্ষিত হার বা ডিফল্ট USD-কেন্দ্রিক হারে ফিরে যায়, এবং বিনিময় হার যোগ, আপডেট,
 * মুছে ফেলা এবং পুনরুদ্ধার করার জন্য ফাংশন সরবরাহ করে। এটি বিভিন্ন মুদ্রার মধ্যে রূপান্তর
 * করার সময় একটি কনফিগারযোগ্য মার্কআপ (গ্লোবাল বা নির্দিষ্ট মুদ্রা জোড়ার জন্য) প্রয়োগ করার
 * যুক্তি অন্তর্ভুক্ত করে।
 */
import * as React from 'react';
import type { ExchangeRate, CurrencyCode, SpecificMarkupRate } from '@/types/itinerary';
import { CURRENCIES as SYSTEM_DEFAULT_CURRENCIES, REFERENCE_CURRENCY } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useToast } from './use-toast';
import { useCustomCurrencies } from './useCustomCurrencies';

const EXCHANGE_RATES_STORAGE_KEY = 'itineraryAceExchangeRates';
const GLOBAL_MARKUP_STORAGE_KEY = 'itineraryAceGlobalExchangeMarkup';
const SPECIFIC_MARKUP_RATES_STORAGE_KEY = 'itineraryAceSpecificMarkupRates';
const API_RATES_LAST_FETCHED_KEY = 'itineraryAceApiRatesLastFetched';
const AUTO_REFRESH_INTERVAL_HOURS = 23; // Fetch new rates if last fetch was more than 23 hours ago

const DEFAULT_RATES_DATA: Omit<ExchangeRate, 'id' | 'updatedAt' | 'source'>[] = [
  { fromCurrency: "USD", toCurrency: "THB", rate: 36.50 },
  { fromCurrency: "USD", toCurrency: "MYR", rate: 4.70 },
  { fromCurrency: "USD", toCurrency: "BDT", rate: 121.00 }, // Updated BDT rate
  { fromCurrency: "THB", toCurrency: "MYR", rate: 0.128 }, // THB to MYR
  { fromCurrency: "THB", toCurrency: "BDT", rate: 3.30 },  // THB to BDT
  { fromCurrency: "MYR", toCurrency: "BDT", rate: 25.75 }, // MYR to BDT
];


export interface ConversionRateDetails {
  baseRate: number;
  finalRate: number;
  markupApplied: number; // The percentage actually applied
  markupType: 'global' | 'specific' | 'none';
}

// --- Helper functions for localStorage ---
const loadDataFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const storedData = localStorage.getItem(key);
    if (storedData) {
      if (key === GLOBAL_MARKUP_STORAGE_KEY) return parseFloat(storedData) as T;
      return JSON.parse(storedData) as T;
    }
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage, using default. Error:`, e);
    localStorage.removeItem(key); // Clear corrupted data
  }
  return defaultValue;
};

const saveDataToStorage = <T>(key: string, dataToSave: T): void => {
  try {
    let dataString = typeof dataToSave === 'string' ? dataToSave : JSON.stringify(dataToSave);
    localStorage.setItem(key, dataString);
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
    // Optionally notify user
  }
};
// --- End helper functions ---


export function useExchangeRates() {
  const [exchangeRates, setExchangeRates] = React.useState<ExchangeRate[]>([]);
  const [globalMarkupPercentage, setGlobalMarkupPercentageState] = React.useState<number>(0);
  const [specificMarkupRates, setSpecificMarkupRates] = React.useState<SpecificMarkupRate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastApiFetchTimestamp, setLastApiFetchTimestampState] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { getAllCurrencyCodes: getAllManagedCurrencyCodesFromHook, isLoading: isLoadingCustomCurrencies } = useCustomCurrencies();

  const allManagedCurrencyCodes = React.useMemo(() => {
      if (isLoadingCustomCurrencies) return [...SYSTEM_DEFAULT_CURRENCIES, REFERENCE_CURRENCY];
      return Array.from(new Set([...getAllManagedCurrencyCodesFromHook(), REFERENCE_CURRENCY]));
  }, [getAllManagedCurrencyCodesFromHook, isLoadingCustomCurrencies]);

  const fetchRatesFromAPI = React.useCallback(async (): Promise<{rates: Partial<Record<CurrencyCode, number>>, timestamp: string } | null> => {
    const apiKey = process.env.NEXT_PUBLIC_EXCHANGERATE_API_KEY || process.env.EXCHANGERATE_API_KEY;
    if (!apiKey || apiKey === 'YOUR_EXCHANGERATE_API_KEY_HERE' || apiKey.trim() === '') {
      console.warn("ExchangeRate-API key is not configured. API fetch for exchange rates skipped.");
      setError("API key for exchange rates is not configured.");
      return null;
    }
    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${REFERENCE_CURRENCY}`);
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = `API request failed: ${response.status} - ${errorData?.['error-type'] || response.statusText}`;
        console.error("ExchangeRate-API Error:", errorMessage, errorData);
        setError(errorMessage);
        return null;
      }
      const data = await response.json();
      if (data.result === 'success' && data.conversion_rates) {
        const newTimestamp = new Date(data.time_last_update_unix * 1000).toISOString();
        setError(null); 
        return { rates: data.conversion_rates, timestamp: newTimestamp };
      } else {
        const errorMessage = data['error-type'] || 'Invalid API response structure';
        console.error("ExchangeRate-API Error:", errorMessage, data);
        setError(errorMessage);
        return null;
      }
    } catch (apiError: any) {
      console.error("Error fetching rates from ExchangeRate-API:", apiError);
      setError(`API Error: ${apiError.message}.`);
      return null;
    }
  }, [setError]);

  const internalSaveRates = React.useCallback((rates: ExchangeRate[]) => {
    rates.sort((a,b) => `${a.fromCurrency}-${a.toCurrency}`.localeCompare(`${b.fromCurrency}-${b.toCurrency}`));
    saveDataToStorage<ExchangeRate[]>(EXCHANGE_RATES_STORAGE_KEY, rates);
    setExchangeRates(rates);
  }, []);

  const internalSaveSpecificMarkups = React.useCallback((markups: SpecificMarkupRate[]) => {
    markups.sort((a,b) => `${a.fromCurrency}-${a.toCurrency}`.localeCompare(`${b.fromCurrency}-${b.toCurrency}`));
    saveDataToStorage<SpecificMarkupRate[]>(SPECIFIC_MARKUP_RATES_STORAGE_KEY, markups);
    setSpecificMarkupRates(markups);
  }, []);


  const fetchAndSeedData = React.useCallback(async (options?: { forceApiFetch?: boolean }) => {
    setIsLoading(true);
    const forceApiFetch = options?.forceApiFetch ?? false;

    try {
      let localRates: ExchangeRate[] = loadDataFromStorage<ExchangeRate[]>(EXCHANGE_RATES_STORAGE_KEY, []);
      let localApiTimestampString: string | null = loadDataFromStorage<string | null>(API_RATES_LAST_FETCHED_KEY, null);
      
      let ratesToSet = [...localRates];
      let finalTimestampForState = localApiTimestampString;
      let fetchedFromApiSuccessfully = false;

      let shouldAttemptApiFetch = forceApiFetch;
      if (!shouldAttemptApiFetch && !isLoadingCustomCurrencies) {
        if (!localApiTimestampString) {
          shouldAttemptApiFetch = true;
        } else {
          try {
            const lastFetchDate = new Date(localApiTimestampString);
            const now = new Date();
            const hoursSinceLastFetch = (now.getTime() - lastFetchDate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastFetch > AUTO_REFRESH_INTERVAL_HOURS) {
              shouldAttemptApiFetch = true;
            }
          } catch (dateParseError) {
            shouldAttemptApiFetch = true;
            saveDataToStorage<string | null>(API_RATES_LAST_FETCHED_KEY, null); // Clear invalid timestamp
          }
        }
      }

      if (shouldAttemptApiFetch) {
        const apiResult = await fetchRatesFromAPI();
        if (apiResult) {
          fetchedFromApiSuccessfully = true;
          const { rates: apiRatesFromFunc, timestamp: apiTimestampFromFunc } = apiResult;
          const currenciesToUpdateFromApi = [...new Set([...SYSTEM_DEFAULT_CURRENCIES, ...allManagedCurrencyCodes])];
          const updatedRatesMap = new Map<string, ExchangeRate>(
            ratesToSet.map(r => [`${r.fromCurrency}-${r.toCurrency}`, r])
          );

          currenciesToUpdateFromApi.forEach(currency => {
            if (currency === REFERENCE_CURRENCY) return;
            if (apiRatesFromFunc[currency] !== undefined) {
              const pairKey = `${REFERENCE_CURRENCY}-${currency}`;
              const existingRate = updatedRatesMap.get(pairKey);
              const newApiRate: ExchangeRate = {
                fromCurrency: REFERENCE_CURRENCY, toCurrency: currency, rate: apiRatesFromFunc[currency]!,
                id: (existingRate?.source === 'api' || !existingRate) ? (existingRate?.id || generateGUID()) : generateGUID(),
                updatedAt: apiTimestampFromFunc, source: 'api',
              };
              updatedRatesMap.set(pairKey, newApiRate);
            }
          });
          ratesToSet = Array.from(updatedRatesMap.values());
          finalTimestampForState = apiTimestampFromFunc;
          saveDataToStorage<string | null>(API_RATES_LAST_FETCHED_KEY, apiTimestampFromFunc);
          if (forceApiFetch) toast({ title: "Rates Updated", description: "Successfully fetched latest exchange rates from API.", variant: "default" });
        } else {
          if (forceApiFetch) {
            toast({ title: "API Fetch Failed", description: `Could not update rates from API. ${error || 'Using previously stored or default rates.'}`, variant: "destructive" });
          }
        }
      }

      if (ratesToSet.length === 0) {
        DEFAULT_RATES_DATA.forEach(defaultRate => {
          ratesToSet.push({ ...defaultRate, id: generateGUID(), updatedAt: new Date().toISOString(), source: 'manual' });
        });
        finalTimestampForState = null;
        if (loadDataFromStorage<string | null>(API_RATES_LAST_FETCHED_KEY, null)) saveDataToStorage<string | null>(API_RATES_LAST_FETCHED_KEY, null);
        
        if (shouldAttemptApiFetch && !fetchedFromApiSuccessfully) {
          toast({ title: "Using Default Rates", description: "API fetch failed and no saved rates found. Using default rates.", variant: "default" });
        } else if (!shouldAttemptApiFetch && localRates.length === 0) {
          toast({ title: "Using Default Rates", description: "No saved rates. Using default rates.", variant: "default" });
        }
      }

      internalSaveRates(ratesToSet.map(r => ({ ...r, source: r.source || 'manual' })));
      setLastApiFetchTimestampState(finalTimestampForState);

      setGlobalMarkupPercentageState(loadDataFromStorage<number>(GLOBAL_MARKUP_STORAGE_KEY, 0));
      setSpecificMarkupRates(loadDataFromStorage<SpecificMarkupRate[]>(SPECIFIC_MARKUP_RATES_STORAGE_KEY, []));

    } catch (criticalError: any) {
      console.error("Critical error in fetchAndSeedData:", criticalError);
      setError("An unexpected critical error occurred while loading rate data.");
      internalSaveRates(DEFAULT_RATES_DATA.map(dr => ({...dr, id: generateGUID(), updatedAt: new Date().toISOString(), source: 'manual'})));
      setLastApiFetchTimestampState(null);
      setGlobalMarkupPercentageState(0);
      setSpecificMarkupRates([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, allManagedCurrencyCodes, fetchRatesFromAPI, internalSaveRates, isLoadingCustomCurrencies, error]);

  React.useEffect(() => {
    if (!isLoadingCustomCurrencies) {
      fetchAndSeedData();
    }
  }, [fetchAndSeedData, isLoadingCustomCurrencies]);
  
  const setGlobalMarkup = React.useCallback((newMarkup: number) => {
    if (isNaN(newMarkup) || newMarkup < 0) {
      toast({ title: "Invalid Markup", description: "Global markup must be non-negative.", variant: "destructive"}); return;
    }
    saveDataToStorage<number>(GLOBAL_MARKUP_STORAGE_KEY, newMarkup);
    setGlobalMarkupPercentageState(newMarkup);
    toast({ title: "Success", description: `Global conversion markup set to ${newMarkup}%.` });
  }, [toast]);

  const addRate = React.useCallback((newRateData: Omit<ExchangeRate, 'id' | 'updatedAt' | 'source'>) => {
    const existing = exchangeRates.find(r => r.fromCurrency === newRateData.fromCurrency && r.toCurrency === newRateData.toCurrency);
    if (existing) { toast({ title: "Rate Exists", description: `Rate ${newRateData.fromCurrency}-${newRateData.toCurrency} already exists. Edit it.`, variant: "default" }); return; }
    if (newRateData.fromCurrency === newRateData.toCurrency) { toast({ title: "Invalid Pair", description: "Cannot set rate for same currency.", variant: "destructive"}); return; }
    const newRate: ExchangeRate = { ...newRateData, id: generateGUID(), updatedAt: new Date().toISOString(), source: 'manual' };
    internalSaveRates([...exchangeRates, newRate]);
    toast({ title: "Success", description: `Rate ${newRate.fromCurrency}-${newRate.toCurrency} added.` });
  }, [exchangeRates, internalSaveRates, toast]);

  const updateRate = React.useCallback((updatedRate: ExchangeRate) => {
    const updatedRates = exchangeRates.map(r => r.id === updatedRate.id ? { ...updatedRate, updatedAt: new Date().toISOString(), source: 'manual' } : r);
    internalSaveRates(updatedRates);
    toast({ title: "Success", description: `Rate ${updatedRate.fromCurrency}-${updatedRate.toCurrency} updated.` });
  }, [exchangeRates, internalSaveRates, toast]);

  const deleteRate = React.useCallback((rateId: string) => {
    const rateToDelete = exchangeRates.find(r => r.id === rateId);
    internalSaveRates(exchangeRates.filter(r => r.id !== rateId));
    if (rateToDelete) toast({ title: "Success", description: `Rate ${rateToDelete.fromCurrency}-${rateToDelete.toCurrency} deleted.` });
  }, [exchangeRates, internalSaveRates, toast]);
  
  const addSpecificMarkup = React.useCallback((markupData: Omit<SpecificMarkupRate, 'id' | 'updatedAt'>) => {
    if (markupData.fromCurrency === markupData.toCurrency) { toast({ title: "Invalid Pair", description: "Cannot set specific markup for same currency.", variant: "destructive" }); return; }
    const existing = specificMarkupRates.find(sm => sm.fromCurrency === markupData.fromCurrency && sm.toCurrency === markupData.toCurrency);
    if (existing) { toast({ title: "Specific Markup Exists", description: `Specific markup for ${markupData.fromCurrency}-${markupData.toCurrency} already exists. Edit it.`, variant: "default" }); return; }
    const newSpecificMarkup: SpecificMarkupRate = { ...markupData, id: generateGUID(), updatedAt: new Date().toISOString() };
    internalSaveSpecificMarkups([...specificMarkupRates, newSpecificMarkup]);
    toast({ title: "Success", description: `Specific markup for ${markupData.fromCurrency}-${markupData.toCurrency} added.` });
  }, [specificMarkupRates, internalSaveSpecificMarkups, toast]);

  const updateSpecificMarkup = React.useCallback((updatedMarkup: SpecificMarkupRate) => {
    const updatedMarkups = specificMarkupRates.map(sm => sm.id === updatedMarkup.id ? { ...updatedMarkup, updatedAt: new Date().toISOString() } : sm);
    internalSaveSpecificMarkups(updatedMarkups);
    toast({ title: "Success", description: `Specific markup for ${updatedMarkup.fromCurrency}-${updatedMarkup.toCurrency} updated.` });
  }, [specificMarkupRates, internalSaveSpecificMarkups, toast]);
  
  const deleteSpecificMarkup = React.useCallback((markupId: string) => {
    const markupToDelete = specificMarkupRates.find(sm => sm.id === markupId);
    internalSaveSpecificMarkups(specificMarkupRates.filter(sm => sm.id !== markupId));
    if (markupToDelete) toast({ title: "Success", description: `Specific markup for ${markupToDelete.fromCurrency}-${markupToDelete.toCurrency} deleted.` });
  }, [specificMarkupRates, internalSaveSpecificMarkups, toast]);

  const findBaseRate = React.useCallback((from: CurrencyCode, to: CurrencyCode): number | null => {
    if (from === to) return 1;
    const directRate = exchangeRates.find(r => r.fromCurrency === from && r.toCurrency === to);
    if (directRate) return directRate.rate;
    const inverseRate = exchangeRates.find(r => r.fromCurrency === to && r.toCurrency === from);
    if (inverseRate && inverseRate.rate !== 0) return 1 / inverseRate.rate;
    return null;
  }, [exchangeRates]);

  const getRate = React.useCallback((fromCurrency: CurrencyCode, toCurrency: CurrencyCode): ConversionRateDetails | null => {
    if (isLoadingCustomCurrencies) {}
    if (!allManagedCurrencyCodes.includes(fromCurrency as any) || !allManagedCurrencyCodes.includes(toCurrency as any)) {}

    if (fromCurrency === toCurrency) return { baseRate: 1, finalRate: 1, markupApplied: 0, markupType: 'none' };

    let rateFromToRef: number | null = fromCurrency === REFERENCE_CURRENCY ? 1 : findBaseRate(fromCurrency, REFERENCE_CURRENCY);
    if (rateFromToRef === null) { return null; }

    let rateRefToTo: number | null = toCurrency === REFERENCE_CURRENCY ? 1 : findBaseRate(REFERENCE_CURRENCY, toCurrency);
    if (rateRefToTo === null) { return null; }

    const baseCombinedRate = Math.max(0.000001, rateFromToRef * rateRefToTo);
    let finalCombinedRate = baseCombinedRate;
    let actualMarkupApplied = 0;
    let markupType: ConversionRateDetails['markupType'] = 'none';

    if (fromCurrency !== toCurrency) {
      const specificMarkup = specificMarkupRates.find(sm => sm.fromCurrency === fromCurrency && sm.toCurrency === toCurrency);
      if (specificMarkup && specificMarkup.markupPercentage >= 0) {
        finalCombinedRate = baseCombinedRate * (1 + (specificMarkup.markupPercentage / 100));
        actualMarkupApplied = specificMarkup.markupPercentage;
        markupType = 'specific';
      } else if (globalMarkupPercentage > 0) {
        finalCombinedRate = baseCombinedRate * (1 + (globalMarkupPercentage / 100));
        actualMarkupApplied = globalMarkupPercentage;
        markupType = 'global';
      }
    }
    finalCombinedRate = Math.max(0.000001, finalCombinedRate);

    return { baseRate: baseCombinedRate, finalRate: finalCombinedRate, markupApplied: actualMarkupApplied, markupType };
  }, [findBaseRate, globalMarkupPercentage, specificMarkupRates, allManagedCurrencyCodes, isLoadingCustomCurrencies]);

  return {
    exchangeRates,
    isLoading: isLoading || isLoadingCustomCurrencies,
    error,
    addRate, updateRate, deleteRate,
    getRate,
    globalMarkupPercentage, setGlobalMarkup,
    specificMarkupRates, addSpecificMarkup, updateSpecificMarkup, deleteSpecificMarkup,
    refreshRates: () => fetchAndSeedData({ forceApiFetch: true }),
    lastApiFetchTimestamp
  };
}
