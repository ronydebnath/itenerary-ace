import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/googleai'; // Removed googleAI plugin

export const ai = genkit({
  plugins: [/* googleAI() */], // Removed googleAI()
  // model: 'googleai/gemini-2.0-flash', // Default model not needed if not using googleAI plugin directly
});
