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
 * Clean markdown code fences from LLM response text if present.
 * @param {string} raw
 * @returns {string}
 */
function cleanJsonOutput(raw = '') {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Construct system prompt with persona rules and trusted context.
 */
function buildSystemPrompt({ persona = 'citizen', location = {}, weather = {}, crop = {}, alerts = [] }) {
  const personaKey = persona.toLowerCase();
  const personaInstruction = PERSONA_GUIDELINES[personaKey] || PERSONA_GUIDELINES.citizen;
  const locName = location.name || weather?.location?.name || 'Ahmedabad, Gujarat';

  return `You are AERIS (Atmospheric & Environmental Real-time Intelligence System), branded as WeatherGPT — a high-precision meteorological conversational AI for India.

USER PERSONA: ${persona.toUpperCase()}
PERSONA GUIDANCE: ${personaInstruction}

CURRENT STRUCTURED TELEMETRY & CONTEXT FOR ${locName}:
- Location: ${JSON.stringify(weather.location || location)}
- Current Weather Metrics: ${JSON.stringify(weather.current || {})}
- Hourly Forecast: ${JSON.stringify((weather.hourly || []).slice(0, 4))}
- Daily Forecast: ${JSON.stringify((weather.daily || []).slice(0, 2))}
- Crop Profile: ${JSON.stringify(crop || {})}
- Active Bulletins: ${JSON.stringify(alerts || [])}

STRICT METEOROLOGICAL INTEGRITY & MOCK ATTRIBUTION RULES:
1. You MUST respond with a SINGLE valid JSON object matching the exact schema below.
2. DO NOT return markdown formatting around the JSON (no backticks, no text outside JSON).
3. Base all weather advice ONLY on the provided structured context. NEVER invent, fabricate, or hallucinate new weather measurements or rainfall volumes beyond the context.
4. DO NOT claim or imply that mock data came from real providers (such as IMD, OpenWeatherMap, ECMWF, GFS). Attribute data strictly to "MOCK_WEATHER_DATA" and "MOCK_CROP_RULES".

REQUIRED JSON SCHEMA:
{
  "text": "Comprehensive, clear natural language advisory addressing the user query based solely on the provided context.",
  "card": {
    "type": "METEOROLOGICAL_COMMAND_CARD",
    "location": "${locName}",
    "tempRange": "24°C — 31°C",
    "currentTemp": "${weather.current?.temp || 29.4}°C",
    "rainProb": ${weather.current?.precipitationProbability || 78},
    "windSpeed": "${weather.current?.windSpeed || 18} km/h ${weather.current?.windDirection || 'WSW'}",
    "humidity": "${weather.current?.humidity || 82}%",
    "riskLevel": "MODERATE",
    "riskColor": "#f59e0b",
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
    "source": "MOCK_WEATHER_DATA",
    "updated": "${new Date().toISOString()}"
  },
  "sources": ["MOCK_WEATHER_DATA", "MOCK_CROP_RULES"]
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

  const config = getOpenRouterConfig();
  const systemPrompt = buildSystemPrompt({ persona, location, weather, crop, alerts });

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
      body: JSON.stringify(requestPayload)
    });
  } catch (netErr) {
    console.error('[OpenRouter Service] Network connection error:', netErr.message);
    const err = new Error('Failed to connect to OpenRouter API service.');
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

  // Defensive JSON parsing
  let parsed = null;
  try {
    const cleaned = cleanJsonOutput(rawContent);
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('[OpenRouter Service] JSON parse failed on LLM output:', parseErr.message);
    const err = new Error('The AI model returned an invalid or malformed JSON response.');
    err.code = 'MODEL_RESPONSE_MALFORMED';
    err.status = 502;
    throw err;
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.text || !parsed.card) {
    console.error('[OpenRouter Service] LLM output missing required fields (text or card)');
    const err = new Error('The AI model response is missing required fields (text or card).');
    err.code = 'MODEL_RESPONSE_MALFORMED';
    err.status = 502;
    throw err;
  }

  // Validate & normalize fields according to ARCHITECTURE.md Section 7.1 contract
  const normalizedResponse = {
    text: parsed.text || 'No detailed advisory generated.',
    card: {
      type: parsed.card?.type || 'METEOROLOGICAL_COMMAND_CARD',
      location: parsed.card?.location || location.name || weather.location?.name || 'Ahmedabad, Gujarat',
      tempRange: parsed.card?.tempRange || '24°C — 31°C',
      currentTemp: parsed.card?.currentTemp || `${weather.current?.temp || 29.4}°C`,
      rainProb: typeof parsed.card?.rainProb === 'number' ? parsed.card.rainProb : (weather.current?.precipitationProbability || 78),
      windSpeed: parsed.card?.windSpeed || `${weather.current?.windSpeed || 18} km/h WSW`,
      humidity: parsed.card?.humidity || `${weather.current?.humidity || 82}%`,
      riskLevel: parsed.card?.riskLevel || 'MODERATE',
      riskColor: parsed.card?.riskColor || '#f59e0b',
      personaAdvisory: {
        title: parsed.card?.personaAdvisory?.title || `${persona.toUpperCase()} DIRECTIVE`,
        recommendation: parsed.card?.personaAdvisory?.recommendation || 'Proceed with standard precautions based on weather context.',
        metrics: Array.isArray(parsed.card?.personaAdvisory?.metrics) ? parsed.card.personaAdvisory.metrics : []
      },
      whyThisRisk: {
        factors: Array.isArray(parsed.card?.whyThisRisk?.factors) ? parsed.card.whyThisRisk.factors : []
      },
      source: parsed.card?.source || 'MOCK_WEATHER_DATA',
      updated: parsed.card?.updated || new Date().toISOString()
    },
    sources: Array.isArray(parsed.sources) ? parsed.sources : ['MOCK_WEATHER_DATA', 'MOCK_CROP_RULES']
  };

  // Exactly match ARCHITECTURE.md Section 7.1 POST /api/chat success response contract
  return {
    success: true,
    conversationId: conversationId,
    response: normalizedResponse
  };
}
