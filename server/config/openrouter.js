/**
 * AERIS / WeatherGPT — OpenRouter Configuration Module
 * 
 * STRICT SECURITY GOVERNANCE:
 * - OPENROUTER_API_KEY is a server-only secret loaded from process.env.
 * - NEVER log, print, or expose the API key in client bundles, Vite configs, or API responses.
 */

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const DEFAULT_OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';

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
      'X-Title': 'AERIS Environmental Intelligence System',
      'Content-Type': 'application/json'
    }
  };
}
