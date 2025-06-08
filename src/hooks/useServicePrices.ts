
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, CurrencyCode, OldSeasonalRate, HotelDefinition, HotelRoomTypeDefinition, RoomTypeSeasonalPrice } from '@/types/itinerary';
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


  // == Bangkok - Hotels (using hotelDetails) ==
  {
    id: generateGUID(), name: 'Riverside Luxury Hotel', province: 'Bangkok', category: 'hotel', currency: 'THB', unitDescription: 'per night',
    notes: '5-star, riverside location',
    hotelDetails: {
      id: generateGUID(), name: 'Riverside Luxury Hotel', province: 'Bangkok',
      roomTypes: [
        {
          id: generateGUID(), name: 'Deluxe River View', characteristics: [],
          seasonalPrices: [
            { id: generateGUID(), startDate: '2024-11-01', endDate: '2025-02-28', rate: 6500, extraBedAllowed: true, extraBedRate: 1200 },
            { id: generateGUID(), startDate: '2024-05-01', endDate: '2024-09-30', rate: 4000, extraBedAllowed: true, extraBedRate: 800 }
          ]
        },
        {
          id: generateGUID(), name: 'Standard City View', characteristics: [],
          seasonalPrices: [
            { id: generateGUID(), startDate: '2024-11-01', endDate: '2025-02-28', rate: 5000, extraBedAllowed: false },
            { id: generateGUID(), startDate: '2024-05-01', endDate: '2024-09-30', rate: 3200, extraBedAllowed: false }
          ]
        }
      ]
    }
  },
  {
    id: generateGUID(), name: 'Sukhumvit Boutique Hotel', province: 'Bangkok', category: 'hotel', currency: 'THB', unitDescription: 'per night',
    notes: '4-star, near BTS Asok',
    hotelDetails: {
      id: generateGUID(), name: 'Sukhumvit Boutique Hotel', province: 'Bangkok',
      roomTypes: [
        {
          id: generateGUID(), name: 'Superior Room', characteristics: [],
          seasonalPrices: [
            { id: generateGUID(), startDate: '2024-01-01', endDate: '2024-12-31', rate: 2500, extraBedAllowed: true, extraBedRate: 600 }
          ]
        }
      ]
    }
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

  // == Pattaya - Hotels (using hotelDetails) ==
  {
    id: generateGUID(), name: 'Pattaya Beachfront Resort', province: 'Pattaya (Chonburi)', category: 'hotel', currency: 'THB', unitDescription: 'per night',
    notes: '4-star, on Beach Road',
    hotelDetails: {
        id: generateGUID(), name: 'Pattaya Beachfront Resort', province: 'Pattaya (Chonburi)',
        roomTypes: [
            {
                id: generateGUID(), name: 'Sea View Room', characteristics: [],
                seasonalPrices: [
                    { id: generateGUID(), startDate: '2024-12-01', endDate: '2025-03-31', rate: 5500, extraBedAllowed: true, extraBedRate: 1000 },
                    { id: generateGUID(), startDate: '2024-06-01', endDate: '2024-10-31', rate: 3000, extraBedAllowed: true, extraBedRate: 600 }
                ]
            },
            {
                id: generateGUID(), name: 'Garden View Bungalow', characteristics: [],
                seasonalPrices: [
                    { id: generateGUID(), startDate: '2024-12-01', endDate: '2025-03-31', rate: 4800, extraBedAllowed: false },
                    { id: generateGUID(), startDate: '2024-06-01', endDate: '2024-10-31', rate: 2500, extraBedAllowed: false }
                ]
            }
        ]
    }
  },

  // == Pattaya - Meals ==
  {
    id: generateGUID(), name: 'Seafood Dinner at Beach Restaurant', province: 'Pattaya (Chonburi)', category: 'meal', subCategory: 'A La Carte/Set',
    price1: 1000, price2: 600, currency: 'THB', unitDescription: 'per person (average)', notes: 'Fresh seafood selection'
  },

  // == General / Other Provinces ==
  {
    id: generateGUID(), name: 'Phuket Airport to Patong Beach (Minibus)', province: 'Phuket', category: 'transfer', subCategory: 'Minibus',
    price1: 1800, currency: 'THB', unitDescription: 'per vehicle', maxPassengers: 10
  },
  {
    id: generateGUID(), name: 'Chiang Mai Airport to Old City Hotel (Private Car)', province: 'Chiang Mai', category: 'transfer', subCategory: 'Sedan',
    price1: 300, currency: 'THB', unitDescription: 'per vehicle', maxPassengers: 3
  },
  {
    id: generateGUID(), name: 'Elephant Sanctuary Visit', province: 'Chiang Mai', category: 'activity', subCategory: 'Ethical Tourism',
    price1: 2500, price2: 1800, currency: 'THB', unitDescription: 'per person (Full Day)', notes: 'Incl. lunch, feeding, bathing'
  },
  {
    id: generateGUID(), name: 'Lanna Boutique Resort', province: 'Chiang Mai', category: 'hotel', currency: 'THB', unitDescription: 'per night',
    notes: '4-star, near Old City',
    hotelDetails: {
      id: generateGUID(), name: 'Lanna Boutique Resort', province: 'Chiang Mai',
      roomTypes: [
        {
          id: generateGUID(), name: 'Deluxe Room', characteristics: [],
          seasonalPrices: [
            { id: generateGUID(), startDate: '2024-11-01', endDate: '2025-02-15', rate: 3500, extraBedAllowed: true, extraBedRate: 1000 },
            { id: generateGUID(), startDate: '2024-05-01', endDate: '2024-09-30', rate: 2200, extraBedAllowed: true, extraBedRate: 600 }
          ]
        }
      ]
    }
  },
  {
    id: generateGUID(), name: 'Khantoke Dinner with Cultural Show', province: 'Chiang Mai', category: 'meal', subCategory: 'Buffet/Show',
    price1: 900, price2: 600, currency: 'THB', unitDescription: 'per person'
  },
  {
    id: generateGUID(), name: 'Thai SIM Card (7-day unlimited data)', category: 'misc', subCategory: 'Communication',
    price1: 299, currency: 'THB', unitDescription: 'per SIM card', costAssignment: 'total'
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
          // Validate essential fields for all items, and hotelDetails if category is hotel
          const validatedPrices = parsedPrices.filter(p => {
            const basicValid = p.id && p.name && p.category && p.currency;
            if (!basicValid) return false;
            if (p.category === 'hotel') {
              return p.hotelDetails && p.hotelDetails.id && p.hotelDetails.name && Array.isArray(p.hotelDetails.roomTypes);
            }
            return typeof p.price1 === 'number'; // For non-hotels, price1 is expected
          });

          if (validatedPrices.length > 0) {
            pricesToSet = validatedPrices;
          } else {
            pricesToSet = DEFAULT_DEMO_SERVICE_PRICES;
            localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
          }
        } else {
          pricesToSet = DEFAULT_DEMO_SERVICE_PRICES;
          localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
        }
      } else {
        pricesToSet = DEFAULT_DEMO_SERVICE_PRICES;
        localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
      }
    } catch (error) {
      console.error("Failed to load or initialize service prices from localStorage:", error);
      pricesToSet = DEFAULT_DEMO_SERVICE_PRICES; // Fallback to demo
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
          // For 'vehicle' transfers, we want services where subCategory is NOT 'ticket'
          // (as 'ticket' is the explicit subCategory for ticket-based transfers)
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
