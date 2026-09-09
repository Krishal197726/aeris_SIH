/**
 * AERIS / WeatherGPT — Crop Intelligence & Agri-Meteorological REST API Router
 * 
 * Routes:
 * - GET  /api/crops                 -> List all supported crop knowledge profiles
 * - GET  /api/crops/:id             -> Detailed agronomic profile for a specific crop
 * - POST /api/crops/recommend       -> ML Crop Suitability & Recommendation Model
 * - POST /api/crops/disease-risk    -> Disease & Pest Vulnerability ML Classifier
 * - POST /api/crops/irrigation      -> FAO-56 Evapotranspiration & Smart Irrigation Engine
 * - POST /api/crops/analyze         -> OpenRouter AI Deep Crop Intelligence Synthesis
 */

import { Router } from 'express';
import { 
  CROP_DATABASE, 
  recommendCrops, 
  evaluateDiseaseRisk, 
  calculateIrrigationAdvisory 
} from '../services/cropService.js';
import { runAgriIntelligenceAnalysis } from '../services/openRouterAgriService.js';
import { getWeather, getCoordinates, getWeatherByCoordinates } from '../../src/services/weatherBackendService.js';

const router = Router();

/**
 * Helper: Resolve location using the unified weatherBackendService geocoder
 */
async function resolveCropLocation(locationParam) {
  if (locationParam) {
    if (typeof locationParam === 'string' && locationParam.trim()) {
      const coords = await getCoordinates(locationParam);
      if (coords) return coords;
      return { name: locationParam.trim(), latitude: 23.0225, longitude: 72.5714, state: 'Gujarat', country: 'India' };
    }
    if (typeof locationParam === 'object') {
      if (locationParam.latitude != null && locationParam.longitude != null) {
        return {
          name: locationParam.name || 'Requested Location',
          latitude: Number(locationParam.latitude),
          longitude: Number(locationParam.longitude),
          state: locationParam.state || 'Global',
          country: locationParam.country || 'Global'
        };
      }
      if (locationParam.name && typeof locationParam.name === 'string') {
        const coords = await getCoordinates(locationParam.name);
        if (coords) return coords;
      }
    }
  }
  const defaultCoords = await getCoordinates('Ahmedabad');
  return defaultCoords || { name: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714 };
}

/**
 * Helper: Fetch and normalize live weather telemetry for crop ML algorithms
 */
async function fetchAndNormalizeWeather(resolvedLocation) {
  let rawWeather;
  try {
    rawWeather = await getWeather(resolvedLocation.name || 'Ahmedabad');
  } catch (_) {
    rawWeather = await getWeatherByCoordinates(resolvedLocation.latitude || 23.0225, resolvedLocation.longitude || 72.5714, resolvedLocation);
  }

  const current = rawWeather.current || {};
  const forecast = rawWeather.forecast || [];
  const temp = typeof current.temperature === 'number' ? current.temperature : (current.temp ?? 28.5);
  const humidity = typeof current.humidity === 'number' ? current.humidity : 75;
  const rainProb = forecast[0]?.rainProb ?? current.precipitationProbability ?? 60;
  const precipitation = current.precipitation ?? 0;

  const daily = forecast.map(f => ({
    tempMin: f.tempMin,
    tempMax: f.tempMax,
    rainProb: f.rainProb,
    precipitation: f.precipitation || (f.rainProb > 50 ? 5.0 : 0)
  }));

  return {
    ...rawWeather,
    current: {
      ...current,
      temp,
      temperature: temp,
      humidity,
      precipitation,
      precipitationProbability: rainProb
    },
    daily: daily.length > 0 ? daily : [
      { tempMin: temp - 4, tempMax: temp + 4, rainProb, precipitation },
      { tempMin: temp - 5, tempMax: temp + 3, rainProb: Math.max(0, rainProb - 15), precipitation: 0 }
    ]
  };
}

/**
 * GET /api/crops
 * List all supported crop profiles with core statistics.
 */
router.get('/', (req, res) => {
  try {
    const list = Object.values(CROP_DATABASE).map(crop => ({
      id: crop.id,
      cropName: crop.cropName,
      hindiName: crop.hindiName,
      season: crop.season,
      category: crop.category,
      optimalTempRange: crop.optimalTempRange,
      rainfallRequirement: crop.rainfallRequirement,
      diseaseCount: crop.diseases.length,
      growthStagesCount: crop.growthStages.length
    }));

    return res.json({
      success: true,
      count: list.length,
      crops: list
    });
  } catch (err) {
    console.error('[Crops Router] GET / error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve crops list' });
  }
});

/**
 * GET /api/crops/:id
 * Detailed agronomic profile for a specific crop.
 */
