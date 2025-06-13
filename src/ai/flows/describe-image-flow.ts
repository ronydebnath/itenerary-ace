/**
 * @fileoverview This file implements a Genkit flow named 'describeImageGenkitFlow'
 * designed to take an image (as a data URI) and return a textual description of it.
 * It interacts with the OpenRouter API, specifically using the "google/gemma-3n-e4b-it:free" model,
 * to perform the image description task. The flow handles API key management from
 * environment variables and includes error handling for API requests.
 *
 * It exports the following:
 * - `describeImage`: An async function that serves as the public interface to call the Genkit flow.
 * - `DescribeImageInput`: The Zod schema type for the input to the `describeImage` function.
 * - `DescribeImageOutput`: The Zod schema type for the output from the `describeImage` function.
 *
 * @bangla এই ফাইলটি 'describeImageGenkitFlow' নামে একটি Genkit ফ্লো প্রয়োগ করে।
 * এটি একটি ছবি (ডেটা URI হিসাবে) গ্রহণ করে এবং তার একটি পাঠ্য বিবরণ প্রদান করার জন্য ডিজাইন করা হয়েছে।
 * এটি OpenRouter API-এর সাথে ইন্টারঅ্যাক্ট করে, বিশেষত "google/gemma-3n-e4b-it:free" মডেল ব্যবহার করে,
 * ছবির বিবরণ টাস্ক সম্পাদন করার জন্য। এই ফ্লো পরিবেশ পরিবর্তনশীল থেকে API কী পরিচালনা করে এবং
 * API অনুরোধগুলির জন্য ত্রুটি হ্যান্ডলিং অন্তর্ভুক্ত করে।
 *
 * এটি নিম্নলিখিতগুলি রপ্তানি করে:
 * - `describeImage`: একটি অ্যাসিঙ্ক্রোনাস ফাংশন যা Genkit ফ্লো কল করার জন্য পাবলিক ইন্টারফেস হিসেবে কাজ করে।
 * - `DescribeImageInput`: `describeImage` ফাংশনের ইনপুটের জন্য Zod স্কিমা টাইপ।
 * - `DescribeImageOutput`: `describeImage` ফাংশনের আউটপুটের জন্য Zod স্কিমা টাইপ।
 */
'use server';

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

// Exported function now calls the Genkit flow
export async function describeImage(input: DescribeImageInput): Promise<DescribeImageOutput> {
  return describeImageGenkitFlow(input);
}

const describeImageGenkitFlow = ai.defineFlow(
  {
    name: 'describeImageGenkitFlow', // Changed name for clarity
    inputSchema: DescribeImageInputSchema,
    outputSchema: DescribeImageOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const httpReferer = process.env.OPENROUTER_HTTP_REFERER;
    const xTitle = process.env.OPENROUTER_X_TITLE;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openrouter_api_key_here') {
      const errorMsg = "OpenRouter API key is not configured. Please ensure OPENROUTER_API_KEY is set correctly in your .env file at the project root (it should not be empty, whitespace, or the placeholder value) and restart your development server.";
      console.error(errorMsg);
      throw new Error(errorMsg);
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
          "model": "google/gemma-3n-e4b-it:free",
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
      // Check if the error message is the specific API key configuration error to avoid duplicating the detailed message
      if (error.message.startsWith("OpenRouter API key is not configured")) {
        throw error;
      }
      throw new Error(`Failed to describe image: ${error.message}`);
    }
  }
);
