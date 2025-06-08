
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, CurrencyCode, SeasonalRate } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';

const DEFAULT_DEMO_SERVICE_PRICES: ServicePriceItem[] = [
  // == Bangkok - Transfers ==
  {
    id: generateGUID(), name: 'Suvarnabhumi Airport (BKK) to Bangkok City Hotel (Sedan)', province: 'Bangkok', category: 'transfer', subCategory: 'Sedan',
    price1: 1000, currency: 'THB', unitDescription: 'per vehicle', notes: 'Max 3 pax, 2 luggage', maxPassengers: 3
  },
  {
    id: generateGUID(), name: 'Suvarnabhumi Airport (BKK) to Bangkok City Hotel (Van)', province: 'Bangkok', category: 'transfer', subCategory: 'Van',
    price1: 1500, currency: 'THB', unitDescription: 'per vehicle', notes: 'Max 8 pax, 5 luggage', maxPassengers: 8
  },
  {
    id: generateGUID(), name: 'Don Mueang Airport (DMK) to Bangkok City Hotel (Van)', province: 'Bangkok', category: 'transfer', subCategory: 'Van',
    price1: 1200, currency: 'THB', unitDescription: 'per vehicle', notes: 'Max 8 pax', maxPassengers: 8
  },
  {
    id: generateGUID(), name: 'BTS Skytrain Day Pass', province: 'Bangkok', category: 'transfer', subCategory: 'ticket',
    price1: 150, currency: 'THB', unitDescription: 'per person', notes: 'Unlimited rides for 1 day'
  },

  // == Bangkok - Activities ==
  {
    id: generateGUID(), name: 'Grand Palace & Wat Phra Kaew Entrance', province: 'Bangkok', category: 'activity', subCategory: 'Entrance Fee',
    price1: 500, price2: 250, currency: 'THB', unitDescription: 'per person', notes: 'Child price for under 120cm'
  },
  {
    id: generateGUID(), name: 'Chao Phraya River Cruise (Evening with Dinner)', province: 'Bangkok', category: 'activity', subCategory: 'Cruise & Dinner',
    price1: 1800, price2: 1200, currency: 'THB', unitDescription: 'per person', notes: 'Includes international buffet'
  },
  {
    id: generateGUID(), name: 'Floating Markets Tour (Damnoen Saduak & Maeklong)', province: 'Bangkok', category: 'activity', subCategory: 'Guided Tour',
    price1: 1500, price2: 1000, currency: 'THB', unitDescription: 'per person (Half Day)', notes: 'Includes transport, boat ride'
  },
   {
    id: generateGUID(), name: 'Muay Thai Boxing Match (Rajadamnern Stadium)', province: 'Bangkok', category: 'activity', subCategory: 'Sports Event',
    price1: 2000, currency: 'THB', unitDescription: 'per person (Ringside)', notes: 'Cheaper seats available'
  },
  {
    id: generateGUID(), name: 'Thai Cooking Class (Half Day)', province: 'Bangkok', category: 'activity', subCategory: 'Workshop',
    price1: 1200, currency: 'THB', unitDescription: 'per person', notes: 'Includes market tour'
  },


  // == Bangkok - Hotels ==
  {
    id: generateGUID(), name: 'Riverside Luxury Hotel', province: 'Bangkok', category: 'hotel', subCategory: 'Deluxe River View',
    price1: 5000, price2: 1000, currency: 'THB', unitDescription: 'per night (default)',
    seasonalRates: [
      { id: generateGUID(), startDate: '2024-11-01', endDate: '2025-02-28', roomRate: 6500, extraBedRate: 1200 }, // Peak
      { id: generateGUID(), startDate: '2024-05-01', endDate: '2024-09-30', roomRate: 4000, extraBedRate: 800 }  // Low
    ], notes: '5-star, riverside location'
  },
  {
    id: generateGUID(), name: 'Sukhumvit Boutique Hotel', province: 'Bangkok', category: 'hotel', subCategory: 'Superior Room',
    price1: 2500, price2: 600, currency: 'THB', unitDescription: 'per night', notes: '4-star, near BTS Asok'
  },
  {
    id: generateGUID(), name: 'Khaosan Road Budget Guesthouse', province: 'Bangkok', category: 'hotel', subCategory: 'Standard Double (Fan)',
    price1: 600, price2: 0, currency: 'THB', unitDescription: 'per night', notes: 'Basic, shared bathroom options cheaper'
  },


  // == Bangkok - Meals ==
  {
    id: generateGUID(), name: 'Street Food Tour (Chinatown Evening)', province: 'Bangkok', category: 'meal', subCategory: 'Guided Food Tour',
    price1: 800, price2: 500, currency: 'THB', unitDescription: 'per person'
  },
  {
    id: generateGUID(), name: 'Hotel Buffet Lunch (International)', province: 'Bangkok', category: 'meal', subCategory: 'Buffet',
    price1: 900, price2: 450, currency: 'THB', unitDescription: 'per person'
  },
  {
    id: generateGUID(), name: 'Rooftop Bar Signature Cocktail', province: 'Bangkok', category: 'meal', subCategory: 'Drinks',
    price1: 450, currency: 'THB', unitDescription: 'per drink (average)'
  },
  {
    id: generateGUID(), name: 'Local Thai Restaurant Set Menu', province: 'Bangkok', category: 'meal', subCategory: 'Set Menu',
    price1: 350, price2: 200, currency: 'THB', unitDescription: 'per person'
  },


  // == Bangkok - Miscellaneous ==
  {
    id: generateGUID(), name: 'Thai Massage (Traditional, 1 hour)', province: 'Bangkok', category: 'misc', subCategory: 'Wellness',
    price1: 300, currency: 'THB', unitDescription: 'per person', costAssignment: 'perPerson'
  },
  {
    id: generateGUID(), name: 'Souvenir T-shirt (Chatuchak Market)', province: 'Bangkok', category: 'misc', subCategory: 'Shopping',
    price1: 250, currency: 'THB', unitDescription: 'per item', costAssignment: 'total'
  },
  {
    id: generateGUID(), name: 'Tuk-tuk Ride (Short Distance)', province: 'Bangkok', category: 'misc', subCategory: 'Local Transport',
    price1: 150, currency: 'THB', unitDescription: 'per ride (estimated)', costAssignment: 'total'
  },


  // == Pattaya - Transfers ==
  {
    id: generateGUID(), name: 'Bangkok Hotel to Pattaya Hotel (Van)', province: 'Pattaya (Chonburi)', category: 'transfer', subCategory: 'Van',
    price1: 2500, currency: 'THB', unitDescription: 'per vehicle', notes: 'One-way private transfer', maxPassengers: 8
  },
   {
    id: generateGUID(), name: 'Bangkok Hotel to Pattaya Hotel (Sedan)', province: 'Pattaya (Chonburi)', category: 'transfer', subCategory: 'Sedan',
    price1: 1800, currency: 'THB', unitDescription: 'per vehicle', notes: 'One-way private transfer', maxPassengers: 3
  },
  {
    id: generateGUID(), name: 'Pattaya Hotel to U-Tapao Airport (UTP) (Sedan)', province: 'Pattaya (Chonburi)', category: 'transfer', subCategory: 'Sedan',
    price1: 800, currency: 'THB', unitDescription: 'per vehicle', notes: 'Max 3 pax', maxPassengers: 3
  },
  {
    id: generateGUID(), name: 'Ferry to Koh Larn (Round Trip)', province: 'Pattaya (Chonburi)', category: 'transfer', subCategory: 'ticket',
    price1: 60, currency: 'THB', unitDescription: 'per person (Standard Ferry)', notes: 'Speedboat option available at higher price'
  },
   {
    id: generateGUID(), name: 'Speedboat to Koh Larn (Round Trip)', province: 'Pattaya (Chonburi)', category: 'transfer', subCategory: 'ticket',
    price1: 300, currency: 'THB', unitDescription: 'per person (Shared Speedboat)'
  },


  // == Pattaya - Activities ==
  {
    id: generateGUID(), name: 'Sanctuary of Truth Entrance', province: 'Pattaya (Chonburi)', category: 'activity', subCategory: 'Entrance Fee',
    price1: 500, price2: 250, currency: 'THB', unitDescription: 'per person'
  },
  {
    id: generateGUID(), name: 'Tiffany\'s Cabaret Show (VIP)', province: 'Pattaya (Chonburi)', category: 'activity', subCategory: 'Show/Entertainment',
    price1: 1200, price2: 1000, currency: 'THB', unitDescription: 'per person (VIP Seat)', notes: 'Standard seats cheaper'
  },
  {
    id: generateGUID(), name: 'Nong Nooch Tropical Garden Tour', province: 'Pattaya (Chonburi)', category: 'activity', subCategory: 'Garden & Show',
    price1: 800, price2: 600, currency: 'THB', unitDescription: 'per person', notes: 'Includes entrance and cultural show'
  },
  {
    id: generateGUID(), name: 'Coral Island (Koh Larn) Day Trip Package', province: 'Pattaya (Chonburi)', category: 'activity', subCategory: 'Island Hopping',
    price1: 1200, price2: 900, currency: 'THB', unitDescription: 'per person', notes: 'Includes speedboat, lunch, basic water sports'
  },
  {
    id: generateGUID(), name: 'Pattaya Underwater World', province: 'Pattaya (Chonburi)', category: 'activity', subCategory: 'Aquarium',
    price1: 500, price2: 300, currency: 'THB', unitDescription: 'per person'
  },

  // == Pattaya - Hotels ==
  {
    id: generateGUID(), name: 'Pattaya Beachfront Resort', province: 'Pattaya (Chonburi)', category: 'hotel', subCategory: 'Sea View Room',
    price1: 4000, price2: 800, currency: 'THB', unitDescription: 'per night (default)',
    seasonalRates: [
      { id: generateGUID(), startDate: '2024-12-01', endDate: '2025-03-31', roomRate: 5500, extraBedRate: 1000 }, // Peak
      { id: generateGUID(), startDate: '2024-06-01', endDate: '2024-10-31', roomRate: 3000, extraBedRate: 600 }  // Low
    ], notes: '4-star, on Beach Road'
  },
  {
    id: generateGUID(), name: 'Jomtien Family Hotel', province: 'Pattaya (Chonburi)', category: 'hotel', subCategory: 'Family Suite',
    price1: 3200, price2: 500, currency: 'THB', unitDescription: 'per night', notes: 'Good for families, pool'
  },
  {
    id: generateGUID(), name: 'Pattaya Central Guesthouse', province: 'Pattaya (Chonburi)', category: 'hotel', subCategory: 'Basic Double Room',
    price1: 800, price2: 200, currency: 'THB', unitDescription: 'per night', notes: 'Budget-friendly, no frills'
  },

  // == Pattaya - Meals ==
  {
    id: generateGUID(), name: 'Seafood Dinner at Beach Restaurant', province: 'Pattaya (Chonburi)', category: 'meal', subCategory: 'A La Carte/Set',
    price1: 1000, price2: 600, currency: 'THB', unitDescription: 'per person (average)', notes: 'Fresh seafood selection'
  },
  {
    id: generateGUID(), name: 'Walking Street Food Allowance', province: 'Pattaya (Chonburi)', category: 'meal', subCategory: 'Street Food',
    price1: 500, price2: 300, currency: 'THB', unitDescription: 'per person (estimated)'
  },
  {
    id: generateGUID(), name: 'Hotel Breakfast Buffet', province: 'Pattaya (Chonburi)', category: 'meal', subCategory: 'Buffet',
    price1: 400, price2: 200, currency: 'THB', unitDescription: 'per person'
  },


  // == Pattaya - Miscellaneous ==
  {
    id: generateGUID(), name: 'Jet Ski Rental (30 mins)', province: 'Pattaya (Chonburi)', category: 'misc', subCategory: 'Water Sport',
    price1: 1500, currency: 'THB', unitDescription: 'per jet ski', costAssignment: 'total'
  },
  {
    id: generateGUID(), name: 'Beach Chair & Umbrella Rental', province: 'Pattaya (Chonburi)', category: 'misc', subCategory: 'Rental',
    price1: 100, currency: 'THB', unitDescription: 'per set/day', costAssignment: 'total'
  },
  {
    id: generateGUID(), name: 'Pattaya Viewpoint Songthaew Ride', province: 'Pattaya (Chonburi)', category: 'misc', subCategory: 'Local Transport',
    price1: 50, currency: 'THB', unitDescription: 'per person/trip', costAssignment: 'perPerson'
  },


  // == General / Other Provinces (from previous demo data, adjusted or retained) ==
  {
    id: generateGUID(), name: 'Phuket Airport to Patong Beach (Minibus)', province: 'Phuket', category: 'transfer', subCategory: 'Minibus',
    price1: 1800, currency: 'THB', unitDescription: 'per vehicle', maxPassengers: 10
  },
  {
    id: generateGUID(), name: 'Chiang Mai Airport to Old City Hotel (Private Car)', province: 'Chiang Mai', category: 'transfer', subCategory: 'Sedan',
    price1: 300, currency: 'THB', unitDescription: 'per vehicle', maxPassengers: 3
  },
  {
    id: generateGUID(), name: 'Ferry: Phuket (Rassada Pier) to Phi Phi Island', province: 'Phuket', category: 'transfer', subCategory: 'ticket',
    price1: 600, price2: 500, currency: 'THB', unitDescription: 'per person (One-way Standard)'
  },
  {
    id: generateGUID(), name: 'Ferry: Surat Thani (Donsak) to Koh Samui (Nathon)', province: 'Surat Thani (Koh Samui, Koh Phangan)', category: 'transfer', subCategory: 'ticket',
    price1: 150, price2: 100, currency: 'THB', unitDescription: 'per person (One-way)'
  },
  {
    id: generateGUID(), name: 'Elephant Sanctuary Visit', province: 'Chiang Mai', category: 'activity', subCategory: 'Ethical Tourism',
    price1: 2500, price2: 1800, currency: 'THB', unitDescription: 'per person (Full Day)', notes: 'Incl. lunch, feeding, bathing'
  },
  {
    id: generateGUID(), name: 'Phi Phi Islands & Maya Bay Speedboat Tour', province: 'Phuket', category: 'activity', subCategory: 'Island Hopping',
    price1: 3000, price2: 2000, currency: 'THB', unitDescription: 'per person (Full Day)', notes: 'Incl. lunch, snorkel gear'
  },
  {
    id: generateGUID(), name: 'Lanna Boutique Resort', province: 'Chiang Mai', category: 'hotel', subCategory: 'Deluxe Room',
    price1: 2800, price2: 800, currency: 'THB', unitDescription: 'per night (default)',
    seasonalRates: [
      { id: generateGUID(), startDate: '2024-11-01', endDate: '2025-02-15', roomRate: 3500, extraBedRate: 1000 },
      { id: generateGUID(), startDate: '2024-05-01', endDate: '2024-09-30', roomRate: 2200, extraBedRate: 600 }
    ], notes: '4-star, near Old City'
  },
  {
    id: generateGUID(), name: 'Patong Beachfront Villa', province: 'Phuket', category: 'hotel', subCategory: 'Ocean View Villa',
    price1: 7000, price2: 1500, currency: 'THB', unitDescription: 'per night (default)',
    seasonalRates: [
      { id: generateGUID(), startDate: '2024-12-15', endDate: '2025-03-31', roomRate: 9000, extraBedRate: 2000 },
      { id: generateGUID(), startDate: '2024-05-01', endDate: '2024-10-31', roomRate: 5500, extraBedRate: 1200 }
    ], notes: '5-star, beachfront'
  },
  {
    id: generateGUID(), name: 'Khantoke Dinner with Cultural Show', province: 'Chiang Mai', category: 'meal', subCategory: 'Buffet/Show',
    price1: 900, price2: 600, currency: 'THB', unitDescription: 'per person'
  },
  {
    id: generateGUID(), name: 'Thai SIM Card (7-day unlimited data)', category: 'misc', subCategory: 'Communication',
    price1: 299, currency: 'THB', unitDescription: 'per SIM card', costAssignment: 'total'
  },
  {
    id: generateGUID(), name: 'Travel Insurance (Basic, 7 days)', category: 'misc', subCategory: 'Service',
    price1: 500, currency: 'THB', unitDescription: 'per person', costAssignment: 'perPerson'
  }
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
          const validatedPrices = parsedPrices.filter(p => p.id && p.name && p.category && typeof p.price1 === 'number' && p.currency);
          if (validatedPrices.length > 0) {
            pricesToSet = validatedPrices;
          } else {
            pricesToSet = DEFAULT_DEMO_SERVICE_PRICES;
            localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
            console.info("Stored service prices were empty or invalid. Initializing with demo data.");
          }
        } else {
          pricesToSet = DEFAULT_DEMO_SERVICE_PRICES;
          localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
          console.info("Stored service prices were not a valid array or empty. Initializing with demo data.");
        }
      } else {
        pricesToSet = DEFAULT_DEMO_SERVICE_PRICES;
        localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
        console.info("No service prices found in localStorage. Initializing with demo data.");
      }
    } catch (error) {
      console.error("Failed to load or initialize service prices from localStorage:", error);
      pricesToSet = DEFAULT_DEMO_SERVICE_PRICES;
      try {
        localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
      } catch (saveError) {
        console.error("Failed to save demo service prices to localStorage after load error:", saveError);
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
      if (subCategory) {
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

