
import { config } from 'dotenv';
config();

// import '@/ai/flows/suggest-itinerary-refinements.ts'; // Removed import
import '@/ai/flows/describe-image-flow.ts';
import '@/ai/flows/extract-contract-data-flow.ts';
import '@/ai/flows/parse-activity-text-flow.ts'; // Ensure this line is present
