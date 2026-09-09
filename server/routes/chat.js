/**
 * AERIS / WeatherGPT — Chat REST API Endpoint Router
 * 
 * Route: POST /api/chat
 * Handles conversational queries by combining live Open-Meteo weather context with OpenRouter AI orchestration.
 * Conforms strictly to contract documented in ARCHITECTURE.md (Sections 7.1, 8, and 9.1).
 */

import { Router } from 'express';
import { isOpenRouterConfigured } from '../config/openrouter.js';
import { generateChatResponse } from '../services/openRouterService.js';
import { getWeather, getCoordinates } from '../../src/services/weatherBackendService.js';
import { CROP_DATABASE, evaluateDiseaseRisk, calculateIrrigationAdvisory } from '../services/cropService.js';

const router = Router();

/**
 * Detect mentioned crop from user query
 */
function detectCropFromMessage(text = '', fallback = null) {
  if (!text) return fallback;
  const lower = text.toLowerCase();
  for (const key of Object.keys(CROP_DATABASE)) {
    const crop = CROP_DATABASE[key];
    if (lower.includes(crop.id) || lower.includes(crop.cropName.toLowerCase())) {
      return crop.id;
    }
  }
  if (lower.includes('peanut')) return 'groundnut';
  if (lower.includes('paddy')) return 'rice';
  if (lower.includes('corn')) return 'maize';
  if (lower.includes('cane')) return 'sugarcane';
  if (lower.includes('sarson')) return 'mustard';
  return fallback;
}

/**
 * Extract target location query from explicit location payload or natural language message.
 * Supports:
 * - Explicit prepositions: "in", "for", "near", "around", "at", "of"
 * - Direct queries: "Tamil Nadu weather updates" -> "Tamil Nadu"
 * - Multi-word location preservation: "Arunachal Pradesh", "Himachal Pradesh", "Tamil Nadu"
 * - Safe punctuation removal
 * 
 * @param {string} message 
 * @param {object|string} [locationParam] 
 * @returns {Promise<string|null>}
 */
