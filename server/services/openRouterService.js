/**
 * AERIS / WeatherGPT — OpenRouter AI Service
 * 
 * SERVER-SIDE ONLY.
 * Provider-isolated AI orchestration service. Assembles persona-specific system prompts,
 * injects structured weather telemetry & crop profiles, calls OpenRouter chat completions API,
 * defensively parses JSON responses, and normalizes output into the AERIS ChatResponse contract.
 * 
 * HONESTY & ATTRIBUTION GOVERNANCE:
 * - Instructs LLM never to invent unverified measurements.
 * - Attributes mock telemetry strictly to "MOCK_WEATHER_DATA" and "MOCK_CROP_RULES".
 */

import { getOpenRouterConfig } from '../config/openrouter.js';

/**
 * Persona-specific guidance rules
 */
const PERSONA_GUIDELINES = {
  citizen: 'Focus on daily planning, mobility advice, umbrella recommendations, outdoor activity timing, and comfort.',
  farmer: 'Focus on agronomic guidance, crop health, irrigation holding/scheduling, pest/fungal risks, and root zone moisture.',
  disaster: 'Focus on emergency response, urban inundation risks, drainage clearance, severe weather bulletins, and evacuation staging.',
  aviation: 'Focus on cloud ceiling, visibility, surface/upper wind shear, squalls, and flight safety.',
  marine: 'Focus on coastal winds, wave swell, sea state, gale advisories, and port warning signals.',
  researcher: 'Focus on thermodynamic indices (CAPE, PWAT, Lifted Index), synoptic dynamics, and NWP model ensemble agreement.'
};

/**
 * Clean markdown code fences, thought prefaces, or wrapper text from LLM response text.
 * @param {string} raw
 * @returns {string}
 */
