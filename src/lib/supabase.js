import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[AERIS CLIENT] Warning: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is not defined.');
}

/**
 * Reusable Frontend Supabase Client
 * Configured for client-side authentication, automatic token refresh, and browser session persistence.
 * Uses ONLY the public/publishable anon key. Never contains service-role secrets.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-publishable-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

export default supabase;
