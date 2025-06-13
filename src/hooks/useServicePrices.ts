
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, HotelDefinition, CountryItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries } from './useCountries'; 

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';
// currentYear, DEFAULT_THAI_COUNTRY_NAME, DEFAULT_MALAYSIAN_COUNTRY_NAME removed
// createDemoHotelDefinitionsForServices and createDemoServicePrices functions removed

export function useServicePrices() {
  const { countries, isLoading: isLoadingCountries, getCountryByName } = useCountries();
  const [allServicePrices, setAllServicePrices] = React.useState<ServicePriceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isLoadingCountries) return;

    let pricesToSet: ServicePriceItem[] = [];
    // DEMO_SERVICE_PRICES creation logic removed

    try {
      const storedPricesString = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      if (storedPricesString) {
        const parsedPrices = JSON.parse(storedPricesString) as ServicePriceItem[];
        if (Array.isArray(parsedPrices)) { // Simplified check
          const validatedPrices = parsedPrices.filter(p => p.id && p.name && p.category && p.currency && (p.category === 'hotel' ? (p.hotelDetails && p.hotelDetails.countryId) : true));
          pricesToSet = validatedPrices;
        } else {
          // If not an array or parsing failed, start with empty
          pricesToSet = [];
          localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY);
        }
      } else {
        // No stored prices, start empty
        pricesToSet = [];
      }
    } catch (error) {
      console.error("Failed to load or initialize service prices:", error);
      pricesToSet = []; // Start empty on error
      localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY); // Clear potentially corrupted data
    }
    setAllServicePrices(pricesToSet);
    setIsLoading(false);
  }, [isLoadingCountries, getCountryByName, countries]);

  const getServicePricesFiltered = React.useCallback(
    (filters: { category?: ItineraryItemType; countryId?: string; provinceName?: string; currency?: string } = {}): ServicePriceItem[] => {
      if (isLoading) return [];
      return allServicePrices.filter(service => {
        if (filters.category && service.category !== filters.category) return false;
        
        if (filters.countryId) {
            if (service.category === 'hotel' && (!service.hotelDetails || service.hotelDetails.countryId !== filters.countryId)) return false;
            if (service.category !== 'hotel' && service.category !== 'misc' && service.countryId && service.countryId !== filters.countryId) return false;
            if (service.category !== 'hotel' && service.category !== 'misc' && !service.countryId) return false;
        }
        
        if (filters.provinceName) {
            if (service.category === 'misc' && service.province !== filters.provinceName && service.province) return false;
            if (service.category !== 'misc' && service.province !== filters.provinceName) return false;
        }

        if (filters.currency && service.currency !== filters.currency) return false;
        return true;
      }).sort((a,b) => a.name.localeCompare(b.name));
    },
    [allServicePrices, isLoading]
  );
  
  const getServicePriceById = React.useCallback(
    (id: string): ServicePriceItem | undefined => {
      if (isLoading) return undefined;
      return allServicePrices.find(sp => sp.id === id);
    }, [allServicePrices, isLoading]);

  return { isLoading, allServicePrices, getServicePrices: getServicePricesFiltered, getServicePriceById };
}
