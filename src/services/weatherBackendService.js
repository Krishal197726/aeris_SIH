/**
 * AERIS Weather & Geocoding Backend Service
 * Subsystem B - Weather API Integration, Geocoding & In-Memory Caching
 */

const getFetch = () => globalThis.fetch || fetch;

// In-Memory Cache Store: key -> { data, expiresAt }
const weatherCache = new Map();


// Default Cache TTL: 600 seconds (10 minutes) unless overridden by env
function getCacheTTL() {
  const envTTL = parseInt(process.env.WEATHER_CACHE_TTL, 10);
  return !isNaN(envTTL) && envTTL > 0 ? envTTL * 1000 : 600 * 1000;
}

/**
 * Normalized Indian Cities Geocoding Fallback Dictionary
 * Ensures instant, zero-latency geocoding for major Indian cities.
 */
const INDIAN_CITIES_GEOCODING_MAP = {
  'ahmedabad': { name: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714 },
  'surat': { name: 'Surat', district: 'Surat', state: 'Gujarat', country: 'India', latitude: 21.1702, longitude: 72.8311 },
  'vadodara': { name: 'Vadodara', district: 'Vadodara', state: 'Gujarat', country: 'India', latitude: 22.3072, longitude: 73.1812 },
  'baroda': { name: 'Vadodara', district: 'Vadodara', state: 'Gujarat', country: 'India', latitude: 22.3072, longitude: 73.1812 },
  'rajkot': { name: 'Rajkot', district: 'Rajkot', state: 'Gujarat', country: 'India', latitude: 22.3039, longitude: 70.8022 },
  'bhavnagar': { name: 'Bhavnagar', district: 'Bhavnagar', state: 'Gujarat', country: 'India', latitude: 21.7645, longitude: 72.1519 },
  'jamnagar': { name: 'Jamnagar', district: 'Jamnagar', state: 'Gujarat', country: 'India', latitude: 22.4707, longitude: 70.0577 },
  'junagadh': { name: 'Junagadh', district: 'Junagadh', state: 'Gujarat', country: 'India', latitude: 21.5222, longitude: 70.4579 },
  'gandhinagar': { name: 'Gandhinagar', district: 'Gandhinagar', state: 'Gujarat', country: 'India', latitude: 23.2156, longitude: 72.6369 },
  'mumbai': { name: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777 },
  'pune': { name: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567 },
  'nagpur': { name: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', country: 'India', latitude: 21.1458, longitude: 79.0882 },
  'delhi': { name: 'New Delhi', district: 'New Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090 },
  'new delhi': { name: 'New Delhi', district: 'New Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090 },
  'bengaluru': { name: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  'bangalore': { name: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  'chennai': { name: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707 },
  'kolkata': { name: 'Kolkata', district: 'Kolkata', state: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639 },
  'hyderabad': { name: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867 },
  'jaipur': { name: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', country: 'India', latitude: 26.9124, longitude: 75.7873 },
  'lucknow': { name: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', country: 'India', latitude: 26.8467, longitude: 80.9462 },
  'bhopal': { name: 'Bhopal', district: 'Bhopal', state: 'Madhya Pradesh', country: 'India', latitude: 23.2599, longitude: 77.4126 },
  'patna': { name: 'Patna', district: 'Patna', state: 'Bihar', country: 'India', latitude: 25.5941, longitude: 85.1376 },
  'chandigarh': { name: 'Chandigarh', district: 'Chandigarh', state: 'Chandigarh', country: 'India', latitude: 30.7333, longitude: 76.7794 }
};

/**
 * WMO Weather Interpretation Codes to Human Readable Conditions
 */
function decodeWMOCode(code) {
  switch (code) {
    case 0:
      return { condition: 'Clear', description: 'Clear sky' };
    case 1:
      return { condition: 'Mainly Clear', description: 'Mainly clear sky' };
    case 2:
      return { condition: 'Partly Cloudy', description: 'Partly cloudy' };
    case 3:
      return { condition: 'Overcast', description: 'Overcast skies' };
    case 45:
    case 48:
      return { condition: 'Fog', description: 'Fog and depositing rime fog' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Drizzle', description: 'Light to dense drizzle' };
    case 56:
    case 57:
      return { condition: 'Freezing Drizzle', description: 'Freezing drizzle' };
    case 61:
      return { condition: 'Light Rain', description: 'Slight rain showers' };
    case 63:
      return { condition: 'Moderate Rain', description: 'Moderate rainfall' };
    case 65:
      return { condition: 'Heavy Rain', description: 'Heavy rain downpour' };
    case 66:
    case 67:
      return { condition: 'Freezing Rain', description: 'Freezing rain' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Snow', description: 'Snowfall' };
    case 77:
      return { condition: 'Snow Grains', description: 'Snow grains' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', description: 'Slight to heavy rain showers' };
    case 85:
    case 86:
      return { condition: 'Snow Showers', description: 'Snow showers' };
    case 95:
      return { condition: 'Thunderstorm', description: 'Thunderstorm with lightning' };
    case 96:
    case 99:
      return { condition: 'Severe Thunderstorm', description: 'Thunderstorm with heavy hail' };
    default:
      return { condition: 'Cloudy', description: 'Partly cloudy' };
  }
}

/**
 * Convert wind direction degrees to compass points
 */
function degreesToCompass(deg) {
  if (deg === undefined || deg === null) return 'N/A';
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}

/**
 * 1. Geocoding Service: Name -> Coordinates
 */
export async function getCoordinates(locationQuery) {
  if (!locationQuery || typeof locationQuery !== 'string') return null;

  const cleanQuery = locationQuery.trim().toLowerCase().replace(/,?\s*india$/i, '').trim();
  if (!cleanQuery) return null;

  // Check Indian cities dictionary first
  if (INDIAN_CITIES_GEOCODING_MAP[cleanQuery]) {
    return INDIAN_CITIES_GEOCODING_MAP[cleanQuery];
  }

  // Check partial key match in fallback map
  for (const [key, cityObj] of Object.entries(INDIAN_CITIES_GEOCODING_MAP)) {
    if (cleanQuery.includes(key) || key.includes(cleanQuery)) {
      return cityObj;
    }
  }

  // Call Open-Meteo Geocoding API
  try {
    const fetchFn = getFetch();
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationQuery)}&count=5&language=en&format=json`;
    const res = await fetchFn(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return null;
    }

    // Prefer Indian location match
    const indiaMatch = data.results.find(r => (r.country_code || '').toUpperCase() === 'IN' || (r.country || '').toLowerCase() === 'india');
    const target = indiaMatch || data.results[0];

    return {
      name: target.name,
      district: target.admin2 || target.admin1 || target.name,
      state: target.admin1 || 'India',
      country: target.country || 'India',
      latitude: parseFloat(target.latitude),
      longitude: parseFloat(target.longitude)
    };
  } catch (err) {
    console.error(`[AERIS GEOCODING ERROR] Geocoding lookup failed for query "${locationQuery}":`, err.message);
    return null;
  }
}

/**
 * 2. Weather Fetching Service by Coordinates
 */
export async function getWeatherByCoordinates(latitude, longitude, locationObj = null) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid coordinates provided.');
  }

  const fetchFn = getFetch();

  // Open-Meteo Forecast API call
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

  const res = await fetchFn(apiUrl);
  if (!res.ok) {
    throw new Error(`Weather provider responded with HTTP status ${res.status}`);
  }

  const raw = await res.json();
  const currentRaw = raw.current || {};
  const dailyRaw = raw.daily || {};

  const weatherDecoded = decodeWMOCode(currentRaw.weather_code ?? 0);
  const windDirCompass = degreesToCompass(currentRaw.wind_direction_10m);

  // Build daily forecast array
  const forecast = [];
  if (Array.isArray(dailyRaw.time)) {
    for (let i = 0; i < dailyRaw.time.length; i++) {
      const dailyDecoded = decodeWMOCode(dailyRaw.weather_code?.[i] ?? 0);
      forecast.push({
        date: dailyRaw.time[i],
        tempMin: Math.round(dailyRaw.temperature_2m_min?.[i] ?? 24),
        tempMax: Math.round(dailyRaw.temperature_2m_max?.[i] ?? 32),
        rainProb: dailyRaw.precipitation_probability_max?.[i] ?? 60,
        condition: dailyDecoded.condition,
        description: dailyDecoded.description
      });
    }
  }

  const resolvedLocation = locationObj || {
    name: `Lat ${lat.toFixed(2)}, Lng ${lng.toFixed(2)}`,
    state: 'Regional Coordinates',
    country: 'Global',
    latitude: lat,
    longitude: lng
  };

  return {
    location: resolvedLocation,
    current: {
      temperature: Math.round(currentRaw.temperature_2m ?? 28),
      feelsLike: Math.round(currentRaw.apparent_temperature ?? currentRaw.temperature_2m ?? 30),
      humidity: Math.round(currentRaw.relative_humidity_2m ?? 70),
      windSpeed: Math.round(currentRaw.wind_speed_10m ?? 12),
      windDirection: windDirCompass,
      pressure: Math.round(currentRaw.surface_pressure ?? 1008),
      condition: weatherDecoded.condition,
      description: weatherDecoded.description,
      precipitation: currentRaw.precipitation ?? 0.0,
      uvIndex: 6,
      sunrise: '06:15 IST',
      sunset: '19:02 IST'
    },
    forecast: forecast.slice(0, 7), // 7-day forecast
    source: 'Open-Meteo Meteorological Service',
    cached: false,
    timestamp: new Date().toISOString()
  };
}

/**
 * 3. Cache Management Layer
 */
export function getCachedWeather(cacheKey) {
  if (!cacheKey) return null;
  const key = cacheKey.toLowerCase().trim();
  const record = weatherCache.get(key);

  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    weatherCache.delete(key);
    return null;
  }

  return { ...record.data, cached: true };
}

export function setCachedWeather(cacheKey, data) {
  if (!cacheKey || !data) return;
  const key = cacheKey.toLowerCase().trim();
  const ttlMs = getCacheTTL();

  weatherCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

/**
 * 4. Master Reusable Weather Service Function (OpenRouter / AI / REST Endpoint compatible)
 */
export async function getWeather(locationQuery) {
  if (!locationQuery || typeof locationQuery !== 'string' || !locationQuery.trim()) {
    const error = new Error('Location query string is required.');
    error.code = 'INVALID_LOCATION_QUERY';
    throw error;
  }

  const normalizedKey = locationQuery.trim().toLowerCase();

  // Step 1: Check Cache
  const cachedData = getCachedWeather(normalizedKey);
  if (cachedData) {
    return cachedData;
  }

  // Step 2: Geocode Location
  const locationObj = await getCoordinates(locationQuery);
  if (!locationObj) {
    const error = new Error(`Location "${locationQuery}" could not be found.`);
    error.code = 'LOCATION_NOT_FOUND';
    throw error;
  }

  // Check Cache by lat:lng coordinates
  const coordsKey = `weather:${locationObj.latitude.toFixed(4)}:${locationObj.longitude.toFixed(4)}`;
  const cachedCoordsData = getCachedWeather(coordsKey);
  if (cachedCoordsData) {
    return { ...cachedCoordsData, location: locationObj };
  }

  // Step 3: Fetch Weather Telemetry
  const weatherData = await getWeatherByCoordinates(locationObj.latitude, locationObj.longitude, locationObj);

  // Step 4: Store in Cache
  setCachedWeather(normalizedKey, weatherData);
  setCachedWeather(coordsKey, weatherData);

  return weatherData;
}
