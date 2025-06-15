
# Itinerary Ace - LocalStorage Data Schema

This document outlines the primary data structures used by the Itinerary Ace application and how they are stored in the browser's `localStorage`. Since this application does not use a traditional backend database for these core operational data, `localStorage` serves as its primary data persistence layer.

এই ডকুমেন্টটি ইটিনেরারি এস অ্যাপ্লিকেশন দ্বারা ব্যবহৃত প্রধান ডেটা কাঠামো এবং সেগুলি ব্রাউজারের `localStorage`-এ কীভাবে সংরক্ষণ করা হয় তার রূপরেখা দেয়। যেহেতু এই অ্যাপ্লিকেশনটি এই মূল অপারেশনাল ডেটার জন্য প্রচলিত ব্যাকএন্ড ডেটাবেস ব্যবহার করে না, `localStorage` এর প্রাথমিক ডেটা স্থায়ীত্ব স্তর হিসাবে কাজ করে।

## General Notes / সাধারণ নোট

*   **Data Format**: All data in `localStorage` is stored as JSON strings.
    *   **ডেটা ফরম্যাট**: `localStorage`-এর সমস্ত ডেটা JSON স্ট্রিং হিসাবে সংরক্ষণ করা হয়।
*   **Keys**: Specific keys are used to identify different data collections.
    *   **কী**: বিভিন্ন ডেটা সংগ্রহ সনাক্ত করতে নির্দিষ্ট কী ব্যবহার করা হয়।
*   **Relationships**: Relationships between data entities are typically managed through IDs (e.g., an `ItineraryItem` might reference a `ServicePriceItem` by its ID).
    *   **সম্পর্ক**: ডেটা সত্তাগুলির মধ্যে সম্পর্কগুলি সাধারণত আইডিগুলির মাধ্যমে পরিচালিত হয় (যেমন, একটি `ItineraryItem` তার আইডি দ্বারা একটি `ServicePriceItem`-কে রেফারেন্স করতে পারে)।

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
        *   Fields include: `id`, `itineraryName`, `clientName`, `createdAt`, `updatedAt`, `settings` (`TripSettings`), `pax` (`PaxDetails`), `travelers` (`Traveler[]`), `days` (object mapping day number to `DayItinerary`), `quotationRequestId`, `version`, `overallBookingStatus`.
        *   ক্ষেত্রগুলির মধ্যে রয়েছে: `id`, `itineraryName`, `clientName`, `createdAt`, `updatedAt`, `settings` (`TripSettings`), `pax` (`PaxDetails`), `travelers` (`Traveler[]`), `days` (দিনের নম্বর থেকে `DayItinerary`-তে ম্যাপিং অবজেক্ট), `quotationRequestId`, `version`, `overallBookingStatus`।
    *   `ItineraryMetadata` (from `src/types/itinerary.ts`): Basic info for the index.
        *   `ItineraryMetadata` (`src/types/itinerary.ts` থেকে): সূচকের জন্য প্রাথমিক তথ্য।
        *   Fields: `id`, `itineraryName`, `clientName`, `createdAt`, `updatedAt`.
        *   ক্ষেত্র: `id`, `itineraryName`, `clientName`, `createdAt`, `updatedAt`।
    *   `ItineraryItem` (from `src/types/itinerary.ts`): Union type for items like `TransferItem`, `ActivityItem`, `HotelItem`, `MealItem`, `MiscItem`.
        *   `ItineraryItem` (`src/types/itinerary.ts` থেকে): `TransferItem`, `ActivityItem`, `HotelItem`, `MealItem`, `MiscItem`-এর মতো আইটেমগুলির জন্য ইউনিয়ন টাইপ।

### 2. Service Prices (পরিষেবার মূল্য)

*   **Description**: Master list of predefined prices for various services (hotels, activities, transfers, meals, misc). These are used to populate options and default pricing in the itinerary planner.
    *   **বিবরণ**: বিভিন্ন পরিষেবার (হোটেল, কার্যকলাপ, ট্রান্সফার, খাবার, বিবিধ) জন্য পূর্বনির্ধারিত মূল্যের মাস্টার তালিকা। এগুলি ভ্রমণপথ পরিকল্পনাকারীতে বিকল্প এবং ডিফল্ট মূল্য পূরণ করতে ব্যবহৃত হয়।
