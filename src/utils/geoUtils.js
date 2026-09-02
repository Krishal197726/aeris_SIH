import * as THREE from 'three';

// Comprehensive Geographic Coordinate Registry
export const GEO_REGISTRY = {
  // Major Indian Cities & States
  'ahmedabad': { name: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714, state: 'Gujarat', country: 'India', temp: '29°C', rain: '78%', wind: '18 km/h WSW', humidity: '82%', risk: 'MODERATE TO HIGH', condition: 'Convective Cloud Formation' },
  'mumbai': { name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777, state: 'Maharashtra', country: 'India', temp: '31°C', rain: '45%', wind: '22 km/h WNW', humidity: '86%', risk: 'MODERATE', condition: 'Coastal Squall Watch' },
  'delhi': { name: 'New Delhi, NCR', lat: 28.6139, lng: 77.2090, state: 'Delhi NCR', country: 'India', temp: '37°C', rain: '15%', wind: '14 km/h NW', humidity: '48%', risk: 'HEAT ALERT', condition: 'Dry Thermal Inversion' },
  'new delhi': { name: 'New Delhi, NCR', lat: 28.6139, lng: 77.2090, state: 'Delhi NCR', country: 'India', temp: '37°C', rain: '15%', wind: '14 km/h NW', humidity: '48%', risk: 'HEAT ALERT', condition: 'Dry Thermal Inversion' },
  'bengaluru': { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946, state: 'Karnataka', country: 'India', temp: '25°C', rain: '62%', wind: '18 km/h ESE', humidity: '79%', risk: 'LOW', condition: 'Pleasant Orographic Showers' },
  'bangalore': { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946, state: 'Karnataka', country: 'India', temp: '25°C', rain: '62%', wind: '18 km/h ESE', humidity: '79%', risk: 'LOW', condition: 'Pleasant Orographic Showers' },
  'kolkata': { name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639, state: 'West Bengal', country: 'India', temp: '32°C', rain: '68%', wind: '26 km/h S', humidity: '84%', risk: 'MODERATE', condition: 'Norwester Thunderstorm Watch' },
  'calcutta': { name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639, state: 'West Bengal', country: 'India', temp: '32°C', rain: '68%', wind: '26 km/h S', humidity: '84%', risk: 'MODERATE', condition: 'Norwester Thunderstorm Watch' },
  'chennai': { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu', country: 'India', temp: '34°C', rain: '30%', wind: '20 km/h ENE', humidity: '78%', risk: 'MODERATE', condition: 'Warm Humid Marine Flow' },
  'hyderabad': { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867, state: 'Telangana', country: 'India', temp: '30°C', rain: '35%', wind: '16 km/h SW', humidity: '65%', risk: 'LOW', condition: 'Scattered Cloud Deck' },
  'jaipur': { name: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873, state: 'Rajasthan', country: 'India', temp: '40°C', rain: '5%', wind: '12 km/h W', humidity: '24%', risk: 'SEVERE HEAT', condition: 'Intense Arid Heatwave' },
  'surat': { name: 'Surat, Gujarat', lat: 21.1702, lng: 72.8311, state: 'Gujarat', country: 'India', temp: '31°C', rain: '72%', wind: '24 km/h WSW', humidity: '85%', risk: 'MODERATE TO HIGH', condition: 'Heavy Coastal Precipitation' },
  'rajkot': { name: 'Rajkot, Gujarat', lat: 22.3039, lng: 70.8022, state: 'Gujarat', country: 'India', temp: '32°C', rain: '65%', wind: '28 km/h SW', humidity: '74%', risk: 'MODERATE', condition: 'Saurashtra Squall Watch' },
  'bhavnagar': { name: 'Bhavnagar, Gujarat', lat: 21.7645, lng: 72.1519, state: 'Gujarat', country: 'India', temp: '30°C', rain: '82%', wind: '35 km/h S', humidity: '88%', risk: 'HIGH', condition: 'Gulf of Khambhat Trough' },
  'vadodara': { name: 'Vadodara, Gujarat', lat: 22.3072, lng: 73.1812, state: 'Gujarat', country: 'India', temp: '31°C', rain: '68%', wind: '18 km/h WSW', humidity: '80%', risk: 'MODERATE', condition: 'Central Gujarat Moisture Surge' },
  'jamnagar': { name: 'Jamnagar, Gujarat', lat: 22.4707, lng: 70.0577, state: 'Gujarat', country: 'India', temp: '29°C', rain: '55%', wind: '30 km/h W', humidity: '78%', risk: 'MODERATE', condition: 'Coastal Wind Surge' },
  'gandhinagar': { name: 'Gandhinagar, Gujarat', lat: 23.2156, lng: 72.6369, state: 'Gujarat', country: 'India', temp: '29°C', rain: '75%', wind: '18 km/h SW', humidity: '81%', risk: 'MODERATE', condition: 'Thunderstorm Watch' },
  'pune': { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567, state: 'Maharashtra', country: 'India', temp: '28°C', rain: '50%', wind: '16 km/h WNW', humidity: '72%', risk: 'LOW', condition: 'Ghats Orographic Clouds' },
  'guwahati': { name: 'Guwahati, Assam', lat: 26.1445, lng: 91.7362, state: 'Assam', country: 'India', temp: '27°C', rain: '88%', wind: '20 km/h NE', humidity: '92%', risk: 'FLOOD WATCH', condition: 'Heavy Monsoonal Runoff' },
  'gujarat': { name: 'Gujarat State, India', lat: 22.2587, lng: 71.1924, state: 'Gujarat', country: 'India', temp: '30°C', rain: '74%', wind: '25 km/h SW', humidity: '80%', risk: 'MODERATE TO HIGH', condition: 'Regional Low-Pressure System' },
  'india': { name: 'Subcontinent Grid, India', lat: 20.5937, lng: 78.9629, state: 'Subcontinent', country: 'India', temp: '31°C', rain: '60%', wind: '20 km/h SW', humidity: '75%', risk: 'MODERATE', condition: 'Southwest Monsoon Synoptic Flow' },

  // Key International Hubs
  'london': { name: 'London, United Kingdom', lat: 51.5074, lng: -0.1278, state: 'England', country: 'UK', temp: '19°C', rain: '40%', wind: '15 km/h SW', humidity: '70%', risk: 'LOW', condition: 'North Atlantic Marine Front' },
  'new york': { name: 'New York City, USA', lat: 40.7128, lng: -74.0060, state: 'New York', country: 'USA', temp: '26°C', rain: '25%', wind: '18 km/h SE', humidity: '62%', risk: 'LOW', condition: 'Humid Continental Flow' },
  'tokyo': { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, state: 'Kanto', country: 'Japan', temp: '28°C', rain: '55%', wind: '22 km/h S', humidity: '78%', risk: 'MODERATE', condition: 'Pacific Maritime Air' },
  'paris': { name: 'Paris, France', lat: 48.8566, lng: 2.3522, state: 'Île-de-France', country: 'France', temp: '23°C', rain: '20%', wind: '12 km/h WNW', humidity: '58%', risk: 'LOW', condition: 'Temperate Continental Flow' },
  'dubai': { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, state: 'Dubai', country: 'UAE', temp: '41°C', rain: '0%', wind: '18 km/h NW', humidity: '45%', risk: 'HIGH HEAT', condition: 'Persian Gulf Extreme Solar Thermal' },
  'singapore': { name: 'Singapore', lat: 1.3521, lng: 103.8198, state: 'Singapore', country: 'Singapore', temp: '30°C', rain: '80%', wind: '12 km/h SSE', humidity: '85%', risk: 'MODERATE', condition: 'Equatorial Convective Showers' },
  'sydney': { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, state: 'NSW', country: 'Australia', temp: '20°C', rain: '30%', wind: '24 km/h ENE', humidity: '64%', risk: 'LOW', condition: 'Tasman Sea Marine Breeze' }
};

// Convert Geographic Latitude & Longitude to Three.js Vector3 Cartesian on a sphere
export function latLongToVector3(lat, lng, radius = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

// Natural Language Location Extractor
export function extractLocationFromQuery(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.toLowerCase().trim();

  // 1. Direct registry lookup
  for (const [key, data] of Object.entries(GEO_REGISTRY)) {
    // Word boundary or containment check
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(q)) {
      return data;
    }
  }

  // 2. Default fallback: If query contains weather terms without explicit city, default to Ahmedabad
  if (q.includes('rain') || q.includes('forecast') || q.includes('alert') || q.includes('temperature') || q.includes('irrigate')) {
    return GEO_REGISTRY['ahmedabad'];
  }

  return null;
}

// Cubic Easing Function for smooth Google-Earth style camera transitions
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
