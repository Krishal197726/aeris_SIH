/**
 * AERIS / WeatherGPT — Chat REST API Endpoint Router
 * 
 * Route: POST /api/chat
 * Handles conversational queries by combining mock weather context with OpenRouter AI orchestration.
 * Conforms strictly to contract documented in ARCHITECTURE.md (Sections 7.1, 8, and 9.1).
 */

import { Router } from 'express';
import { isOpenRouterConfigured } from '../config/openrouter.js';
import { CROP_DATABASE, evaluateDiseaseRisk, calculateIrrigationAdvisory } from '../services/cropService.js';
import { resolveLocation } from '../services/geocodeService.js';
import { getLiveWeatherData, deriveAlertsFromWeather } from '../services/weatherService.js';
import { generateChatResponse } from '../services/openRouterService.js';

const router = Router();

/**
 * Detect mentioned crop from user query
 */
function detectCropFromMessage(text = '', fallback = 'cotton') {
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
 * POST /api/chat
 */
router.post('/', async (req, res) => {
  try {
    const { message, conversationId, persona = 'citizen', location, cropId } = req.body || {};

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
          message: 'OpenRouter AI service is currently unavailable. Server API key is unconfigured.',
          details: null
        }
      });
    }

    // 3. Resolve the real location
    const resolvedLocation = await resolveLocation(message.trim(), location);

    // 4. Fetch LIVE weather telemetry from the NWP ensemble provider
    const weather = await getLiveWeatherData(resolvedLocation);

    // 5. Derive real threshold-based alerts
    const alerts = deriveAlertsFromWeather(weather);

    // 6. Resolve crop intelligence profile and run ML models
    const targetCropId = cropId || detectCropFromMessage(message.trim(), 'cotton');
    const baseCrop = CROP_DATABASE[targetCropId] || CROP_DATABASE.cotton;
    
    // Evaluate disease risks and FAO-56 irrigation
    const diseaseAssessment = evaluateDiseaseRisk(targetCropId, weather);
    const irrigationAssessment = calculateIrrigationAdvisory({
      cropId: targetCropId,
      stageIndex: 2,
      tempMax: weather.daily?.[0]?.tempMax || 32,
      tempMin: weather.daily?.[0]?.tempMin || 24,
      forecastedRain24h: weather.current?.precipitation || 3.0,
      forecastedRain48h: weather.daily?.[1]?.precipitation || 6.0,
      latitude: resolvedLocation.latitude
    });

    const enrichedCropProfile = {
      ...baseCrop,
      liveMlAssessments: {
        diseaseRisk: diseaseAssessment,
        irrigationAdvisory: irrigationAssessment
      }
    };

    // 7. Generate AI response via OpenRouter Service, grounded in real weather and crop ML
    const chatResponse = await generateChatResponse({
      message: message.trim(),
      conversationId: conversationId || `chat_${Date.now()}`,
      persona: persona || 'citizen',
      location: resolvedLocation,
      weather,
      crop: enrichedCropProfile,
      alerts
    });

    // 8. Return normalized AERIS ChatResponse
    return res.json(chatResponse);

  } catch (err) {
    console.error('[Chat Router Error] /api/chat failure:', err.message);

    const status = err.status || 500;
    const errorCode = err.code || 'CHAT_PROCESSING_ERROR';
    const message = err.message || 'An error occurred while processing the chat query.';

    return res.status(status).json({
      error: {
        code: errorCode,
        message: message,
        details: null
      }
    });
  }
});

export default router;
