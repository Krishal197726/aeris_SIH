/**
 * AERIS Frontend Weather Client Service
 * Calls backend /api/weather endpoint for real-time telemetry and caching
 */

/**
 * Fetch live normalized weather telemetry from AERIS backend gateway
 * @param {string} locationQuery City name, district, or query string
 * @returns {Promise<Object>} Normalized weather response
 */
export async function fetchLiveWeather(locationQuery) {
  if (!locationQuery || typeof locationQuery !== 'string' || !locationQuery.trim()) {
    throw new Error('Please enter a location name.');
  }

  const encoded = encodeURIComponent(locationQuery.trim());
  const response = await fetch(`/api/weather?location=${encoded}`);

  const data = await response.json();
  if (!response.ok || !data.success) {
    const errorMessage = data.error?.message || `Failed to fetch weather data for "${locationQuery}".`;
    const err = new Error(errorMessage);
    err.code = data.error?.code || 'WEATHER_FETCH_FAILED';
    throw err;
  }

  return data;
}

/**
 * Search locations for auto-completion
 * @param {string} query Search term
 * @returns {Promise<Array>} List of location matches
 */
export async function searchLocations(query) {
  if (!query || !query.trim()) return [];

  try {
    const encoded = encodeURIComponent(query.trim());
    const response = await fetch(`/api/locations/search?q=${encoded}`);
    const data = await response.json();
    if (!response.ok || !data.success) return [];
    return data.results || [];
  } catch (err) {
    console.error('Failed to search locations:', err);
    return [];
  }
}
