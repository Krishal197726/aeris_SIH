export const PROMPT_SUGGESTIONS = [
  {
    id: 'rain-tomorrow',
    icon: 'CloudRain',
    title: 'Will it rain tomorrow?',
    category: 'Forecast',
    query: 'Will it rain tomorrow in Ahmedabad?'
  },
  {
    id: 'alerts-near-me',
    icon: 'AlertTriangle',
    title: 'Any alerts near me?',
    category: 'Severe Weather',
    query: 'Are there any active extreme weather alerts in Gujarat?'
  },
  {
    id: 'irrigate-crop',
    icon: 'Sprout',
    title: 'Should I irrigate my crop?',
    category: 'Agri-Intelligence',
    query: 'Should I irrigate my cotton and wheat fields today considering upcoming humidity?'
  },
  {
    id: 'rainfall-change',
    icon: 'TrendingUp',
    title: 'How has rainfall changed?',
    category: 'Climate Trend',
    query: 'How has the monsoon rainfall pattern changed over the last 15 years in Western India?'
  }
];

export const INITIAL_CHAT_HISTORY = [
  {
    category: 'TODAY',
    chats: [
      { id: 'chat-1', title: 'Will it rain tomorrow?', timestamp: '14:20', active: true },
      { id: 'chat-2', title: 'Weather in Ahmedabad', timestamp: '11:05', active: false },
      { id: 'chat-3', title: 'Heavy rain warning', timestamp: '09:42', active: false },
      { id: 'chat-4', title: 'Should I irrigate today?', timestamp: '08:15', active: false },
    ]
  },
  {
    category: 'YESTERDAY',
    chats: [
      { id: 'chat-5', title: 'Monsoon forecast', timestamp: 'Yesterday', active: false },
      { id: 'chat-6', title: 'Cyclone update', timestamp: 'Yesterday', active: false },
      { id: 'chat-7', title: 'Climate analysis', timestamp: 'Yesterday', active: false },
    ]
  },
  {
    category: 'PREVIOUS 7 DAYS',
    chats: [
      { id: 'chat-8', title: 'Crop yield vs heatwaves', timestamp: '3 days ago', active: false },
      { id: 'chat-9', title: 'Wind vectors over Arabian Sea', timestamp: '5 days ago', active: false },
    ]
  }
];

export const MOCK_KNOWLEDGE_BASE = {
  rain: {
    text: "Rain is likely tomorrow evening in your selected location. A localized low-pressure trough over the Northeast Arabian Sea is driving convective cloud bands inland.",
    weatherCard: {
      type: 'RAIN_FORECAST',
      title: 'RAIN FORECAST',
      location: 'Ahmedabad, Gujarat (23.02° N, 72.57° E)',
      probability: 72,
      expectedPeriod: '4 PM – 8 PM',
      intensity: 'Moderate to Heavy',
      risk: 'Moderate',
      precipitationAmount: '24 - 38 mm',
      hourlyForecast: [
        { time: '12 PM', prob: 15, temp: 33 },
        { time: '2 PM', prob: 35, temp: 32 },
        { time: '4 PM', prob: 72, temp: 28 },
        { time: '6 PM', prob: 84, temp: 26 },
        { time: '8 PM', prob: 65, temp: 25 },
        { time: '10 PM', prob: 25, temp: 25 }
      ],
      recommendation: 'Carry rain protection and consider avoiding unnecessary travel during the peak rainfall period (5:00 PM – 7:30 PM). Ensure urban drainage clearance.',
      source: 'AERIS DeepMet High-Resolution Ensemble v4.1',
      updated: '18:25 IST'
    }
  },
  irrigation: {
    text: "Based on real-time soil moisture sensors, upcoming relative humidity spikes (78%), and high probability of precipitation within the next 24-36 hours, you should HOLD irrigation today.",
    weatherCard: {
      type: 'AGRI_ADVISORY',
      title: 'SMART IRRIGATION ADVISORY',
      location: 'Western Agricultural Zone',
      soilMoisture: '34% (Adequate)',
      evapotranspiration: '3.8 mm/day',
      actionRecommendation: 'HOLD IRRIGATION',
      waterSavedEstimate: '42,000 Liters / Hectare',
      risk: 'Low Leaching Risk',
      soilMetrics: [
        { metric: 'Topsoil Moisture (0-15cm)', value: '34%', status: 'Optimal' },
        { metric: 'Subsoil Moisture (15-40cm)', value: '41%', status: 'Good' },
        { metric: '24h Rain Expectation', value: '28 mm', status: 'Sufficient' },
        { metric: 'Fungal Infection Risk', value: 'Moderate', status: 'Monitor' }
      ],
      recommendation: 'Postpone scheduled drip or flood irrigation. Natural rainfall expected between 16:00 and 20:00 will sufficiently replenish root zones without wasting ground energy.',
      source: 'AERIS Agro-Meteorological Core & ICAR Field Matrix',
      updated: '18:30 IST'
    }
  },
  alerts: {
    text: "There is currently 1 Severe Alert (Heavy Precipitation & Flash Inundation) and 1 High Wind Advisory active in your meteorological sector.",
    weatherCard: {
      type: 'SEVERE_ALERT',
      title: 'ACTIVE METEOROLOGICAL ALERT',
      severity: 'Severe',
      severityLevel: 'RED',
      location: 'Ahmedabad & North-Central Gujarat',
      phenomenon: 'Intense Convective Thunderstorm & Gale Gusts',
      windSpeed: '58 - 72 km/h',
      rainRate: 'Up to 45 mm/hr peak',
      validUntil: 'Tomorrow, 22:00 IST',
      risk: 'Severe Urban Inundation',
      recommendation: 'Secure temporary installations. Farmers should clear drainage outlets. Fishermen and small crafts advised not to venture into Gulf of Khambhat.',
      source: 'IMD Coastal Radar Network & AERIS Rapid Warning System',
      updated: '18:15 IST'
    }
  },
  cyclone: {
    text: "A deep cyclonic depression in the East-Central Arabian Sea is tracking North-Northwest with sustained core winds of 90 km/h.",
    weatherCard: {
      type: 'CYCLONE_TRACK',
      title: 'CYCLONIC STORM TRACKING',
      location: 'East-Central Arabian Sea (18.4° N, 69.2° E)',
      intensity: 'Severe Cyclonic Storm',
      centralPressure: '984 hPa',
      gustSpeed: '105 km/h',
      risk: 'High Coastal Hazard',
      recommendation: 'Continuous multi-spectral satellite tracking is active. Ports on Saurashtra coast have hoisted Local Cautionary Signal LC-3.',
      source: 'INSAT-3DR Rapid Sounder + AERIS Hurricane Core',
      updated: '18:00 IST'
    }
  }
};