*   **Storage Key / স্টোরেজ কী**: `itineraryAceServicePrices`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `ServicePriceItem[]` (from `src/types/itinerary.ts`)
    *   Fields include: `id`, `name`, `countryId`, `province`, `category`, `price1`, `price2`, `subCategory`, `transferMode`, `vehicleOptions`, `currency`, `unitDescription`, `notes`, `hotelDetails` (links to a `HotelDefinition` structure if category is 'hotel'), `activityPackages`.
    *   ক্ষেত্রগুলির মধ্যে রয়েছে: `id`, `name`, `countryId`, `province`, `category`, `price1`, `price2`, `subCategory`, `transferMode`, `vehicleOptions`, `currency`, `unitDescription`, `notes`, `hotelDetails` (যদি বিভাগ 'hotel' হয় তবে `HotelDefinition` কাঠামোর সাথে লিঙ্ক করে), `activityPackages`।

### 3. Hotel Definitions (হোটেল সংজ্ঞা)

*   **Description**: Master list of hotel details, including their available room types and seasonal pricing for those room types. This is referenced by `ServicePriceItem` when the category is 'hotel'.
    *   **বিবরণ**: হোটেলের বিবরণগুলির মাস্টার তালিকা, যার মধ্যে তাদের উপলব্ধ রুমের প্রকার এবং সেই রুমের প্রকারগুলির জন্য মরশুমি মূল্য অন্তর্ভুক্ত রয়েছে। এটি `ServicePriceItem` দ্বারা রেফারেন্স করা হয় যখন বিভাগ 'hotel' হয়।
*   **Storage Key / স্টোরেজ কী**: `itineraryAceHotelDefinitions`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `HotelDefinition[]` (from `src/types/itinerary.ts`)
    *   Fields include: `id`, `name`, `countryId`, `province`, `starRating`, `roomTypes` (`HotelRoomTypeDefinition[]`).
    *   ক্ষেত্রগুলির মধ্যে রয়েছে: `id`, `name`, `countryId`, `province`, `starRating`, `roomTypes` (`HotelRoomTypeDefinition[]`)।
    *   Each `HotelRoomTypeDefinition` includes: `id`, `name`, `extraBedAllowed`, `notes`, `seasonalPrices` (`RoomTypeSeasonalPrice[]`), `characteristics`.
    *   প্রতিটি `HotelRoomTypeDefinition`-এ অন্তর্ভুক্ত: `id`, `name`, `extraBedAllowed`, `notes`, `seasonalPrices` (`RoomTypeSeasonalPrice[]`), `characteristics`।

### 4. Countries (দেশ)

*   **Description**: List of countries used for location selection and filtering. Each country has a default currency.
    *   **বিবরণ**: অবস্থান নির্বাচন এবং ফিল্টারিংয়ের জন্য ব্যবহৃত দেশগুলির তালিকা। প্রতিটি দেশের একটি ডিফল্ট মুদ্রা রয়েছে।
*   **Storage Key / স্টোরেজ কী**: `itineraryAceCountries`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `CountryItem[]` (from `src/types/itinerary.ts`)
    *   Fields: `id`, `name`, `defaultCurrency`.
    *   ক্ষেত্র: `id`, `name`, `defaultCurrency`।

### 5. Provinces (প্রদেশ)

*   **Description**: List of provinces or regions, each linked to a parent country. Used for more granular location selection.
    *   **বিবরণ**: প্রদেশ বা অঞ্চলের তালিকা, প্রতিটি একটি মূল দেশের সাথে লিঙ্ক করা। আরও বিস্তারিত অবস্থান নির্বাচনের জন্য ব্যবহৃত হয়।
