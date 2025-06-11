
import * as React from 'react';
import type { ServicePriceItem, ItineraryItemType, CurrencyCode, HotelDefinition, ActivityPackageDefinition, SurchargePeriod, VehicleOption, RoomTypeSeasonalPrice, HotelRoomTypeDefinition } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';

const currentYear = new Date().getFullYear();

// Hotel definitions (copied from useHotelDefinitions.ts for embedding)
const demoHotelDefinitions: HotelDefinition[] = [
  {
    id: "hd_bkk_grand_riverside",
    name: "Grand Bangkok Riverside Hotel",
    province: "Bangkok",
    roomTypes: [
      {
        id: "rt_bkk_gr_deluxe_city",
        name: "Deluxe City View",
        extraBedAllowed: true,
        notes: "Modern room with city views, 32 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Low Season", startDate: `${currentYear}-05-01`, endDate: `${currentYear}-10-31`, rate: 2500, extraBedRate: 800 },
          { id: generateGUID(), seasonName: "High Season", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-04-30`, rate: 3500, extraBedRate: 1000 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "32 sqm" },
          { id: generateGUID(), key: "Bed", value: "King or Twin" },
          { id: generateGUID(), key: "View", value: "City" }
        ]
      },
      {
        id: "rt_bkk_gr_suite_river",
        name: "River View Suite",
        extraBedAllowed: false,
        notes: "Spacious suite with panoramic river views, separate living area, 60 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 6000 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "60 sqm" },
          { id: generateGUID(), key: "Bed", value: "King" },
          { id: generateGUID(), key: "View", value: "River (Panoramic)" },
          { id: generateGUID(), key: "Features", value: "Separate Living Room, Bathtub" }
        ]
      }
    ]
  },
  {
    id: "hd_bkk_urban_oasis",
    name: "Urban Oasis Boutique Hotel",
    province: "Bangkok",
    roomTypes: [
      {
        id: "rt_bkk_uo_superior",
        name: "Superior Room",
        extraBedAllowed: false,
        notes: "Cozy room with essential amenities, 25 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Standard Rate", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 1800 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "25 sqm" },
          { id: generateGUID(), key: "Bed", value: "Queen" }
        ]
      },
      {
        id: "rt_bkk_uo_deluxe_balcony",
        name: "Deluxe Balcony Room",
        extraBedAllowed: true,
        notes: "Room with private balcony, 30 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Standard Rate", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 2200, extraBedRate: 700 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "30 sqm" },
          { id: generateGUID(), key: "Bed", value: "King" },
          { id: generateGUID(), key: "Feature", value: "Private Balcony" }
        ]
      }
    ]
  },
  {
    id: "hd_bkk_sukhumvit_modern",
    name: "Sukhumvit Modern Living",
    province: "Bangkok",
    roomTypes: [
      {
        id: "rt_bkk_sm_studio",
        name: "Executive Studio",
        extraBedAllowed: false,
        notes: "Stylish studio with kitchenette, 40 sqm. Near BTS.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 2800 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "40 sqm" },
          { id: generateGUID(), key: "Bed", value: "King" },
          { id: generateGUID(), key: "Feature", value: "Kitchenette, BTS Access" }
        ]
      }
    ]
  },
  {
    id: "hd_pty_beach_resort",
    name: "Pattaya Beach Resort & Spa",
    province: "Pattaya",
    roomTypes: [
      {
        id: "rt_pty_br_garden_view",
        name: "Superior Garden View",
        extraBedAllowed: true,
        notes: "Comfortable room overlooking lush gardens, 28 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Standard Rate", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 2000, extraBedRate: 600 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "28 sqm" },
          { id: generateGUID(), key: "Bed", value: "King or Twin" },
          { id: generateGUID(), key: "View", value: "Garden" }
        ]
      },
      {
        id: "rt_pty_br_oceanfront_dlx",
        name: "Oceanfront Deluxe",
        extraBedAllowed: false,
        notes: "Stunning ocean views from private balcony, 35 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Peak Season", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-03-31`, rate: 4000 },
          { id: generateGUID(), seasonName: "Regular Season", startDate: `${currentYear}-04-01`, endDate: `${currentYear}-10-31`, rate: 3200 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "35 sqm" },
          { id: generateGUID(), key: "Bed", value: "King" },
          { id: generateGUID(), key: "View", value: "Oceanfront with Balcony" }
        ]
      }
    ]
  },
  {
    id: "hd_pty_seaview_inn",
    name: "Seaview Inn Pattaya",
    province: "Pattaya",
    roomTypes: [
      {
        id: "rt_pty_si_standard",
        name: "Standard Seaview",
        extraBedAllowed: false,
        notes: "Budget-friendly room with partial sea view, 22 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 1500 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "22 sqm" },
          { id: generateGUID(), key: "Bed", value: "Double" },
          { id: generateGUID(), key: "View", value: "Partial Sea View" }
        ]
      },
      {
        id: "rt_pty_si_family",
        name: "Family Room Garden Access",
        extraBedAllowed: true,
        notes: "Spacious room for families, direct garden access, 40 sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "All Year", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, rate: 2800, extraBedRate: 500 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "40 sqm" },
          { id: generateGUID(), key: "Bed", value: "King + Bunk Bed" },
          { id: generateGUID(), key: "Feature", value: "Direct Garden Access" }
        ]
      }
    ]
  },
  {
    id: "hd_pty_jomtien_luxury", 
    name: "Jomtien Luxury Condotel",
    province: "Pattaya",
    roomTypes: [
      {
        id: "rt_pty_jl_one_bedroom",
        name: "One Bedroom Seaview Condo",
        extraBedAllowed: false,
        notes: "Apartment-style with kitchen, living area, balcony, 55sqm.",
        seasonalPrices: [
          { id: generateGUID(), seasonName: "Monthly Rate (Low)", startDate: `${currentYear}-05-01`, endDate: `${currentYear}-10-31`, rate: Math.round(25000/30) },
          { id: generateGUID(), seasonName: "Daily Rate (High)", startDate: `${currentYear}-11-01`, endDate: `${currentYear + 1}-04-30`, rate: 1800 }
        ],
        characteristics: [
          { id: generateGUID(), key: "Size", value: "55 sqm" },
          { id: generateGUID(), key: "Bed", value: "King" },
          { id: generateGUID(), key: "View", value: "Seaview" },
          { id: generateGUID(), key: "Features", value: "Kitchen, Living Area, Balcony, Pool Access" }
        ]
      }
    ]
  }
];

