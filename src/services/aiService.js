const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Real implementation. Calls the Node/Express backend's POST /api/chat,
 * which resolves the location (geocoding), pulls LIVE weather data from
 * Open-Meteo, derives alerts, and asks OpenRouter to synthesize the final
 * advisory JSON grounded in that real data. The proxy in vite.config.js
 * forwards /api/* to the Express server, so this works with a plain
 * relative fetch in both dev and prod.
 *
 * Returns { text, card } — the exact shape ChatPage.jsx / WeatherCard.jsx
 * already expect, so no downstream rendering code changes.
 */
export async function generateWeatherIntelligenceResponse(query, persona = 'citizen', locationHint = null) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: query,
      persona,
      location: locationHint
        ? {
            name: locationHint.name,
            latitude: locationHint.lat,
            longitude: locationHint.lng,
            state: locationHint.state,
            country: locationHint.country
          }
        : undefined
    })
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `Chat service error (${response.status})`);
  }

  const data = await response.json();
  // Server wraps the actual advisory in { success, conversationId, response: { text, card, sources } }
  return {
    text: data.response.text,
    card: data.response.card
  };
}

/* ------------------------------------------------------------------ */
/* Everything below (image analysis mock, voice, TTS) is unchanged.    */
/* ------------------------------------------------------------------ */

async function _legacyMockGenerateWeatherIntelligenceResponse(query, persona = 'citizen') {
  await delay(600); // realistic inference delay

  const normalized = query.toLowerCase();

  // 1. PERSONA ADVISORY GENERATOR
  const getPersonaAdvisory = (personaId) => {
    switch (personaId) {
      case 'farmer':
        return {
          title: 'AGRONOMIC FIELD DIRECTIVE',
          recommendation: 'HOLD scheduled drip and canal irrigation. Natural precipitation of 28–42 mm expected between 16:00 and 20:30 IST will saturate root zones (0–30 cm). Monitor cotton and groundnut fields for fungal spore germination.',
          metrics: [
            { label: 'Root Zone Moisture', val: '34% (Optimal)' },
            { label: 'Evapotranspiration', val: '3.8 mm/day' },
            { label: 'Water Saved', val: '42,000 L / Ha' },
            { label: 'Fungal Risk', val: 'Moderate (Monitor)' }
          ]
        };
      case 'disaster':
        return {
          title: 'DISASTER REDUCTION & MITIGATION DIRECTIVE',
          recommendation: 'Alert municipal de-watering units across Ahmedabad urban underpasses (Akhbarnagar, Parimal). Estimated runoff volume: 85,000 m³. Mobilize SDRF Quick Response Teams for low-lying Sabarmati riverfront pockets.',
          metrics: [
            { label: 'Runoff Coefficient', val: '0.82 (High)' },
            { label: 'Pop. In Vulnerable Zone', val: '145,000' },
            { label: 'Drainage Capacity', val: '65% (Borderline)' },
            { label: 'EOC Alert Status', val: 'STAGE 2 STANDBY' }
          ]
        };
      case 'aviation':
        return {
          title: 'AVIATION METEOROLOGICAL ADVISORY',
          recommendation: 'Ahmedabad (VAAH / AMD) Runway 23/05: Expect convective turbulence and temporary reduction in RVR to 1,200m between 17:00 and 19:30 IST. Microburst downdrafts up to 32 knots detected in southwest arrival quadrant. Plan contingency fuel for holding.',
          metrics: [
            { label: 'Cloud Base Ceiling', val: '1,400 ft AGL' },
            { label: 'Vertical Wind Shear', val: '18 kts / 500 ft' },
            { label: 'Runway Visual Range', val: '3,200 m (Declining)' },
            { label: 'Convective Sigmet', val: 'ACTIVE SIGMET 02' }
          ]
        };
      case 'marine':
        return {
          title: 'MARITIME & COASTAL SAFETY DIRECTIVE',
          recommendation: 'Gulf of Khambhat & Saurashtra Coast: Significant wave heights rising from 2.2m to 3.4m. Squally winds reaching 45–55 km/h gusting to 65 km/h. Local Cautionary Signal LC-3 hoisted at Bhavnagar and Pipavav ports. Small fishing vessels strictly advised to return to harbor.',
          metrics: [
            { label: 'Swell Wave Height', val: '2.8 – 3.4 m' },
            { label: 'Peak Gale Gusts', val: '65 km/h' },
            { label: 'Tidal Cycle', val: 'High Tide 18:42 IST' },
            { label: 'Port Signal', val: 'LC-3 HOISTED' }
          ]
        };
      case 'researcher':
        return {
          title: 'SYNOPTIC & THERMODYNAMIC REANALYSIS',
          recommendation: 'Convective low-pressure vortex over Northeast Arabian Sea (18.4° N, 69.2° E) showing rapid barometric deepening (-3.8 hPa/3hr). High CAPE values (2,450 J/kg) combined with precipitable water (PWAT: 58 mm) indicate severe mesoscale convective system (MCS) propagation.',
          metrics: [
            { label: 'Surface CAPE', val: '2,450 J/kg' },
            { label: 'PWAT Water Column', val: '58.2 mm' },
            { label: 'Lifted Index (LI)', val: '-4.8 (Very Unstable)' },
            { label: 'Ensemble Variance', val: '±4.2 mm / 6hr' }
          ]
        };
      case 'citizen':
      default:
        return {
          title: 'CITIZEN MOBILITY ADVISORY',
          recommendation: 'Rain is likely tomorrow evening in Ahmedabad after 4:00 PM. Peak intensity expected between 5:00 PM and 7:30 PM. Carry rain protection and consider scheduling outdoor commutes or market trips prior to late afternoon.',
          metrics: [
            { label: 'Precipitation Prob.', val: '78%' },
            { label: 'Expected Window', val: '4 PM – 8 PM' },
            { label: 'Rain Volume', val: '25 – 40 mm' },
            { label: 'UV Index', val: '6 (Moderate)' }
          ]
        };
    }
  };

  const personaData = getPersonaAdvisory(persona);

  // 2. WHY THIS RISK DIAGNOSTIC BREAKDOWN
  const whyThisRiskDetails = {
    factors: [
      {
        title: '78% Precipitation Probability',
        detail: 'Ensemble agreement across ECMWF, GFS, and WRF 3km high-resolution runs confirms heavy convective moisture convergence.'
      },
      {
        title: 'Increasing Wind & Squall Dynamics',
        detail: 'Surface winds accelerating from 14 km/h to gust peaks of 42 km/h during convective downdrafts.'
      },
      {
        title: 'Atmospheric Instability (CAPE > 2,400 J/kg)',
        detail: 'High thermal lapse rates and Gulf of Khambhat moisture flux creating strong vertical thunderstorm updrafts.'
      },
      {
        title: 'Official Multi-Agency Cross-Check',
        detail: 'IMD Doppler Radar Bhuj/Ahmedabad reflectivity > 45 dBZ verified against INSAT-3DR infrared sounders.'
      }
    ],
    nwpModels: ['IMD HRRR v4.2', 'GFS 0.25°', 'ECMWF IFS', 'WRF-AERIS Meso 3km'],
    synopticSource: 'IMD Coastal Radar Network & AERIS Rapid Warning System',
    timestamp: '14:32 IST (Live Telemetry Sync)'
  };

  return {
    text: `Ahmedabad Weather Intelligence: Deep moisture inflow from the Northeast Arabian Sea is driving convective cloud bands inland. Expected precipitation probability is 78% with moderate to heavy spells during late afternoon.`,
    card: {
      type: 'METEOROLOGICAL_COMMAND_CARD',
      location: 'Ahmedabad, Gujarat (23.02° N, 72.57° E)',
      tempRange: '24°C — 31°C',
      currentTemp: '29.4°C',
      rainProb: 78,
      windSpeed: '18 km/h WSW (Gusts 42 km/h)',
      humidity: '82%',
      riskLevel: 'MODERATE TO HIGH',
      riskColor: '#f59e0b',
      personaAdvisory: personaData,
      whyThisRisk: whyThisRiskDetails,
      source: 'IMD • GFS • WRF • AERIS Ensemble v4.1',
      updated: '14:32 IST'
    }
  };
}

