
/**
 * @fileoverview This custom React hook manages exchange rates for currency conversion.
 * It loads rates from localStorage, attempts to fetch fresh rates from ExchangeRate-API,
 * seeds default USD-centric rates if API fails, and provides functions
 * to add, update, delete, and retrieve exchange rates. It includes logic for applying a
 * configurable markup when converting between different currencies.
 *
 * @bangla এই কাস্টম রিঅ্যাক্ট হুক মুদ্রা রূপান্তরের জন্য বিনিময় হার পরিচালনা করে।
 * এটি localStorage থেকে হার লোড করে, ExchangeRate-API থেকে নতুন হার আনার চেষ্টা করে,
 * API ব্যর্থ হলে ডিফল্ট USD-কেন্দ্রিক হার বীজ করে, এবং বিনিময় হার
 * যোগ, আপডেট, মুছে ফেলা এবং পুনরুদ্ধার করার জন্য ফাংশন সরবরাহ করে। এটি বিভিন্ন মুদ্রার
 * মধ্যে রূপান্তর করার সময় একটি কনফিগারযোগ্য মার্কআপ প্রয়োগ করার যুক্তি অন্তর্ভুক্ত করে।
 */
import * as React from 'react';
import type { ExchangeRate, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useToast } from './use-toast';

const EXCHANGE_RATES_STORAGE_KEY = 'itineraryAceExchangeRates';
const EXCHANGE_MARKUP_STORAGE_KEY = 'itineraryAceExchangeMarkup';
const API_RATES_LAST_FETCHED_KEY = 'itineraryAceApiRatesLastFetched';
const REFERENCE_CURRENCY: CurrencyCode = "USD";

const DEFAULT_RATES_DATA: Omit<ExchangeRate, 'id' | 'updatedAt'>[] = [
  { fromCurrency: "USD", toCurrency: "THB", rate: 36.50 },
  { fromCurrency: "USD", toCurrency: "MYR", rate: 4.70 },
  { fromCurrency: "USD", toCurrency: "SGD", rate: 1.35 },
  { fromCurrency: "USD", toCurrency: "VND", rate: 25000 },
  { fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 },
  { fromCurrency: "USD", toCurrency: "GBP", rate: 0.79 },
  { fromCurrency: "USD", toCurrency: "JPY", rate: 157.00 },
];

export interface ConversionRateDetails {
  baseRate: number;
  finalRate: number;
  markupApplied: number;
}