const DEFAULT_DEMO_SERVICE_PRICES: ServicePriceItem[] = [
  // --- Hotel Services (Transformed from HotelDefinition) ---
  ...demoHotelDefinitions.map((hd): ServicePriceItem => ({
    id: generateGUID(), 
    name: hd.name,
    province: hd.province,
    category: "hotel",
    currency: "THB", 
    unitDescription: "per night", // Unit description now optional
    notes: `This hotel, ${hd.name}, offers various room types with seasonal pricing.`,
    hotelDetails: hd, 
    price1: undefined,
    price2: undefined,
    subCategory: undefined,
    transferMode: undefined,
    vehicleOptions: undefined,
    maxPassengers: undefined,
    activityPackages: undefined,
    surchargePeriods: undefined,
  })),

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
    price1: 1800, 
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
    province: "Bangkok", 
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
    province: "Pattaya", 
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
    category: "misc", 
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
            const basicValid = p.id && p.name && p.category && p.currency; // unitDescription no longer required
            if (!basicValid) return false;
            
            if (p.category === 'hotel') {
              const hd = p.hotelDetails as HotelDefinition | undefined;
              return hd && hd.id && hd.name && Array.isArray(hd.roomTypes) && hd.roomTypes.length > 0 &&
                     hd.roomTypes.every((rt: HotelRoomTypeDefinition) => 
                       rt.id && rt.name && 
                       Array.isArray(rt.seasonalPrices) && rt.seasonalPrices.length > 0 &&
                       rt.seasonalPrices.every((sp: RoomTypeSeasonalPrice) => 
                         sp.id && 
                         typeof sp.startDate === 'string' && 
                         typeof sp.endDate === 'string' && 
                         typeof sp.rate === 'number'
                       )
                     );
            }
            if (p.category === 'activity') {
              if (p.activityPackages && Array.isArray(p.activityPackages) && p.activityPackages.length > 0) {
                return p.activityPackages.every((ap: ActivityPackageDefinition) => ap.id && ap.name && typeof ap.price1 === 'number');
              }
              return typeof p.price1 === 'number'; 
            }
            if (p.category === 'transfer') {
                if (p.transferMode === 'vehicle') {
                    return Array.isArray(p.vehicleOptions) && p.vehicleOptions.length > 0 &&
                           p.vehicleOptions.every((vo: VehicleOption) => vo.id && vo.vehicleType && typeof vo.price === 'number' && typeof vo.maxPassengers === 'number');
                }
                return typeof p.price1 === 'number'; 
            }
            return typeof p.price1 === 'number'; 
          });

          if (validatedPrices.length > 0) {
            pricesToSet = validatedPrices;
          } else {
            console.log("localStorage data invalid or empty after validation, re-seeding with demo data.");
            pricesToSet = DEFAULT_DEMO_SERVICE_PRICES; 
            if (DEFAULT_DEMO_SERVICE_PRICES.length > 0) {
                 localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
            } else {
                 localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY); 
            }
          }
        } else {
          console.log("localStorage data empty or not an array, re-seeding with demo data.");
          pricesToSet = DEFAULT_DEMO_SERVICE_PRICES;
          if (DEFAULT_DEMO_SERVICE_PRICES.length > 0) {
            localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SERVICE_PRICES));
          } else {
            localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY);
          }
        }
      } else {
        console.log("No data in localStorage, seeding with demo data.");
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
      if (subCategory && category !== 'transfer' && category !== 'hotel' && category !== 'activity') { 
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
    
