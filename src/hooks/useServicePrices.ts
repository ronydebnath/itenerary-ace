
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, CurrencyCode, SeasonalRate } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';

const DEFAULT_DEMO_SERVICE_PRICES: ServicePriceItem[] = [
  // == Transfers ==
  {
    id: generateGUID(), name: 'Suvarnabhumi Airport to Bangkok City Hotel', province: 'Bangkok', category: 'transfer', subCategory: 'Sedan',
    price1: 800, currency: 'THB', unitDescription: 'per vehicle (Sedan)', notes: 'Max 3 pax, 2 luggage'
  },
  {
    id: generateGUID(), name: 'Suvarnabhumi Airport to Pattaya Hotel', province: 'Bangkok', category: 'transfer', subCategory: 'Van',
    price1: 2500, currency: 'THB', unitDescription: 'per vehicle (Van)', notes: 'Max 8 pax, shared transfer to Pattaya start point'
  },
  {
    id: generateGUID(), name: 'Phuket Airport to Patong Beach', province: 'Phuket', category: 'transfer', subCategory: 'ticket',
    price1: 200, price2: 150, currency: 'THB', unitDescription: 'per person (Minibus Ticket)', notes: 'Shared minibus'
  },
  {
    id: generateGUID(), name: 'Chiang Mai Airport to Old City Hotel', province: 'Chiang Mai', category: 'transfer', subCategory: 'Sedan',
    price1: 300, currency: 'THB', unitDescription: 'per vehicle (Sedan)', notes: 'Fixed price'
  },
  {
    id: generateGUID(), name: 'Ferry: Phuket (Rassada Pier) to Phi Phi Island', province: 'Phuket', category: 'transfer', subCategory: 'ticket',
    price1: 600, price2: 500, currency: 'THB', unitDescription: 'per person (One-way)', notes: 'Standard ferry'
  },
  {
    id: generateGUID(), name: 'Ferry: Surat Thani (Donsak Pier) to Koh Samui (Nathon Pier)', province: 'Surat Thani (Koh Samui, Koh Phangan)', category: 'transfer', subCategory: 'ticket',
    price1: 150, price2: 100, currency: 'THB', unitDescription: 'per person (One-way)', notes: 'Raja Ferry / Seatran Ferry'
  },

  // == Activities ==
  {
    id: generateGUID(), name: 'Grand Palace & Emerald Buddha Tour', province: 'Bangkok', category: 'activity', subCategory: 'Guided Tour',
    price1: 1500, price2: 750, currency: 'THB', unitDescription: 'per person (Half Day)', notes: 'Includes guide, excludes entrance if separate'
  },
  {
    id: generateGUID(), name: 'Chao Phraya River Dinner Cruise', province: 'Bangkok', category: 'activity', subCategory: 'Cruise',
    price1: 1800, price2: 1200, currency: 'THB', unitDescription: 'per person', notes: 'Includes international buffet'
  },
  {
    id: generateGUID(), name: 'Elephant Sanctuary Visit', province: 'Chiang Mai', category: 'activity', subCategory: 'Ethical Tourism',
    price1: 2500, price2: 1800, currency: 'THB', unitDescription: 'per person (Full Day)', notes: 'Includes lunch, feeding, bathing'
  },
  {
    id: generateGUID(), name: 'Doi Suthep Temple & Hmong Village Tour', province: 'Chiang Mai', category: 'activity', subCategory: 'Cultural Tour',
    price1: 1200, price2: 800, currency: 'THB', unitDescription: 'per person (Half Day)', notes: 'Includes transport & guide'
  },
  {
    id: generateGUID(), name: 'Phi Phi Islands & Maya Bay Speedboat Tour', province: 'Phuket', category: 'activity', subCategory: 'Island Hopping',
    price1: 3000, price2: 2000, currency: 'THB', unitDescription: 'per person (Full Day)', notes: 'Includes lunch, snorkel gear, park fees where applicable'
  },
  {
    id: generateGUID(), name: 'Simon Cabaret Show Ticket', province: 'Phuket', category: 'activity', subCategory: 'Show/Entertainment',
    price1: 800, price2: 600, currency: 'THB', unitDescription: 'per person (Standard Seat)', notes: 'VIP seats extra'
  },
  {
    id: generateGUID(), name: 'Sanctuary of Truth Entrance Ticket', province: 'Pattaya (Chonburi)', category: 'activity', subCategory: 'Entrance Fee',
    price1: 500, price2: 250, currency: 'THB', unitDescription: 'per person'
  },
  {
    id: generateGUID(), name: 'Coral Island (Koh Larn) Day Trip', province: 'Pattaya (Chonburi)', category: 'activity', subCategory: 'Island Hopping',
    price1: 1200, price2: 900, currency: 'THB', unitDescription: 'per person', notes: 'Includes speedboat, lunch, basic water sports'
  },
  {
    id: generateGUID(), name: 'Krabi 4 Islands Tour by Longtail Boat', province: 'Krabi', category: 'activity', subCategory: 'Island Hopping',
    price1: 1000, price2: 700, currency: 'THB', unitDescription: 'per person', notes: 'Includes lunch, snorkel gear. Excludes National Park fee (~400 THB for foreigners)'
  },
  {
    id: generateGUID(), name: 'Ang Thong National Marine Park Tour', province: 'Surat Thani (Koh Samui, Koh Phangan)', category: 'activity', subCategory: 'Island Hopping',
    price1: 2200, price2: 1500, currency: 'THB', unitDescription: 'per person', notes: 'From Koh Samui/Phangan. Includes lunch, kayaking, snorkeling. Excludes park fee.'
  },

  // == Hotels ==
  {
    id: generateGUID(), name: 'Sukhumvit Comfort Hotel', province: 'Bangkok', category: 'hotel', subCategory: 'Standard Double',
    price1: 1500, price2: 500, currency: 'THB', unitDescription: 'per night (default)',
    seasonalRates: [
      { id: generateGUID(), startDate: '2024-12-01', endDate: '2025-02-28', roomRate: 2000, extraBedRate: 600 }, // Peak
      { id: generateGUID(), startDate: '2024-06-01', endDate: '2024-10-31', roomRate: 1200, extraBedRate: 400 }  // Low
    ], notes: '3-star, city center'
  },
  {
    id: generateGUID(), name: 'Lanna Boutique Resort', province: 'Chiang Mai', category: 'hotel', subCategory: 'Deluxe Room',
    price1: 2800, price2: 800, currency: 'THB', unitDescription: 'per night (default)',
    seasonalRates: [
      { id: generateGUID(), startDate: '2024-11-01', endDate: '2025-02-15', roomRate: 3500, extraBedRate: 1000 }, // Peak
      { id: generateGUID(), startDate: '2024-05-01', endDate: '2024-09-30', roomRate: 2200, extraBedRate: 600 }   // Low
    ], notes: '4-star, near Old City'
  },
  {
    id: generateGUID(), name: 'Patong Beachfront Villa', province: 'Phuket', category: 'hotel', subCategory: 'Ocean View Villa',
    price1: 7000, price2: 1500, currency: 'THB', unitDescription: 'per night (default)',
    seasonalRates: [
      { id: generateGUID(), startDate: '2024-12-15', endDate: '2025-03-31', roomRate: 9000, extraBedRate: 2000 }, // High
      { id: generateGUID(), startDate: '2024-05-01', endDate: '2024-10-31', roomRate: 5500, extraBedRate: 1200 }  // Low
    ], notes: '5-star, beachfront'
  },
  {
    id: generateGUID(), name: 'Jomtien Bay Hotel', province: 'Pattaya (Chonburi)', category: 'hotel', subCategory: 'Superior Room',
    price1: 1200, price2: 400, currency: 'THB', unitDescription: 'per night', notes: '3-star, near Jomtien beach, no complex seasonal rates for demo'
  },
  {
    id: generateGUID(), name: 'Ao Nang Cliff View Resort', province: 'Krabi', category: 'hotel', subCategory: 'Deluxe Garden View',
    price1: 2500, price2: 700, currency: 'THB', unitDescription: 'per night', notes: '4-star resort'
  },

  // == Meals ==
  {
    id: generateGUID(), name: 'Authentic Thai Set Dinner', province: 'Bangkok', category: 'meal', subCategory: 'Set Menu',
    price1: 700, price2: 400, currency: 'THB', unitDescription: 'per person', notes: 'At a mid-range restaurant'
  },
  {
    id: generateGUID(), name: 'Khantoke Dinner with Cultural Show', province: 'Chiang Mai', category: 'meal', subCategory: 'Buffet/Show',
    price1: 900, price2: 600, currency: 'THB', unitDescription: 'per person'
  },
  {
    id: generateGUID(), name: 'Seafood BBQ Buffet on the Beach', province: 'Phuket', category: 'meal', subCategory: 'Buffet',
    price1: 1200, price2: 700, currency: 'THB', unitDescription: 'per person'
  },
  {
    id: generateGUID(), name: 'Lunch Voucher at Tourist Restaurant', category: 'meal', subCategory: 'Voucher',
    price1: 350, price2: 250, currency: 'THB', unitDescription: 'per person', notes: 'Generic voucher for many locations'
  },
  
  // == Miscellaneous ==
  {
    id: generateGUID(), name: 'Thai SIM Card (7-day unlimited data)', category: 'misc', subCategory: 'Communication',
    price1: 299, currency: 'THB', unitDescription: 'per SIM card', notes: 'Tourist SIM'
  },
  {
    id: generateGUID(), name: 'Travel Insurance (Basic)', category: 'misc', subCategory: 'Service',
    price1: 150, currency: 'THB', unitDescription: 'per person, per day'
  },
  {
    id: generateGUID(), name: 'Shopping Mall Discount Booklet', province: 'Bangkok', category: 'misc', subCategory: 'Voucher',
    price1: 0, currency: 'THB', unitDescription: 'per booklet', notes: 'Free item, cost might be covered elsewhere'
  },
  {
    id: generateGUID(), name: 'Beach Umbrella & Mat Rental', province: 'Phuket', category: 'misc', subCategory: 'Rental',
    price1: 200, currency: 'THB', unitDescription: 'per day (set)'
  }
];