export function useExchangeRates() {
  const [exchangeRates, setExchangeRates] = React.useState<ExchangeRate[]>([]);
  const [markupPercentage, setMarkupPercentageState] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastApiFetchTimestamp, setLastApiFetchTimestamp] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchRatesFromAPI = async (): Promise<Partial<Record<CurrencyCode, number>> | null> => {
    const apiKey = process.env.NEXT_PUBLIC_EXCHANGERATE_API_KEY || process.env.EXCHANGERATE_API_KEY;
    if (!apiKey || apiKey === 'YOUR_EXCHANGERATE_API_KEY_HERE' || apiKey.trim() === '') {
      console.warn("ExchangeRate-API key is not configured. Skipping API fetch.");
      toast({ title: "API Key Missing", description: "ExchangeRate-API key not set. Using fallback rates.", variant: "default" });
      return null;
    }

    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${response.status} - ${errorData?.['error-type'] || response.statusText}`);
      }
      const data = await response.json();
      if (data.result === 'success' && data.conversion_rates) {
        setLastApiFetchTimestamp(new Date(data.time_last_update_unix * 1000).toISOString());
        localStorage.setItem(API_RATES_LAST_FETCHED_KEY, new Date(data.time_last_update_unix * 1000).toISOString());
        return data.conversion_rates;
      } else {
        throw new Error(data['error-type'] || 'Invalid API response structure');
      }
    } catch (apiError: any) {
      console.error("Error fetching rates from ExchangeRate-API:", apiError);
      setError(`API Error: ${apiError.message}. Using fallback rates.`);
      toast({ title: "API Fetch Failed", description: `Could not fetch live rates: ${apiError.message}. Using stored/default rates.`, variant: "destructive" });
      setLastApiFetchTimestamp(localStorage.getItem(API_RATES_LAST_FETCHED_KEY)); // Keep last known good fetch time
      return null;
    }
  };

  const fetchAndSeedData = React.useCallback(async (attemptApiFetch = true) => {
    setIsLoading(true);
    setError(null);
    let apiRates: Partial<Record<CurrencyCode, number>> | null = null;

    if (attemptApiFetch) {
      apiRates = await fetchRatesFromAPI();
    } else {
       setLastApiFetchTimestamp(localStorage.getItem(API_RATES_LAST_FETCHED_KEY));
    }

    try {
      let ratesToSet: ExchangeRate[] = [];
      const storedRatesString = localStorage.getItem(EXCHANGE_RATES_STORAGE_KEY);
      if (storedRatesString) {
        try {
          ratesToSet = JSON.parse(storedRatesString);
        } catch (e) { /* ignore parse error, will re-seed */ }
      }

      // Update USD-based rates from API if available
      if (apiRates) {
        CURRENCIES.forEach(currency => {
          if (currency === REFERENCE_CURRENCY) return; // Skip USD to USD
          if (apiRates && apiRates[currency] !== undefined) {
            const existingRateIndex = ratesToSet.findIndex(r => r.fromCurrency === REFERENCE_CURRENCY && r.toCurrency === currency);
            const newApiRate = {
              fromCurrency: REFERENCE_CURRENCY,
              toCurrency: currency,
              rate: apiRates[currency]!,
              id: existingRateIndex !== -1 ? ratesToSet[existingRateIndex].id : generateGUID(),
              updatedAt: new Date().toISOString(),
            };
            if (existingRateIndex !== -1) {
              ratesToSet[existingRateIndex] = newApiRate;
            } else {
              ratesToSet.push(newApiRate);
            }
          }
        });
        toast({ title: "Rates Updated", description: "Successfully fetched latest exchange rates.", variant: "default" });
      } else if (!storedRatesString || ratesToSet.filter(r => r.fromCurrency === REFERENCE_CURRENCY).length === 0) {
        // If API failed AND no stored rates OR no USD rates in storage, use hardcoded defaults for USD pairs
        DEFAULT_RATES_DATA.forEach(defaultRate => {
          if (!ratesToSet.some(r => r.fromCurrency === defaultRate.fromCurrency && r.toCurrency === defaultRate.toCurrency)) {
            ratesToSet.push({ ...defaultRate, id: generateGUID(), updatedAt: new Date().toISOString() });
          }
        });
         if (!attemptApiFetch && !apiRates) { /* No message if just loading from storage */ }
         else if (attemptApiFetch && !apiRates) { /* API already showed toast */ }
         else {
            toast({ title: "Using Default Rates", description: "Used pre-defined default exchange rates.", variant: "default" });
         }
      }

      localStorage.setItem(EXCHANGE_RATES_STORAGE_KEY, JSON.stringify(ratesToSet));
      setExchangeRates(ratesToSet.sort((a,b) => `${a.fromCurrency}-${a.toCurrency}`.localeCompare(`${b.fromCurrency}-${b.toCurrency}`)));

      const storedMarkup = localStorage.getItem(EXCHANGE_MARKUP_STORAGE_KEY);
      if (storedMarkup) {
        const parsedMarkup = parseFloat(storedMarkup);
        setMarkupPercentageState(!isNaN(parsedMarkup) && parsedMarkup >= 0 ? parsedMarkup : 0);
      } else {
        setMarkupPercentageState(0);
      }

    } catch (e: any) {
      console.error("Error initializing exchange rates/markup:", e);
      setError("Failed to load exchange rates or markup.");
      setExchangeRates([]);
      setMarkupPercentageState(0);
    }
    setIsLoading(false);
  }, [toast]); // Removed apiRates from dependency array as it's fetched inside

  React.useEffect(() => {
    fetchAndSeedData(true); // Attempt API fetch on initial load
  }, [fetchAndSeedData]);


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
  
  const setGlobalMarkup = (newMarkup: number) => {
    if (isNaN(newMarkup) || newMarkup < 0) {
      toast({ title: "Invalid Markup", description: "Markup percentage must be a non-negative number.", variant: "destructive"});
      return;
    }
    try {
      localStorage.setItem(EXCHANGE_MARKUP_STORAGE_KEY, String(newMarkup));
      setMarkupPercentageState(newMarkup);
      toast({ title: "Success", description: `Conversion markup set to ${newMarkup}%.` });
    } catch (e: any) {
      console.error("Error saving markup to localStorage:", e);
      toast({ title: "Error Setting Markup", description: e.message, variant: "destructive" });
    }
  };

  const addRate = (newRateData: Omit<ExchangeRate, 'id' | 'updatedAt'>) => {
    const existing = exchangeRates.find(r => r.fromCurrency === newRateData.fromCurrency && r.toCurrency === newRateData.toCurrency);
    if (existing) {
      toast({ title: "Rate Exists", description: `Rate from ${newRateData.fromCurrency} to ${newRateData.toCurrency} already exists. Please edit it.`, variant: "default" });
      return;
    }
    if (newRateData.fromCurrency === newRateData.toCurrency) {
        toast({ title: "Invalid Pair", description: "Cannot set an exchange rate from a currency to itself.", variant: "destructive"});
        return;
    }
    const newRate: ExchangeRate = {
      ...newRateData, id: generateGUID(), updatedAt: new Date().toISOString(),
    };
    saveRates([...exchangeRates, newRate]);
    toast({ title: "Success", description: `Rate ${newRate.fromCurrency} -> ${newRate.toCurrency} added.` });
  };

  const updateRate = (updatedRate: ExchangeRate) => {
    const updatedRates = exchangeRates.map(r =>
      r.id === updatedRate.id ? { ...updatedRate, updatedAt: new Date().toISOString() } : r
    );
    saveRates(updatedRates);
    toast({ title: "Success", description: `Rate ${updatedRate.fromCurrency} -> ${updatedRate.toCurrency} updated.` });
  };

  const deleteRate = (rateId: string) => {
    const rateToDelete = exchangeRates.find(r => r.id === rateId);
    const updatedRates = exchangeRates.filter(r => r.id !== rateId);
    saveRates(updatedRates);
    if (rateToDelete) {
      toast({ title: "Success", description: `Rate ${rateToDelete.fromCurrency} -> ${rateToDelete.toCurrency} deleted.` });
    }
  };
  
  const findBaseRate = React.useCallback((from: CurrencyCode, to: CurrencyCode): number | null => {
    if (from === to) return 1;

    const directRate = exchangeRates.find(r => r.fromCurrency === from && r.toCurrency === to);
    if (directRate) {
      return directRate.rate;
    }

    const inverseRate = exchangeRates.find(r => r.fromCurrency === to && r.toCurrency === from);
    if (inverseRate && inverseRate.rate !== 0) {
      return 1 / inverseRate.rate;
    }
    return null;
  }, [exchangeRates]);

  const getRate = React.useCallback((fromCurrency: CurrencyCode, toCurrency: CurrencyCode): ConversionRateDetails | null => {
    if (!CURRENCIES.includes(fromCurrency) || !CURRENCIES.includes(toCurrency)) {
      console.error("Invalid currency code provided to getRate", fromCurrency, toCurrency);
      return null;
    }
    if (fromCurrency === toCurrency) {
      return { baseRate: 1, finalRate: 1, markupApplied: 0 };
    }

    let rateFromToUSD: number | null;
    if (fromCurrency === REFERENCE_CURRENCY) {
      rateFromToUSD = 1;
    } else {
      rateFromToUSD = findBaseRate(fromCurrency, REFERENCE_CURRENCY);
    }

    if (rateFromToUSD === null) {
      console.warn(`Cannot find base rate from ${fromCurrency} to ${REFERENCE_CURRENCY}. Ensure a direct or inverse rate to USD is defined.`);
      return null;
    }

    let rateUSDToTo: number | null;
    if (toCurrency === REFERENCE_CURRENCY) {
      rateUSDToTo = 1;
    } else {
      rateUSDToTo = findBaseRate(REFERENCE_CURRENCY, toCurrency);
    }
    
    if (rateUSDToTo === null) {
      console.warn(`Cannot find base rate from ${REFERENCE_CURRENCY} to ${toCurrency}. Ensure a direct or inverse rate from USD is defined.`);
      return null;
    }

    const baseCombinedRate = Math.max(0.000001, rateFromToUSD * rateUSDToTo);
    let finalCombinedRate = baseCombinedRate;
    let actualMarkupApplied = 0;

    if (fromCurrency !== toCurrency && markupPercentage > 0) {
      finalCombinedRate = baseCombinedRate * (1 + (markupPercentage / 100));
      actualMarkupApplied = markupPercentage;
    }
    finalCombinedRate = Math.max(0.000001, finalCombinedRate);

    return { baseRate: baseCombinedRate, finalRate: finalCombinedRate, markupApplied: actualMarkupApplied };
  }, [findBaseRate, markupPercentage]);

  return { 
    exchangeRates, 
    isLoading, 
    error, 
    addRate, 
    updateRate, 
    deleteRate, 
    getRate, 
    markupPercentage,
    setGlobalMarkup,
    refreshRates: () => fetchAndSeedData(true), // Ensure API fetch on manual refresh
    lastApiFetchTimestamp
  };
}

