import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Compass,
  Plus,
  Minus,
  Crosshair,
  Maximize2,
  Minimize2,
  RotateCcw,
  Globe as GlobeIcon,
  Layers,
  Calendar,
  Satellite as SatelliteIcon,
  ArrowRight
} from 'lucide-react';

/* ================= PROCEDURAL HIGH-FIDELITY EARTH TEXTURE GENERATOR ================= */
// Generates a crisp, rich 2048x1024 equirectangular Earth texture with oceans, continents,
// golden highlighted India, night city lights, and latitude/longitude grid.
function createEarthCanvasTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Deep Ocean Base with realistic marine trenches
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#04152d');
  oceanGrad.addColorStop(0.35, '#07244a');
  oceanGrad.addColorStop(0.5, '#0a3266');
  oceanGrad.addColorStop(0.65, '#07244a');
  oceanGrad.addColorStop(1, '#04152d');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper to convert lat/lng to canvas x/y
  const toXY = (lat, lng) => {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  // 2. Continents drawing with rich terrain gradients (Eurasia, Africa, Americas, Australia)
  const drawPoly = (points, fill, stroke = null, strokeWidth = 1) => {
    if (!points || points.length < 3) return;
    ctx.beginPath();
    const [startX, startY] = toXY(points[0][0], points[0][1]);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < points.length; i++) {
      const [px, py] = toXY(points[i][0], points[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  };

  // Rough realistic continental boundaries
  // Africa
  drawPoly([
    [36, -6], [32, 32], [12, 51], [5, 48], [-11, 40], [-25, 32],
    [-34, 18], [-33, 27], [-17, 12], [4, 9], [15, -17], [28, -13], [36, -6]
  ], '#204a29', '#14331c', 2);

  // Eurasia (Europe + Asia)
  drawPoly([
    [71, 28], [65, 80], [60, 140], [45, 145], [35, 130], [22, 120],
    [10, 105], [15, 95], [25, 80], [12, 75], [25, 60], [30, 35],
    [40, 28], [55, 30], [65, 15], [71, 28]
  ], '#24522e', '#16381e', 2);

  // North America
  drawPoly([
    [70, -160], [70, -60], [50, -55], [30, -80], [15, -90], [18, -105],
    [32, -118], [55, -135], [65, -168], [70, -160]
  ], '#294f2d', '#1a371e', 2);

  // South America
  drawPoly([
    [12, -72], [7, -52], [-5, -35], [-22, -41], [-54, -68], [-45, -75],
    [-18, -70], [-5, -81], [10, -75], [12, -72]
  ], '#1e4827', '#13321a', 2);

  // Australia
  drawPoly([
    [-12, 131], [-16, 145], [-28, 153], [-37, 149], [-35, 117], [-22, 114],
    [-15, 124], [-12, 131]
  ], '#453c23', '#2e2716', 2);

  // 3. SPECIAL FOCUS: INDIA OUTLINE (Highlighted with Radiant Gold/Orange)
  const indiaPolygon = [
    [35.5, 74.5], [37.0, 77.0], [34.5, 78.5], [32.0, 79.0], [30.0, 81.0],
    [27.5, 88.0], [28.0, 97.0], [24.0, 94.0], [22.0, 89.0], [21.5, 87.0],
    [16.0, 82.0], [10.5, 79.8], [8.0, 77.5], [12.0, 75.0], [15.5, 73.5],
    [20.0, 72.8], [23.5, 68.5], [24.5, 71.0], [28.5, 70.0], [31.5, 74.0],
    [35.5, 74.5]
  ];

  // Draw India with richer lush vegetation fill
  drawPoly(indiaPolygon, '#2e6b3b', '#fbbf24', 3.5);

  // Glowing boundary for India
  ctx.save();
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 18;
  drawPoly(indiaPolygon, 'transparent', '#fbbf24', 2.5);
  ctx.restore();

  // 4. Night Lights (Golden urban clusters on nocturnal side)
  ctx.fillStyle = '#ffdf78';
  for (let i = 0; i < 450; i++) {
    const lat = 10 + Math.random() * 50;
    const lng = -120 + Math.random() * 240;
    const [x, y] = toXY(lat, lng);
    const rad = Math.random() * 1.8 + 0.6;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Extra night lights over Indian subcontinent
  ctx.fillStyle = '#fde68a';
  for (let i = 0; i < 180; i++) {
    const lat = 12 + Math.random() * 20;
    const lng = 72 + Math.random() * 18;
    const [x, y] = toXY(lat, lng);
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 2.2 + 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Subtle latitude & longitude graticule grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = toXY(lat, 0);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 30) {
    const [x] = toXY(0, lng);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export default function Globe3D({
  targetCity = { name: 'Kalyani', lat: 22.975, lng: 88.434 },
  onSwitchToHeatmap
}) {
  const mountRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Three.js internal refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const globeGroupRef = useRef(null);
  const rippleMeshRef = useRef(null);
  const animationFrameId = useRef(null);
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });

  // Convert lat/lng to 3D Cartesian coordinates on sphere
  const latLngToVector3 = useCallback((lat, lng, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 3, 14);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Master Globe Group (allows rotating target and earth together)
    const globeGroup = new THREE.Group();
    // Tilt Earth slightly on its axis (~23.4 degrees)
    globeGroup.rotation.z = THREE.MathUtils.degToRad(-15);
    globeGroup.rotation.x = THREE.MathUtils.degToRad(12);
    // Initial rotation to face India towards the camera
    globeGroup.rotation.y = THREE.MathUtils.degToRad(-105);
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 5. Earth Sphere Mesh
    const sphereRadius = 4.6;
    const earthGeometry = new THREE.SphereGeometry(sphereRadius, 64, 64);
    const earthTexture = createEarthCanvasTexture();

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.15
    });

    // Try loading online photorealistic NASA Blue Marble texture asynchronously
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      (loadedTex) => {
        loadedTex.wrapS = THREE.RepeatWrapping;
        earthMaterial.map = loadedTex;
        earthMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback to procedural texture
      }
    );

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // 6. Atmospheric Glow Outer Shell
    const atmoGeometry = new THREE.SphereGeometry(sphereRadius * 1.08, 48, 48);
    const atmoMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.22, 0.74, 0.97, 1.0) * intensity * 1.4;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmoMesh = new THREE.Mesh(atmoGeometry, atmoMaterial);
    scene.add(atmoMesh);

    // 7. Target Marker on Kalyani / Target City
    const targetPos = latLngToVector3(targetCity.lat, targetCity.lng, sphereRadius);

    // Glowing vertical pin
    const pinGeo = new THREE.CylinderGeometry(0.04, 0.01, 0.6, 16);
    pinGeo.translate(0, 0.3, 0);
    pinGeo.rotateX(Math.PI / 2);
    const pinMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.copy(targetPos);
    pinMesh.lookAt(new THREE.Vector3(0, 0, 0));
    pinMesh.rotateX(Math.PI);
    globeGroup.add(pinMesh);

    // Concentric pulsating sonar ripple rings
    const rippleGeo = new THREE.RingGeometry(0.12, 0.28, 32);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: '#34d399',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
    rippleMesh.position.copy(targetPos.clone().multiplyScalar(1.015));
    rippleMesh.lookAt(targetPos.clone().multiplyScalar(2));
    globeGroup.add(rippleMesh);
    rippleMeshRef.current = rippleMesh;

    // Glowing target center bead
    const beadGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const beadMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const beadMesh = new THREE.Mesh(beadGeo, beadMat);
    beadMesh.position.copy(targetPos.clone().multiplyScalar(1.02));
    globeGroup.add(beadMesh);

    // 8. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    sunLight.position.set(12, 8, 14);
    scene.add(sunLight);

    const blueBacklight = new THREE.DirectionalLight(0x0284c7, 1.4);
    blueBacklight.position.set(-10, -5, -10);
    scene.add(blueBacklight);

    // 9. Stars Background Dust
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 60;
      starCoords[i + 1] = (Math.random() - 0.5) * 60;
      starCoords[i + 2] = (Math.random() - 0.5) * 40 - 15;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starsMat = new THREE.PointsMaterial({
      color: '#93c5fd',
      size: 0.28,
      transparent: true,
      opacity: 0.65
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 10. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Pulsate ripple ring
      if (rippleMeshRef.current) {
        const scale = 1 + (time % 1.6) * 1.8;
        rippleMeshRef.current.scale.set(scale, scale, 1);
        rippleMeshRef.current.material.opacity = Math.max(0, 0.9 - (time % 1.6) * 0.55);
      }

      // Auto-rotation
      if (globeGroupRef.current && autoRotate && !isDraggingRef.current) {
        globeGroupRef.current.rotation.y += delta * 0.12 * rotationSpeed;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 11. Resize handling
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [targetCity, latLngToVector3, autoRotate, rotationSpeed]);

  // Mouse & Touch Drag Controls
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !globeGroupRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;

    globeGroupRef.current.rotation.y += deltaX * 0.005;
    globeGroupRef.current.rotation.x = Math.max(
      -Math.PI / 3,
      Math.min(Math.PI / 3, globeGroupRef.current.rotation.x + deltaY * 0.005)
    );

    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    if (!cameraRef.current) return;
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.006;
    cameraRef.current.position.z = Math.max(7.5, Math.min(22, cameraRef.current.position.z + zoomDelta));
  };

  // Zoom buttons
  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(7.5, cameraRef.current.position.z - 1.8);
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.min(22, cameraRef.current.position.z + 1.8);
    }
  };

  // Reset view to center on India & target city
  const handleResetView = () => {
    if (globeGroupRef.current && cameraRef.current) {
      globeGroupRef.current.rotation.y = THREE.MathUtils.degToRad(-105);
      globeGroupRef.current.rotation.x = THREE.MathUtils.degToRad(12);
      cameraRef.current.position.set(0, 3, 14);
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#020914] shadow-2xl ${
        isFullscreen ? 'fixed inset-0 z-[5000] h-screen rounded-none' : 'h-[500px]'
      }`}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="h-full w-full cursor-grab active:cursor-grabbing select-none"
      />

      {/* Floating Kalyani Location Target Badge on Globe */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-12 -translate-y-8 z-10 flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-black/85 px-2.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        <span>{targetCity.name}</span>
      </div>

      {/* Left Map Controls (Compass, Zoom +, Zoom -, Crosshair, Fullscreen) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* Compass */}
        <div
          title="North Indicator"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-rose-400 backdrop-blur-md shadow-lg"
        >
          <Compass className="h-4 w-4" />
        </div>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-slate-300 hover:text-white hover:border-emerald-500/50 backdrop-blur-md shadow-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-slate-300 hover:text-white hover:border-emerald-500/50 backdrop-blur-md shadow-lg transition-colors cursor-pointer"
        >
          <Minus className="h-4 w-4" />
        </button>

        {/* Crosshair Target */}
        <button
          onClick={handleResetView}
          title="Target Kalyani"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-emerald-400 hover:border-emerald-500 backdrop-blur-md shadow-lg transition-colors cursor-pointer"
        >
          <Crosshair className="h-4 w-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          title="Toggle Fullscreen"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-slate-300 hover:text-white backdrop-blur-md shadow-lg transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Rotation & Animation Bar (Immediately Below Globe Sphere) */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-500/30 bg-slate-950/85 px-4 py-2 text-xs backdrop-blur-md shadow-2xl">
        {/* Auto Rotate Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-300">
            Auto Rotate <span className={autoRotate ? 'text-emerald-400 font-bold' : 'text-slate-500 font-bold'}>{autoRotate ? 'ON' : 'OFF'}</span>
          </span>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`relative h-5 w-10 rounded-full transition-colors cursor-pointer ${
              autoRotate ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
                autoRotate ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Rotation Speed Slider */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Rotation Speed</span>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.1"
            value={rotationSpeed}
            onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
            className="w-24 accent-emerald-400 cursor-pointer"
          />
        </div>

        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-200 hover:border-emerald-500 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3 w-3 text-emerald-400" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Bottom Info Pill Banner (Matches Mockup Image Exactly) */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/90 px-4 py-2 text-xs text-slate-300 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-5 text-[11px]">
          {/* Study Area */}
          <div className="flex items-center gap-1.5">
            <GlobeIcon className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Study Area</span>
            <b className="text-white font-semibold">{targetCity.name}, WB</b>
          </div>

          {/* Satellite */}
          <div className="flex items-center gap-1.5">
            <SatelliteIcon className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Satellite</span>
            <b className="text-white font-semibold">Landsat 8 / Sentinel-2</b>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Last Updated</span>
            <b className="text-white font-semibold">11 Oct 2026</b>
          </div>

          {/* Resolution */}
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Resolution</span>
            <b className="text-white font-semibold">30 m</b>
          </div>
        </div>

        {/* View City Analysis Action Button */}
        <button
          onClick={onSwitchToHeatmap}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          <span>View City Analysis</span>
          <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
        </button>
      </div>
    </div>
  );
}