export function useServicePrices() {
  const [allServicePrices, setAllServicePrices] = React.useState<ServicePriceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const storedPricesString = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      if (storedPricesString) {
        const parsedPrices = JSON.parse(storedPricesString);
        // Basic validation to ensure it's an array. More robust validation could be added here if needed.
        if (Array.isArray(parsedPrices)) {
          setAllServicePrices(parsedPrices);
        } else {
          // If data is corrupted or not an array, initialize with demo data
          console.warn("Stored service prices are not an array. Initializing with demo data.");
          localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
          setAllServicePrices(DEFAULT_DEMO_SERVICE_PRICES);
        }
      } else {
        // No data found, initialize with demo data
        localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
        setAllServicePrices(DEFAULT_DEMO_SERVICE_PRICES);
      }
    } catch (error) {
      console.error("Failed to load or initialize service prices from localStorage:", error);
      // Fallback to demo data in case of any error during load/parse
      try {
        localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
      } catch (saveError) {
        console.error("Failed to save demo service prices to localStorage after load error:", saveError);
      }
      setAllServicePrices(DEFAULT_DEMO_SERVICE_PRICES);
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
        // For transfers, if subCategory is 'vehicle', it implies any non-'ticket' subCategory
        if (category === 'transfer' && subCategory === 'vehicle') {
          filtered = filtered.filter(service => service.subCategory !== 'ticket');
        } else {
          filtered = filtered.filter(service => service.subCategory === subCategory);
        }
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