export async function analyzeWeatherImage(imageUrl, fileName = 'sky_analysis.jpg') {
  await delay(1100);

  return {
    success: true,
    fileName,
    imageUrl,
    analysis: {
      classification: 'Cumulonimbus Calvus with Inflow Stasis Arc',
      cloudCoverage: '82% Sky Fraction (Severe Overcast)',
      estimatedCeiling: '1,250 m Above Ground Level',
      verticalDevelopment: 'Severe (Towering convective column exceeding 9,000m)',
      precipitationLikelihood: '88% within 60 minutes',
      thunderstormPotential: 'HIGH (Elevated cloud-to-ground lightning risk)',
      meteorologicalCrossCheck: 'Cross-referenced with Ahmedabad Doppler Radar: Echo top height measured at 11.4 km with core reflectivity of 48.5 dBZ. Atmospheric sounding confirms steep lapse rate (-7.2°C/km).',
      disclaimer: 'AI Visual Weather Analysis combines multi-spectral computer vision with real-time numerical weather prediction (NWP) sounding models. Photographic imaging is fused with atmospheric pressure data.'
    }
  };
}

export async function transcribeMockVoice() {
  await delay(1500);
  const sampleQueries = [
    "Will it rain tomorrow in Ahmedabad?",
    "Show active thunderstorm warnings in Gujarat.",
    "Should I irrigate my crops today?",
    "Show cyclonic storm track over the Arabian Sea."
  ];
  return sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
}

// Browser Text-To-Speech Synthesis
export function speakWeatherAdvisory(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Real Browser Speech Recognition with fallback
export function startVoiceRecognition({ onResult, onError, onEnd }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    setTimeout(() => {
      onResult("Will it rain tomorrow in Ahmedabad?");
      if (onEnd) onEnd();
    }, 2000);
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-IN';

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error);
    onResult("Will it rain tomorrow in Ahmedabad?");
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
  } catch (err) {
    onResult("Will it rain tomorrow in Ahmedabad?");
    if (onEnd) onEnd();
  }

  return recognition;
}
