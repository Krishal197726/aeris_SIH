import * as THREE from 'three';

// Generate procedural Earth textures with landmasses, oceans, clouds, and night lights
export function createEarthTextures() {
  const width = 2048;
  const height = 1024;

  // 1. DAY MAP
  const canvasDay = document.createElement('canvas');
  canvasDay.width = width;
  canvasDay.height = height;
  const ctxDay = canvasDay.getContext('2d');

  // Ocean base gradient
  const oceanGrad = ctxDay.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#092542');
  oceanGrad.addColorStop(0.2, '#0B335E');
  oceanGrad.addColorStop(0.5, '#082747');
  oceanGrad.addColorStop(0.8, '#0B335E');
  oceanGrad.addColorStop(1, '#092542');
  ctxDay.fillStyle = oceanGrad;
  ctxDay.fillRect(0, 0, width, height);

  // Subtle ocean bathymetry / continental shelf currents
  ctxDay.fillStyle = 'rgba(14, 165, 233, 0.12)';
  for (let i = 0; i < 35; i++) {
    const x = Math.random() * width;
    const y = 200 + Math.random() * (height - 400);
    const r = 40 + Math.random() * 120;
    ctxDay.beginPath();
    ctxDay.arc(x, y, r, 0, Math.PI * 2);
    ctxDay.fill();
  }

  // Draw landmass contours (Approximation of major continents)
  ctxDay.fillStyle = '#1D4A38'; // lush vegetation base
  
  // Eurasia & India
  drawContinent(ctxDay, [
    [width * 0.42, height * 0.25], [width * 0.55, height * 0.22], [width * 0.75, height * 0.20],
    [width * 0.82, height * 0.32], [width * 0.78, height * 0.48], [width * 0.68, height * 0.52],
    [width * 0.60, height * 0.45], [width * 0.56, height * 0.58], // India subcontinent
    [width * 0.52, height * 0.52], [width * 0.48, height * 0.48], [width * 0.44, height * 0.35]
  ], '#265C45');

  // India highlight peninsula
  drawContinent(ctxDay, [
    [width * 0.53, height * 0.42], [width * 0.57, height * 0.44], [width * 0.58, height * 0.52],
    [width * 0.55, height * 0.60], [width * 0.52, height * 0.52]
  ], '#2D7252');

  // Africa
  drawContinent(ctxDay, [
    [width * 0.42, height * 0.42], [width * 0.50, height * 0.42], [width * 0.54, height * 0.55],
    [width * 0.52, height * 0.75], [width * 0.46, height * 0.82], [width * 0.40, height * 0.65],
    [width * 0.38, height * 0.50]
  ], '#4A4D30');

  // North America
  drawContinent(ctxDay, [
    [width * 0.12, height * 0.20], [width * 0.28, height * 0.18], [width * 0.32, height * 0.35],
    [width * 0.26, height * 0.48], [width * 0.20, height * 0.52], [width * 0.14, height * 0.38]
  ], '#2B5741');

  // South America
  drawContinent(ctxDay, [
    [width * 0.22, height * 0.54], [width * 0.30, height * 0.58], [width * 0.33, height * 0.72],
    [width * 0.26, height * 0.88], [width * 0.22, height * 0.78], [width * 0.20, height * 0.62]
  ], '#1E583B');

  // Australia
  drawContinent(ctxDay, [
    [width * 0.74, height * 0.65], [width * 0.84, height * 0.65], [width * 0.86, height * 0.78],
    [width * 0.76, height * 0.80], [width * 0.72, height * 0.72]
  ], '#68583B');

  // Polar Ice Caps
  ctxDay.fillStyle = 'rgba(235, 248, 255, 0.9)';
  ctxDay.fillRect(0, 0, width, height * 0.08); // Arctic
  ctxDay.fillRect(0, height * 0.92, width, height * 0.08); // Antarctica

  // Mountain ridges / terrain relief texture
  ctxDay.fillStyle = 'rgba(163, 137, 98, 0.45)';
  for (let k = 0; k < 120; k++) {
    const x = Math.random() * width;
    const y = height * 0.2 + Math.random() * (height * 0.6);
    ctxDay.beginPath();
    ctxDay.ellipse(x, y, 15 + Math.random() * 25, 4 + Math.random() * 8, Math.PI / 4, 0, Math.PI * 2);
    ctxDay.fill();
  }

  // 2. CLOUDS TEXTURE
  const canvasClouds = document.createElement('canvas');
  canvasClouds.width = width;
  canvasClouds.height = height;
  const ctxClouds = canvasClouds.getContext('2d');
  ctxClouds.fillStyle = 'rgba(0, 0, 0, 0)';
  ctxClouds.fillRect(0, 0, width, height);

  // Procedural cloud swirl bands (Monsoon & mid-latitude systems)
  for (let c = 0; c < 280; c++) {
    const x = Math.random() * width;
    const y = height * 0.15 + Math.random() * (height * 0.7);
    const radius = 25 + Math.random() * 95;
    const alpha = 0.15 + Math.random() * 0.55;

    const grad = ctxClouds.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(0.5, `rgba(240, 248, 255, ${alpha * 0.6})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctxClouds.fillStyle = grad;
    ctxClouds.beginPath();
    ctxClouds.arc(x, y, radius, 0, Math.PI * 2);
    ctxClouds.fill();
  }

  // Tropical Cyclonic Spiral feature over Indian Ocean / Bay of Bengal
  const cycloneX = width * 0.62;
  const cycloneY = height * 0.56;
  const cycloneGrad = ctxClouds.createRadialGradient(cycloneX, cycloneY, 5, cycloneX, cycloneY, 110);
  cycloneGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  cycloneGrad.addColorStop(0.4, 'rgba(230, 245, 255, 0.7)');
  cycloneGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctxClouds.fillStyle = cycloneGrad;
  ctxClouds.beginPath();
  ctxClouds.arc(cycloneX, cycloneY, 110, 0, Math.PI * 2);
  ctxClouds.fill();

  const dayTexture = new THREE.CanvasTexture(canvasDay);
  dayTexture.colorSpace = THREE.SRGBColorSpace;

  const cloudTexture = new THREE.CanvasTexture(canvasClouds);
  cloudTexture.colorSpace = THREE.SRGBColorSpace;

  return { dayTexture, cloudTexture };
}

function drawContinent(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fill();
}
