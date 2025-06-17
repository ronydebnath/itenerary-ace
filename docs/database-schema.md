
# Itinerary Ace - LocalStorage Data Schema

**Important Note:** This document outlines the primary data structures used by the Itinerary Ace application and how they are **currently stored in the user's web browser using `localStorage`**. This means all operational data such as itineraries, service prices, agent details, etc., is persisted locally on the user's device and is not automatically synced across different browsers or devices.

The recent refactoring of data management hooks (e.g., `useCountries`, `useServicePrices`) has encapsulated this `localStorage` interaction. This modularization is a preparatory step that would facilitate a smoother transition to a proper backend database and API layer in the future should the application require features like data sharing, multi-user access, or more robust persistence.

**গুরুত্বপূর্ণ দ্রষ্টব্য:** এই ডকুমেন্টটি ইটিনেরারি এস অ্যাপ্লিকেশন দ্বারা ব্যবহৃত প্রধান ডেটা কাঠামো এবং সেগুলি বর্তমানে **ব্যবহারকারীর ওয়েব ব্রাউজারের `localStorage`-এ কীভাবে সংরক্ষণ করা হয়** তার রূপরেখা দেয়। এর মানে হল ভ্রমণপথ, পরিষেবার মূল্য, এজেন্টের বিবরণ ইত্যাদির মতো সমস্ত অপারেশনাল ডেটা ব্যবহারকারীর ডিভাইসে স্থানীয়ভাবে স্থায়ী হয় এবং বিভিন্ন ব্রাউজার বা ডিভাইস জুড়ে স্বয়ংক্রিয়ভাবে সিঙ্ক হয় না।

ডেটা ম্যানেজমেন্ট হুকগুলির (যেমন, `useCountries`, `useServicePrices`) সাম্প্রতিক রিফ্যাক্টরিং এই `localStorage` ইন্টারঅ্যাকশনকে আবদ্ধ করেছে। এই মডুলারাইজেশন একটি প্রস্তুতিমূলক পদক্ষেপ যা ভবিষ্যতে অ্যাপ্লিকেশনটির ডেটা শেয়ারিং, মাল্টি-ইউজার অ্যাক্সেস বা আরও শক্তিশালী স্থায়ীত্বের মতো বৈশিষ্ট্যগুলির প্রয়োজন হলে একটি সঠিক ব্যাকএন্ড ডেটাবেস এবং API স্তরে একটি মসৃণ انتقالকে সহজতর করবে।

## General Notes / সাধারণ নোট

*   **Data Format**: All data in `localStorage` is stored as JSON strings.
    *   **ডেটা ফরম্যাট**: `localStorage`-এর সমস্ত ডেটা JSON স্ট্রিং হিসাবে সংরক্ষণ করা হয়।
*   **Keys**: Specific keys are used to identify different data collections.
    *   **কী**: বিভিন্ন ডেটা সংগ্রহ সনাক্ত করতে নির্দিষ্ট কী ব্যবহার করা হয়।
*   **Relationships**: Relationships between data entities are typically managed through IDs (e.g., an `ItineraryItem` might reference a `ServicePriceItem` by its ID).
    *   **সম্পর্ক**: ডেটা সত্তাগুলির মধ্যে সম্পর্কগুলি সাধারণত আইডিগুলির মাধ্যমে পরিচালিত হয় (যেমন, একটি `ItineraryItem` তার আইডি দ্বারা একটি `ServicePriceItem`-কে রেফারেন্স করতে পারে)।
*   **Limitations**: Being `localStorage`-based, the data is:
    *   Specific to the browser and device.
    *   Not automatically shareable or synchronizable across devices/users.
    *   Limited by the browser's storage capacity (typically 5-10MB).
    *   Not suitable for sensitive data in a production multi-user environment without additional security.
    *   **সীমাবদ্ধতা**: `localStorage`-ভিত্তিক হওয়ায়, ডেটা হল:
        *   ব্রাউজার এবং ডিভাইসের জন্য নির্দিষ্ট।
        *   ডিভাইস/ব্যবহারকারীদের মধ্যে স্বয়ংক্রিয়ভাবে ভাগ করা বা সিঙ্ক্রোনাইজ করা যায় না।
        *   ব্রাউজারের স্টোরেজ ক্ষমতা দ্বারা সীমাবদ্ধ (সাধারণত ৫-১০MB)।
        *   অতিরিক্ত নিরাপত্তা ছাড়া প্রোডাকশন মাল্টি-ইউজার পরিবেশে সংবেদনশীল ডেটার জন্য উপযুক্ত নয়।

## Core Data Entities / মূল ডেটা সত্তা

### 1. Itineraries (ভ্রমণপথ)

