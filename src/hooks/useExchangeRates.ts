
/**
 * @fileoverview This custom React hook manages exchange rates for currency conversion.
 * It loads rates from localStorage, attempts to fetch fresh rates from ExchangeRate-API,
 * saves API-fetched rates, falls back to last saved rates or default USD-centric rates
 * if API fails, and provides functions to add, update, delete, and retrieve exchange rates.
 * It includes logic for applying a configurable markup (global or specific to a currency pair)
 * when converting.
 *
 * @bangla এই কাস্টম রিঅ্যাক্ট হুক মুদ্রা রূপান্তরের জন্য বিনিময় হার পরিচালনা করে।
 * এটি localStorage থেকে হার লোড করে, ExchangeRate-API থেকে নতুন হার আনার চেষ্টা করে,
 * API-থেকে আনা হারগুলি সংরক্ষণ করে, API ব্যর্থ হলে সর্বশেষ সংরক্ষিত হার বা ডিফল্ট USD-কেন্দ্রিক
 * হারে ফিরে যায়, এবং বিনিময় হার যোগ, আপডেট, মুছে ফেলা এবং পুনরুদ্ধার করার জন্য ফাংশন
 * সরবরাহ করে। এটি বিভিন্ন মুদ্রার মধ্যে রূপান্তর করার সময় একটি কনফিগারযোগ্য মার্কআপ
 * (গ্লোবাল বা নির্দিষ্ট মুদ্রা জোড়ার জন্য) প্রয়োগ করার যুক্তি অন্তর্ভুক্ত করে।
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

const DEFAULT_RATES_DATA: Omit<ExchangeRate, 'id' | 'updatedAt' | 'source'>[] = [
  { fromCurrency: "USD", toCurrency: "THB", rate: 36.50 },
  { fromCurrency: "USD", toCurrency: "MYR", rate: 4.70 },
  { fromCurrency: "USD", toCurrency: "SGD", rate: 1.35 },
  { fromCurrency: "USD", toCurrency: "VND", rate: 25000 },
  { fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 },
  { fromCurrency: "USD", toCurrency: "GBP", rate: 0.79 },
  { fromCurrency: "USD", toCurrency: "JPY", rate: 157.00 },
  { fromCurrency: "USD", toCurrency: "AUD", rate: 1.50 }, // Adjusted default AUD for consistency
  { fromCurrency: "USD", toCurrency: "INR", rate: 83.00 },
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
      if (isLoadingCustomCurrencies) return [...SYSTEM_DEFAULT_CURRENCIES, REFERENCE_CURRENCY]; // Include REFERENCE_CURRENCY
      return Array.from(new Set([...getAllManagedCurrencyCodesFromHook(), REFERENCE_CURRENCY])); // Ensure REFERENCE_CURRENCY is always present
  }, [getAllManagedCurrencyCodesFromHook, isLoadingCustomCurrencies]);

  const fetchRatesFromAPI = async (): Promise<{rates: Partial<Record<CurrencyCode, number>>, timestamp: string } | null> => {
    const apiKey = process.env.NEXT_PUBLIC_EXCHANGERATE_API_KEY || process.env.EXCHANGERATE_API_KEY;
    if (!apiKey || apiKey === 'YOUR_EXCHANGERATE_API_KEY_HERE' || apiKey.trim() === '') {
      console.warn("ExchangeRate-API key is not configured. Skipping API fetch.");
      return null;
    }

    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${REFERENCE_CURRENCY}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${response.status} - ${errorData?.['error-type'] || response.statusText}`);
      }
      const data = await response.json();
      if (data.result === 'success' && data.conversion_rates) {
        const newTimestamp = new Date(data.time_last_update_unix * 1000).toISOString();
        return { rates: data.conversion_rates, timestamp: newTimestamp };
      } else {
        throw new Error(data['error-type'] || 'Invalid API response structure');
      }
    } catch (apiError: any) {
      console.error("Error fetching rates from ExchangeRate-API:", apiError);
      setError(`API Error: ${apiError.message}.`);
      // Toast will be handled by fetchAndSeedData
      return null;
    }
  };

  const fetchAndSeedData = React.useCallback(async (attemptApiFetch = true) => {
    setIsLoading(true);
    setError(null);
    let localRates: ExchangeRate[] = [];
    let localTimestamp: string | null = null;

    // 1. Load from localStorage first
    try {
      const storedRatesString = localStorage.getItem(EXCHANGE_RATES_STORAGE_KEY);
      if (storedRatesString) localRates = JSON.parse(storedRatesString);
      localTimestamp = localStorage.getItem(API_RATES_LAST_FETCHED_KEY);
    } catch (e) {
      console.warn("Could not parse localStorage rates/timestamp.", e);
      localRates = [];
      localTimestamp = null;
    }

    let ratesToSet = [...localRates]; // Start with local rates
    let finalTimestamp = localTimestamp;

    if (attemptApiFetch) {
      const apiResult = await fetchRatesFromAPI();
      if (apiResult) { // API Success
        const { rates: apiRates, timestamp: apiTimestamp } = apiResult;
        const currenciesToUpdateFromApi = [...new Set([...SYSTEM_DEFAULT_CURRENCIES, ...allManagedCurrencyCodes])];
        
        const updatedRatesMap = new Map<string, ExchangeRate>(ratesToSet.map(r => [`${r.fromCurrency}-${r.toCurrency}`, r]));

        currenciesToUpdateFromApi.forEach(currency => {
          if (currency === REFERENCE_CURRENCY) return;
          if (apiRates[currency] !== undefined) {
            const pairKey = `${REFERENCE_CURRENCY}-${currency}`;
            const existingRate = updatedRatesMap.get(pairKey);
            const newApiRate: ExchangeRate = {
              fromCurrency: REFERENCE_CURRENCY, toCurrency: currency, rate: apiRates[currency]!,
              id: existingRate?.id || generateGUID(),
              updatedAt: apiTimestamp, source: 'api',
            };
            updatedRatesMap.set(pairKey, newApiRate);
          }
        });
        ratesToSet = Array.from(updatedRatesMap.values());
        finalTimestamp = apiTimestamp;
        localStorage.setItem(API_RATES_LAST_FETCHED_KEY, apiTimestamp); // Save successful API timestamp
        toast({ title: "Rates Updated", description: "Successfully fetched latest exchange rates from API.", variant: "default" });
      } else { // API Failed
        if (ratesToSet.length > 0 && finalTimestamp) {
          toast({ title: "API Fetch Failed", description: `Using last saved rates from ${new Date(finalTimestamp).toLocaleString()}.`, variant: "default" });
        } else if (ratesToSet.length > 0) {
          toast({ title: "API Fetch Failed", description: "Using manually entered/stored rates.", variant: "default" });
        }
        // If API failed and ratesToSet is empty, defaults will be applied below.
      }
    }

    // If still no rates (e.g., first run and API failed, or localStorage was empty)
    if (ratesToSet.length === 0) {
      DEFAULT_RATES_DATA.forEach(defaultRate => {
        ratesToSet.push({ ...defaultRate, id: generateGUID(), updatedAt: new Date().toISOString(), source: 'manual' });
      });
      finalTimestamp = null; // No API success to report for timestamp
      if (attemptApiFetch) { // Only show this if an API attempt was made and failed leading to defaults
          toast({ title: "Using Default Rates", description: "API fetch failed and no saved rates found. Using pre-defined default exchange rates.", variant: "default" });
      } else { // If !attemptApiFetch and localStorage was empty
          toast({ title: "Using Default Rates", description: "No saved rates found. Using pre-defined default exchange rates.", variant: "default" });
      }
    }
    
    // Ensure all rates have a source
    ratesToSet = ratesToSet.map(r => ({ ...r, source: r.source || 'manual' }));

    saveRates(ratesToSet); // This also calls setExchangeRates
    setLastApiFetchTimestampState(finalTimestamp);

    // Load markups (should be independent of rate fetching success/failure)
    try {
      const storedGlobalMarkup = localStorage.getItem(GLOBAL_MARKUP_STORAGE_KEY);
      setGlobalMarkupPercentageState(storedGlobalMarkup ? parseFloat(storedGlobalMarkup) : 0);
      const storedSpecificMarkups = localStorage.getItem(SPECIFIC_MARKUP_RATES_STORAGE_KEY);
      setSpecificMarkupRates(storedSpecificMarkups ? JSON.parse(storedSpecificMarkups) : []);
    } catch (e) {
      console.error("Error loading markup settings:", e);
      setGlobalMarkupPercentageState(0);
      setSpecificMarkupRates([]);
    }

    setIsLoading(false);
  }, [toast, allManagedCurrencyCodes]); // allManagedCurrencyCodes will trigger re-evaluation if custom currencies change

  React.useEffect(() => {
    if (!isLoadingCustomCurrencies) {
        fetchAndSeedData(true); 
    }
  }, [fetchAndSeedData, isLoadingCustomCurrencies]);

  const saveRates = (rates: ExchangeRate[]) => {
    try {
      rates.sort((a,b) => `${a.fromCurrency}-${a.toCurrency}`.localeCompare(`${b.fromCurrency}-${b.toCurrency}`));
      localStorage.setItem(EXCHANGE_RATES_STORAGE_KEY, JSON.stringify(rates));
      setExchangeRates(rates);
    } catch (e: any) {
      console.error("Error saving rates to localStorage:", e);
      toast({ title: "Error Saving Rates", description: e.message, variant: "destructive" });
    }
  };
  
  const saveSpecificMarkupRates = (newSpecificMarkups: SpecificMarkupRate[]) => {
    try {
      newSpecificMarkups.sort((a,b) => `${a.fromCurrency}-${a.toCurrency}`.localeCompare(`${b.fromCurrency}-${b.toCurrency}`));
      localStorage.setItem(SPECIFIC_MARKUP_RATES_STORAGE_KEY, JSON.stringify(newSpecificMarkups));
      setSpecificMarkupRates(newSpecificMarkups);
    } catch (e: any) {
      console.error("Error saving specific markups to localStorage:", e);
      toast({ title: "Error Saving Specific Markups", description: e.message, variant: "destructive" });
    }
  };

  const setGlobalMarkup = (newMarkup: number) => {
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
  };

  const addRate = (newRateData: Omit<ExchangeRate, 'id' | 'updatedAt' | 'source'>) => {
    const existing = exchangeRates.find(r => r.fromCurrency === newRateData.fromCurrency && r.toCurrency === newRateData.toCurrency);
    if (existing) { toast({ title: "Rate Exists", description: `Rate ${newRateData.fromCurrency}-${newRateData.toCurrency} already exists. Edit it.`, variant: "default" }); return; }
    if (newRateData.fromCurrency === newRateData.toCurrency) { toast({ title: "Invalid Pair", description: "Cannot set rate for same currency.", variant: "destructive"}); return; }
    const newRate: ExchangeRate = { ...newRateData, id: generateGUID(), updatedAt: new Date().toISOString(), source: 'manual' };
    saveRates([...exchangeRates, newRate]);
    toast({ title: "Success", description: `Rate ${newRate.fromCurrency}-${newRate.toCurrency} added.` });
  };

  const updateRate = (updatedRate: ExchangeRate) => {
    const updatedRates = exchangeRates.map(r => r.id === updatedRate.id ? { ...updatedRate, updatedAt: new Date().toISOString(), source: 'manual' } : r);
    saveRates(updatedRates);
    toast({ title: "Success", description: `Rate ${updatedRate.fromCurrency}-${updatedRate.toCurrency} updated.` });
  };

  const deleteRate = (rateId: string) => {
    const rateToDelete = exchangeRates.find(r => r.id === rateId);
    saveRates(exchangeRates.filter(r => r.id !== rateId));
    if (rateToDelete) toast({ title: "Success", description: `Rate ${rateToDelete.fromCurrency}-${rateToDelete.toCurrency} deleted.` });
  };
  
  const addSpecificMarkup = (markupData: Omit<SpecificMarkupRate, 'id' | 'updatedAt'>) => {
    if (markupData.fromCurrency === markupData.toCurrency) { toast({ title: "Invalid Pair", description: "Cannot set specific markup for same currency.", variant: "destructive" }); return; }
    const existing = specificMarkupRates.find(sm => sm.fromCurrency === markupData.fromCurrency && sm.toCurrency === markupData.toCurrency);
    if (existing) { toast({ title: "Specific Markup Exists", description: `Specific markup for ${markupData.fromCurrency}-${markupData.toCurrency} already exists. Edit it.`, variant: "default" }); return; }
    const newSpecificMarkup: SpecificMarkupRate = { ...markupData, id: generateGUID(), updatedAt: new Date().toISOString() };
    saveSpecificMarkupRates([...specificMarkupRates, newSpecificMarkup]);
    toast({ title: "Success", description: `Specific markup for ${markupData.fromCurrency}-${markupData.toCurrency} added.` });
  };

  const updateSpecificMarkup = (updatedMarkup: SpecificMarkupRate) => {
    const updatedMarkups = specificMarkupRates.map(sm => sm.id === updatedMarkup.id ? { ...updatedMarkup, updatedAt: new Date().toISOString() } : sm);
    saveSpecificMarkupRates(updatedMarkups);
    toast({ title: "Success", description: `Specific markup for ${updatedMarkup.fromCurrency}-${updatedMarkup.toCurrency} updated.` });
  };
  
  const deleteSpecificMarkup = (markupId: string) => {
    const markupToDelete = specificMarkupRates.find(sm => sm.id === markupId);
    saveSpecificMarkupRates(specificMarkupRates.filter(sm => sm.id !== markupId));
    if (markupToDelete) toast({ title: "Success", description: `Specific markup for ${markupToDelete.fromCurrency}-${markupToDelete.toCurrency} deleted.` });
  };

  const findBaseRate = React.useCallback((from: CurrencyCode, to: CurrencyCode): number | null => {
    if (from === to) return 1;
    const directRate = exchangeRates.find(r => r.fromCurrency === from && r.toCurrency === to);
    if (directRate) return directRate.rate;
    const inverseRate = exchangeRates.find(r => r.fromCurrency === to && r.toCurrency === from);
    if (inverseRate && inverseRate.rate !== 0) return 1 / inverseRate.rate;
    return null;
  }, [exchangeRates]);

  const getRate = React.useCallback((fromCurrency: CurrencyCode, toCurrency: CurrencyCode): ConversionRateDetails | null => {
    if (isLoadingCustomCurrencies) { /* console.warn("getRate called while custom currencies loading."); */ }
    if (!allManagedCurrencyCodes.includes(fromCurrency as any) || !allManagedCurrencyCodes.includes(toCurrency as any)) {
      console.error("Invalid currency code to getRate:", fromCurrency, toCurrency, "Available:", allManagedCurrencyCodes); return null;
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
    refreshRates: () => fetchAndSeedData(true), // Explicitly pass true to attempt API fetch
    lastApiFetchTimestamp
  };
}

    
