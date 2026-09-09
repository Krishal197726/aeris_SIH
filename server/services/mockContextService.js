/**
 * AERIS / WeatherGPT — Mock Context Service
 * 
 * SERVER-SIDE ONLY.
 * Provides isolated mock weather, crop, and alert context adhering strictly to contracts
 * in ARCHITECTURE.md (Sections 7.3, 10, and 12) until live API services are implemented.
 * 
 * HONESTY & ATTRIBUTION GOVERNANCE:
 * - Data from this service is strictly MOCK context for integration testing.
 * - Sources are explicitly marked as "MOCK_WEATHER_DATA", "MOCK_CROP_RULES", etc.
 * - Real provider names (IMD, OpenWeatherMap, NWP models) MUST NOT be attributed to mock data.
 */

/**
 * Generate mock weather data for a requested location.
 * @param {object} [location]
 * @returns {object} WeatherData object according to ARCHITECTURE.md Section 10 contract
 */
export function getMockWeatherData(location = {}) {
  const locName = location.name || 'Ahmedabad';
  const lat = typeof location.latitude === 'number' ? location.latitude : 23.0225;
  const lon = typeof location.longitude === 'number' ? location.longitude : 72.5714;
  const state = location.state || 'Gujarat';

  return {
    location: {
      name: locName,
      district: locName,
      state: state,
      country: 'India',
      latitude: lat,
      longitude: lon
    },
    current: {
      temp: 29.4,
      feelsLike: 33.1,
      humidity: 82,
      pressure: 1008,
      windSpeed: 18,
      windDirection: 'WSW',
      precipitation: 2.4,
      precipitationProbability: 78,
      condition: 'Thunderstorm',
      visibility: 6.0,
      uvIndex: 6,
      sunrise: '06:15 IST',
      sunset: '19:02 IST'
    },
    hourly: [
      { time: '14:00', temp: 30.1, rainProb: 35, condition: 'Partly Cloudy' },
      { time: '16:00', temp: 28.5, rainProb: 78, condition: 'Heavy Rain' },
      { time: '18:00', temp: 27.0, rainProb: 65, condition: 'Moderate Rain' },
      { time: '20:00', temp: 26.2, rainProb: 40, condition: 'Light Rain' }
    ],
    daily: [
      { date: '2026-09-06', tempMin: 24.0, tempMax: 31.0, rainProb: 78, condition: 'Thunderstorm' },
      { date: '2026-09-07', tempMin: 23.5, tempMax: 30.5, rainProb: 60, condition: 'Moderate Rain' }
    ],
    source: 'MOCK_WEATHER_DATA',
    retrievedAt: new Date().toISOString()
  };
}

/**
 * Generate mock crop profile.
 * @param {string} [cropId]
 * @returns {object} CropProfile object according to ARCHITECTURE.md Section 12 contract
 */
export function getMockCropProfile(cropId = 'cotton') {
  const cropMap = {
    cotton: {
      id: 'cotton',
      cropName: 'Cotton',
      season: 'Kharif',
      optimalTempRange: { min: 21, max: 35 },
      rainfallRequirement: '500 - 1000 mm',
      humidityLimit: 80,
      growthStages: ['Square formation', 'Flowering', 'Boll development'],
      irrigationGuidance: 'Maintain soil moisture at 60-70% field capacity during flowering.',
      weatherRisks: ['Waterlogging during boll opening', 'High humidity encouraging pink bollworm'],
      diseaseRelationships: [
        { disease: 'Tikka leaf spot', triggerCondition: 'Temp 25-30°C and Relative Humidity > 85% for 2 consecutive days' }
      ],
      advisoryRules: [
        { condition: 'precipitation_24h > 30mm', action: 'Hold irrigation for next 48 hours' }
      ]
    },
    groundnut: {
      id: 'groundnut',
      cropName: 'Groundnut',
      season: 'Kharif',
      optimalTempRange: { min: 22, max: 32 },
      rainfallRequirement: '500 - 700 mm',
      humidityLimit: 80,
      growthStages: ['Germination', 'Pegging', 'Pod formation', 'Maturity'],
      irrigationGuidance: 'Critical water requirement during pegging and pod development stages.',
      weatherRisks: ['Waterlogging leading to pod rot', 'Dry spell during pegging stage'],
      diseaseRelationships: [
        { disease: 'Tikka leaf spot', triggerCondition: 'Temp 25-30°C and Relative Humidity > 85%' }
      ],
      advisoryRules: [
        { condition: 'precipitation_24h > 30mm', action: 'Hold irrigation for next 48 hours' }
      ]
    }
  };

  return cropMap[cropId?.toLowerCase()] || cropMap.cotton;
}

/**
 * Generate mock alerts list.
 * @param {string} [state]
 * @returns {Array<object>} Alert array according to ARCHITECTURE.md Section 7.3 contract
 */
export function getMockAlerts(state = 'Gujarat') {
  return [
    {
      id: 'alert_guj_mock_0912',
      title: 'Heavy Rain & Squally Wind Advisory (Mock Bulletin)',
      severity: 'Severe',
      severityLevel: 'RED',
      state: state || 'Gujarat',
      affectedDistricts: ['Ahmedabad', 'Gandhinagar', 'Kheda'],
      phenomenon: 'Thunderstorm & Squall',
      windSpeed: '58 - 72 km/h',
      validUntil: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      instruction: 'Clear drainage outlets. Exercise caution during severe weather windows.',
      issuedBy: 'MOCK_ALERT_SERVICE'
    }
  ];
}

/**
 * Retrieve comprehensive mock context matching current request details.
 * @param {object} params
 * @param {object} [params.location]
 * @param {string} [params.persona]
 * @param {string} [params.cropId]
 * @returns {{ weather: object, crop: object, alerts: Array<object> }}
 */
export function getMockContext({ location, persona = 'citizen', cropId = 'cotton' } = {}) {
  return {
    weather: getMockWeatherData(location),
    crop: persona === 'farmer' ? getMockCropProfile(cropId) : getMockCropProfile('cotton'),
    alerts: getMockAlerts(location?.state)
  };
}