*   **Description**: Stores all data related to individual travel itineraries, including settings, passenger details, and day-by-day items.
    *   **বিবরণ**: সেটিংস, যাত্রী বিবরণ এবং প্রতিদিনের আইটেম সহ স্বতন্ত্র ভ্রমণপথ সম্পর্কিত সমস্ত ডেটা সংরক্ষণ করে।
*   **Storage Keys / স্টোরেজ কী**:
    *   `itineraryAce_index`: An array of `ItineraryMetadata` objects, providing a quick lookup for all saved itineraries.
        *   `itineraryAce_index`: `ItineraryMetadata` অবজেক্টের একটি অ্যারে, যা সমস্ত সংরক্ষিত ভ্রমণপথের জন্য দ্রুত সন্ধানের সুবিধা দেয়।
    *   `itineraryAce_data_<ITINERARY_ID>`: Stores the full `TripData` object for a specific itinerary, where `<ITINERARY_ID>` is the unique ID of the itinerary.
        *   `itineraryAce_data_<ITINERARY_ID>`: একটি নির্দিষ্ট ভ্রমণপথের জন্য সম্পূর্ণ `TripData` অবজেক্ট সংরক্ষণ করে, যেখানে `<ITINERARY_ID>` হলো ভ্রমণপথের অনন্য আইডি।
    *   `lastActiveItineraryId`: Stores the ID of the most recently accessed or modified itinerary.
        *   `lastActiveItineraryId`: সম্প্রতি অ্যাক্সেস করা বা পরিবর্তিত ভ্রমণপথের আইডি সংরক্ষণ করে।