async function resolveLocationQuery(message, locationParam) {
  // 1. Explicit location parameter in request body
  if (locationParam) {
    if (typeof locationParam === 'string' && locationParam.trim()) {
      return locationParam.trim();
    }
    if (typeof locationParam === 'object' && locationParam.name && typeof locationParam.name === 'string') {
      return locationParam.name.trim();
    }
  }

  if (!message || typeof message !== 'string') return null;

  // Normalize and clean punctuation safely
  const rawText = message.trim();
  const textWithoutPunct = rawText.replace(/[?!.,;:()[\]{}"']/g, ' ').replace(/\s+/g, ' ').trim();

  // Words that commonly follow a location name in prepositional queries
  const TRAILING_NOISE_REGEX = /\b(?:today|tomorrow|yesterday|now|right\s+now|tonight|this\s+week|this\s+evening|currently|updates?|forecast|status|report|conditions?|please|radar|live)\b.*$/gi;

  // 2. Stage 1: Explicit preposition matching: in, for, near, around, at, of
  const prepRegex = /\b(?:in|for|near|around|at|of)\s+([A-Za-z\s-]+)/i;
  const prepMatch = textWithoutPunct.match(prepRegex);
  if (prepMatch && prepMatch[1]) {
    let candidate = prepMatch[1].replace(TRAILING_NOISE_REGEX, '').trim();
    candidate = candidate.replace(/^(?:the|a|an)\s+/i, '').trim();
    if (candidate.length >= 2) {
      const coords = await getCoordinates(candidate);
      if (coords) return candidate;
    }
  }

  // 3. Stage 2: If no preposition matched or resolved, strip weather/intent/filler words
  const INTENT_WORDS_REGEX = /\b(?:what'?s|what|how|is|are|was|were|tell|give|show|check|get|find|please|me|us|the|a|an|about|weather|climate|forecast|updates?|temperature|temp|humidity|rain|raining|rainfall|precipitation|condition|conditions?|status|report|reports?|current|currently|live|real-?time|satellite|radar|today|tomorrow|yesterday|tonight|now|right|day|night)\b/gi;

  const strippedCandidate = textWithoutPunct
    .replace(INTENT_WORDS_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (strippedCandidate.length >= 2) {
    const coords = await getCoordinates(strippedCandidate);
    if (coords) return strippedCandidate;
  }

  // 4. Stage 3: Fallback - test clean text if non-empty
  if (textWithoutPunct.length >= 2) {
    const fullCoords = await getCoordinates(textWithoutPunct);
    if (fullCoords) return textWithoutPunct;
  }

  return null;
}

/**
 * POST /api/chat
 * 
 * Expected Request Body:
 * {
 *   "message": "Will it rain in Arunachal Pradesh tomorrow afternoon?",
 *   "conversationId": "chat_1725321600_a8f9d",
 *   "persona": "farmer",
 *   "location": "Arunachal Pradesh"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { message, conversationId, persona = 'citizen', location } = req.body || {};

    // 1. Request payload validation
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'The "message" field is required and must be a non-empty string.',
          details: null
        }
      });
    }

    // 2. OpenRouter API Key configuration check
    if (!isOpenRouterConfigured()) {
      return res.status(503).json({
        error: {
          code: 'OPENROUTER_KEY_MISSING',
          message: 'OpenRouter AI service is currently unconfigured or unavailable on the server. Please check OPENROUTER_API_KEY in server environment settings.',
          details: null
        }
      });
    }

    // 3. Resolve target location from request payload or natural language query
    const locationQuery = await resolveLocationQuery(message, location);
    if (!locationQuery) {
      return res.status(400).json({
        error: {
          code: 'LOCATION_NOT_FOUND',
          message: 'Could not determine the target location from your message. Please specify a location name (e.g. "What is the weather in Arunachal Pradesh?").',
          details: null
        }
      });
    }

    // 4. Fetch live Open-Meteo weather telemetry using existing weatherBackendService
    let weatherData;
    try {
      weatherData = await getWeather(locationQuery);
    } catch (weatherErr) {
      console.error('[Chat Router] Live weather lookup failed for location query:', locationQuery, '|', weatherErr.message);
      const isNotFound = weatherErr.code === 'LOCATION_NOT_FOUND' || weatherErr.message?.includes('could not be found');
      return res.status(isNotFound ? 404 : 502).json({
        error: {
          code: isNotFound ? 'LOCATION_NOT_FOUND' : 'WEATHER_PROVIDER_ERROR',
          message: `Unable to retrieve live weather telemetry for "${locationQuery}". ${weatherErr.message || 'Please check the location name.'}`,
          details: null
        }
      });
    }

    // 4.5. Optional crop context enrichment (if cropId specified or persona is farmer or crop mentioned)
    let cropProfile = null;
    const { cropId } = req.body || {};
    const detectedCropId = cropId || detectCropFromMessage(message.trim(), (persona || '').toLowerCase() === 'farmer' ? 'cotton' : null);
    
    if (detectedCropId) {
      const baseCrop = CROP_DATABASE[detectedCropId];
      if (baseCrop) {
        const diseaseAssessment = evaluateDiseaseRisk(detectedCropId, weatherData);
        const irrigationAssessment = calculateIrrigationAdvisory({
          cropId: detectedCropId,
          stageIndex: 2,
          tempMax: weatherData.forecast?.[0]?.tempMax || (weatherData.current?.temperature + 4) || 32,
          tempMin: weatherData.forecast?.[0]?.tempMin || (weatherData.current?.temperature - 4) || 24,
          forecastedRain24h: weatherData.current?.precipitation || 0,
          forecastedRain48h: weatherData.forecast?.[1]?.precipitation || 0,
          latitude: weatherData.location.latitude
        });

        cropProfile = {
          ...baseCrop,
          liveMlAssessments: {
            diseaseRisk: diseaseAssessment,
            irrigationAdvisory: irrigationAssessment
          }
        };
      }
    }

    // 5. Generate AI response via OpenRouter Service with live Open-Meteo telemetry
    const chatResponse = await generateChatResponse({
      message: message.trim(),
      conversationId: conversationId || `chat_${Date.now()}`,
      persona: persona || 'citizen',
      location: weatherData.location,
      weather: weatherData,
      crop: cropProfile,
      alerts: []
    });

    // 6. Return normalized AERIS ChatResponse
    return res.json(chatResponse);

  } catch (err) {
    console.error('[Chat Router Error] /api/chat failure:', err.message);

    const status = err.status || 500;
    const errorCode = err.code || 'CHAT_PROCESSING_ERROR';
    const messageText = err.message || 'An error occurred while processing the chat query.';

    return res.status(status).json({
      error: {
        code: errorCode,
        message: messageText,
        details: null
      }
    });
  }
});

export default router;
