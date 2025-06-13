import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing. Please check your .env.local file.'
  );
}

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client;
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase client is not configured. Returning a non-functional mock. Ensure .env.local is set up.");
    return {
        from: (table: string) => ({
            select: async (columns?: string, options?: any) => ({ data: [], error: { message: `Supabase not configured for table ${table} select` } }),
            insert: async (data: any, options?: any) => ({ data: [], error: { message: `Supabase not configured for table ${table} insert` } }),
            update: async (data: any, options?: any) => ({ data: [], error: { message: `Supabase not configured for table ${table} update` } }),
            delete: async (options?: any) => ({ data: [], error: { message: `Supabase not configured for table ${table} delete` } }),
            // Add other methods as needed by your application for the mock
            // For example, eq, single, etc., if used directly or chained.
            // This simple mock is primarily for basic CRUD and select.
            eq: () => ({ /* return 'this' or a new mock object for chaining */ }),
            single: async () => ({ data: null, error: { message: `Supabase not configured for table ${table} single` } }),
        }),
        // Add other Supabase client top-level methods if needed by your app
    } as any; 
  }
  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