router.get('/:id', (req, res) => {
  try {
    const cropId = req.params.id?.toLowerCase();
    const crop = CROP_DATABASE[cropId];

    if (!crop) {
      return res.status(404).json({
        success: false,
        error: `Crop with id '${req.params.id}' not found in database. Supported crops: ${Object.keys(CROP_DATABASE).join(', ')}`
      });
    }

    return res.json({
      success: true,
      crop
    });
  } catch (err) {
    console.error(`[Crops Router] GET /:id error:`, err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve crop profile' });
  }
});

/**
 * POST /api/crops/recommend
 * ML Multi-Criteria Crop Suitability Model.
 */
router.post('/recommend', async (req, res) => {
  try {
    const { 
      nitrogen = 80, 
      phosphorus = 45, 
      potassium = 50, 
      ph = 7.0, 
      soilType = 'Alluvial',
      location,
      season = 'Kharif'
    } = req.body || {};

    const resolvedLocation = await resolveCropLocation(location);
    const weather = await fetchAndNormalizeWeather(resolvedLocation);

    const temp = weather.current.temp;
    const humidity = weather.current.humidity;
    const rainfall = 650; // Expected seasonal rainfall baseline

    const recommendations = recommendCrops({
      nitrogen: Number(nitrogen),
      phosphorus: Number(phosphorus),
      potassium: Number(potassium),
      ph: Number(ph),
      soilType,
      temp,
      humidity,
      rainfall,
      season
    });

    return res.json({
      success: true,
      location: resolvedLocation,
      environmentalTelemetry: {
        currentTemp: `${temp}°C`,
        relativeHumidity: `${humidity}%`,
        season
      },
      soilParameters: {
        nitrogen: `${nitrogen} kg/ha`,
        phosphorus: `${phosphorus} kg/ha`,
        potassium: `${potassium} kg/ha`,
        ph,
        soilType
      },
      recommendations
    });
  } catch (err) {
    console.error('[Crops Router] POST /recommend error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Crop recommendation failed' });
  }
});

/**
 * POST /api/crops/disease-risk
 * Real-time Disease & Pest Vulnerability ML Classifier.
 */
router.post('/disease-risk', async (req, res) => {
  try {
    const { cropId = 'cotton', location } = req.body || {};

    const resolvedLocation = await resolveCropLocation(location);
    const weather = await fetchAndNormalizeWeather(resolvedLocation);

    const assessment = evaluateDiseaseRisk(cropId, weather);

    return res.json({
      success: true,
      location: resolvedLocation,
      assessment
    });
  } catch (err) {
    console.error('[Crops Router] POST /disease-risk error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Disease risk evaluation failed' });
  }
});

/**
 * POST /api/crops/irrigation
 * FAO-56 Penman-Monteith Evapotranspiration & Smart Irrigation Engine.
 */
router.post('/irrigation', async (req, res) => {
  try {
    const { cropId = 'cotton', stageIndex = 2, location } = req.body || {};

    const resolvedLocation = await resolveCropLocation(location);
    const weather = await fetchAndNormalizeWeather(resolvedLocation);

    const tempMax = weather.daily?.[0]?.tempMax || (weather.current.temp + 4);
    const tempMin = weather.daily?.[0]?.tempMin || (weather.current.temp - 4);
    const rain24h = weather.current?.precipitation || 0;
    const rain48h = weather.daily?.[1]?.precipitation || 0;

    const advisory = calculateIrrigationAdvisory({
      cropId,
      stageIndex: Number(stageIndex),
      tempMax,
      tempMin,
      forecastedRain24h: rain24h,
      forecastedRain48h: rain48h,
      latitude: resolvedLocation.latitude
    });

    return res.json({
      success: true,
      location: resolvedLocation,
      advisory
    });
  } catch (err) {
    console.error('[Crops Router] POST /irrigation error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Irrigation advisory calculation failed' });
  }
});

/**
 * POST /api/crops/analyze
 * OpenRouter AI Precision Agronomy Synthesis.
 */
router.post('/analyze', async (req, res) => {
  try {
    const { cropId = 'cotton', location, soil, customQuery } = req.body || {};

    const resolvedLocation = await resolveCropLocation(location);
    const weather = await fetchAndNormalizeWeather(resolvedLocation);

    const report = await runAgriIntelligenceAnalysis({
      cropId,
      location: resolvedLocation,
      weather,
      soil: soil || { nitrogen: 80, phosphorus: 45, potassium: 50, ph: 7.0, soilType: 'Alluvial' },
      customQuery
    });

    return res.json(report);
  } catch (err) {
    console.error('[Crops Router] POST /analyze error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Agri-Intelligence analysis failed' });
  }
});

export default router;
