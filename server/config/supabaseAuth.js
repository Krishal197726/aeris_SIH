import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../../.env');

// Ensure root .env is loaded
dotenv.config({ path: rootEnvPath });

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabasePublishableKey = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)?.trim();

export const isSupabaseAuthConfigured = Boolean(supabaseUrl && supabasePublishableKey);

if (!isSupabaseAuthConfigured) {
  console.warn('[AERIS SUPABASE AUTH] Warning: SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY missing in .env.');
}

/**
 * Standard Supabase Client for End-User Authentication
 * Uses the public/anon publishable key for signup and password signin operations.
 */
export const supabaseAuth = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-publishable-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

export default supabaseAuth;
