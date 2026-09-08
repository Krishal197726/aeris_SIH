/**
 * AERIS / WeatherGPT — Geocoding Service
 *
 * Resolves ANY place name to coordinates using Open-Meteo's free geocoding
 * API (no key required). Replaces reliance on the frontend's hardcoded
 * ~25-city GEO_REGISTRY for anything the backend needs to resolve itself.
 */

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const STOP_WORDS = new Set([
  'should', 'could', 'would', 'will', 'can', 'what', 'when', 'where', 'why', 'how',
  'is', 'are', 'was', 'were', 'do', 'does', 'did', 'tell', 'show', 'check', 'give',
  'please', 'my', 'the', 'weather', 'rain', 'today', 'tomorrow', 'crop', 'crops',
  'fertilizer', 'urea', 'irrigate', 'irrigation', 'spray', 'pesticide', 'farmer'
]);

export async function geocodeLocation(name) {
  if (!name || !name.trim()) return null;

  const cleanName = name.trim().replace(/[?!,.]/g, '');
  if (STOP_WORDS.has(cleanName.toLowerCase())) return null;

  const url = new URL(GEOCODE_URL);
  url.searchParams.set('name', cleanName);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  try {
    const resp = await fetch(url.toString());
    if (!resp.ok) return null;

    const data = await resp.json();
    const result = data?.results?.[0];
    if (!result) return null;

    return {
      name: result.name,
      district: result.name,
      state: result.admin1 || '',
      country: result.country || '',
      latitude: result.latitude,
      longitude: result.longitude
    };
  } catch (err) {
    return null;
  }
}

/**
 * Location-name extraction from a free-text query.
 * Prioritizes "in <Place>" / "at <Place>" / "near <Place>" patterns.
 */
export function extractLocationNameFromText(message) {
  if (!message) return null;

  // 1. Explicit prepositions: "in Ahmedabad", "at Surat", "near Pune", "for Rajkot"
  const prepositionMatch = message.match(/\b(?:in|at|near|around|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i);
  if (prepositionMatch && prepositionMatch[1]) {
    const candidate = prepositionMatch[1].trim();
    if (!STOP_WORDS.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return null;
}

/**
 * Resolves a usable location object for a chat request:
 * 1. Use lat/lng if the frontend already provided them.
 * 2. If providedLocation has a name (e.g. "Ahmedabad"), geocode it.
 * 3. Otherwise try to extract + geocode a place name from the raw message.
 * 4. Fall back to Ahmedabad (the product's default demo city) if nothing resolves.
 */
export async function resolveLocation(message, providedLocation) {
  if (providedLocation?.latitude && providedLocation?.longitude) {
    return {
      name: providedLocation.name || 'Current Location',
      district: providedLocation.name || 'Ahmedabad',
      state: providedLocation.state || 'Gujarat',
      country: providedLocation.country || 'India',
      latitude: Number(providedLocation.latitude),
      longitude: Number(providedLocation.longitude)
    };
  }

  if (providedLocation?.name && typeof providedLocation.name === 'string' && providedLocation.name.trim()) {
    try {
      const geocoded = await geocodeLocation(providedLocation.name);
      if (geocoded) return geocoded;
    } catch (_) {}
  }

  const extractedName = extractLocationNameFromText(message);
  if (extractedName) {
    try {
      const geocoded = await geocodeLocation(extractedName);
      if (geocoded) return geocoded;
    } catch (err) {
      console.error('[Geocode] Lookup failed for', extractedName, err.message);
    }
  }

  return {
    name: 'Ahmedabad',
    district: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    latitude: 23.0225,
    longitude: 72.5714
  };
}