*   **Primary TypeScript Types / প্রধান TypeScript টাইপ**:
    *   `TripData` (from `src/types/itinerary.ts`): The main object for a complete itinerary.
        *   `TripData` (`src/types/itinerary.ts` থেকে): একটি সম্পূর্ণ ভ্রমণপথের জন্য প্রধান অবজেক্ট।
        *   Fields include / ক্ষেত্রগুলির মধ্যে রয়েছে:
            *   `id` (string): Unique identifier for the itinerary. / ভ্রমণপথের জন্য অনন্য শনাক্তকারী।
            *   `itineraryName` (string): User-defined name for the itinerary. / ভ্রমণপথের জন্য ব্যবহারকারী-নির্ধারিত নাম।
            *   `clientName` (string, optional): Name of the client for whom the itinerary is planned. / ক্লায়েন্টের নাম যার জন্য ভ্রমণপথটি পরিকল্পনা করা হয়েছে (ঐচ্ছিক)।
            *   `createdAt` (string): ISO date string of when the itinerary was created. / ভ্রমণপথটি কখন তৈরি হয়েছিল তার ISO তারিখ স্ট্রিং।
            *   `updatedAt` (string): ISO date string of the last update time. / শেষ আপডেটের সময়ের ISO তারিখ স্ট্রিং।
            *   `settings` (`TripSettings` object): Contains global settings for the trip like number of days, start date, selected countries/provinces, budget, and template status. / ট্রিপের জন্য গ্লোবাল সেটিংস যেমন দিনের সংখ্যা, শুরুর তারিখ, নির্বাচিত দেশ/প্রদেশ, বাজেট এবং টেমপ্লেট স্ট্যাটাস ধারণ করে।
                *   `numDays` (number): Total number of days in the itinerary. / ভ্রমণপথের মোট দিনের সংখ্যা।
                *   `startDate` (string): ISO date string for the start date of the trip. / ভ্রমণের শুরুর তারিখের জন্য ISO তারিখ স্ট্রিং।
                *   `budget` (number, optional): Overall budget for the trip. / ভ্রমণের জন্য সামগ্রিক বাজেট (ঐচ্ছিক)।
                *   `selectedCountries` (string[]): Array of selected country IDs to focus the itinerary. / ভ্রমণপথকে কেন্দ্র করে নির্বাচিত দেশের আইডিগুলির অ্যারে।
                *   `selectedProvinces` (string[]): Array of selected province names for filtering. / ফিল্টারিংয়ের জন্য নির্বাচিত প্রদেশের নামগুলির অ্যারে।
                *   `isTemplate` (boolean, optional): Flag indicating if this itinerary is a template. / এই ভ্রমণপথটি একটি টেমপ্লেট কিনা তা নির্দেশক পতাকা (ঐচ্ছিক)।
                *   `templateCategory` (string, optional): Category for the template if `isTemplate` is true. / যদি `isTemplate` সত্য হয় তবে টেমপ্লেটের জন্য বিভাগ (ঐচ্ছিক)।
            *   `pax` (`PaxDetails` object): Contains passenger count (adults, children) and the billing currency for the itinerary. / যাত্রীর সংখ্যা (প্রাপ্তবয়স্ক, শিশু) এবং ভ্রমণপথের জন্য বিলিং মুদ্রা ধারণ করে।
                *   `adults` (number): Number of adults. / প্রাপ্তবয়স্কদের সংখ্যা।
                *   `children` (number): Number of children. / শিশুদের সংখ্যা।
                *   `currency` (`CurrencyCode`): Billing currency for the itinerary. / ভ্রমণপথের জন্য বিলিং মুদ্রা।
            *   `travelers` (`Traveler[]` array): List of individual traveler objects. / স্বতন্ত্র ভ্রমণকারী অবজেক্টের তালিকা।
                *   Each `Traveler` has: `id` (string), `label` (string, e.g., "Adult 1"), `type` ('adult' | 'child')। / প্রতিটি `Traveler`-এর আছে: `id` (স্ট্রিং), `label` (স্ট্রিং, যেমন, "Adult 1"), `type` ('adult' | 'child')।
            *   `days` (object): A map where keys are day numbers (e.g., 1, 2) and values are `DayItinerary` objects containing the items planned for that day. / একটি ম্যাপ যেখানে কীগুলি দিনের সংখ্যা (যেমন, ১, ২) এবং মানগুলি `DayItinerary` অবজেক্ট যা সেই দিনের জন্য পরিকল্পিত আইটেমগুলি ধারণ করে।
                *   Each `DayItinerary` has: `items` (`ItineraryItem[]`). / প্রতিটি `DayItinerary`-তে আছে: `items` (`ItineraryItem[]`)।
            *   `quotationRequestId` (string, optional): ID of the quotation request this itinerary is based on, if any. / এই ভ্রমণপথটি যে উদ্ধৃতি অনুরোধের উপর ভিত্তি করে তৈরি, তার আইডি (যদি থাকে)।
            *   `version` (number, optional): Version number of the itinerary data structure. / ভ্রমণপথের ডেটা কাঠামোর সংস্করণ নম্বর (ঐচ্ছিক)।
            *   `overallBookingStatus` (`OverallBookingStatus`, optional): The overall booking status of the entire itinerary. / সম্পূর্ণ ভ্রমণপথের সামগ্রিক বুকিং স্ট্যাটাস (ঐচ্ছিক)।
            *   `adminRevisionNotes` (string, optional): Notes from the admin for this version of the itinerary, related to a quotation. / একটি উদ্ধৃতির সাথে সম্পর্কিত ভ্রমণপথের এই সংস্করণের জন্য অ্যাডমিনের নোট (ঐচ্ছিক)।
    *   `ItineraryMetadata` (from `src/types/itinerary.ts`): Basic info for the index.
        *   `ItineraryMetadata` (`src/types/itinerary.ts` থেকে): সূচকের জন্য প্রাথমিক তথ্য।
        *   Fields: `id` (string), `itineraryName` (string), `clientName` (string, optional), `createdAt` (string), `updatedAt` (string).
        *   ক্ষেত্র: `id` (স্ট্রিং), `itineraryName` (স্ট্রিং), `clientName` (স্ট্রিং, ঐচ্ছিক), `createdAt` (স্ট্রিং), `updatedAt` (স্ট্রিং)।
    *   `ItineraryItem` (from `src/types/itinerary.ts`): Union type for various service items. Common fields:
        *   `ItineraryItem` (`src/types/itinerary.ts` থেকে): বিভিন্ন পরিষেবা আইটেমের জন্য ইউনিয়ন টাইপ। সাধারণ ক্ষেত্র:
        *   `id` (string): Unique ID for the item. / আইটেমের জন্য অনন্য আইডি।
        *   `day` (number): Day number this item belongs to. / এই আইটেমটি যে দিনের অন্তর্গত তার নম্বর।
        *   `name` (string): Name/description of the item. / আইটেমের নাম/বিবরণ।
        *   `note` (string, optional): Additional notes for the item. / আইটেমের জন্য অতিরিক্ত নোট (ঐচ্ছিক)।
        *   `excludedTravelerIds` (string[]): IDs of travelers excluded from this item. / এই আইটেম থেকে বাদ দেওয়া ভ্রমণকারীদের আইডি।
        *   `selectedServicePriceId` (string, optional): ID of a master `ServicePriceItem` if selected. / যদি নির্বাচিত হয় তবে মাস্টার `ServicePriceItem`-এর আইডি (ঐচ্ছিক)।
        *   `countryId` (string, optional): Country ID associated with this item. / এই আইটেমের সাথে যুক্ত দেশের আইডি (ঐচ্ছিক)।
        *   `countryName` (string, optional): Cached country name. / ক্যাশ করা দেশের নাম।
        *   `province` (string, optional): Province name associated with this item. / এই আইটেমের সাথে যুক্ত প্রদেশের নাম (ঐচ্ছিক)।
        *   `bookingStatus` (`BookingStatus`, optional): Booking status of this specific item. / এই নির্দিষ্ট আইটেমের বুকিং স্ট্যাটাস (ঐচ্ছিক)।
        *   `confirmationRef` (string, optional): Confirmation reference for this item. / এই আইটেমের জন্য কনফার্মেশন রেফারেন্স (ঐচ্ছিক)।
        *   Specific types like `TransferItem`, `ActivityItem`, `HotelItem`, `MealItem`, `MiscItem` have additional type-specific fields.
        *   নির্দিষ্ট প্রকার যেমন `TransferItem`, `ActivityItem`, `HotelItem`, `MealItem`, `MiscItem`-এর অতিরিক্ত প্রকার-নির্দিষ্ট ক্ষেত্র রয়েছে।

