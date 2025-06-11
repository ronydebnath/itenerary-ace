
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, CurrencyCode, HotelDefinition, ActivityPackageDefinition, SurchargePeriod, VehicleOption } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';

const currentYear = new Date().getFullYear();

const DEFAULT_DEMO_SERVICE_PRICES: ServicePriceItem[] = [
  // --- Bangkok Services ---
  {
    id: generateGUID(),
    name: "BKK Airport to Bangkok Hotel",
    province: "Bangkok",
    category: "transfer",
    transferMode: "vehicle",
    vehicleOptions: [
      { id: generateGUID(), vehicleType: "Sedan", price: 1000, maxPassengers: 3, notes: "Comfortable for 2-3 passengers with luggage." },
      { id: generateGUID(), vehicleType: "MPV", price: 1200, maxPassengers: 4, notes: "Good for small families." },
      { id: generateGUID(), vehicleType: "Van", price: 1500, maxPassengers: 8, notes: "Spacious for larger groups or extra luggage." }
    ],
    surchargePeriods: [
      { id: generateGUID(), name: "New Year Peak", startDate: `${currentYear}-12-28`, endDate: `${currentYear + 1}-01-03`, surchargeAmount: 300 },
      { id: generateGUID(), name: "Songkran Festival", startDate: `${currentYear}-04-12`, endDate: `${currentYear}-04-16`, surchargeAmount: 200 }
    ],
    currency: "THB",
    unitDescription: "per service (one way)",
    notes: "Meet & Greet at arrivals. Includes tolls."
  },
  {
    id: generateGUID(),
    name: "Bangkok Full Day Private Van with Driver (8 hours)",
    province: "Bangkok",
    category: "transfer",
    transferMode: "vehicle",
    vehicleOptions: [
      { id: generateGUID(), vehicleType: "Van", price: 3500, maxPassengers: 8, notes: "Includes driver, fuel for city limits. Excludes tolls, entrance fees." }
    ],
    currency: "THB",
    unitDescription: "per service (8 hours)",
    notes: "Ideal for custom city tours or shopping trips."
  },
  {
    id: generateGUID(),
    name: "Grand Palace & Temples Tour",
    province: "Bangkok",
    category: "activity",
    activityPackages: [
      { id: generateGUID(), name: "Half-Day Tour (Morning)", price1: 1200, price2: 800, notes: "Includes guide, entrance fees. Excludes lunch. Duration: 4 hours.", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31`, closedWeekdays: [0], specificClosedDates: [`${currentYear}-05-01`]},
      { id: generateGUID(), name: "Full-Day Tour with Lunch", price1: 2000, price2: 1500, notes: "Includes guide, entrance fees, and local Thai lunch. Duration: 8 hours.", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31`}
    ],
    currency: "THB",
    unitDescription: "per person",
    notes: "Dress respectfully (shoulders and knees covered). Pick-up from central Bangkok hotels."
  },
  {
    id: generateGUID(),
    name: "Chao Phraya River Dinner Cruise",
    province: "Bangkok",
    category: "activity",
    price1: 1800, // Simple pricing if no packages
    price2: 1200,
    currency: "THB",
    unitDescription: "per person",
    notes: "International buffet, live music. Daily 7 PM - 9 PM."
  },
  {
    id: generateGUID(),
    name: "Authentic Thai Cooking Class",
    province: "Bangkok",
    category: "activity",
    activityPackages: [
      { id: generateGUID(), name: "Morning Class with Market Tour", price1: 1500, notes: "Learn 4 dishes. 9 AM - 1 PM.", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31`},
      { id: generateGUID(), name: "Evening Class", price1: 1300, notes: "Learn 3 dishes. 4 PM - 7 PM.", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31`}
    ],
    currency: "THB",
    unitDescription: "per person",
  },
  {
    id: generateGUID(),
    name: "Riverside Thai Dinner Set",
    province: "Bangkok",
    category: "meal",
    price1: 800,
    price2: 400,
    subCategory: "Set Menu",
    currency: "THB",
    unitDescription: "per person",
    notes: "Elegant dining experience by the river."
  },

  // --- Pattaya Services ---
  {
    id: generateGUID(),
    name: "Bangkok Hotel to Pattaya Hotel",
    province: "Bangkok", // Route starts in BKK, destination is PTY
    category: "transfer",
    transferMode: "vehicle",
    vehicleOptions: [
      { id: generateGUID(), vehicleType: "Sedan", price: 1800, maxPassengers: 3 },
      { id: generateGUID(), vehicleType: "Van", price: 2500, maxPassengers: 8 }
    ],
    currency: "THB",
    unitDescription: "per service (one way)",
    notes: "Direct transfer, approx 2-2.5 hours."
  },
  {
    id: generateGUID(),
    name: "Pattaya Hotel to BKK Airport",
    province: "Pattaya", // Route starts in PTY
    category: "transfer",
    transferMode: "vehicle",
    vehicleOptions: [
      { id: generateGUID(), vehicleType: "Sedan", price: 1700, maxPassengers: 3 },
      { id: generateGUID(), vehicleType: "Van", price: 2400, maxPassengers: 8 }
    ],
    currency: "THB",
    unitDescription: "per service (one way)",
    notes: "Allow at least 3 hours before flight."
  },
  {
    id: generateGUID(),
    name: "Coral Island (Koh Larn) Speedboat Tour",
    province: "Pattaya",
    category: "activity",
    activityPackages: [
      { id: generateGUID(), name: "Full Day with Lunch & Snorkeling", price1: 1500, price2: 1000, notes: "Includes hotel transfer, speedboat, lunch, snorkeling gear, beach chair.", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31` },
      { id: generateGUID(), name: "Half Day (No Lunch)", price1: 1000, price2: 700, notes: "Includes hotel transfer, speedboat, beach chair.", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31` }
    ],
    currency: "THB",
    unitDescription: "per person",
    notes: "Bring swimwear, sunscreen, and a towel."
  },
  {
    id: generateGUID(),
    name: "Sanctuary of Truth Entrance",
    province: "Pattaya",
    category: "activity",
    price1: 500,
    price2: 250,
    currency: "THB",
    unitDescription: "per person",
    notes: "Magnificent all-wood construction. Open daily."
  },
  {
    id: generateGUID(),
    name: "Alcazar Cabaret Show Ticket",
    province: "Pattaya",
    category: "activity",
    activityPackages: [
      { id: generateGUID(), name: "Standard Seat", price1: 700, notes: "Show times: 5 PM, 6:30 PM, 8 PM, 9:30 PM", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31`},
      { id: generateGUID(), name: "VIP Seat", price1: 900, notes: "Closer to the stage. Show times: 5 PM, 6:30 PM, 8 PM, 9:30 PM", validityStartDate: `${currentYear}-01-01`, validityEndDate: `${currentYear}-12-31`}
    ],
    currency: "THB",
    unitDescription: "per person",
  },
  {
    id: generateGUID(),
    name: "Beachfront Seafood BBQ Buffet",
    province: "Pattaya",
    category: "meal",
    price1: 1200,
    subCategory: "Buffet",
    currency: "THB",
    unitDescription: "per person",
    notes: "Fresh seafood, grilled to order. Includes soft drinks."
  },

  // --- Generic/Other Services ---
  {
    id: generateGUID(),
    name: "Basic Travel Insurance",
    category: "misc", // No province needed, applies generally
    price1: 500,
    subCategory: "Insurance Fee",
    currency: "THB",
    unitDescription: "per person for trip",
    notes: "Covers basic medical emergencies and travel inconveniences."
  },
  {
    id: generateGUID(),
    name: "Local SIM Card with Data",
    category: "misc",
    price1: 300,
    subCategory: "Communication",
    currency: "THB",
    unitDescription: "per SIM card",
    notes: "7-day unlimited data plan."
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
              return typeof p.price1 === 'number'; 
            }
            if (p.category === 'transfer') {
                if (p.transferMode === 'vehicle') {
                    return Array.isArray(p.vehicleOptions) && p.vehicleOptions.length > 0 &&
                           p.vehicleOptions.every((vo: any) => vo.id && vo.vehicleType && typeof vo.price === 'number' && typeof vo.maxPassengers === 'number');
                }
                return typeof p.price1 === 'number'; 
            }
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
      if (subCategory && category !== 'transfer') { 
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

