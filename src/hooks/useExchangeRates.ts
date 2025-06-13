
import * as React from 'react';
import type { ExchangeRate, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary'; // Import CURRENCIES
import { generateGUID } from '@/lib/utils';
import { useToast } from './use-toast';

const EXCHANGE_RATES_STORAGE_KEY = 'itineraryAceExchangeRates';
const EXCHANGE_BUFFER_STORAGE_KEY = 'itineraryAceExchangeBuffer';
const REFERENCE_CURRENCY: CurrencyCode = "USD";

const DEFAULT_RATES_DATA: Omit<ExchangeRate, 'id' | 'updatedAt'>[] = [
  { fromCurrency: "USD", toCurrency: "THB", rate: 36.50 },
  { fromCurrency: "EUR", toCurrency: "THB", rate: 39.20 },
  { fromCurrency: "GBP", toCurrency: "THB", rate: 45.80 },
  { fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 },
  { fromCurrency: "USD", toCurrency: "GBP", rate: 0.79 }, // Added for better USD hub
  { fromCurrency: "USD", toCurrency: "JPY", rate: 157.00 },
  { fromCurrency: "THB", toCurrency: "MYR", rate: 0.125 },
  { fromCurrency: "THB", toCurrency: "SGD", rate: 0.037 },
  { fromCurrency: "THB", toCurrency: "VND", rate: 680 },
];

export function useExchangeRates() {
  const [exchangeRates, setExchangeRates] = React.useState<ExchangeRate[]>([]);
  const [bufferPercentage, setBufferPercentageState] = React.useState<number>(0);
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
          // Ensure all default rates are present, add if missing
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

      // Load Buffer
      const storedBuffer = localStorage.getItem(EXCHANGE_BUFFER_STORAGE_KEY);
      if (storedBuffer) {
        const parsedBuffer = parseFloat(storedBuffer);
        if (!isNaN(parsedBuffer) && parsedBuffer >= 0) {
          setBufferPercentageState(parsedBuffer);
        } else {
          setBufferPercentageState(0); 
        }
      } else {
        setBufferPercentageState(0); 
      }

    } catch (e: any) {
      console.error("Error initializing exchange rates/buffer from localStorage:", e);
      setError("Failed to load exchange rates or buffer.");
      setExchangeRates([]);
      setBufferPercentageState(0);
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

  const setGlobalBuffer = (newBuffer: number) => {
    if (isNaN(newBuffer) || newBuffer < 0) {
      toast({ title: "Invalid Buffer", description: "Buffer percentage must be a non-negative number.", variant: "destructive"});
      return;
    }
    try {
      localStorage.setItem(EXCHANGE_BUFFER_STORAGE_KEY, String(newBuffer));
      setBufferPercentageState(newBuffer);
      toast({ title: "Success", description: `Conversion buffer set to ${newBuffer}%.` });
    } catch (e: any) {
      console.error("Error saving buffer to localStorage:", e);
      toast({ title: "Error Setting Buffer", description: e.message, variant: "destructive" });
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

  // Internal helper to find a base rate (direct or inverse) without buffer or intermediaries
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
    
    let baseRate = findBaseRate(fromCurrency, toCurrency);

    if (baseRate === null) {
      // Attempt conversion via REFERENCE_CURRENCY if not already involving it
      if (fromCurrency !== REFERENCE_CURRENCY && toCurrency !== REFERENCE_CURRENCY) {
        const rateFromToRef = findBaseRate(fromCurrency, REFERENCE_CURRENCY);
        const rateRefToTo = findBaseRate(REFERENCE_CURRENCY, toCurrency);

        if (rateFromToRef !== null && rateRefToTo !== null) {
          baseRate = rateFromToRef * rateRefToTo;
        }
      }
    }

    if (baseRate === null) return null;

    // Apply buffer: user gets less of the target currency
    const effectiveRate = baseRate * (1 - (bufferPercentage / 100));
    return Math.max(0.000001, effectiveRate); // Prevent zero or negative rates
  }, [findBaseRate, bufferPercentage]);

  return { 
    exchangeRates, 
    isLoading, 
    error, 
    addRate, 
    updateRate, 
    deleteRate, 
    getRate, 
    bufferPercentage,
    setGlobalBuffer,
    refreshRates: fetchAndSeedData
  };
}