### 2. Service Prices (পরিষেবার মূল্য)

*   **Description**: Master list of predefined prices for various services (hotels, activities, transfers, meals, misc). These are used to populate options and default pricing in the itinerary planner.
    *   **বিবরণ**: বিভিন্ন পরিষেবার (হোটেল, কার্যকলাপ, ট্রান্সফার, খাবার, বিবিধ) জন্য পূর্বনির্ধারিত মূল্যের মাস্টার তালিকা। এগুলি ভ্রমণপথ পরিকল্পনাকারীতে বিকল্প এবং ডিফল্ট মূল্য পূরণ করতে ব্যবহৃত হয়।
*   **Storage Key / স্টোরেজ কী**: `itineraryAceServicePrices`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `ServicePriceItem[]` (from `src/types/itinerary.ts`)
    *   Fields include / ক্ষেত্রগুলির মধ্যে রয়েছে:
        *   `id` (string): Unique ID for the service price item. / পরিষেবা মূল্য আইটেমের জন্য অনন্য আইডি।
        *   `name` (string): Name of the service. / পরিষেবার নাম।
        *   `countryId` (string, optional): Associated country ID. / সংশ্লিষ্ট দেশের আইডি (ঐচ্ছিক)।
        *   `province` (string, optional): Associated province name. / সংশ্লিষ্ট প্রদেশের নাম (ঐচ্ছিক)।
        *   `category` (`ItineraryItemType`): Category of the service (e.g., 'hotel', 'activity'). / পরিষেবার বিভাগ (যেমন, 'hotel', 'activity')।
        *   `price1` (number, optional): Primary price (e.g., adult price, unit cost). / প্রাথমিক মূল্য (যেমন, প্রাপ্তবয়স্ক মূল্য, ইউনিট খরচ)।
        *   `price2` (number, optional): Secondary price (e.g., child price). / মাধ্যমিক মূল্য (যেমন, শিশু মূল্য)।
        *   `subCategory` (string, optional): More specific type (e.g., meal type, 'ticket' for transfers). / আরও নির্দিষ্ট প্রকার (যেমন, খাবারের প্রকার, ট্রান্সফারের জন্য 'ticket')।
        *   `transferMode` ('ticket' | 'vehicle', optional): Mode for transfer services. / ট্রান্সফার পরিষেবাগুলির জন্য মোড (ঐচ্ছিক)।
        *   `vehicleOptions` (`VehicleOption[]`, optional): Array of vehicle options if `transferMode` is 'vehicle'. / যদি `transferMode` 'vehicle' হয় তবে যান বিকল্পগুলির অ্যারে (ঐচ্ছিক)।
        *   `currency` (`CurrencyCode`): Currency of the prices. / মূল্যের মুদ্রা।
        *   `unitDescription` (string, optional): Description of what the price refers to (e.g., "per person"). / মূল্য একক কী নির্দেশ করে তার বিবরণ (ঐচ্ছিক)।
        *   `notes` (string, optional): Additional notes. / অতিরিক্ত নোট (ঐচ্ছিক)।
        *   `hotelDetails` (`HotelDefinition`, optional): Full hotel definition if category is 'hotel'. / যদি বিভাগ 'hotel' হয় তবে সম্পূর্ণ হোটেল সংজ্ঞা (ঐচ্ছিক)।
        *   `activityPackages` (`ActivityPackageDefinition[]`, optional): Array of packages if category is 'activity'. / যদি বিভাগ 'activity' হয় তবে প্যাকেজগুলির অ্যারে (ঐচ্ছিক)।
        *   `surchargePeriods` (`SurchargePeriod[]`, optional): Array of surcharge periods, mainly for vehicle transfers. / সারচার্জ সময়কালের অ্যারে, প্রধানত যান ট্রান্সফারের জন্য (ঐচ্ছিক)।
        *   `isFavorite` (boolean, optional): Indicates if this service price is a favorite. / এই পরিষেবা মূল্য একটি প্রিয় কিনা তা নির্দেশ করে (ঐচ্ছিক)।