function cleanJsonOutput(raw = '') {
  let cleaned = raw.trim();

  // Strip <think>...</think> blocks if present
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // If code fences are present, extract inner content
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  // Find the first { and the last } to extract pure JSON
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

/**
 * Construct system prompt with persona rules and trusted context.
 */
/**
 * Calculate a deterministic, explainable meteorological risk level directly from live Open-Meteo telemetry.
 * 
 * Signals analyzed:
 * - WMO Weather Code (severe thunderstorms, heavy downpours, squalls, freezing conditions, fog)
 * - Rain Probability / Precipitation Rate
 * - Wind Speed / Sustained Gusts
 * - Temperature Extremes (heatwave vs freezing)
 * - Atmospheric Saturation / Heat Index (humidity + temperature)
 * 
 * Returns { level, color, label, score, factors }
 */
export function calculateWeatherRisk(weather = {}) {
  const current = weather.current || {};
  const forecast0 = weather.forecast?.[0] || {};

  const temp = typeof current.temperature === 'number' ? current.temperature : (current.temp ?? 25);
  const humidity = typeof current.humidity === 'number' ? current.humidity : 60;
  const windSpeed = typeof current.windSpeed === 'number' ? current.windSpeed : 10;
  const rainProb = typeof forecast0.rainProb === 'number' ? forecast0.rainProb : (current.precipitationProbability ?? 0);
  const weatherCode = typeof current.weatherCode === 'number' ? current.weatherCode : (forecast0.weatherCode ?? 0);
  const condition = current.condition || forecast0.condition || '';
  const description = current.description || forecast0.description || '';

  let score = 0;
  const factors = [];

  // 1. Severe Weather / WMO Weather Code Analysis
  if (weatherCode === 99 || weatherCode === 96) {
    score += 40;
    factors.push({
      title: 'Severe Thunderstorm & Hail Warning',
      detail: `Active convective severe thunderstorm detected with hail risk (WMO code ${weatherCode}: ${description || condition || 'Severe Thunderstorm'}).`
    });
  } else if (weatherCode === 95) {
    score += 30;
    factors.push({
      title: 'Thunderstorm Activity',
      detail: `Active convective thunderstorm cells reported in regional airspace (WMO code 95: ${description || condition || 'Thunderstorm'}).`
    });
  } else if ([82, 65, 81].includes(weatherCode)) {
    score += 25;
    factors.push({
      title: 'Heavy Precipitation / Downpour',
      detail: `Violent rain showers or heavy downpour occurring (WMO code ${weatherCode}: ${description || condition || 'Heavy Rain'}).`
    });
  } else if ([71, 73, 75, 85, 86, 66, 67].includes(weatherCode)) {
    score += 25;
    factors.push({
      title: 'Snow / Freezing Precipitation',
      detail: `Freezing rain or accumulating snowfall impacting surface conditions (WMO code ${weatherCode}: ${description || condition || 'Wintry Precipitation'}).`
    });
  } else if ([53, 55, 61, 63, 80].includes(weatherCode)) {
    score += 15;
    factors.push({
      title: 'Rain Showers',
      detail: `Persistent light to moderate rainfall active (WMO code ${weatherCode}: ${description || condition || 'Rain'}).`
    });
  } else if ([45, 48].includes(weatherCode)) {
    score += 12;
    factors.push({
      title: 'Dense Fog / Obscured Visibility',
      detail: `Dense fog reducing horizontal surface visibility (WMO code ${weatherCode}: ${description || condition || 'Fog'}).`
    });
  }

  // 2. Precipitation Probability & Inundation Risk
  if (rainProb >= 85) {
    score += 25;
    factors.push({
      title: `Precipitation Probability: ${rainProb}%`,
      detail: `Near-certain atmospheric saturation indicates impending or ongoing precipitation.`
    });
  } else if (rainProb >= 60) {
    score += 15;
    factors.push({
      title: `Precipitation Probability: ${rainProb}%`,
      detail: `Elevated convective probability of rain showers across the local region.`
    });
  } else if (rainProb >= 35) {
    score += 5;
    factors.push({
      title: `Precipitation Probability: ${rainProb}%`,
      detail: `Scattered convective moisture with moderate chance of localized showers.`
    });
  }

  // 3. Wind Velocity & Kinetic Energy
  if (windSpeed >= 50) {
    score += 25;
    factors.push({
      title: `Gale / High Wind Velocity: ${windSpeed} km/h`,
      detail: `Strong wind shear and potential structural hazard from sustained winds.`
    });
  } else if (windSpeed >= 35) {
    score += 15;
    factors.push({
      title: `Brisk / Fresh Winds: ${windSpeed} km/h`,
      detail: `Elevated surface winds; outdoor and maritime precautions advised.`
    });
  } else if (windSpeed >= 20) {
    score += 8;
    factors.push({
      title: `Moderate Breeze: ${windSpeed} km/h`,
      detail: `Noticeable atmospheric airflow across the region.`
    });
  }

  // 4. Thermal Extremes
  if (temp >= 42) {
    score += 25;
    factors.push({
      title: `Severe Heatwave: ${temp}°C`,
      detail: `Dangerous ambient heat levels; severe thermal stress and hyperthermia hazard.`
    });
  } else if (temp >= 38) {
    score += 15;
    factors.push({
      title: `Elevated Heat Index: ${temp}°C`,
      detail: `High surface temperatures; hydration and solar exposure precautions advised.`
    });
  } else if (temp <= 0) {
    score += 25;
    factors.push({
      title: `Freezing Frost: ${temp}°C`,
      detail: `Sub-zero ground temperatures; black ice formation and hypothermia risk.`
    });
  } else if (temp <= 5) {
    score += 15;
    factors.push({
      title: `Cold Advisory: ${temp}°C`,
      detail: `Near-freezing ambient temperatures requiring cold-weather protection.`
    });
  }

  // 5. Convective Saturation / Mugginess (High Temp + High Humidity)
  if (humidity >= 80 && temp >= 30) {
    score += 15;
    factors.push({
      title: `Tropical Convective Saturation: ${humidity}% at ${temp}°C`,
      detail: `High relative humidity combined with elevated thermal energy amplifies heat index and storm instability.`
    });
  } else if (humidity >= 85) {
    score += 5;
    factors.push({
      title: `High Relative Humidity: ${humidity}%`,
      detail: `Saturated atmospheric boundary layer; reduced evaporative cooling.`
    });
  }

  // If atmospheric conditions are completely calm/benign
  if (factors.length === 0) {
    factors.push({
      title: 'Atmospheric Stability',
      detail: `Nominal temperature (${temp}°C), calm winds (${windSpeed} km/h), comfortable humidity (${humidity}%), and low rain probability (${rainProb}%). Favorable operational conditions.`
    });
  }

  // Final Risk Classification & Palettes
  if (score >= 50) {
    return {
      level: 'SEVERE RISK',
      color: '#ef4444',
      label: 'Severe Hazard',
      score,
      factors
    };
  } else if (score >= 30) {
    return {
      level: 'HIGH RISK',
      color: '#f97316',
      label: 'Adverse Conditions',
      score,
      factors
    };
  } else if (score >= 15) {
    return {
      level: 'MODERATE',
      color: '#eab308',
      label: 'Caution Advised',
      score,
      factors
    };
  } else {
    return {
      level: 'LOW RISK',
      color: '#10b981',
      label: 'Favorable Conditions',
      score,
      factors
    };
  }
}

/**
 * Construct system prompt with persona rules and trusted context.
 */
function buildSystemPrompt({ persona = 'citizen', location = {}, weather = {}, crop = {}, alerts = [], riskAssessment = null }) {
  const personaKey = persona.toLowerCase();
  const personaInstruction = PERSONA_GUIDELINES[personaKey] || PERSONA_GUIDELINES.citizen;
  const locName = weather?.location?.name
    ? `${weather.location.name}${weather.location.state ? `, ${weather.location.state}` : ''}`
    : (location?.name || 'Requested Location');

  const latVal = weather.location?.latitude ?? location?.latitude;
  const lngVal = weather.location?.longitude ?? location?.longitude;
  const latitude = typeof latVal === 'number' ? latVal : (latVal ? parseFloat(latVal) : null);
  const longitude = typeof lngVal === 'number' ? lngVal : (lngVal ? parseFloat(lngVal) : null);

  const currentTempNum = weather.current?.temperature ?? weather.current?.temp ?? 25;
  const rainProbNum = weather.forecast?.[0]?.rainProb ?? weather.current?.precipitationProbability ?? 30;
  const windStr = `${weather.current?.windSpeed ?? 10} km/h ${weather.current?.windDirection || ''}`.trim();
  const humidityStr = `${weather.current?.humidity ?? 65}%`;
  const tempRangeStr = weather.forecast?.[0]
    ? `${weather.forecast[0].tempMin}°C — ${weather.forecast[0].tempMax}°C`
    : `${currentTempNum - 3}°C — ${currentTempNum + 4}°C`;
  const weatherSource = weather.source || 'Open-Meteo Meteorological Service';

  const risk = riskAssessment || calculateWeatherRisk(weather);

  return `You are AERIS (Atmospheric & Environmental Real-time Intelligence System), branded as WeatherGPT — a high-precision meteorological conversational AI supporting India and international regions.

USER PERSONA: ${persona.toUpperCase()}
PERSONA GUIDANCE: ${personaInstruction}

CURRENT STRUCTURED TELEMETRY & CONTEXT FOR ${locName}:
- Resolved Location: ${JSON.stringify(weather.location || location)}
- Resolved Coordinates: Latitude ${latitude !== null ? latitude : 'N/A'}, Longitude ${longitude !== null ? longitude : 'N/A'}
- Current Weather Metrics: ${JSON.stringify(weather.current || {})}
- Daily Forecast: ${JSON.stringify((weather.forecast || weather.daily || []).slice(0, 5))}
- Assessed Live Meteorological Risk: ${risk.level} (${risk.label})
- Primary Risk Factors: ${risk.factors.map(f => `${f.title}: ${f.detail}`).join(' | ')}
- Crop Profile: ${JSON.stringify(crop || {})}
- Active Bulletins: ${JSON.stringify(alerts || [])}

STRICT METEOROLOGICAL INTEGRITY & ATTRIBUTION RULES:
1. You MUST respond with a SINGLE valid JSON object matching the exact schema below.
2. DO NOT return markdown formatting around the JSON (no backticks, no text outside JSON).
3. Base all weather advice ONLY on the provided structured context. NEVER invent, fabricate, or hallucinate new weather measurements or rainfall volumes beyond the context.
4. Attribute weather telemetry strictly to "${weatherSource}".
5. Reflect the assessed meteorological risk level (${risk.level}) and its quantitative factors in your natural language advisory.

REQUIRED JSON SCHEMA:
{
  "text": "Comprehensive, clear natural language advisory addressing the user query based solely on the provided context.",
  "card": {
    "type": "METEOROLOGICAL_COMMAND_CARD",
    "location": "${locName}",
    "latitude": ${latitude !== null ? latitude : 0},
    "longitude": ${longitude !== null ? longitude : 0},
    "tempRange": "${tempRangeStr}",
    "currentTemp": "${currentTempNum}°C",
    "rainProb": ${rainProbNum},
    "windSpeed": "${windStr}",
    "humidity": "${humidityStr}",
    "riskLevel": "${risk.level}",
    "riskColor": "${risk.color}",
    "riskLabel": "${risk.label}",
    "personaAdvisory": {
      "title": "${persona.toUpperCase()} ADVISORY DIRECTIVE",
      "recommendation": "Actionable, specific guidance for this persona derived from the provided context.",
      "metrics": [
        { "label": "Key Metric 1", "val": "Value 1" },
        { "label": "Key Metric 2", "val": "Value 2" }
      ]
    },
    "whyThisRisk": {
      "factors": [
        { "title": "Primary Factor", "detail": "Reasoning based on humidity, temperature, or rain probability." }
      ]
    },
    "source": "${weatherSource}",
    "updated": "${weather.timestamp || new Date().toISOString()}"
  },
  "sources": ["${weatherSource}"]
}`;
}

/**
 * Generate AI chat response via OpenRouter.
 * 
 * @param {object} params
 * @param {string} params.message
 * @param {string} [params.conversationId]
 * @param {string} [params.persona]
 * @param {object} [params.location]
 * @param {object} [params.weather]
 * @param {object} [params.crop]
 * @param {Array} [params.alerts]
 * @returns {Promise<object>} Standardized ChatResponse payload according to ARCHITECTURE.md Section 7.1
 */
export async function generateChatResponse({
  message,
  conversationId = `chat_${Date.now()}`,
  persona = 'citizen',
  location = {},
  weather = {},
  crop = {},
  alerts = []
}) {
  if (!message || typeof message !== 'string' || !message.trim()) {
    const err = new Error('Message string is required');
    err.code = 'INVALID_REQUEST';
    throw err;
  }

  // 1. Calculate deterministic live weather risk assessment
  const riskAssessment = calculateWeatherRisk(weather);

  // 2. Extract verified resolved coordinates from Open-Meteo geocoding result
  const latVal = weather.location?.latitude ?? location?.latitude;
  const lngVal = weather.location?.longitude ?? location?.longitude;
  const latitude = typeof latVal === 'number' ? latVal : (latVal ? parseFloat(latVal) : null);
  const longitude = typeof lngVal === 'number' ? lngVal : (lngVal ? parseFloat(lngVal) : null);

  const config = getOpenRouterConfig();
  const systemPrompt = buildSystemPrompt({ persona, location, weather, crop, alerts, riskAssessment });

  const requestPayload = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message.trim() }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  };

  let response;
  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(120000)
    });
  } catch (netErr) {
    console.error('[OpenRouter Service] Network connection error:', netErr.message);
    const err = new Error('Failed to connect to OpenRouter API service: ' + netErr.message);
    err.code = 'OPENROUTER_NETWORK_ERROR';
    err.status = 502;
    throw err;
  }

  if (!response.ok) {
    let errBody = '';
    try {
      errBody = await response.text();
    } catch (_) {}
    console.error(`[OpenRouter Service] HTTP error ${response.status}:`, errBody.slice(0, 200));
    
    const err = new Error(`OpenRouter model provider returned status ${response.status}.`);
    err.code = 'OPENROUTER_API_ERROR';
    err.status = response.status >= 500 ? 502 : 400;
    throw err;
  }

  const completionData = await response.json();
  const rawContent = completionData?.choices?.[0]?.message?.content;

  if (!rawContent || !rawContent.trim()) {
    const err = new Error('OpenRouter returned an empty response.');
    err.code = 'OPENROUTER_EMPTY_RESPONSE';
    err.status = 502;
    throw err;
  }

  const locName = weather?.location?.name
    ? `${weather.location.name}${weather.location.state ? `, ${weather.location.state}` : ''}`
    : (location?.name || 'Requested Location');

  const currentTempNum = weather.current?.temperature ?? weather.current?.temp ?? 25;
  const rainProbNum = weather.forecast?.[0]?.rainProb ?? weather.current?.precipitationProbability ?? 30;
  const windStr = `${weather.current?.windSpeed ?? 10} km/h ${weather.current?.windDirection || ''}`.trim();
  const humidityStr = `${weather.current?.humidity ?? 65}%`;
  const tempRangeStr = weather.forecast?.[0]
    ? `${weather.forecast[0].tempMin}°C — ${weather.forecast[0].tempMax}°C`
    : `${currentTempNum - 3}°C — ${currentTempNum + 4}°C`;
  const weatherSource = weather.source || 'Open-Meteo Meteorological Service';

  // Defensive JSON parsing
  let parsed = null;
  try {
    const cleaned = cleanJsonOutput(rawContent);
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.warn('[OpenRouter Service] Non-JSON LLM output received, formatting with live Open-Meteo telemetry:', parseErr.message);
    const cleanedText = rawContent
      .replace(/User Safety:\s*\w+/gi, '')
      .replace(/```(?:json)?/gi, '')
      .trim();

    parsed = {
      text: cleanedText || `Currently in ${locName}, the temperature is ${currentTempNum}°C with ${weather.current?.condition || 'clear skies'}, ${humidityStr} humidity, and wind speeds around ${windStr}.`,
      card: {
        type: 'METEOROLOGICAL_COMMAND_CARD',
        location: locName,
        latitude: latitude,
        longitude: longitude,
        tempRange: tempRangeStr,
        currentTemp: `${currentTempNum}°C`,
        rainProb: rainProbNum,
        windSpeed: windStr,
        humidity: humidityStr,
        riskLevel: riskAssessment.level,
        riskColor: riskAssessment.color,
        riskLabel: riskAssessment.label,
        personaAdvisory: {
          title: `${persona.toUpperCase()} DIRECTIVE`,
          recommendation: `Current conditions in ${locName}: ${weather.current?.description || weather.current?.condition || 'Fair conditions'}. Exercise standard situational awareness.`,
          metrics: [
            { label: 'Current Temp', val: `${currentTempNum}°C` },
            { label: 'Humidity', val: humidityStr }
          ]
        },
        whyThisRisk: {
          factors: riskAssessment.factors
        },
        source: weatherSource,
        updated: weather.timestamp || new Date().toISOString()
      },
      sources: [weatherSource]
    };
  }

  // Validate & normalize fields according to ARCHITECTURE.md Section 7.1 contract
  // Ensure deterministic risk and real Open-Meteo coordinates are strictly preserved
  const normalizedResponse = {
    text: parsed.text || 'No detailed advisory generated.',
    card: {
      type: parsed.card?.type || 'METEOROLOGICAL_COMMAND_CARD',
      location: parsed.card?.location || locName,
      latitude: latitude,
      longitude: longitude,
      tempRange: parsed.card?.tempRange || tempRangeStr,
      currentTemp: parsed.card?.currentTemp || `${currentTempNum}°C`,
      rainProb: typeof parsed.card?.rainProb === 'number' ? parsed.card.rainProb : rainProbNum,
      windSpeed: parsed.card?.windSpeed || windStr,
      humidity: parsed.card?.humidity || humidityStr,
      riskLevel: riskAssessment.level,
      riskColor: riskAssessment.color,
      riskLabel: riskAssessment.label,
      personaAdvisory: {
        title: parsed.card?.personaAdvisory?.title || `${persona.toUpperCase()} DIRECTIVE`,
        recommendation: parsed.card?.personaAdvisory?.recommendation || 'Proceed with standard precautions based on weather context.',
        metrics: Array.isArray(parsed.card?.personaAdvisory?.metrics) ? parsed.card.personaAdvisory.metrics : []
      },
      whyThisRisk: {
        factors: riskAssessment.factors,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      },
      source: parsed.card?.source || weatherSource,
      updated: parsed.card?.updated || weather.timestamp || new Date().toISOString()
    },
    sources: Array.isArray(parsed.sources) ? parsed.sources : [weatherSource]
  };

  // Exactly match ARCHITECTURE.md Section 7.1 POST /api/chat success response contract
  return {
    success: true,
    conversationId: conversationId,
    response: normalizedResponse
  };
}
