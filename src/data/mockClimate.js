export const TEMPERATURE_TREND_DATA = [
  { year: '2000', tempAnomaly: +0.22, baseline: 0.00, highTemp: 38.2, heatwaveDays: 14 },
  { year: '2002', tempAnomaly: +0.35, baseline: 0.00, highTemp: 39.1, heatwaveDays: 18 },
  { year: '2004', tempAnomaly: +0.28, baseline: 0.00, highTemp: 38.6, heatwaveDays: 16 },
  { year: '2006', tempAnomaly: +0.44, baseline: 0.00, highTemp: 39.8, heatwaveDays: 21 },
  { year: '2008', tempAnomaly: +0.38, baseline: 0.00, highTemp: 39.0, heatwaveDays: 19 },
  { year: '2010', tempAnomaly: +0.68, baseline: 0.00, highTemp: 41.2, heatwaveDays: 28 },
  { year: '2012', tempAnomaly: +0.52, baseline: 0.00, highTemp: 40.4, heatwaveDays: 22 },
  { year: '2014', tempAnomaly: +0.61, baseline: 0.00, highTemp: 40.8, heatwaveDays: 25 },
  { year: '2016', tempAnomaly: +0.92, baseline: 0.00, highTemp: 42.6, heatwaveDays: 34 },
  { year: '2018', tempAnomaly: +0.78, baseline: 0.00, highTemp: 41.9, heatwaveDays: 29 },
  { year: '2020', tempAnomaly: +0.86, baseline: 0.00, highTemp: 42.1, heatwaveDays: 31 },
  { year: '2022', tempAnomaly: +1.08, baseline: 0.00, highTemp: 43.8, heatwaveDays: 39 },
  { year: '2024', tempAnomaly: +1.24, baseline: 0.00, highTemp: 44.5, heatwaveDays: 42 },
  { year: '2026 (Est)', tempAnomaly: +1.38, baseline: 0.00, highTemp: 45.2, heatwaveDays: 46 },
];

export const RAINFALL_VARIABILITY_DATA = [
  { year: '2012', actualRain: 840, normalRain: 887, variance: -5.3, heavyRainEvents: 8 },
  { year: '2014', actualRain: 780, normalRain: 887, variance: -12.1, heavyRainEvents: 6 },
  { year: '2016', actualRain: 864, normalRain: 887, variance: -2.6, heavyRainEvents: 11 },
  { year: '2018', actualRain: 804, normalRain: 887, variance: -9.4, heavyRainEvents: 9 },
  { year: '2019', actualRain: 968, normalRain: 887, variance: +9.1, heavyRainEvents: 18 },
  { year: '2020', actualRain: 958, normalRain: 887, variance: +8.0, heavyRainEvents: 17 },
  { year: '2021', actualRain: 870, normalRain: 887, variance: -1.9, heavyRainEvents: 14 },
  { year: '2022', actualRain: 925, normalRain: 887, variance: +4.3, heavyRainEvents: 19 },
  { year: '2023', actualRain: 820, normalRain: 887, variance: -7.5, heavyRainEvents: 15 },
  { year: '2024', actualRain: 940, normalRain: 887, variance: +6.0, heavyRainEvents: 22 },
  { year: '2025', actualRain: 962, normalRain: 887, variance: +8.4, heavyRainEvents: 24 },
];

export const EXTREME_EVENTS_BY_DECADE = [
  { decade: '1990s', cyclones: 18, flashFloods: 42, severeDroughts: 12, heatwaves: 65 },
  { decade: '2000s', cyclones: 24, flashFloods: 68, severeDroughts: 15, heatwaves: 94 },
  { decade: '2010s', cyclones: 33, flashFloods: 112, severeDroughts: 19, heatwaves: 168 },
  { decade: '2020s (Proj)', cyclones: 48, flashFloods: 185, severeDroughts: 26, heatwaves: 254 },
];

export const REGIONAL_VULNERABILITY_INDEX = [
  { region: 'Western Coastal Zone (Gujarat/Maharashtra)', riskScore: 88, primaryThreat: 'Cyclonic Surges & Flash Inundation', adaptStatus: 'High Priority' },
  { region: 'Indo-Gangetic Plain (Delhi/UP/Bihar)', riskScore: 82, primaryThreat: 'Extreme Heat & Air Stagnation', adaptStatus: 'Critical' },
  { region: 'Thar Desert Fringe (Rajasthan)', riskScore: 91, primaryThreat: 'Prolonged Drought & Surface Desiccation', adaptStatus: 'Critical' },
  { region: 'Brahmaputra Basin (Assam/NE)', riskScore: 86, primaryThreat: 'Riverine Overflow & Landslides', adaptStatus: 'Urgent' },
  { region: 'Deccan Agricultural Heartland', riskScore: 74, primaryThreat: 'Monsoon Rainfall Erraticity', adaptStatus: 'Moderate' },
];
