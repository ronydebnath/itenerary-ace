import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Supabase URL or Anon Key is not set. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are in your .env.local file if you plan to use Supabase client features (e.g., Auth, Storage).'
    );
  }
}

// Create a single supabase client for interacting with your database
export const supabase = 
  (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Optional: Helper function for components to get the client,
// which can be useful if you want to handle the null case more gracefully.
export function getSupabaseClient() {
  if (!supabase) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("Supabase client was requested but is not configured. Returning null.");
    }
    // In a real app, you might throw an error here or handle it differently
    // depending on whether Supabase client features are critical.
  }
  return supabase;
}
