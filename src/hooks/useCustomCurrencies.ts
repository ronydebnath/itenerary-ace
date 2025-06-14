
/**
 * @fileoverview This custom React hook manages a list of custom currency codes.
 * It stores custom codes in localStorage and provides functions to add, delete,
 * and retrieve all available currencies (system defaults + custom).
 *
 * @bangla এই কাস্টম রিঅ্যাক্ট হুক কাস্টম কারেন্সি কোডগুলির একটি তালিকা পরিচালনা করে।
 * এটি localStorage-এ কাস্টম কোডগুলি সংরক্ষণ করে এবং সিস্টেম ডিফল্ট ও কাস্টম কারেন্সিগুলি
 * (সিস্টেম ডিফল্ট + কাস্টম) যুক্ত, মুছে ফেলা এবং পুনরুদ্ধার করার ফাংশন সরবরাহ করে।
 */
import * as React from 'react';
import { CURRENCIES, type CurrencyCode, type ManagedCurrency } from '@/types/itinerary'; // CURRENCIES are system defaults
import { useToast } from './use-toast';

const CUSTOM_CURRENCIES_STORAGE_KEY = 'itineraryAce_customCurrencies';

export function useCustomCurrencies() {
  const [customCurrencies, setCustomCurrencies] = React.useState<CurrencyCode[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchAndSetCurrencies = React.useCallback(() => {
    setIsLoading(true);
    try {
      const storedCustom = localStorage.getItem(CUSTOM_CURRENCIES_STORAGE_KEY);
      if (storedCustom) {
        const parsedCustom = JSON.parse(storedCustom) as CurrencyCode[];
        // Basic validation: ensure it's an array of strings
        if (Array.isArray(parsedCustom) && parsedCustom.every(c => typeof c === 'string' && c.length === 3)) {
          setCustomCurrencies(parsedCustom.sort());
        } else {
          console.warn("Invalid custom currencies found in localStorage, resetting.");
          localStorage.removeItem(CUSTOM_CURRENCIES_STORAGE_KEY);
          setCustomCurrencies([]);
        }
      } else {
        setCustomCurrencies([]);
      }
    } catch (error) {
      console.error("Error loading custom currencies from localStorage:", error);
      setCustomCurrencies([]);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchAndSetCurrencies();
  }, [fetchAndSetCurrencies]);

  const getAllManagedCurrencies = React.useCallback((): ManagedCurrency[] => {
    const systemDefaults: ManagedCurrency[] = CURRENCIES.map(code => ({ code, isCustom: false }));
    const customManaged: ManagedCurrency[] = customCurrencies.map(code => ({ code, isCustom: true }));
    
    const combined = [...systemDefaults, ...customManaged];
    
    // Deduplicate, preferring system defaults if codes clash (shouldn't happen if validation is good)
    const uniqueMap = new Map<CurrencyCode, ManagedCurrency>();
    combined.forEach(mc => {
      if (!uniqueMap.has(mc.code) || (uniqueMap.has(mc.code) && !mc.isCustom)) {
        uniqueMap.set(mc.code, mc);
      }
    });
    
    return Array.from(uniqueMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [customCurrencies]);
  
  const getAllCurrencyCodes = React.useCallback((): CurrencyCode[] => {
    return getAllManagedCurrencies().map(mc => mc.code);
  }, [getAllManagedCurrencies]);


  const addCustomCurrency = async (code: CurrencyCode) => {
    if (!code || code.trim().length !== 3) {
      toast({ title: "Invalid Code", description: "Currency code must be 3 letters.", variant: "destructive" });
      return false;
    }
    const upperCode = code.toUpperCase();
    if (CURRENCIES.includes(upperCode as any) || customCurrencies.includes(upperCode)) {
      toast({ title: "Already Exists", description: `Currency code "${upperCode}" already exists.`, variant: "default" });
      return false;
    }

    setIsLoading(true);
    const newCustomCurrencies = [...customCurrencies, upperCode].sort();
    try {
      localStorage.setItem(CUSTOM_CURRENCIES_STORAGE_KEY, JSON.stringify(newCustomCurrencies));
      setCustomCurrencies(newCustomCurrencies);
      toast({ title: "Currency Added", description: `Currency "${upperCode}" added successfully.` });
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error saving custom currency:", error);
      toast({ title: "Error", description: "Could not save custom currency.", variant: "destructive" });
      setIsLoading(false);
      return false;
    }
  };

  const deleteCustomCurrency = async (codeToDelete: CurrencyCode) => {
    if (!customCurrencies.includes(codeToDelete)) {
      toast({ title: "Not Found", description: `Custom currency "${codeToDelete}" not found.`, variant: "default" });
      return;
    }
    setIsLoading(true);
    const newCustomCurrencies = customCurrencies.filter(code => code !== codeToDelete);
    try {
      localStorage.setItem(CUSTOM_CURRENCIES_STORAGE_KEY, JSON.stringify(newCustomCurrencies));
      setCustomCurrencies(newCustomCurrencies);
      toast({ title: "Currency Deleted", description: `Custom currency "${codeToDelete}" deleted.` });
    } catch (error) {
      console.error("Error deleting custom currency:", error);
      toast({ title: "Error", description: "Could not delete custom currency.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return {
    isLoading,
    customCurrencies,
    systemCurrencies: CURRENCIES,
    getAllManagedCurrencies,
    getAllCurrencyCodes,
    addCustomCurrency,
    deleteCustomCurrency,
    refreshCustomCurrencies: fetchAndSetCurrencies,
  };
}
