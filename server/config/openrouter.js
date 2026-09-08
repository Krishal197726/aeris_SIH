import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const DEFAULT_OPENROUTER_MODEL = 'openrouter/free';

/**
 * Check if the OpenRouter API key is configured.
 * @returns {boolean}
 */
export function isOpenRouterConfigured() {
  const key = process.env.OPENROUTER_API_KEY;
  return Boolean(key && key.trim().length > 0 && !key.includes('your_openrouter_api_key'));
}

/**
 * Retrieve server-side OpenRouter configuration securely.
 * Throws a safe error if the API key is missing or unconfigured.
 * 
 * @returns {{ apiKey: string, model: string, baseUrl: string, headers: Record<string, string> }}
 */
export function getOpenRouterConfig() {
  if (!isOpenRouterConfigured()) {
    const error = new Error('OPENROUTER_API_KEY is not configured on the server.');
    error.code = 'OPENROUTER_KEY_MISSING';
    throw error;
  }

  const apiKey = process.env.OPENROUTER_API_KEY.trim();
  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
  const siteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  return {
    apiKey,
    model,
    baseUrl: OPENROUTER_BASE_URL,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl,
      'X-Title': 'AERIS Environmental & Agricultural Intelligence System',
      'Content-Type': 'application/json'
    }
  };
}

