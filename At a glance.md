# Project Overview

This document provides a comprehensive overview of the project, covering its features, core logic, data flow, dependencies, and other relevant aspects to help developers quickly understand the software.

## Features

Based on the project structure and available files, the application appears to be a tool for managing and planning itineraries, with features for:

*   **Itinerary Planning:** Creation and management of multi-day itineraries, potentially including activities, accommodations, meals, and transfers. (Refer to `src/components/itinerary/itinerary-planner.tsx`, `src/components/itinerary/day-view.tsx`, `src/types/itinerary.ts`)
*   **Pricing Management:** Managing pricing for various services like activities, hotels, meals, and transfers, possibly with different prices based on location or other factors. (Refer to `src/app/admin/pricing`, `src/components/admin/pricing-manager.tsx`, `src/components/admin/service-pricing/`)
*   **Province Management:** Managing geographical locations or provinces, likely tied to pricing or other itinerary details. (Refer to `src/app/admin/provinces`, `src/components/admin/province-manager.tsx`)
*   **AI Integration:** Features leveraging AI, potentially for image description and contract data extraction. (Refer to `src/ai`, `src/app/image-describer/page.tsx`, `src/ai/flows/`)
*   **User Interface:** A web-based user interface built with React/Next.js.

Key calculations and business logic identified include:

*   **Itinerary Cost Calculation:** Based on the presence of `src/calculation-utils.ts` and `src/lib/calculation-utils.ts`, there are likely functions for calculating the total cost of an itinerary based on the included services and their associated prices. This might involve summing up costs for different items, potentially considering quantities, durations, or other factors.
*   **Pricing Logic:** The pricing management features in `src/app/admin/pricing` and related components suggest business logic for applying different prices based on service type, location (province), or other criteria. The forms within `src/components/admin/service-pricing/` provide hints about the data structure and rules for defining prices.
*   **AI Model Interactions:** The AI flows in `src/ai/flows/` encapsulate the logic for interacting with AI models for specific tasks like image description and contract data extraction. This involves sending data to the models and processing their responses.

## Data Flow Diagram (Textual Description)

The main data flow within the application can be described as follows:

1.  **Admin Data Management:** Administrators interact with the admin sections (`src/app/admin/`) to manage data such as provinces and service pricing. This data is likely stored in a backend database. Data flows from the admin forms to the backend for storage and retrieval.
3.  **AI Feature Data Flow:**
    *   For image description, users upload images through an interface (`src/app/image-describer/page.tsx`). The image data is sent to the AI flow (`src/ai/flows/describe-image-flow.ts`), which interacts with an AI model. The model's description is returned and displayed to the user.
    *   For contract data extraction, a similar flow likely exists where contract data (possibly text or a document) is sent to the extraction flow (`src/ai/flows/extract-contract-data-flow.ts`), processed by an AI model, and the extracted data is presented.

## Dependencies

The project has several key dependencies, both external and internal:

**External Dependencies (from `package.json`):**

*   **React and Next.js:** The core framework for building the web application.
*   **tailwindcss and postcss:** For styling the application.
*   **typescript:** For type-safe JavaScript development.
*   **lucide-react:** Likely for icons.
*   **react-hook-form and zod:** For form management and validation.
*   **@radix-ui/react-\*:** A collection of unstyled, accessible components used as building blocks for the UI.
*   **Other libraries:** Various other libraries for date manipulation, chart plotting, and other utilities.

**Internal Dependencies:**

*   **Custom Hooks:** The project utilizes custom hooks like `use-mobile.tsx`, `use-toast.ts`, `useHotelDefinitions.ts`, `useProvinces.ts`, and `useServicePrices.ts` to manage state and side effects.
*   **Utility Functions:** Shared utility functions are grouped in `src/lib/utils.ts` and potentially `src/calculation-utils.ts`.
*   **UI Components:** A set of reusable UI components built on top of `@radix-ui/react-\*` and styled with Tailwind CSS are located in `src/components/ui/`.
*   **AI Modules:** Internal modules and flows for interacting with AI models are in `src/ai/`.
## Other Aspects

*   **Project Structure:** The project follows a standard Next.js project structure, with `src/app` for pages, `src/components` for reusable components, `src/hooks` for custom hooks, `src/lib` for utility functions, `src/types` for TypeScript types, and `src/ai` for AI-related code.
*   **Styling:** Styling is managed using Tailwind CSS, with configuration in `tailwind.config.ts` and global styles in `src/app/globals.css`. The blueprint document (`docs/blueprint.md`) likely provides further details on styling guidelines and design principles.
*   **Testing:** The presence of a test file like `src/app/admin/pricing/new/page.test.tsx` indicates that the project incorporates testing, at least for certain components or pages.
*   **Blueprint Documentation:** The `docs/blueprint.md` file is a crucial resource for understanding the intended design, features, and potentially technical architecture of the project.

This overview provides a starting point for understanding the project. Developers should explore the codebase and the `docs/blueprint.md` file for more in-depth information.