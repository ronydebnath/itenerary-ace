
/**
 * @fileoverview This custom React hook manages exchange rates for currency conversion.
 * It loads rates from localStorage, seeds default USD-centric rates, and provides functions
 * to add, update, delete, and retrieve exchange rates. It includes logic for applying a
 * configurable markup when converting from specific base currencies (THB, MYR) through USD.
 *
 * @bangla এই কাস্টম রিঅ্যাক্ট হুক মুদ্রা রূপান্তরের জন্য বিনিময় হার পরিচালনা করে।
 * এটি localStorage থেকে হার লোড করে, ডিফল্ট USD-কেন্দ্রিক হার বীজ করে, এবং বিনিময় হার
 * যোগ, আপডেট, মুছে ফেলা এবং পুনরুদ্ধার করার জন্য ফাংশন সরবরাহ করে। এটি নির্দিষ্ট বেস
 * মুদ্রা (THB, MYR) থেকে USD-এর মাধ্যমে রূপান্তর করার সময় একটি কনফিগারযোগ্য মার্কআপ
 * প্রয়োগ করার যুক্তি অন্তর্ভুক্ত করে।
 */
import * as React from 'react';
import type { ExchangeRate, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary'; // Import CURRENCIES
import { generateGUID } from '@/lib/utils';
import { useToast } from './use-toast';

const EXCHANGE_RATES_STORAGE_KEY = 'itineraryAceExchangeRates';
const EXCHANGE_MARKUP_STORAGE_KEY = 'itineraryAceExchangeMarkup'; // Renamed from BUFFER
const REFERENCE_CURRENCY: CurrencyCode = "USD";

// Ensure DEFAULT_RATES_DATA is USD-centric
const DEFAULT_RATES_DATA: Omit<ExchangeRate, 'id' | 'updatedAt'>[] = [
  { fromCurrency: "USD", toCurrency: "THB", rate: 36.50 },
  { fromCurrency: "USD", toCurrency: "MYR", rate: 4.70 },
  { fromCurrency: "USD", toCurrency: "SGD", rate: 1.35 },
  { fromCurrency: "USD", toCurrency: "VND", rate: 25000 },
  { fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 },
  { fromCurrency: "USD", toCurrency: "GBP", rate: 0.79 },
  { fromCurrency: "USD", toCurrency: "JPY", rate: 157.00 },
];

export function useExchangeRates() {
  const [exchangeRates, setExchangeRates] = React.useState<ExchangeRate[]>([]);
  const [markupPercentage, setMarkupPercentageState] = React.useState<number>(0); // Renamed from bufferPercentage
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchAndSeedData = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      // Load Rates
      const storedRatesString = localStorage.getItem(EXCHANGE_RATES_STORAGE_KEY);
      let ratesToSet: ExchangeRate[] = [];
      if (storedRatesString) {
        try {
          ratesToSet = JSON.parse(storedRatesString);
          // Ensure all default USD-centric rates are present, add if missing
          DEFAULT_RATES_DATA.forEach(defaultRate => {
            const existing = ratesToSet.find(r => r.fromCurrency === defaultRate.fromCurrency && r.toCurrency === defaultRate.toCurrency);
            if (!existing) {
              ratesToSet.push({ ...defaultRate, id: generateGUID(), updatedAt: new Date().toISOString() });
            }
          });
        } catch (parseError) {
          console.warn("Error parsing exchange rates from localStorage, seeding defaults:", parseError);
          localStorage.removeItem(EXCHANGE_RATES_STORAGE_KEY);
          ratesToSet = DEFAULT_RATES_DATA.map(rate => ({
            ...rate, id: generateGUID(), updatedAt: new Date().toISOString(),
          }));
        }
      } else {
        ratesToSet = DEFAULT_RATES_DATA.map(rate => ({
          ...rate, id: generateGUID(), updatedAt: new Date().toISOString(),
        }));
      }
      localStorage.setItem(EXCHANGE_RATES_STORAGE_KEY, JSON.stringify(ratesToSet));
      setExchangeRates(ratesToSet.sort((a,b) => `${a.fromCurrency}-${a.toCurrency}`.localeCompare(`${b.fromCurrency}-${b.toCurrency}`)));

      // Load Markup Percentage
      const storedMarkup = localStorage.getItem(EXCHANGE_MARKUP_STORAGE_KEY);
      if (storedMarkup) {
        const parsedMarkup = parseFloat(storedMarkup);
        if (!isNaN(parsedMarkup) && parsedMarkup >= 0) {
          setMarkupPercentageState(parsedMarkup);
        } else {
          setMarkupPercentageState(0); 
        }
      } else {
        setMarkupPercentageState(0); 
      }

    } catch (e: any) {
      console.error("Error initializing exchange rates/markup from localStorage:", e);
      setError("Failed to load exchange rates or markup.");
      setExchangeRates([]);
      setMarkupPercentageState(0);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchAndSeedData();
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

  const setGlobalMarkup = (newMarkup: number) => { // Renamed from setGlobalBuffer
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

  const getRate = React.useCallback((fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number | null => {
    if (!CURRENCIES.includes(fromCurrency) || !CURRENCIES.includes(toCurrency)) {
      console.error("Invalid currency code provided to getRate", fromCurrency, toCurrency);
      return null;
    }
    if (fromCurrency === toCurrency) return 1;

    // Step 1: Convert fromCurrency to USD (REFERENCE_CURRENCY)
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

    // Step 2: Convert USD (REFERENCE_CURRENCY) to toCurrency
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

    const combinedBaseRate = rateFromToUSD * rateUSDToTo;

    // Apply markup if fromCurrency is THB or MYR and it's different from toCurrency
    if ((fromCurrency === 'THB' || fromCurrency === 'MYR') && fromCurrency !== toCurrency) {
      const markedUpRate = combinedBaseRate * (1 + (markupPercentage / 100));
      return Math.max(0.000001, markedUpRate);
    }

    return Math.max(0.000001, combinedBaseRate);
  }, [findBaseRate, markupPercentage, REFERENCE_CURRENCY]);

  return { 
    exchangeRates, 
    isLoading, 
    error, 
    addRate, 
    updateRate, 
    deleteRate, 
    getRate, 
    markupPercentage, // Renamed from bufferPercentage
    setGlobalMarkup,  // Renamed from setGlobalBuffer
    refreshRates: fetchAndSeedData
  };
}
