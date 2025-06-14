import {genkit} from 'genkit';
// No plugins needed for the current OpenRouter-based flows

export const ai = genkit({
  plugins: [],
  // No default model needed here as flows specify their models.
});