### 3. Hotel Definitions (হোটেল সংজ্ঞা)

*   **Description**: Master list of hotel details, including their available room types and seasonal pricing for those room types. This is referenced by `ServicePriceItem` when the category is 'hotel'.
    *   **বিবরণ**: হোটেলের বিবরণগুলির মাস্টার তালিকা, যার মধ্যে তাদের উপলব্ধ রুমের প্রকার এবং সেই রুমের প্রকারগুলির জন্য মরশুমি মূল্য অন্তর্ভুক্ত রয়েছে। এটি `ServicePriceItem` দ্বারা রেফারেন্স করা হয় যখন বিভাগ 'hotel' হয়।
*   **Storage Key / স্টোরেজ কী**: `itineraryAceHotelDefinitions`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `HotelDefinition[]` (from `src/types/itinerary.ts`)
    *   Fields include / ক্ষেত্রগুলির মধ্যে রয়েছে:
        *   `id` (string): Unique ID for the hotel definition. / হোটেল সংজ্ঞার জন্য অনন্য আইডি।
        *   `name` (string): Name of the hotel. / হোটেলের নাম।
        *   `countryId` (string): ID of the country where the hotel is located. / হোটেলটি যে দেশে অবস্থিত তার আইডি।
        *   `province` (string): Name of the province where the hotel is located. / হোটেলটি যে প্রদেশে অবস্থিত তার নাম।
        *   `starRating` (number, optional, nullable): Hotel star rating (1-5). / হোটেলের তারকা রেটিং (১-৫) (ঐচ্ছিক, শূন্য হতে পারে)।
        *   `roomTypes` (`HotelRoomTypeDefinition[]` array): List of available room types in the hotel. / হোটেলে উপলব্ধ রুমের প্রকারগুলির তালিকা।
            *   Each `HotelRoomTypeDefinition` includes / প্রতিটি `HotelRoomTypeDefinition`-এ অন্তর্ভুক্ত:
                *   `id` (string): Unique ID for the room type. / রুমের প্রকারের জন্য অনন্য আইডি।
                *   `name` (string): Name of the room type (e.g., "Deluxe King"). / রুমের প্রকারের নাম (যেমন, "Deluxe King")।
                *   `extraBedAllowed` (boolean, optional): Whether an extra bed is allowed. / অতিরিক্ত বিছানা অনুমোদিত কিনা (ঐচ্ছিক)।
                *   `notes` (string, optional): Notes about the room type. / রুমের প্রকার সম্পর্কে নোট (ঐচ্ছিক)।
                *   `seasonalPrices` (`RoomTypeSeasonalPrice[]` array): Array of pricing periods for this room type. / এই রুমের প্রকারের জন্য মূল্য নির্ধারণের সময়কালের অ্যারে।
                    *   Each `RoomTypeSeasonalPrice` has: `id` (string), `seasonName` (string, optional), `startDate` (string), `endDate` (string), `rate` (number), `extraBedRate` (number, optional). / প্রতিটি `RoomTypeSeasonalPrice`-এ আছে: `id` (স্ট্রিং), `seasonName` (স্ট্রিং, ঐচ্ছিক), `startDate` (স্ট্রিং), `endDate` (স্ট্রিং), `rate` (সংখ্যা), `extraBedRate` (সংখ্যা, ঐচ্ছিক)।
                *   `characteristics` (`HotelCharacteristic[]`, optional): Array of key-value pairs describing room features. / রুমের বৈশিষ্ট্য বর্ণনাকারী কী-ভ্যালু জোড়ার অ্যারে (ঐচ্ছিক)।

### 4. Countries (দেশ)

*   **Description**: List of countries used for location selection and filtering. Each country has a default currency.
    *   **বিবরণ**: অবস্থান নির্বাচন এবং ফিল্টারিংয়ের জন্য ব্যবহৃত দেশগুলির তালিকা। প্রতিটি দেশের একটি ডিফল্ট মুদ্রা রয়েছে।
*   **Storage Key / স্টোরেজ কী**: `itineraryAceCountries`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `CountryItem[]` (from `src/types/itinerary.ts`)
    *   Fields: `id` (string), `name` (string), `defaultCurrency` (`CurrencyCode`).
    *   ক্ষেত্র: `id` (স্ট্রিং), `name` (স্ট্রিং), `defaultCurrency` (`CurrencyCode`)।

