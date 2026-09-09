/**
 * AERIS / WeatherGPT — Frontend Crop Intelligence API Client Service
 */

export async function fetchCropsList() {
  const res = await fetch('/api/crops');
  if (!res.ok) throw new Error('Failed to fetch crops list');
  return res.json();
}

export async function fetchCropDetail(cropId) {
  const res = await fetch(`/api/crops/${encodeURIComponent(cropId)}`);
  if (!res.ok) throw new Error(`Failed to fetch crop detail for ${cropId}`);
  return res.json();
}

export async function getCropRecommendations(payload) {
  const res = await fetch('/api/crops/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Crop recommendation failed');
  return res.json();
}

export async function evaluateDiseaseRisk(payload) {
  const res = await fetch('/api/crops/disease-risk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Disease risk evaluation failed');
  return res.json();
}

export async function getIrrigationAdvisory(payload) {
  const res = await fetch('/api/crops/irrigation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Irrigation advisory calculation failed');
  return res.json();
}

export async function runOpenRouterAgriAnalysis(payload) {
  const res = await fetch('/api/crops/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Agri-Intelligence analysis failed');
  return res.json();
}
