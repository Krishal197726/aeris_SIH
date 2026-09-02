import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { latLongToVector3, easeInOutCubic } from '../../utils/geoUtils';

const MARKER_STATIONS = [
  { id: 'amd', name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, temp: '29°C', rain: '78%' },
  { id: 'bom', name: 'Mumbai', lat: 19.0760, lng: 72.8777, temp: '31°C', rain: '45%' },
  { id: 'del', name: 'New Delhi', lat: 28.6139, lng: 77.2090, temp: '37°C', rain: '15%' },
  { id: 'blr', name: 'Bengaluru', lat: 12.9716, lng: 77.5946, temp: '25°C', rain: '62%' },
  { id: 'jpr', name: 'Jaipur', lat: 26.9124, lng: 75.7873, temp: '40°C', rain: '5%' },
  { id: 'lon', name: 'London', lat: 51.5074, lng: -0.1278, temp: '19°C', rain: '40%' },
  { id: 'nyc', name: 'New York', lat: 40.7128, lng: -74.0060, temp: '26°C', rain: '25%' },
  { id: 'tok', name: 'Tokyo', lat: 35.6762, lng: 139.6503, temp: '28°C', rain: '55%' },
];

export default function EarthCanvas({
  focusTarget = null,
  className = ''
}) {
  const mountRef = useRef(null);

  // Flight transition and orbital state
  const stateRef = useRef({
    currentLat: -5,
    currentLng: -55,
    targetLat: -5,
    targetLng: -55,
    startLat: -5,
    startLng: -55,
    
    currentDistance: 2.45,
    targetDistance: 2.45,
    startDistance: 2.45,
    
    isFlying: false,
    flightStartTime: 0,
    flightDuration: 2400,
    
    isDragging: false,
    prevX: 0,
    prevY: 0,
    lastUserInteraction: 0,
    autoSpeed: 0.04
  });

  useEffect(() => {
    if (focusTarget && focusTarget.lat !== undefined && focusTarget.lng !== undefined) {
      const s = stateRef.current;
      s.startLat = s.currentLat;
      s.startLng = s.currentLng;
      s.startDistance = s.currentDistance;

      s.targetLat = focusTarget.lat;
      let deltaLng = focusTarget.lng - (s.currentLng % 360);
      while (deltaLng > 180) deltaLng -= 360;
      while (deltaLng < -180) deltaLng -= 360;
      s.targetLng = s.currentLng + deltaLng;

      s.targetDistance = focusTarget.zoom || 1.95;
      s.isFlying = true;
      s.flightStartTime = performance.now();
      s.flightDuration = 2400;
      s.lastUserInteraction = Date.now();
    }
  }, [focusTarget]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. SCENE & CAMERA (Centered on viewport)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 2.45);

    // 2. RENDERER (Balanced natural exposure)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. DIRECTIONAL SUN LIGHTING
    const sunDirection = new THREE.Vector3(4.8, 2.0, 3.8).normalize();
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.copy(sunDirection.clone().multiplyScalar(40));
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0a1e16, 0.35);
    scene.add(ambientLight);

    // 4. EARTH GROUP (23.44° axial tilt)
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = (23.44 * Math.PI) / 180;
    scene.add(earthGroup);

    // 5. NASA TEXTURES
    const textureLoader = new THREE.TextureLoader();
    const dayMap = textureLoader.load('/textures/earth/earth_day.jpg');
    dayMap.colorSpace = THREE.SRGBColorSpace;

    const nightMap = textureLoader.load('/textures/earth/earth_night.png');
    nightMap.colorSpace = THREE.SRGBColorSpace;

    const cloudsMap = textureLoader.load('/textures/earth/earth_clouds.png');
    cloudsMap.colorSpace = THREE.SRGBColorSpace;

    const specularMap = textureLoader.load('/textures/earth/earth_specular.jpg');
    const normalMap = textureLoader.load('/textures/earth/earth_normal.jpg');

    // 6. REALISTIC EARTH SHADER: DEEP NATURAL BLUE OCEANS, NO WHITE GLARE WASH-OUT
    const earthVertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const earthFragmentShader = `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform sampler2D specularTexture;
      uniform sampler2D normalTexture;
      uniform vec3 sunDirection;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(-vPosition);
        
        float nDotL = dot(normal, sunDirection);
        float dayWeight = smoothstep(-0.10, 0.16, nDotL);

        vec4 dayColor = texture2D(dayTexture, vUv);
        vec4 nightColor = texture2D(nightTexture, vUv);
        float specularMask = texture2D(specularTexture, vUv).r;

        // Vivid natural land colors (lush greens, golden deserts & mountains)
        vec3 dayRgb = dayColor.rgb;
        dayRgb = pow(dayRgb, vec3(0.92));
        dayRgb = mix(vec3(dot(dayRgb, vec3(0.299, 0.587, 0.114))), dayRgb, 1.25);

        // DEEP NATURAL OCEAN BLUE (Sapphire & Marine Blue without blown-out white glare)
        vec3 oceanDeep = vec3(0.012, 0.085, 0.24); // Deep Atlantic/Pacific blue
        vec3 oceanShallow = vec3(0.025, 0.16, 0.38); // Coastal shelf blue
        vec3 naturalOcean = mix(oceanDeep, oceanShallow, clamp(dayColor.b * 1.2, 0.0, 1.0));

        if (specularMask > 0.1) {
          dayRgb = mix(dayRgb, naturalOcean, specularMask * 0.82);
        }

        // Subtle, tight natural sun reflection (NO massive white washed-out circle)
        vec3 halfVector = normalize(sunDirection + viewDir);
        float nDotH = max(0.0, dot(normal, halfVector));
        float tightGlint = pow(nDotH, 64.0) * specularMask * 0.28 * max(0.0, nDotL);
        vec3 oceanGlint = vec3(0.8, 0.9, 1.0) * tightGlint;

        // Illumination
        vec3 dayLighting = dayRgb * (max(0.12, nDotL) * 1.15 + 0.14) + oceanGlint;
        vec3 nightLighting = nightColor.rgb * vec3(1.3, 1.0, 0.7) * 2.2 + dayRgb * 0.04;

        vec3 finalColor = mix(nightLighting, dayLighting, dayWeight);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const earthGeo = new THREE.SphereGeometry(1.0, 128, 128);
    const earthMat = new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        dayTexture: { value: dayMap },
        nightTexture: { value: nightMap },
        specularTexture: { value: specularMap },
        normalTexture: { value: normalMap },
        sunDirection: { value: sunDirection }
      }
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // 7. INDEPENDENT CLOUDS SPHERE
    const cloudGeo = new THREE.SphereGeometry(1.010, 128, 128);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(cloudMesh);

    // 8. LOCATION 3D PINS
    const pinsGroup = new THREE.Group();
    earthGroup.add(pinsGroup);

    MARKER_STATIONS.forEach((st) => {
      const pos = latLongToVector3(st.lat, st.lng, 1.016);

      const pinMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.011, 16, 16),
        new THREE.MeshBasicMaterial({ color: st.id === 'amd' ? 0xef4444 : 0x00e5ff })
      );
      pinMesh.position.copy(pos);
      pinsGroup.add(pinMesh);

      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.013, 0.019, 16),
        new THREE.MeshBasicMaterial({
          color: pinMesh.material.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        })
      );
      ringMesh.position.copy(pos);
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      pinsGroup.add(ringMesh);
    });

    // 9. REALISTIC STARFIELD
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 120;
      starPos[i + 1] = (Math.random() - 0.5) * 120;
      starPos[i + 2] = -25 - Math.random() * 80;

      const brightness = 0.4 + Math.random() * 0.6;
      starCol[i] = brightness * 0.88;
      starCol[i + 1] = brightness * 0.94;
      starCol[i + 2] = brightness * 1.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));

    const starField = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.85 })
    );
    scene.add(starField);

    // 10. CONTROLS
    const s = stateRef.current;

    const onPointerDown = (e) => {
      s.isDragging = true;
      s.isFlying = false;
      s.prevX = e.clientX;
      s.prevY = e.clientY;
      s.lastUserInteraction = Date.now();
    };

    const onPointerMove = (e) => {
      if (!s.isDragging) return;
      const deltaX = e.clientX - s.prevX;
      const deltaY = e.clientY - s.prevY;

      s.targetLng -= deltaX * 0.28;
      s.targetLat = Math.max(-80, Math.min(80, s.targetLat + deltaY * 0.28));

      s.prevX = e.clientX;
      s.prevY = e.clientY;
      s.lastUserInteraction = Date.now();
    };

    const onPointerUp = () => {
      s.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      s.targetDistance = Math.max(1.65, Math.min(3.6, s.targetDistance + e.deltaY * 0.0018));
      s.lastUserInteraction = Date.now();
      s.isFlying = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. ANIMATION LOOP
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (s.isFlying) {
        const elapsed = performance.now() - s.flightStartTime;
        const progress = Math.min(1.0, elapsed / s.flightDuration);
        const ease = easeInOutCubic(progress);

        s.currentLat = s.startLat + (s.targetLat - s.startLat) * ease;
        s.currentLng = s.startLng + (s.targetLng - s.startLng) * ease;
        s.currentDistance = s.startDistance + (s.targetDistance - s.startDistance) * ease;

        if (progress >= 1.0) {
          s.isFlying = false;
        }
      } else {
        const idleTime = Date.now() - s.lastUserInteraction;
        if (!s.isDragging && idleTime > 2500) {
          s.targetLng += s.autoSpeed;
        }

        s.currentLat += (s.targetLat - s.currentLat) * 0.055;
        s.currentLng += (s.targetLng - s.currentLng) * 0.055;
        s.currentDistance += (s.targetDistance - s.currentDistance) * 0.075;
      }

      const theta = (s.currentLng + 180) * (Math.PI / 180);
      const phi = s.currentLat * (Math.PI / 180) * 0.28;

      earthMesh.rotation.y = -theta;
      earthMesh.rotation.x = phi;

      cloudMesh.rotation.y = -theta * 1.035;
      cloudMesh.rotation.x = phi;

      pinsGroup.rotation.y = earthMesh.rotation.y;
      pinsGroup.rotation.x = earthMesh.rotation.x;

      camera.position.z = s.currentDistance;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      earthGeo.dispose();
      cloudGeo.dispose();
      starGeo.dispose();
      if (container && renderer.domElement) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        title="NASA Satellite Earth"
      />
    </div>
  );
}
