import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const D2R = Math.PI / 180;
const CYAN = 0x22e6f2;

// Land mask (equirectangular). Local file age try hobe, na thakle CDN.
const MASK_URLS = [
  '/earth-water.png',
  'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-water.png',
  'https://unpkg.com/three-globe/example/img/earth-water.png'
];

function latLngToVec3(lat, lng, r = 1) {
  const phi = (90 - lat) * D2R;
  const theta = (lng + 180) * D2R;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function loadLandMask() {
  return new Promise((resolve) => {
    let i = 0;
    const tryNext = () => {
      if (i >= MASK_URLS.length) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = 720;
          const h = 360;
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          resolve({ data, w, h });
        } catch {
          tryNext();
        }
      };
      img.onerror = tryNext;
      img.src = MASK_URLS[i++];
    };
    tryNext();
  });
}

function buildLandPositions({ data, w, h }) {
  // Minority colour = land (water mask e land ta choto hoy)
  let dark = 0;
  let total = 0;
  for (let k = 0; k < data.length; k += 16) {
    if (data[k] < 128) dark++;
    total++;
  }
  const landIsDark = dark < total / 2;

  const positions = [];
  const latStep = 1.0;
  for (let lat = -88; lat <= 88; lat += latStep) {
    const lonStep = latStep / Math.max(0.15, Math.cos(lat * D2R));
    for (let lng = -180; lng < 180; lng += lonStep) {
      const px = Math.min(w - 1, Math.floor(((lng + 180) / 360) * w));
      const py = Math.min(h - 1, Math.floor(((90 - lat) / 180) * h));
      const lum = data[(py * w + px) * 4];
      const isLand = landIsDark ? lum < 128 : lum >= 128;
      if (isLand) {
        const v = latLngToVec3(lat, lng, 1.004);
        positions.push(v.x, v.y, v.z);
      }
    }
  }
  return new Float32Array(positions);
}

function buildGridLines() {
  const pts = [];
  const r = 1.003;
  // Longitude lines (every 15 deg)
  for (let lng = -180; lng < 180; lng += 15) {
    for (let lat = -90; lat < 90; lat += 2) {
      const a = latLngToVec3(lat, lng, r);
      const b = latLngToVec3(lat + 2, lng, r);
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  // Latitude lines (every 15 deg)
  for (let lat = -75; lat <= 75; lat += 15) {
    for (let lng = -180; lng < 180; lng += 3) {
      const a = latLngToVec3(lat, lng, r);
      const b = latLngToVec3(lat, lng + 3, r);
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

const wrapAngle = (a) => {
  const twoPi = Math.PI * 2;
  return ((((a + Math.PI) % twoPi) + twoPi) % twoPi) - Math.PI;
};

export default function HoloGlobe({ visible = false, lat = 0, lng = 0, label = '' }) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  const visibleRef = useRef(visible);
  const focusRef = useRef({ rot: 0, tilt: 0.35, until: 0 });

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  /* ---------- Scene setup (once) ---------- */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let cancelled = false;
    let raf = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);

    const tilt = new THREE.Group();
    tilt.rotation.x = 0.35;
    const spin = new THREE.Group();
    tilt.add(spin);
    scene.add(tilt);

    // 1) Dark holographic body with fresnel edge glow
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.995, 64, 64),
      new THREE.ShaderMaterial({
        transparent: true,
        vertexShader: `
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          varying vec3 vN;
          varying vec3 vV;
          void main() {
            float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.4);
            vec3 col = mix(vec3(0.01, 0.09, 0.12), vec3(0.05, 0.85, 0.95), f);
            gl_FragColor = vec4(col, 0.88 + 0.1 * f);
          }`
      })
    );
    body.renderOrder = 0;
    spin.add(body);

    // 2) Lat/Long grid
    const grid = new THREE.LineSegments(
      buildGridLines(),
      new THREE.LineBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    grid.renderOrder = 1;
    spin.add(grid);

    // 3) Outer atmosphere glow
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.14, 64, 64),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float i = pow(max(0.0, 0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
            gl_FragColor = vec4(0.0, 0.9, 1.0, 1.0) * i;
          }`
      })
    );
    glow.renderOrder = 5;
    scene.add(glow);

    // 4) Location marker + pulse ring
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd166 })
    );
    marker.renderOrder = 4;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.022, 0.03, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffd166,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    ring.renderOrder = 4;
    spin.add(marker);
    spin.add(ring);

    const placeMarker = (la, ln) => {
      const v = latLngToVec3(la, ln, 1.012);
      marker.position.copy(v);
      ring.position.copy(v);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v.clone().normalize());
    };

    // 5) Land dots (async load)
    loadLandMask().then((mask) => {
      if (cancelled || !mask) return;
      const positions = buildLandPositions(mask);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const points = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: 0x4ff3ff,
          size: 0.0115,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true
        })
      );
      points.renderOrder = 2;
      spin.add(points);
    });

    // Responsive fit
    const fit = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      const half = Math.tan((camera.fov * D2R) / 2);
      const d = 1.3 / (half * Math.min(1, w / h));
      camera.position.set(0, 0, d);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(mount);

    apiRef.current = { spin, tilt, placeMarker };

    // Animation loop
    let last = performance.now();
    let lastVisibleAt = last;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (visibleRef.current) {
        lastVisibleAt = now;
      } else if (now - lastVisibleAt > 900) {
        return; // hidden: render pause (CPU save)
      }

      const f = focusRef.current;
      if (performance.now() < f.until) {
        const d = wrapAngle(f.rot - spin.rotation.y);
        spin.rotation.y += d * Math.min(1, dt * 3.5);
        tilt.rotation.x += (f.tilt - tilt.rotation.x) * Math.min(1, dt * 3.5);
      } else {
        spin.rotation.y += 0.22 * dt; // auto spin
      }

      // pulse ring
      const k = ((now / 1000) % 1.6) / 1.6;
      ring.scale.setScalar(1 + k * 2.2);
      ring.material.opacity = 0.9 * (1 - k);

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      apiRef.current = null;
    };
  }, []);

  /* ---------- Location change / globe visible: globe oi place er dike ghurbe ---------- */
  useEffect(() => {
    const a = apiRef.current;
    if (!a) return;
    a.placeMarker(lat, lng);
    focusRef.current = {
      rot: -(lng + 90) * D2R,
      tilt: Math.max(-0.9, Math.min(0.9, lat * D2R * 0.85)),
      until: performance.now() + 1500
    };
  }, [lat, lng, visible]);

  return (
    <div
      className="absolute inset-0 z-[750] pointer-events-none transition-opacity duration-700"
      style={{
        opacity: visible ? 1 : 0,
        background:
          'radial-gradient(ellipse at center, #04202b 0%, #020b14 55%, #01040a 100%)'
      }}
    >
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/30 bg-slate-950/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 backdrop-blur">
        Global View {label ? `• ${label}` : ''} • Scroll to zoom in
      </div>
    </div>
  );
}