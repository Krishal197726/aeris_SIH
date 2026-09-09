/**
 * AERIS / WeatherGPT — Chat REST API Endpoint Router
 * 
 * Route: POST /api/chat
 * Handles conversational queries by combining mock weather context with OpenRouter AI orchestration.
 * Conforms strictly to contract documented in ARCHITECTURE.md (Sections 7.1, 8, and 9.1).
 */

import { Router } from 'express';
import { isOpenRouterConfigured } from '../config/openrouter.js';
import { getMockContext } from '../services/mockContextService.js';
import { generateChatResponse } from '../services/openRouterService.js';

const router = Router();

/**
 * POST /api/chat
 * 
 * Expected Request Body:
 * {
 *   "message": "Will it rain in Ahmedabad tomorrow afternoon?",
 *   "conversationId": "chat_1725321600_a8f9d",
 *   "persona": "farmer",
 *   "location": {
 *     "name": "Ahmedabad",
 *     "latitude": 23.0225,
 *     "longitude": 72.5714
 *   }
 * }
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

    // 3. Retrieve mock context telemetry (weather + crop profile + active alerts)
    const context = getMockContext({ location, persona, cropId });

    // 4. Generate AI response via OpenRouter Service
    const chatResponse = await generateChatResponse({
      message: message.trim(),
      conversationId: conversationId || `chat_${Date.now()}`,
      persona: persona || 'citizen',
      location: location || context.weather.location,
      weather: context.weather,
      crop: context.crop,
      alerts: context.alerts
    });

    // 5. Return normalized AERIS ChatResponse
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
