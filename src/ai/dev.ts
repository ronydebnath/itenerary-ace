
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-itinerary-refinements.ts';
import '@/ai/flows/describe-image-flow.ts';
import '@/ai/flows/extract-contract-data-flow.ts'; // Added this line