*   **Storage Key / স্টোরেজ কী**: `itineraryAceProvinces`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `ProvinceItem[]` (from `src/types/itinerary.ts`)
    *   Fields: `id`, `name`, `countryId`.
    *   ক্ষেত্র: `id`, `name`, `countryId`।

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
        *   Fields: `id`, `name`, `mainAddress` (`AgentAddress`), `contactEmail`, `contactPhone`, `preferredCurrency`.
        *   ক্ষেত্র: `id`, `name`, `mainAddress` (`AgentAddress`), `contactEmail`, `contactPhone`, `preferredCurrency`।
    *   `AgentProfile` (from `src/types/agent.ts`): Profile information for an individual agent.
        *   `AgentProfile` (`src/types/agent.ts` থেকে): একজন স্বতন্ত্র এজেন্টের প্রোফাইল তথ্য।
        *   Fields: `id`, `agencyId`, `fullName`, `email`, `phoneNumber`, `agencyName`, `specializations`, `yearsOfExperience`, `bio`, `profilePictureUrl`.
        *   ক্ষেত্র: `id`, `agencyId`, `fullName`, `email`, `phoneNumber`, `agencyName`, `specializations`, `yearsOfExperience`, `bio`, `profilePictureUrl`।

### 7. Quotation Requests (উদ্ধৃতি অনুরোধ)

*   **Description**: Stores quotation requests submitted by agents. These requests contain client needs and trip preferences.
    *   **বিবরণ**: এজেন্টদের দ্বারা জমা দেওয়া উদ্ধৃতি অনুরোধগুলি সংরক্ষণ করে। এই অনুরোধগুলিতে ক্লায়েন্টের প্রয়োজন এবং ভ্রমণের পছন্দ থাকে।
*   **Storage Key / স্টোরেজ কী**: `itineraryAce_agentQuotationRequests`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `QuotationRequest[]` (from `src/types/quotation.ts`)
    *   Fields include: `id`, `requestDate`, `agentId`, `clientInfo`, `tripDetails`, `accommodationPrefs`, `activityPrefs`, `flightPrefs`, `mealPrefs`, `otherRequirements`, `status`, `linkedItineraryId`, `updatedAt`.
    *   ক্ষেত্রগুলির মধ্যে রয়েছে: `id`, `requestDate`, `agentId`, `clientInfo`, `tripDetails`, `accommodationPrefs`, `activityPrefs`, `flightPrefs`, `mealPrefs`, `otherRequirements`, `status`, `linkedItineraryId`, `updatedAt`।

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
    *   `ExchangeRate` (from `src/types/itinerary.ts`): `id`, `fromCurrency`, `toCurrency`, `rate`, `updatedAt`, `source`.
        *   `ExchangeRate` (`src/types/itinerary.ts` থেকে): `id`, `fromCurrency`, `toCurrency`, `rate`, `updatedAt`, `source`।
    *   `SpecificMarkupRate` (from `src/types/itinerary.ts`): `id`, `fromCurrency`, `toCurrency`, `markupPercentage`, `updatedAt`.
        *   `SpecificMarkupRate` (`src/types/itinerary.ts` থেকে): `id`, `fromCurrency`, `toCurrency`, `markupPercentage`, `updatedAt`।

### 9. Temporary Data (অস্থায়ী ডেটা)

*   **Description**: Used for temporarily holding data, for example, when prefilling a form after an AI parsing operation.
    *   **বিবরণ**: অস্থায়ীভাবে ডেটা ধরে রাখতে ব্যবহৃত হয়, উদাহরণস্বরূপ, একটি AI পার্সিং অপারেশনের পরে একটি ফর্ম প্রিফিল করার সময়।
*   **Storage Key / স্টোরেজ কী**: `tempServicePricePrefillData`
*   **Primary TypeScript Type / প্রধান TypeScript টাইপ**: `Partial<ServicePriceItem>` (from `src/types/itinerary.ts`)
    *   Stores a partial service price item object to prefill the service price creation form. This key is typically cleared after the data is read.
    *   পরিষেবা মূল্য তৈরির ফর্ম প্রিফিল করার জন্য একটি আংশিক পরিষেবা মূল্য আইটেম অবজেক্ট সংরক্ষণ করে। ডেটা পড়ার পরে এই কী সাধারণত পরিষ্কার করা হয়।

This schema provides a foundational understanding of how data is managed locally within the Itinerary Ace application.
এই স্কিমাটি ইটিনেরারি এস অ্যাপ্লিকেশনের মধ্যে স্থানীয়ভাবে ডেটা কীভাবে পরিচালিত হয় তার একটি মৌলিক ধারণা প্রদান করে।
      