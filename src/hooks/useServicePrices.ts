
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, CurrencyCode, HotelDefinition, ActivityPackageDefinition, SurchargePeriod, VehicleOption } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';

const DEFAULT_DEMO_SERVICE_PRICES: ServicePriceItem[] = [
  // All demo data removed
];


export function useServicePrices() {
  const [allServicePrices, setAllServicePrices] = React.useState<ServicePriceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let pricesToSet: ServicePriceItem[] = [];
    try {
      const storedPricesString = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      if (storedPricesString) {
        const parsedPrices = JSON.parse(storedPricesString);
        if (Array.isArray(parsedPrices) && parsedPrices.length > 0) {
          const validatedPrices = parsedPrices.filter(p => {
            const basicValid = p.id && p.name && p.category && p.currency;
            if (!basicValid) return false;
            
            if (p.category === 'hotel') {
              const hd = p.hotelDetails as HotelDefinition | undefined;
              return hd && hd.id && hd.name && Array.isArray(hd.roomTypes) &&
                     hd.roomTypes.every((rt: any) => rt.id && rt.name && Array.isArray(rt.seasonalPrices));
            }
            if (p.category === 'activity') {
              if (p.activityPackages && p.activityPackages.length > 0) {
                return Array.isArray(p.activityPackages) && p.activityPackages.every((ap: any) => ap.id && ap.name && typeof ap.price1 === 'number');
              }
              return typeof p.price1 === 'number'; // For simple activities without packages
            }
            if (p.category === 'transfer') {
                if (p.transferMode === 'vehicle') {
                    return Array.isArray(p.vehicleOptions) && p.vehicleOptions.length > 0 &&
                           p.vehicleOptions.every((vo: any) => vo.id && vo.vehicleType && typeof vo.price === 'number' && typeof vo.maxPassengers === 'number');
                }
                // For ticket mode or if transferMode is somehow undefined (should default to ticket)
                return typeof p.price1 === 'number'; 
            }
            // For Meal, Misc
            return typeof p.price1 === 'number'; 
          });

          if (validatedPrices.length > 0) {
            pricesToSet = validatedPrices;
          } else {
            pricesToSet = DEFAULT_DEMO_SERVICE_PRICES; 
            if (DEFAULT_DEMO_SERVICE_PRICES.length > 0) {
                 localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
            } else {
                 localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY); 
            }
          }
        } else {
          pricesToSet = DEFAULT_DEMO_SERVICE_PRICES;
          if (DEFAULT_DEMO_SERVICE_PRICES.length > 0) {
            localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
          } else {
            localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY);
          }
        }
      } else {
        pricesToSet = DEFAULT_DEMO_SERVICE_PRICES;
        if (DEFAULT_DEMO_SERVICE_PRICES.length > 0) {
          localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
        }
      }
    } catch (error) {
      console.error("Failed to load or initialize service prices from localStorage:", error);
      pricesToSet = DEFAULT_DEMO_SERVICE_PRICES; 
      if (DEFAULT_DEMO_SERVICE_PRICES.length > 0) {
        try {
          localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
        } catch (saveError) {
          console.error("Failed to save demo service prices to localStorage after load error:", saveError);
        }
      } else {
         localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY);
      }
    }
    setAllServicePrices(pricesToSet);
    setIsLoading(false);
  }, []);

  const getServicePrices = React.useCallback(
    (category?: ItineraryItemType, subCategory?: string): ServicePriceItem[] => {
      if (isLoading) return [];
      let filtered = allServicePrices;
      if (category) {
        filtered = filtered.filter(service => service.category === category);
      }
      if (subCategory && category !== 'transfer') { // subCategory not generally used for filtering transfers with vehicleOptions
          filtered = filtered.filter(service => service.subCategory === subCategory);
      }
      return filtered;
    },
    [allServicePrices, isLoading]
  );

  const getServicePriceById = React.useCallback(
    (id: string): ServicePriceItem | undefined => {
      if (isLoading) return undefined;
      return allServicePrices.find(service => service.id === id);
    },
    [allServicePrices, isLoading]
  );

  return { isLoading, allServicePrices, getServicePrices, getServicePriceById };
}
