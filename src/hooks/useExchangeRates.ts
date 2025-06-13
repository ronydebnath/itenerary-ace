
import * as React from 'react';
import type { ExchangeRate, CurrencyCode } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useToast } from './use-toast';

const EXCHANGE_RATES_STORAGE_KEY = 'itineraryAceExchangeRates';

const DEFAULT_RATES_DATA: Omit<ExchangeRate, 'id' | 'updatedAt'>[] = [
  { fromCurrency: "USD", toCurrency: "THB", rate: 36.50 },
  { fromCurrency: "EUR", toCurrency: "THB", rate: 39.20 },
  { fromCurrency: "GBP", toCurrency: "THB", rate: 45.80 },
  { fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 },
  { fromCurrency: "USD", toCurrency: "JPY", rate: 157.00 },
  { fromCurrency: "THB", toCurrency: "MYR", rate: 0.125 },
  { fromCurrency: "THB", toCurrency: "SGD", rate: 0.037 },
  { fromCurrency: "THB", toCurrency: "VND", rate: 680 },
];

export function useExchangeRates() {
  const [exchangeRates, setExchangeRates] = React.useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const fetchAndSeedRates = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const storedRatesString = localStorage.getItem(EXCHANGE_RATES_STORAGE_KEY);
      let ratesToSet: ExchangeRate[] = [];
      if (storedRatesString) {
        try {
          ratesToSet = JSON.parse(storedRatesString);
          // Add/Update defaults if not present or if structure changed
          DEFAULT_RATES_DATA.forEach(defaultRate => {
            const existing = ratesToSet.find(r => r.fromCurrency === defaultRate.fromCurrency && r.toCurrency === defaultRate.toCurrency);
            if (!existing) {
              ratesToSet.push({ ...defaultRate, id: generateGUID(), updatedAt: new Date().toISOString() });
            } else {
              // Optionally update rate if it's a default pair to keep it fresh,
              // but for user-managed rates, this might be undesirable. For now, only add if missing.
            }
          });

        } catch (parseError) {
          console.warn("Error parsing exchange rates from localStorage, seeding defaults:", parseError);
          localStorage.removeItem(EXCHANGE_RATES_STORAGE_KEY); // Clear corrupted data
          ratesToSet = DEFAULT_RATES_DATA.map(rate => ({
            ...rate,
            id: generateGUID(),
            updatedAt: new Date().toISOString(),
          }));
        }
      } else {
        ratesToSet = DEFAULT_RATES_DATA.map(rate => ({
          ...rate,
          id: generateGUID(),
          updatedAt: new Date().toISOString(),
        }));
      }
      localStorage.setItem(EXCHANGE_RATES_STORAGE_KEY, JSON.stringify(ratesToSet));
      setExchangeRates(ratesToSet.sort((a,b) => `${a.fromCurrency}-${a.toCurrency}`.localeCompare(`${b.fromCurrency}-${b.toCurrency}`)));
    } catch (e: any) {
      console.error("Error initializing exchange rates from localStorage:", e);
      setError("Failed to load exchange rates.");
      setExchangeRates([]);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchAndSeedRates();
  }, [fetchAndSeedRates]);

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
      ...newRateData,
      id: generateGUID(),
      updatedAt: new Date().toISOString(),
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

  const getRate = (fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number | null => {
    if (fromCurrency === toCurrency) return 1;

    const directRate = exchangeRates.find(
      r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );
    if (directRate) return directRate.rate;

    const inverseRate = exchangeRates.find(
      r => r.fromCurrency === toCurrency && r.toCurrency === fromCurrency
    );
    if (inverseRate && inverseRate.rate !== 0) return 1 / inverseRate.rate;

    return null; // Rate not found
  };

  return { exchangeRates, isLoading, error, addRate, updateRate, deleteRate, getRate, refreshRates: fetchAndSeedRates };
}
