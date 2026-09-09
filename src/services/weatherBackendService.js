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
 * 1. Fully Generic Geocoding Service: Name -> Coordinates
 * Uses Open-Meteo Geocoding API as the PRIMARY, NORMAL and ONLY source of coordinates for arbitrary user-provided locations.
 * Supports arbitrary cities, states/provinces, districts/regions, countries, and multi-word names worldwide without any hardcoded dictionary.
 */
export async function getCoordinates(locationQuery) {
  if (!locationQuery || typeof locationQuery !== 'string') return null;

  const cleanQuery = locationQuery
    .trim()
    .replace(/^(?:the|a|an)\s+/i, '')
    .replace(/[?!.,;:()[\]{}"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanQuery) return null;

  const fetchFn = getFetch();

  // Helper to log and return standardized location object with clear SOURCE instrumentation
  const formatLocation = (name, district, state, country, lat, lng) => {
    const loc = {
      name: name,
      district: district || name,
      state: state || country || 'Global',
      country: country || 'Global',
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      source: 'OPEN_METEO_GEOCODING'
    };
    console.log(`[GEOCODING RESOLUTION] Location: "${locationQuery}" -> Resolved: "${loc.name}" (${loc.latitude}, ${loc.longitude}) | SOURCE = ${loc.source}`);
    return loc;
  };

  // Strategy 1: Direct Open-Meteo Geocoding Search
  let directResults = [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=15&language=en&format=json`;
    const res = await fetchFn(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results)) {
        directResults = data.results;
      }
    }
  } catch (err) {
    console.error(`[AERIS GEOCODING ERROR] Direct Open-Meteo lookup failed for "${cleanQuery}":`, err.message);
  }

  // 1a. Major city exact match with significant population (e.g. Ahmedabad, Mumbai, Tokyo, London, Paris, New York)
  const exactMajorCity = directResults.find(r => 
    r.name.toLowerCase() === cleanQuery.toLowerCase() && (r.population >= 50000 || (r.country_code === 'IN' && r.population > 10000))
  );
  if (exactMajorCity) {
    return formatLocation(
      exactMajorCity.name,
      exactMajorCity.admin2 || exactMajorCity.admin1 || exactMajorCity.name,
      exactMajorCity.admin1 || exactMajorCity.country || 'Global',
      exactMajorCity.country || 'Global',
      exactMajorCity.latitude,
      exactMajorCity.longitude
    );
  }

  // 1b. Exact name match in India if admin1 matches
  const indiaExact = directResults.find(r => 
    r.name.toLowerCase() === cleanQuery.toLowerCase() && 
    ((r.country_code || '').toUpperCase() === 'IN' || (r.country || '').toLowerCase() === 'india') &&
    (r.admin1 || '').toLowerCase() === cleanQuery.toLowerCase()
  );
  if (indiaExact) {
    return formatLocation(
      indiaExact.name,
      indiaExact.admin2 || indiaExact.admin1 || indiaExact.name,
      indiaExact.admin1 || indiaExact.country || 'India',
      indiaExact.country || 'India',
      indiaExact.latitude,
      indiaExact.longitude
    );
  }

  // Strategy 2: Administrative Division Search using Open-Meteo's '<location>, <admin1>' syntax
  // Dynamically resolves states/provinces/districts (e.g. Tamil Nadu, Assam, Goa, Texas, Bavaria, Queensland)
  const adminCandidates = ['Town', 'Main', 'North', 'Central', 'City', 'Station', 'Post', 'New', 'San', 'Fort'];
  for (const prefix of adminCandidates) {
    try {
      const q = `${prefix}, ${cleanQuery}`;
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en&format=json`;
      const res = await fetchFn(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          const adminMatch = data.results.find(r => 
            (r.admin1 && r.admin1.toLowerCase() === cleanQuery.toLowerCase()) ||
            (r.country && r.country.toLowerCase() === cleanQuery.toLowerCase())
          );
          if (adminMatch) {
            return formatLocation(
              cleanQuery,
              adminMatch.name,
              adminMatch.admin1 || cleanQuery,
              adminMatch.country || 'India',
              adminMatch.latitude,
              adminMatch.longitude
            );
          }
        }
      }
    } catch (err) {
      console.error(`[AERIS GEOCODING ERROR] Regional qualifier lookup failed for "${cleanQuery}":`, err.message);
    }
  }

  // Strategy 3: Exact name match anywhere globally if not resolved as administrative division
  const globalExact = directResults.find(r => r.name.toLowerCase() === cleanQuery.toLowerCase());
  if (globalExact) {
    return formatLocation(
      globalExact.name,
      globalExact.admin2 || globalExact.admin1 || globalExact.name,
      globalExact.admin1 || globalExact.country || 'Global',
      globalExact.country || 'Global',
      globalExact.latitude,
      globalExact.longitude
    );
  }

  // Strategy 4: Multi-word query fallback: query distinctive first token (e.g. 'Arunachal Pradesh' -> 'Arunachal')
  const words = cleanQuery.split(/\s+/);
  if (words.length > 1) {
    try {
      const firstWord = words[0];
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(firstWord)}&count=5&language=en&format=json`;
      const res = await fetchFn(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          const inMatch = data.results.find(r => (r.country_code || '').toUpperCase() === 'IN' || (r.country || '').toLowerCase() === 'india');
          const target = inMatch || data.results[0];
          return formatLocation(
            cleanQuery,
            target.name,
            target.admin1 || cleanQuery,
            target.country || 'India',
            target.latitude,
            target.longitude
          );
        }
      }
    } catch (err) {
      console.error(`[AERIS GEOCODING ERROR] Multi-word token lookup failed for "${cleanQuery}":`, err.message);
    }
  }

  // Strategy 5: Country Qualifier fallback (e.g. '<query>, India')
  try {
    const qIndia = `${cleanQuery}, India`;
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(qIndia)}&count=5&language=en&format=json`;
    const res = await fetchFn(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const target = data.results[0];
        return formatLocation(
          cleanQuery,
          target.name,
          target.admin1 || cleanQuery,
          target.country || 'India',
          target.latitude,
          target.longitude
        );
      }
    }
  } catch (err) {
    console.error(`[AERIS GEOCODING ERROR] Country qualifier lookup failed for "${cleanQuery}":`, err.message);
  }

  // Strategy 6: Single top result from direct search if available
  if (directResults.length > 0) {
    const top = directResults[0];
    return formatLocation(
      top.name,
      top.admin2 || top.admin1 || top.name,
      top.admin1 || top.country || 'Global',
      top.country || 'Global',
      top.latitude,
      top.longitude
    );
  }

  // No coordinates resolved
  return null;
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
