import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing. Please check your .env.local file.'
  );
}

// Memoize the client so it's created only once.
let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client;
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client or throw an error if not configured,
    // to prevent app crash during build or if env vars are missing.
    // This mock won't work for actual operations but prevents errors on access.
    console.warn("Supabase client is not configured. Returning a non-functional mock. Ensure .env.local is set up.");
    return {
        from: (table: string) => ({
            select: async () => ({ data: [], error: { message: `Supabase not configured for table ${table}` } }),
            insert: async () => ({ data: [], error: { message: `Supabase not configured for table ${table}` } }),
            update: async () => ({ data: [], error: { message: `Supabase not configured for table ${table}` } }),
            delete: async () => ({ data: [], error: { message: `Supabase not configured for table ${table}` } }),
        }),
        // Add other Supabase client methods if needed by your app, mocking them similarly
    } as any; // Cast to any to satisfy SupabaseClient type for mock
  }
  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
