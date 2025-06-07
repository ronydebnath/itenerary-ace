
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType } from '@/types/itinerary';

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';

export function useServicePrices() {
  const [allServicePrices, setAllServicePrices] = React.useState<ServicePriceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const storedPrices = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      if (storedPrices) {
        setAllServicePrices(JSON.parse(storedPrices));
      }
    } catch (error) {
      console.error("Failed to load service prices from localStorage:", error);
    }
    setIsLoading(false);
  }, []);

  const getServicePrices = React.useCallback(
    (category?: ItineraryItemType, subCategory?: string): ServicePriceItem[] => {
      if (isLoading) return [];
      let filtered = allServicePrices;
      if (category) {
        filtered = filtered.filter(service => service.category === category);
      }
      if (subCategory) {
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