### 5. Provinces (প্রদেশ)

*   **Description**: List of provinces or regions, each linked to a parent country. Used for more granular location selection.
    *   **বিবরণ**: প্রদেশ বা অঞ্চলের তালিকা, প্রতিটি একটি মূল দেশের সাথে লিঙ্ক করা। আরও বিস্তারিত অবস্থান নির্বাচনের জন্য ব্যবহৃত হয়।
*   **Storage Key / স্টোরেজ কী**: `itineraryAceProvinces`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `ProvinceItem[]` (from `src/types/itinerary.ts`)
    *   Fields: `id` (string), `name` (string), `countryId` (string - ID of the parent `CountryItem`).
    *   ক্ষেত্র: `id` (স্ট্রিং), `name` (স্ট্রিং), `countryId` (স্ট্রিং - মূল `CountryItem`-এর আইডি)।

### 6. Agencies & Agents (এজেন্সি ও এজেন্ট)

*   **Description**: Stores information about travel agencies and the agent profiles associated with them.
    *   **বিবরণ**: ট্রাভেল এজেন্সি এবং তাদের সাথে যুক্ত এজেন্ট প্রোফাইল সম্পর্কিত তথ্য সংরক্ষণ করে।
*   **Storage Keys / স্টোরেজ কী**:
    *   `itineraryAceAgencies`: An array of `Agency` objects.
        *   `itineraryAceAgencies`: `Agency` অবজেক্টের একটি অ্যারে।
    *   `itineraryAceAgents`: An array of `AgentProfile` objects.
        *   `itineraryAceAgents`: `AgentProfile` অবজেক্টের একটি অ্যারে।
*   **Primary TypeScript Types / প্রধান TypeScript টাইপ**:
    *   `Agency` (from `src/types/agent.ts`): Details of a travel agency.
        *   `Agency` (`src/types/agent.ts` থেকে): একটি ট্রাভেল এজেন্সির বিবরণ।
        *   Fields: `id` (string), `name` (string), `mainAddress` (`AgentAddress` object, optional), `contactEmail` (string, optional), `contactPhone` (string, optional), `preferredCurrency` (`CurrencyCode`).
        *   ক্ষেত্র: `id` (স্ট্রিং), `name` (স্ট্রিং), `mainAddress` (`AgentAddress` অবজেক্ট, ঐচ্ছিক), `contactEmail` (স্ট্রিং, ঐচ্ছিক), `contactPhone` (স্ট্রিং, ঐচ্ছিক), `preferredCurrency` (`CurrencyCode`)।
            *   `AgentAddress` has: `street`, `city`, `stateProvince` (optional), `postalCode`, `countryId`. / `AgentAddress`-এ আছে: `street`, `city`, `stateProvince` (ঐচ্ছিক), `postalCode`, `countryId`।
    *   `AgentProfile` (from `src/types/agent.ts`): Profile information for an individual agent.
        *   `AgentProfile` (`src/types/agent.ts` থেকে): একজন স্বতন্ত্র এজেন্টের প্রোফাইল তথ্য।
        *   Fields: `id` (string), `agencyId` (string), `fullName` (string), `email` (string), `phoneNumber` (string, optional), `agencyName` (string, optional - specific branch name), `specializations` (string, optional), `yearsOfExperience` (number, optional), `bio` (string, optional), `profilePictureUrl` (string, optional, nullable).
        *   ক্ষেত্র: `id` (স্ট্রিং), `agencyId` (স্ট্রিং), `fullName` (স্ট্রিং), `email` (স্ট্রিং), `phoneNumber` (স্ট্রিং, ঐচ্ছিক), `agencyName` (স্ট্রিং, ঐচ্ছিক - নির্দিষ্ট শাখার নাম), `specializations` (স্ট্রিং, ঐচ্ছিক), `yearsOfExperience` (সংখ্যা, ঐচ্ছিক), `bio` (স্ট্রিং, ঐচ্ছিক), `profilePictureUrl` (স্ট্রিং, ঐচ্ছিক, শূন্য হতে পারে)।

### 7. Quotation Requests (উদ্ধৃতি অনুরোধ)

*   **Description**: Stores quotation requests submitted by agents. These requests contain client needs and trip preferences.
    *   **বিবরণ**: এজেন্টদের দ্বারা জমা দেওয়া উদ্ধৃতি অনুরোধগুলি সংরক্ষণ করে। এই অনুরোধগুলিতে ক্লায়েন্টের প্রয়োজন এবং ভ্রমণের পছন্দ থাকে।
