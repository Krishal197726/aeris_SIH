/**
 * AERIS / WeatherGPT — Live Weather Data Service
 *
 * Replaces getMockWeatherData() from mockContextService.js with real NWP
 * ensemble data from Open-Meteo (free, no key, blends GFS/ICON/ECMWF
 * server-side). Returns the EXACT same shape the mock used to, so
 * openRouterService.js and chat.js need no changes downstream.
 *
 * Swap this file's fetch calls for IMD's own API later without touching
 * any calling code — that's the whole point of isolating it here.
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const WIND_COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function degToCompass(deg) {
  if (deg === null || deg === undefined) return '';
  const ix = Math.round(deg / 22.5) % 16;
  return WIND_COMPASS[ix];
}

function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return isoString;
  }
}

export async function getLiveWeatherData(location = {}) {
  const lat = typeof location.latitude === 'number' ? location.latitude : 23.0225;
  const lon = typeof location.longitude === 'number' ? location.longitude : 72.5714;
  const locName = location.name || 'Ahmedabad';
  const state = location.state || 'Gujarat';

  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code');
  url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,weather_code');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,weather_code');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '3');

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const errBody = await resp.text().catch(() => '');
    const err = new Error(`Open-Meteo request failed (${resp.status}): ${errBody.slice(0, 200)}`);
    err.code = 'WEATHER_PROVIDER_ERROR';
    err.status = 502;
    throw err;
  }

  const data = await resp.json();
  const c = data.current || {};
  const hourly = data.hourly || {};
  const daily = data.daily || {};

  const hourlyForecast = (hourly.time || []).slice(0, 8).map((t, i) => ({
    time: formatTime(t),
    temp: hourly.temperature_2m?.[i],
    rainProb: hourly.precipitation_probability?.[i],
    condition: weatherCodeToCondition(hourly.weather_code?.[i])
  })).filter((_, i) => i % 2 === 0).slice(0, 4); // every other hour, first 4

  const dailyForecast = (daily.time || []).slice(0, 2).map((d, i) => ({
    date: d,
    tempMin: daily.temperature_2m_min?.[i],
    tempMax: daily.temperature_2m_max?.[i],
    rainProb: daily.precipitation_probability_max?.[i],
    condition: weatherCodeToCondition(daily.weather_code?.[i])
  }));

  return {
    location: {
      name: locName,
      district: location.district || locName,
      state,
      country: location.country || 'India',
      latitude: lat,
      longitude: lon
    },
    current: {
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      pressure: null,
      windSpeed: c.wind_speed_10m,
      windDirection: degToCompass(c.wind_direction_10m),
      precipitation: c.precipitation,
      precipitationProbability: daily.precipitation_probability_max?.[0] ?? 0,
      condition: weatherCodeToCondition(c.weather_code),
      visibility: null,
      uvIndex: null,
      sunrise: null,
      sunset: null
    },
    hourly: hourlyForecast,
    daily: dailyForecast,
    source: 'OPEN_METEO_LIVE_NWP_ENSEMBLE',
    retrievedAt: new Date().toISOString()
  };
}

/**
 * Derives real threshold-based alerts from the LIVE forecast data just
 * fetched, instead of returning a static hardcoded bulletin. This is a
 * genuine (if simple) analytical step — not a call to an actual IMD
 * alerts feed, which isn't publicly available as a free API. Swap in a
 * real IMD alerts endpoint here later without touching chat.js.
 */
export function deriveAlertsFromWeather(weatherData) {
  const alerts = [];
  const c = weatherData.current || {};
  const maxWind = Math.max(c.windSpeed || 0, ...(weatherData.daily || []).map(d => 0));

  if ((c.windSpeed || 0) > 45) {
    alerts.push({
      id: `alert_wind_${Date.now()}`,
      title: 'High Wind Advisory',
      severity: c.windSpeed > 62 ? 'Severe' : 'Moderate',
      severityLevel: c.windSpeed > 62 ? 'RED' : 'ORANGE',
      state: weatherData.location.state,
      affectedDistricts: [weatherData.location.name],
      phenomenon: 'Strong Surface Winds',
      windSpeed: `${Math.round(c.windSpeed)} km/h`,
      validUntil: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      instruction: 'Secure loose outdoor structures. Exercise caution during travel.',
      issuedBy: 'AERIS_DERIVED_THRESHOLD_ALERT'
    });
  }

  const rainProb = weatherData.daily?.[0]?.rainProb ?? c.precipitationProbability ?? 0;
  if (rainProb > 75) {
    alerts.push({
      id: `alert_rain_${Date.now()}`,
      title: 'Heavy Precipitation Advisory',
      severity: rainProb > 90 ? 'Severe' : 'Moderate',
      severityLevel: rainProb > 90 ? 'RED' : 'ORANGE',
      state: weatherData.location.state,
      affectedDistricts: [weatherData.location.name],
      phenomenon: 'Heavy Rainfall',
      windSpeed: null,
      validUntil: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      instruction: 'Avoid low-lying and flood-prone areas. Clear drainage outlets where possible.',
      issuedBy: 'AERIS_DERIVED_THRESHOLD_ALERT'
    });
  }

  return alerts;
}

function weatherCodeToCondition(code) {
  // WMO weather interpretation codes (used by Open-Meteo)
  const map = {
    0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing Rime Fog',
    51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
    61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
    71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
    80: 'Slight Rain Showers', 81: 'Moderate Rain Showers', 82: 'Violent Rain Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm with Hail'
  };
  return map[code] || 'Variable Conditions';
}
