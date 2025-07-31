
import { createBrowserClient } from '@supabase/ssr';
import { type Database } from './database.types';

// This is a client-side only supabase client.
// It is used for client-side authentication and data fetching.
// Do not use this on the server.
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
