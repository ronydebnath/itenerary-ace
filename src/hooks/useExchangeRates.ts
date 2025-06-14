
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
      setError("API key for exchange rates is not configured."); // Set error for internal state
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
        setError(null); // Clear previous API errors on success
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

  const saveRatesToLocalStorage = React.useCallback((rates: ExchangeRate[]) => {
    try {
      rates.sort((a,b) => `${a.fromCurrency}-${a.toCurrency}`.localeCompare(`${b.fromCurrency}-${b.toCurrency}`));
      localStorage.setItem(EXCHANGE_RATES_STORAGE_KEY, JSON.stringify(rates));
      setExchangeRates(rates); // Update state
    } catch (e: any) {
      console.error("Error saving rates to localStorage:", e);
      toast({ title: "Error Saving Rates", description: e.message, variant: "destructive" });
    }
  }, [toast]); // setExchangeRates is stable

  const fetchAndSeedData = React.useCallback(async (options?: { forceApiFetch?: boolean }) => {
    setIsLoading(true);
    // setError(null); // Clear general errors, API specific error is handled by fetchRatesFromAPI
    const forceApiFetch = options?.forceApiFetch ?? false;

    try {
      let localRates: ExchangeRate[] = [];
      let localApiTimestampString: string | null = null;

      try {
        const storedRatesString = localStorage.getItem(EXCHANGE_RATES_STORAGE_KEY);
        if (storedRatesString) localRates = JSON.parse(storedRatesString);
        localApiTimestampString = localStorage.getItem(API_RATES_LAST_FETCHED_KEY);
      } catch (e) { console.warn("localStorage rate read error", e); }

      let ratesToSet = [...localRates];
      let finalTimestampForState = localApiTimestampString;
      let fetchedFromApiSuccessfully = false;

      let shouldAttemptApiFetch = forceApiFetch;
      if (!shouldAttemptApiFetch && !isLoadingCustomCurrencies) { // Don't auto-fetch if custom currencies are still loading
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
            console.warn("Error parsing last API fetch timestamp, will attempt API fetch:", dateParseError);
            shouldAttemptApiFetch = true;
            localStorage.removeItem(API_RATES_LAST_FETCHED_KEY); // Clear invalid timestamp
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
          localStorage.setItem(API_RATES_LAST_FETCHED_KEY, apiTimestampFromFunc);
          if (forceApiFetch) toast({ title: "Rates Updated", description: "Successfully fetched latest exchange rates from API.", variant: "default" });
        } else {
          // API fetch failed
          if (forceApiFetch) {
            toast({ title: "API Fetch Failed", description: `Could not update rates from API. ${error || 'Using previously stored or default rates.'}`, variant: "destructive" });
          }
          // If not forced, failure is silent, relying on console logs from fetchRatesFromAPI
        }
      }

      if (ratesToSet.length === 0) {
        DEFAULT_RATES_DATA.forEach(defaultRate => {
          ratesToSet.push({ ...defaultRate, id: generateGUID(), updatedAt: new Date().toISOString(), source: 'manual' });
        });
        finalTimestampForState = null;
        if (localStorage.getItem(API_RATES_LAST_FETCHED_KEY)) localStorage.removeItem(API_RATES_LAST_FETCHED_KEY);
        
        if (shouldAttemptApiFetch && !fetchedFromApiSuccessfully) {
          toast({ title: "Using Default Rates", description: "API fetch failed and no saved rates found. Using default rates.", variant: "default" });
        } else if (!shouldAttemptApiFetch && localRates.length === 0) {
          toast({ title: "Using Default Rates", description: "No saved rates. Using default rates.", variant: "default" });
        }
      } else if (!shouldAttemptApiFetch && !forceApiFetch && localApiTimestampString && !error) { // No API attempt, used cache
         // toast({ title: "Using Cached Rates", description: `Rates last updated: ${new Date(localApiTimestampString).toLocaleString()}.`, variant: "default" });
      }


      saveRatesToLocalStorage(ratesToSet.map(r => ({ ...r, source: r.source || 'manual' })));
      setLastApiFetchTimestampState(finalTimestampForState);

      try {
        const storedGlobalMarkup = localStorage.getItem(GLOBAL_MARKUP_STORAGE_KEY);
        setGlobalMarkupPercentageState(storedGlobalMarkup ? parseFloat(storedGlobalMarkup) : 0);
        const storedSpecificMarkups = localStorage.getItem(SPECIFIC_MARKUP_RATES_STORAGE_KEY);
        setSpecificMarkupRates(storedSpecificMarkups ? JSON.parse(storedSpecificMarkups) : []);
      } catch (e) { console.error("Error loading markup settings:", e); }

    } catch (criticalError: any) {
      console.error("Critical error in fetchAndSeedData:", criticalError);
      setError("An unexpected critical error occurred while loading rate data.");
      setExchangeRates(DEFAULT_RATES_DATA.map(dr => ({...dr, id: generateGUID(), updatedAt: new Date().toISOString(), source: 'manual'})));
      setLastApiFetchTimestampState(null);
      setGlobalMarkupPercentageState(0);
      setSpecificMarkupRates([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, allManagedCurrencyCodes, fetchRatesFromAPI, saveRatesToLocalStorage, isLoadingCustomCurrencies, error]); // Added `error` to dependencies

  React.useEffect(() => {
    if (!isLoadingCustomCurrencies) {
      fetchAndSeedData(); // Initial load, will decide internally if API fetch is needed
    }
  }, [fetchAndSeedData, isLoadingCustomCurrencies]);
  
  const saveSpecificMarkupRatesToLocalStorage = React.useCallback((newSpecificMarkups: SpecificMarkupRate[]) => {
    try {
      newSpecificMarkups.sort((a,b) => `${a.fromCurrency}-${a.toCurrency}`.localeCompare(`${b.fromCurrency}-${b.toCurrency}`));
      localStorage.setItem(SPECIFIC_MARKUP_RATES_STORAGE_KEY, JSON.stringify(newSpecificMarkups));
      setSpecificMarkupRates(newSpecificMarkups);
    } catch (e: any) {
      console.error("Error saving specific markups to localStorage:", e);
      toast({ title: "Error Saving Specific Markups", description: e.message, variant: "destructive" });
    }
  },[toast]);


  const setGlobalMarkup = React.useCallback((newMarkup: number) => {
    if (isNaN(newMarkup) || newMarkup < 0) {
      toast({ title: "Invalid Markup", description: "Global markup must be non-negative.", variant: "destructive"}); return;
    }
    try {
      localStorage.setItem(GLOBAL_MARKUP_STORAGE_KEY, String(newMarkup));
      setGlobalMarkupPercentageState(newMarkup);
      toast({ title: "Success", description: `Global conversion markup set to ${newMarkup}%.` });
    } catch (e: any) {
      console.error("Error saving global markup:", e);
      toast({ title: "Error Setting Global Markup", description: e.message, variant: "destructive" });
    }
  }, [toast]);

  const addRate = React.useCallback((newRateData: Omit<ExchangeRate, 'id' | 'updatedAt' | 'source'>) => {
    const currentRates = exchangeRatesRef.current; // Use ref for current rates
    const existing = currentRates.find(r => r.fromCurrency === newRateData.fromCurrency && r.toCurrency === newRateData.toCurrency);
    if (existing) { toast({ title: "Rate Exists", description: `Rate ${newRateData.fromCurrency}-${newRateData.toCurrency} already exists. Edit it.`, variant: "default" }); return; }
    if (newRateData.fromCurrency === newRateData.toCurrency) { toast({ title: "Invalid Pair", description: "Cannot set rate for same currency.", variant: "destructive"}); return; }
    const newRate: ExchangeRate = { ...newRateData, id: generateGUID(), updatedAt: new Date().toISOString(), source: 'manual' };
    saveRatesToLocalStorage([...currentRates, newRate]);
    toast({ title: "Success", description: `Rate ${newRate.fromCurrency}-${newRate.toCurrency} added.` });
  }, [saveRatesToLocalStorage, toast]); // exchangeRatesRef is stable

  const exchangeRatesRef = React.useRef(exchangeRates);
  React.useEffect(() => { exchangeRatesRef.current = exchangeRates; }, [exchangeRates]);

  const updateRate = React.useCallback((updatedRate: ExchangeRate) => {
    const currentRates = exchangeRatesRef.current;
    const updatedRates = currentRates.map(r => r.id === updatedRate.id ? { ...updatedRate, updatedAt: new Date().toISOString(), source: 'manual' } : r);
    saveRatesToLocalStorage(updatedRates);
    toast({ title: "Success", description: `Rate ${updatedRate.fromCurrency}-${updatedRate.toCurrency} updated.` });
  }, [saveRatesToLocalStorage, toast]);

  const deleteRate = React.useCallback((rateId: string) => {
    const currentRates = exchangeRatesRef.current;
    const rateToDelete = currentRates.find(r => r.id === rateId);
    saveRatesToLocalStorage(currentRates.filter(r => r.id !== rateId));
    if (rateToDelete) toast({ title: "Success", description: `Rate ${rateToDelete.fromCurrency}-${rateToDelete.toCurrency} deleted.` });
  }, [saveRatesToLocalStorage, toast]);
  
  const specificMarkupRatesRef = React.useRef(specificMarkupRates);
  React.useEffect(() => { specificMarkupRatesRef.current = specificMarkupRates; }, [specificMarkupRates]);

  const addSpecificMarkup = React.useCallback((markupData: Omit<SpecificMarkupRate, 'id' | 'updatedAt'>) => {
    const currentMarkups = specificMarkupRatesRef.current;
    if (markupData.fromCurrency === markupData.toCurrency) { toast({ title: "Invalid Pair", description: "Cannot set specific markup for same currency.", variant: "destructive" }); return; }
    const existing = currentMarkups.find(sm => sm.fromCurrency === markupData.fromCurrency && sm.toCurrency === markupData.toCurrency);
    if (existing) { toast({ title: "Specific Markup Exists", description: `Specific markup for ${markupData.fromCurrency}-${markupData.toCurrency} already exists. Edit it.`, variant: "default" }); return; }
    const newSpecificMarkup: SpecificMarkupRate = { ...markupData, id: generateGUID(), updatedAt: new Date().toISOString() };
    saveSpecificMarkupRatesToLocalStorage([...currentMarkups, newSpecificMarkup]);
    toast({ title: "Success", description: `Specific markup for ${markupData.fromCurrency}-${markupData.toCurrency} added.` });
  }, [saveSpecificMarkupRatesToLocalStorage, toast]);

  const updateSpecificMarkup = React.useCallback((updatedMarkup: SpecificMarkupRate) => {
    const currentMarkups = specificMarkupRatesRef.current;
    const updatedMarkups = currentMarkups.map(sm => sm.id === updatedMarkup.id ? { ...updatedMarkup, updatedAt: new Date().toISOString() } : sm);
    saveSpecificMarkupRatesToLocalStorage(updatedMarkups);
    toast({ title: "Success", description: `Specific markup for ${updatedMarkup.fromCurrency}-${updatedMarkup.toCurrency} updated.` });
  }, [saveSpecificMarkupRatesToLocalStorage, toast]);
  
  const deleteSpecificMarkup = React.useCallback((markupId: string) => {
    const currentMarkups = specificMarkupRatesRef.current;
    const markupToDelete = currentMarkups.find(sm => sm.id === markupId);
    saveSpecificMarkupRatesToLocalStorage(currentMarkups.filter(sm => sm.id !== markupId));
    if (markupToDelete) toast({ title: "Success", description: `Specific markup for ${markupToDelete.fromCurrency}-${markupToDelete.toCurrency} deleted.` });
  }, [saveSpecificMarkupRatesToLocalStorage, toast]);

  const findBaseRate = React.useCallback((from: CurrencyCode, to: CurrencyCode): number | null => {
    const currentRates = exchangeRatesRef.current;
    if (from === to) return 1;
    const directRate = currentRates.find(r => r.fromCurrency === from && r.toCurrency === to);
    if (directRate) return directRate.rate;
    const inverseRate = currentRates.find(r => r.fromCurrency === to && r.toCurrency === from);
    if (inverseRate && inverseRate.rate !== 0) return 1 / inverseRate.rate;
    return null;
  }, []); // exchangeRatesRef ensures this doesn't change with exchangeRates state

  const getRate = React.useCallback((fromCurrency: CurrencyCode, toCurrency: CurrencyCode): ConversionRateDetails | null => {
    if (isLoadingCustomCurrencies) { /* console.warn("getRate called while custom currencies loading."); */ }
    if (!allManagedCurrencyCodes.includes(fromCurrency as any) || !allManagedCurrencyCodes.includes(toCurrency as any)) {
      // console.error("Invalid currency code to getRate:", fromCurrency, toCurrency, "Available:", allManagedCurrencyCodes); return null;
    }

    if (fromCurrency === toCurrency) return { baseRate: 1, finalRate: 1, markupApplied: 0, markupType: 'none' };

    let rateFromToRef: number | null = fromCurrency === REFERENCE_CURRENCY ? 1 : findBaseRate(fromCurrency, REFERENCE_CURRENCY);
    if (rateFromToRef === null) { /* console.warn(`No base rate from ${fromCurrency} to ${REFERENCE_CURRENCY}.`); */ return null; }

    let rateRefToTo: number | null = toCurrency === REFERENCE_CURRENCY ? 1 : findBaseRate(REFERENCE_CURRENCY, toCurrency);
    if (rateRefToTo === null) { /* console.warn(`No base rate from ${REFERENCE_CURRENCY} to ${toCurrency}.`); */ return null; }

    const baseCombinedRate = Math.max(0.000001, rateFromToRef * rateRefToTo);
    let finalCombinedRate = baseCombinedRate;
    let actualMarkupApplied = 0;
    let markupType: ConversionRateDetails['markupType'] = 'none';

    if (fromCurrency !== toCurrency) {
      const specificMarkup = specificMarkupRatesRef.current.find(sm => sm.fromCurrency === fromCurrency && sm.toCurrency === toCurrency);
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
  }, [findBaseRate, globalMarkupPercentage, allManagedCurrencyCodes, isLoadingCustomCurrencies]); // specificMarkupRatesRef ensures this doesn't change with specificMarkupRates state

  return {
    exchangeRates,
    isLoading: isLoading || isLoadingCustomCurrencies,
    error, // This reflects API errors primarily
    addRate, updateRate, deleteRate,
    getRate,
    globalMarkupPercentage, setGlobalMarkup,
    specificMarkupRates, addSpecificMarkup, updateSpecificMarkup, deleteSpecificMarkup,
    refreshRates: () => fetchAndSeedData({ forceApiFetch: true }),
    lastApiFetchTimestamp
  };
}
