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
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim();

/**
 * Startup environment validation
 * Validates presence of required Supabase credentials without exposing secrets
 */
export function validateSupabaseEnv() {
  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseSecretKey) missing.push('SUPABASE_SECRET_KEY');

  if (missing.length > 0) {
    console.warn(`[AERIS SUPABASE CONFIG] Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn('[AERIS SUPABASE CONFIG] Please provide SUPABASE_URL and SUPABASE_SECRET_KEY in your .env file.');
    return false;
  }

  console.log('[AERIS SUPABASE CONFIG] Environment validation passed:');
  console.log(`- SUPABASE_URL: ${supabaseUrl}`);
  console.log(`- SUPABASE_SECRET_KEY: [CONFIGURED] (${supabaseSecretKey.length} characters)`);
  return true;
}

// Run startup check
export const isSupabaseConfigured = validateSupabaseEnv();

/**
 * Privileged Supabase Server Client (Service Role)
 * Configured specifically for server-side operations (no session persistence, no token refresh)
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseSecretKey || 'placeholder-secret-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

export default supabase;
