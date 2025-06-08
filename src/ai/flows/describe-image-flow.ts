
'use server';
/**
 * @fileOverview A Genkit flow to describe an image using the OpenRouter API.
 *
 * - describeImage - A function that takes an image data URI and returns a description.
 * - DescribeImageInput - The input type for the describeImage function.
 * - DescribeImageOutput - The return type for the describeImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DescribeImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to be described, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescribeImageInput = z.infer<typeof DescribeImageInputSchema>;

const DescribeImageOutputSchema = z.object({
  description: z.string().describe('The textual description of the image.'),
});
export type DescribeImageOutput = z.infer<typeof DescribeImageOutputSchema>;

export async function describeImage(input: DescribeImageInput): Promise<DescribeImageOutput> {
  return describeImageFlow(input);
}

const describeImageFlow = ai.defineFlow(
  {
    name: 'describeImageFlow',
    inputSchema: DescribeImageInputSchema,
    outputSchema: DescribeImageOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const httpReferer = process.env.OPENROUTER_HTTP_REFERER;
    const xTitle = process.env.OPENROUTER_X_TITLE;

    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      console.error('OpenRouter API key is missing or not configured in .env file.');
      throw new Error('OpenRouter API key is not configured.');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    if (httpReferer) {
      headers['HTTP-Referer'] = httpReferer;
    }
    if (xTitle) {
      headers['X-Title'] = xTitle;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          "model": "google/gemma-3-27b-it:free", // As specified in your example
          "messages": [
            {
              "role": "user",
              "content": [
                {
                  "type": "text",
                  "text": "What is in this image?"
                },
                {
                  "type": "image_url",
                  "image_url": {
                    "url": input.imageDataUri
                  }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`OpenRouter API Error: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`OpenRouter API request failed with status ${response.status}: ${errorBody}`);
      }

      const data = await response.json();

      if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return { description: data.choices[0].message.content };
      } else {
        console.error('Unexpected response structure from OpenRouter API:', data);
        throw new Error('Failed to extract description from OpenRouter API response.');
      }
    } catch (error: any) {
      console.error('Error calling OpenRouter API:', error);
      throw new Error(`Failed to describe image: ${error.message}`);
    }
  }
);