*   **Storage Key / স্টোরেজ কী**: `itineraryAce_agentQuotationRequests`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `QuotationRequest[]` (from `src/types/quotation.ts`)
    *   Fields include / ক্ষেত্রগুলির মধ্যে রয়েছে:
        *   `id` (string): Unique ID for the quotation request. / উদ্ধৃতি অনুরোধের জন্য অনন্য আইডি।
        *   `requestDate` (string): ISO date string of when the request was made. / অনুরোধটি কখন করা হয়েছিল তার ISO তারিখ স্ট্রিং।
        *   `agentId` (string, optional): ID of the agent who submitted the request. / অনুরোধ জমা দেওয়া এজেন্টের আইডি (ঐচ্ছিক)।
        *   `clientInfo` (`QuotationRequestClientInfo` object): Pax details - adults, children, childAges. / যাত্রীর বিবরণ - প্রাপ্তবয়স্ক, শিশু, শিশুদের বয়স।
        *   `tripDetails` (`QuotationRequestTripDetails` object): Preferred countries, provinces, start/end dates, duration, trip type, budget. / পছন্দের দেশ, প্রদেশ, শুরু/শেষের তারিখ, সময়কাল, ভ্রমণের ধরণ, বাজেট।
        *   `accommodationPrefs` (`QuotationRequestAccommodationPrefs` object, optional): Hotel star rating, room preferences, specific hotel requests. / হোটেলের তারকা রেটিং, রুমের পছন্দ, নির্দিষ্ট হোটেলের অনুরোধ (ঐচ্ছিক)।
        *   `activityPrefs` (`QuotationRequestActivityPrefs` object, optional): Requested activities or interests. / অনুরোধ করা কার্যকলাপ বা আগ্রহ (ঐচ্ছিক)।
        *   `flightPrefs` (`QuotationRequestFlightPrefs` object, optional): Airport/activity transfer requirements. / বিমানবন্দর/কার্যকলাপ ট্রান্সফারের প্রয়োজনীয়তা (ঐচ্ছিক)।
        *   `mealPrefs` (`QuotationRequestMealPrefs` object, optional): Preferred meal plan. / পছন্দের খাবারের পরিকল্পনা (ঐচ্ছিক)।
        *   `otherRequirements` (string, optional): Any other special requests. / অন্য কোনো বিশেষ অনুরোধ (ঐচ্ছিক)।
        *   `status` (`QuotationRequestStatus`): Current status of the request (e.g., "Pending", "Quoted"). / অনুরোধের বর্তমান অবস্থা (যেমন, "Pending", "Quoted")।
        *   `linkedItineraryId` (string, optional): ID of the `TripData` created from this request. / এই অনুরোধ থেকে তৈরি `TripData`-এর আইডি (ঐচ্ছিক)।
        *   `updatedAt` (string, optional): ISO date string of the last update time. / শেষ আপডেটের সময়ের ISO তারিখ স্ট্রিং (ঐচ্ছিক)।
        *   `agentRevisionNotes` (string, optional): Notes from agent when requesting revision. / সংশোধনীর জন্য অনুরোধ করার সময় এজেন্টের নোট (ঐচ্ছিক)।
        *   `adminRevisionNotes` (string, optional): Notes from admin when sending a re-quote. / পুনরায় উদ্ধৃতি পাঠানোর সময় অ্যাডমিনের নোট (ঐচ্ছিক)।
        *   `version` (number, optional): Version number of the quotation. / উদ্ধৃতির সংস্করণ নম্বর (ঐচ্ছিক)।


### 8. Currency and Exchange Rate Settings (মুদ্রা এবং বিনিময় হার সেটিংস)

*   **Description**: Manages custom currencies, base exchange rates, global markup, specific pair markups, and API fetch status.
    *   **বিবরণ**: কাস্টম মুদ্রা, ভিত্তি বিনিময় হার, গ্লোবাল মার্কআপ, নির্দিষ্ট জোড়ার মার্কআপ এবং API ফেচ স্ট্যাটাস পরিচালনা করে।
*   **Storage Keys / স্টোরেজ কী**:
    *   `itineraryAce_customCurrencies`: Stores `CurrencyCode[]` (an array of custom currency code strings).
        *   `itineraryAce_customCurrencies`: `CurrencyCode[]` (কাস্টম কারেন্সি কোড স্ট্রিংগুলির একটি অ্যারে) সংরক্ষণ করে।
    *   `itineraryAceExchangeRates`: Stores `ExchangeRate[]` objects.
        *   `itineraryAceExchangeRates`: `ExchangeRate[]` অবজেক্ট সংরক্ষণ করে।
    *   `itineraryAceGlobalExchangeMarkup`: Stores a `number` representing the global markup percentage.
        *   `itineraryAceGlobalExchangeMarkup`: গ্লোবাল মার্কআপ শতাংশ প্রতিনিধিত্বকারী একটি `number` সংরক্ষণ করে।
    *   `itineraryAceSpecificMarkupRates`: Stores `SpecificMarkupRate[]` objects for currency pair-specific markups.
        *   `itineraryAceSpecificMarkupRates`: মুদ্রা জোড়া-নির্দিষ্ট মার্কআপের জন্য `SpecificMarkupRate[]` অবজেক্ট সংরক্ষণ করে।
    *   `itineraryAceApiRatesLastFetched`: Stores an ISO date `string` indicating the last successful API fetch time for rates.
        *   `itineraryAceApiRatesLastFetched`: হারের জন্য সর্বশেষ সফল API ফেচ সময় নির্দেশক একটি ISO তারিখ `string` সংরক্ষণ করে।
*   **Primary TypeScript Types / প্রধান TypeScript টাইপ**:
    *   `ExchangeRate` (from `src/types/itinerary.ts`):
        *   Fields: `id` (string), `fromCurrency` (`CurrencyCode`), `toCurrency` (`CurrencyCode`), `rate` (number), `updatedAt` (string), `source` ('api' | 'manual', optional).
        *   ক্ষেত্র: `id` (স্ট্রিং), `fromCurrency` (`CurrencyCode`), `toCurrency` (`CurrencyCode`), `rate` (সংখ্যা), `updatedAt` (স্ট্রিং), `source` ('api' | 'manual', ঐচ্ছিক)।
    *   `SpecificMarkupRate` (from `src/types/itinerary.ts`):
        *   Fields: `id` (string), `fromCurrency` (`CurrencyCode`), `toCurrency` (`CurrencyCode`), `markupPercentage` (number), `updatedAt` (string).
        *   ক্ষেত্র: `id` (স্ট্রিং), `fromCurrency` (`CurrencyCode`), `toCurrency` (`CurrencyCode`), `markupPercentage` (সংখ্যা), `updatedAt` (স্ট্রিং)।

### 9. Temporary Data (অস্থায়ী ডেটা)

*   **Description**: Used for temporarily holding data, for example, when prefilling a form after an AI parsing operation.
    *   **বিবরণ**: অস্থায়ীভাবে ডেটা ধরে রাখতে ব্যবহৃত হয়, উদাহরণস্বরূপ, একটি AI পার্সিং অপারেশনের পরে একটি ফর্ম প্রিফিল করার সময়।
*   **Storage Key / স্টোরেজ কী**: `tempServicePricePrefillData`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `Partial<ServicePriceItem>` (from `src/types/itinerary.ts`)
    *   Stores a partial service price item object to prefill the service price creation form. This key is typically cleared after the data is read.
    *   পরিষেবা মূল্য তৈরির ফর্ম প্রিফিল করার জন্য একটি আংশিক পরিষেবা মূল্য আইটেম অবজেক্ট সংরক্ষণ করে। ডেটা পড়ার পরে এই কী সাধারণত পরিষ্কার করা হয়।

## Future Considerations for Database Backend / ডেটাবেস ব্যাকএন্ডের জন্য ভবিষ্যতের বিবেচনা

The current `localStorage`-based system is suitable for single-user demonstrations or personal use. For a production application, especially one intended for multiple users (e.g., multiple agents, admin oversight) or if data persistence beyond a single browser session is critical, migrating to a dedicated backend with a proper database (e.g., PostgreSQL, MySQL, Firestore, MongoDB) would be essential.

The recent refactoring of data management hooks (e.g., `useCountries`, `useServicePrices`, `useItineraryManager`) to encapsulate `localStorage` interactions is a foundational step. This modularization means that future migration would primarily involve updating the internal data loading and saving logic within these hooks to interact with an API layer connected to the chosen database, rather than rewriting large parts of the UI components.

**Benefits of a Database Backend:**
*   **Data Centralization & Synchronization:** All users access and modify the same data.
*   **User Authentication & Authorization:** Secure access control.
*   **Data Integrity & Backups:** Robust data management and recovery.
*   **Scalability:** Handles larger amounts of data and more users.
*   **Advanced Queries & Reporting:** Enables more complex data analysis.

This schema provides a foundational understanding of how data is managed locally within the Itinerary Ace application.
এই স্কিমাটি ইটিনেরারি এস অ্যাপ্লিকেশনের মধ্যে স্থানীয়ভাবে ডেটা কীভাবে পরিচালিত হয় তার একটি মৌলিক ধারণা প্রদান করে।
      
