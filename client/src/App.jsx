import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Circle, Popup, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip } from 'recharts';
import './App.css';
import { api } from './services/api';
import MitigationSimulator from './components/MitigationSimulator';
import AuditReportModal from './components/AuditReportModal';
import ProposeProjectModal from './components/ProposeProjectModal';
import ZoneDetailPanel from './components/ZoneDetailPanel';
import AlertsView from './components/AlertsView';
import AnalyticsView from './components/AnalyticsView';
import { buildLiveAlerts } from './utils/liveAlerts';
import HoloGlobe from './components/HoloGlobe';
import {
  LayoutDashboard,
  CloudSun,
  Radar,
  Wind,
  CloudRain,
  Thermometer,
  Satellite,
  Leaf,
  Waves,
  Bell,
  BarChart3,
  FileText,
  Key,
  Settings,
  Search,
  Sparkles,
  Play,
  Pause,
  Send,
  Globe,
  Network,
  ShieldCheck,
  Brain,
  Droplets,
  Sun,
  Flame,
  Gauge,
  Sliders,
  AlertTriangle,
  Eye,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  Database,
  X,
  Check,
  Navigation,
  Loader2
} from 'lucide-react';

/* ================= WORLDWIDE GEOCODING & FLAG UTILITIES ================= */
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getWeatherCondition(code) {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Fog & Haze';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Showers';
  if (code >= 71 && code <= 77) return 'Snow Fall';
  if (code >= 80 && code <= 82) return 'Heavy Rain Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm Activity';
  return 'Clear Sky';
}

function getAqiCategory(aqi) {
  const val = Number(aqi) || 0;
  if (val <= 50) return { label: 'Good', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
  if (val <= 100) return { label: 'Moderate', color: 'text-amber-300', bg: 'bg-amber-500/20' };
  if (val <= 150) return { label: 'Unhealthy for Sensitive', color: 'text-orange-400', bg: 'bg-orange-500/20' };
  if (val <= 200) return { label: 'Unhealthy', color: 'text-rose-400', bg: 'bg-rose-500/20' };
  if (val <= 300) return { label: 'Very Unhealthy', color: 'text-purple-400', bg: 'bg-purple-500/20' };
  return { label: 'Hazardous', color: 'text-red-500', bg: 'bg-red-950/80' };
}

/* ================= CURATED POPULAR WORLDWIDE DESTINATIONS FOR INSTANT JUMP ================= */
const POPULAR_GLOBAL_CITIES = [
  { id: 'p1', name: 'Kalyani', country: 'India', country_code: 'IN', admin1: 'West Bengal', latitude: 22.9751, longitude: 88.4345, population: 100000 },
  { id: 'p2', name: 'Kolkata', country: 'India', country_code: 'IN', admin1: 'West Bengal', latitude: 22.5726, longitude: 88.3639, population: 15000000 },
  { id: 'p3', name: 'New Delhi', country: 'India', country_code: 'IN', admin1: 'Delhi', latitude: 28.6139, longitude: 77.2090, population: 33000000 },
  { id: 'p4', name: 'Mumbai', country: 'India', country_code: 'IN', admin1: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, population: 21000000 },
  { id: 'p5', name: 'Bengaluru', country: 'India', country_code: 'IN', admin1: 'Karnataka', latitude: 12.9716, longitude: 77.5946, population: 13000000 },
  { id: 'p6', name: 'New York', country: 'United States', country_code: 'US', admin1: 'New York', latitude: 40.7128, longitude: -74.0060, population: 8300000 },
  { id: 'p7', name: 'London', country: 'United Kingdom', country_code: 'GB', admin1: 'England', latitude: 51.5074, longitude: -0.1278, population: 9000000 },
  { id: 'p8', name: 'Tokyo', country: 'Japan', country_code: 'JP', admin1: 'Tokyo', latitude: 35.6762, longitude: 139.6503, population: 14000000 },
  { id: 'p9', name: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', admin1: 'Dubai', latitude: 25.2048, longitude: 55.2708, population: 3500000 },
  { id: 'p10', name: 'Paris', country: 'France', country_code: 'FR', admin1: 'Île-de-France', latitude: 48.8566, longitude: 2.3522, population: 2160000 },
  { id: 'p11', name: 'Dhaka', country: 'Bangladesh', country_code: 'BD', admin1: 'Dhaka Division', latitude: 23.8103, longitude: 90.4125, population: 22000000 },
  { id: 'p12', name: 'Sydney', country: 'Australia', country_code: 'AU', admin1: 'New South Wales', latitude: -33.8688, longitude: 151.2093, population: 5300000 }
];

/* ================= SYNTHESIZE LOCAL MICROCLIMATE ZONES FOR ANY CITY ON EARTH ================= */
function generateGlobalCityZones(lat, lng, cityName, baseTemp = 28) {
  return [
    {
      id: `zone-${cityName}-cbd`,
      code: 'CBD-CORE',
      name: `${cityName} Commercial Core`,
      category: 'Commercial High-Density Canyon',
      coordinates: { lat: lat + 0.003, lng: lng - 0.002 },
      polygon: [
        [lat + 0.008, lng - 0.007],
        [lat + 0.008, lng + 0.003],
        [lat - 0.002, lng + 0.003],
        [lat - 0.002, lng - 0.007]
      ],
      areaKm2: 3.5,
      surfaceTemp: Number((baseTemp + 6.8).toFixed(1)),
      currentTemp: Number((baseTemp + 4.2).toFixed(1)),
      uhiIntensity: 6.8,
      hviScore: 82,
      albedo: 0.12,
      ndvi: 0.08,
      treeCanopyCoverage: 8,
      elderlyRatio: 18.0,
      populationDensity: 24000,
      windSpeed: 1.2,
      permeablePavementCoverage: 6,
      description: `High thermal mass downtown canyon in ${cityName} with glass facades and dark asphalt roadways.`
    },
    {
      id: `zone-${cityName}-ind`,
      code: 'IND-NODE',
      name: `${cityName} Industrial & Logistics Corridor`,
      category: 'Industrial Manufacturing',
      coordinates: { lat: lat + 0.018, lng: lng + 0.022 },
      polygon: [
        [lat + 0.024, lng + 0.015],
        [lat + 0.024, lng + 0.029],
        [lat + 0.012, lng + 0.029],
        [lat + 0.012, lng + 0.015]
      ],
      areaKm2: 4.8,
      surfaceTemp: Number((baseTemp + 9.5).toFixed(1)),
      currentTemp: Number((baseTemp + 6.0).toFixed(1)),
      uhiIntensity: 9.5,
      hviScore: 88,
      albedo: 0.10,
      ndvi: 0.04,
      treeCanopyCoverage: 4,
      elderlyRatio: 11.0,
      populationDensity: 14000,
      windSpeed: 1.8,
      permeablePavementCoverage: 4,
      description: `Anthropogenic heat emissions hub with dark corrugated iron roofs, minimal canopy, and heavy logistics traffic.`
    },
    {
      id: `zone-${cityName}-old`,
      code: 'OLD-HISTORIC',
      name: `${cityName} Heritage Quarter`,
      category: 'Ultra-Dense Mixed Residential',
      coordinates: { lat: lat + 0.008, lng: lng + 0.010 },
      polygon: [
        [lat + 0.014, lng + 0.005],
        [lat + 0.014, lng + 0.015],
        [lat + 0.002, lng + 0.015],
        [lat + 0.002, lng + 0.005]
      ],
      areaKm2: 2.2,
      surfaceTemp: Number((baseTemp + 5.5).toFixed(1)),
      currentTemp: Number((baseTemp + 3.6).toFixed(1)),
      uhiIntensity: 5.5,
      hviScore: 74,
      albedo: 0.16,
      ndvi: 0.07,
      treeCanopyCoverage: 7,
      elderlyRatio: 22.5,
      populationDensity: 32000,
      windSpeed: 0.8,
      permeablePavementCoverage: 8,
      description: `Historical high-density quarter with narrow alleyways, reduced airflow, and senior citizen vulnerability.`
    },
    {
      id: `zone-${cityName}-sub`,
      code: 'SUB-NORTH',
      name: `${cityName} North Avenue Residential`,
      category: 'Medium-Density Residential',
      coordinates: { lat: lat + 0.025, lng: lng - 0.015 },
      polygon: [
        [lat + 0.032, lng - 0.022],
        [lat + 0.032, lng - 0.008],
        [lat + 0.018, lng - 0.008],
        [lat + 0.018, lng - 0.022]
      ],
      areaKm2: 3.6,
      surfaceTemp: Number((baseTemp + 3.0).toFixed(1)),
      currentTemp: Number((baseTemp + 1.8).toFixed(1)),
      uhiIntensity: 3.2,
      hviScore: 45,
      albedo: 0.22,
      ndvi: 0.32,
      treeCanopyCoverage: 28,
      elderlyRatio: 17.5,
      populationDensity: 12000,
      windSpeed: 2.6,
      permeablePavementCoverage: 30,
      description: `Residential neighborhood with backyard garden canopy and moderate cool roof retrofit potential.`
    },
    {
      id: `zone-${cityName}-park`,
      code: 'ECO-PARK',
      name: `${cityName} Botanical & Urban Forest Buffer`,
      category: 'Urban Forest & Ecological Sink',
      coordinates: { lat: lat - 0.020, lng: lng + 0.015 },
      polygon: [
        [lat - 0.012, lng + 0.005],
        [lat - 0.012, lng + 0.025],
        [lat - 0.028, lng + 0.025],
        [lat - 0.028, lng + 0.005]
      ],
      areaKm2: 5.2,
      surfaceTemp: Number((baseTemp - 1.8).toFixed(1)),
      currentTemp: Number((baseTemp - 0.9).toFixed(1)),
      uhiIntensity: 0.8,
      hviScore: 26,
      albedo: 0.26,
      ndvi: 0.72,
      treeCanopyCoverage: 72,
      elderlyRatio: 10.0,
      populationDensity: 1200,
      windSpeed: 3.8,
      permeablePavementCoverage: 55,
      description: `Major vegetative cooling sink suppressing ambient thermal anomalies across the ${cityName} metro domain.`
    },
    {
      id: `zone-${cityName}-water`,
      code: 'RIVER-FRONT',
      name: `${cityName} Waterfront Riparian Buffer`,
      category: 'Mixed-Use Waterfront & Wetlands',
      coordinates: { lat: lat - 0.005, lng: lng + 0.028 },
      polygon: [
        [lat + 0.002, lng + 0.021],
        [lat + 0.002, lng + 0.035],
        [lat - 0.012, lng + 0.035],
        [lat - 0.012, lng + 0.021]
      ],
      areaKm2: 3.0,
      surfaceTemp: Number((baseTemp + 0.8).toFixed(1)),
      currentTemp: Number((baseTemp + 0.4).toFixed(1)),
      uhiIntensity: 1.8,
      hviScore: 35,
      albedo: 0.28,
      ndvi: 0.42,
      treeCanopyCoverage: 35,
      elderlyRatio: 12.0,
      populationDensity: 8500,
      windSpeed: 4.2,
      permeablePavementCoverage: 45,
      description: `Riparian breeze corridor providing evaporative moisture and nocturnal thermal dissipation.`
    }
  ];
}

/* ================= SYNTHESIZE LOCAL IOT STATIONS ================= */
function generateGlobalCitySensors(lat, lng, cityName, baseTemp = 28) {
  const prefix = cityName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'MET';
  return [
    {
      stationId: `IOT-${prefix}-101`,
      name: `${cityName} Central Met Station`,
      lat: lat + 0.003,
      lng: lng - 0.002,
      lastReading: {
        airTemp: Number((baseTemp + 4.2).toFixed(1)),
        surfaceTemp: Number((baseTemp + 6.8).toFixed(1)),
        humidity: 62,
        windSpeed: 2.8
      }
    },
    {
      stationId: `IOT-${prefix}-102`,
      name: `${cityName} Industrial Thermal Node`,
      lat: lat + 0.018,
      lng: lng + 0.022,
      lastReading: {
        airTemp: Number((baseTemp + 6.0).toFixed(1)),
        surfaceTemp: Number((baseTemp + 9.5).toFixed(1)),
        humidity: 48,
        windSpeed: 1.8
      }
    },
    {
      stationId: `IOT-${prefix}-103`,
      name: `${cityName} Ecological Buffer Sensor`,
      lat: lat - 0.020,
      lng: lng + 0.015,
      lastReading: {
        airTemp: Number((baseTemp - 0.9).toFixed(1)),
        surfaceTemp: Number((baseTemp - 1.8).toFixed(1)),
        humidity: 78,
        windSpeed: 3.4
      }
    }
  ];
}

const ALERT_TONES = {
  Emergency: {
    box: 'border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/40',
    title: 'text-rose-300',
    badge: 'bg-rose-500/20 text-rose-400'
  },
  Warning: {
    box: 'border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40',
    title: 'text-amber-300',
    badge: 'bg-amber-500/20 text-amber-400'
  },
  Advisory: {
    box: 'border-sky-500/30 bg-sky-950/20 hover:bg-sky-950/40',
    title: 'text-sky-300',
    badge: 'bg-sky-500/20 text-sky-400'
  }
};

/* ================= MAP CONTROLLER (SMOOTH FLY TO ANY PLACE ON EARTH) ================= */
function MapController({ center, flyTrigger, onZoomChange }) {
  const map = useMap();

  // Array er identity na, shudhu number dhorbo (jate re-render e auto zoom in na hoy)
  const centerLat = Array.isArray(center) ? center[0] : null;
  const centerLng = Array.isArray(center) ? center[1] : null;

  useEffect(() => {
    const handleResize = () => map.invalidateSize();
    handleResize();
    const t1 = setTimeout(handleResize, 250);
    const t2 = setTimeout(handleResize, 750);
    window.addEventListener('resize', handleResize);

    const ro = new ResizeObserver(handleResize);
    ro.observe(map.getContainer());

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, [map]);

  // Zoom level report kore (globe show/hide er jonno)
  useEffect(() => {
    if (!onZoomChange) return undefined;
    const handleZoom = () => onZoomChange(map.getZoom());
    map.on('zoom', handleZoom);
    map.on('zoomend', handleZoom);
    handleZoom();
    return () => {
      map.off('zoom', handleZoom);
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  // Shudhu location bodlale ba search/flyTrigger hole fly korbe
  useEffect(() => {
    if (centerLat != null && centerLng != null) {
      map.flyTo([centerLat, centerLng], 12, {
        duration: 1.4
      });
    }
  }, [centerLat, centerLng, flyTrigger, map]);

  return null;
}

/* ================= RADIAL CIRCULAR GAUGE COMPONENT ================= */
function MeteoRadialGauge({ value, max = 100, unit = '', label = '', color = '#38bdf8', sub = '', icon: Icon }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const numVal = Number(value) || 0;
  const p = Math.min(1, Math.max(0, numVal / max));

  return (
    <div className="meteo-gauge-wrap">
      <div className="meteo-gauge-label">{label}</div>
      <div className="relative flex items-center justify-center my-1">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="rgba(56, 189, 248, 0.12)"
            strokeWidth="5"
          />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${c * p * 0.75} ${c}`}
            transform="rotate(135 36 36)"
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
              transition: 'stroke-dasharray 0.6s ease'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-bold text-white tracking-tight">{value}</span>
          {unit && <span className="text-[9px] text-slate-400 font-mono -mt-1">{unit}</span>}
        </div>
      </div>
      <div className="meteo-gauge-sub">
        {Icon && <Icon className="w-3 h-3 text-slate-400" />}
        <span>{sub}</span>
      </div>
    </div>
  );
}

/* ================= 7-DAY OUTLOOK ROW ================= */
function DayOutlookRow({ day, min, max }) {
  const leftPercent = Math.max(0, Math.min(80, ((min - 10) / 35) * 100));
  const rightPercent = Math.max(10, Math.min(100, ((max - 10) / 35) * 100));
  const widthPercent = Math.max(15, rightPercent - leftPercent);

  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0">
      <span className="w-10 font-medium text-slate-300">{day}</span>
      <span className="text-[11px] font-mono text-slate-400 w-8 text-right">{min}°</span>
      <div className="meteo-temp-bar-bg mx-2.5">
        <div
          className="meteo-temp-bar-fill"
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`
          }}
        />
      </div>
      <span className="text-[11px] font-mono font-bold text-slate-200 w-8">{max}°</span>
    </div>
  );
}

/* ================= ZONE COLOR CALCULATOR BY LAYER ================= */
function getZoneColor(zone, layerId, diurnalOffset = 0) {
  if (layerId === 'ndvi') {
    const n = Math.min(1, Math.max(0, ((zone.ndvi || 0.1) - 0.04) / 0.7));
    return `hsl(${Math.round(45 + n * 95)} 75% 45%)`;
  }
  if (layerId === 'albedo') {
    const a = Math.min(1, Math.max(0, ((zone.albedo || 0.1) - 0.1) / 0.25));
    return `hsl(${Math.round(195 + a * 25)} 85% ${Math.round(45 + a * 15)}%)`;
  }
  if (layerId === 'hvi') {
    const h = zone.hviScore || 50;
    if (h >= 75) return '#f43f5e';
    if (h >= 55) return '#fb923c';
    if (h >= 35) return '#facc15';
    return '#10b981';
  }
  if (layerId === 'uhi') {
    const u = Math.min(1, Math.max(0, (zone.uhiIntensity || 5) / 10));
    return `hsl(${Math.round(45 - u * 45)} 90% 50%)`;
  }
  if (layerId === 'wind') {
    const w = Math.min(1, Math.max(0, (zone.windSpeed || 2) / 4.5));
    return `hsl(${Math.round(190 + w * 40)} 90% ${Math.round(40 + w * 20)}%)`;
  }
  if (layerId === 'rainfall') {
    const r = Math.min(1, Math.max(0, (zone.permeablePavementCoverage || 15) / 60));
    return `hsl(${Math.round(160 + r * 50)} 85% 45%)`;
  }
  // Default: Surface LST
  const tempWithDiurnal = (zone.surfaceTemp || 35) + diurnalOffset;
  const t = Math.min(1, Math.max(0, (tempWithDiurnal - 20) / 28));
  return `hsl(${Math.round(220 - t * 220)} 90% 55%)`;
}

export default function App() {
  // Navigation & Active Mode
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [navNotification, setNavNotification] = useState('');

  // CURRENT GLOBAL LOCATION STATE (Default to New Delhi, India; dynamically updates on search)
  const [currentLocation, setCurrentLocation] = useState({
    name: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Delhi',
    lat: 28.6315,
    lng: 77.2167,
    population: 32000000
  });
  // 3D Globe: zoom 3 ba tar kom hole globe dekhabe
  const [globeVisible, setGlobeVisible] = useState(false);
  const handleMapZoom = useCallback((z) => setGlobeVisible(z <= 3), []);

  // Real-Time Air Quality state
  const [liveAqi, setLiveAqi] = useState({
    aqi: 0,
    pm25: 0,
    pm10: 0,
    live: false
  });

  // Core Data
  const [zones, setZones] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [ackedAlertIds, setAckedAlertIds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [liveWeather, setLiveWeather] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [flyTrigger, setFlyTrigger] = useState(0);

  // LIVE alerts: weather + AQI theke auto toiri
  const alertsKey = `${currentLocation.lat},${currentLocation.lng}`;
  const alertsLive = liveWeather?._forLocation === alertsKey;
  const alerts = useMemo(() => {
    if (!alertsLive) return [];
    return buildLiveAlerts({ weather: liveWeather, aqi: liveAqi, location: currentLocation }).map((a) => ({
      ...a,
      active: !ackedAlertIds.includes(a.id)
    }));
  }, [alertsLive, liveWeather, liveAqi, currentLocation, ackedAlertIds]);
  const activeAlerts = alerts.filter((a) => a.active);
  const handleResolveAlert = useCallback((id) => {
    setAckedAlertIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  // Global Search Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Global keyboard shortcut (Ctrl+K or / to focus search)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Map Layers state
  const [activeLayer, setActiveLayer] = useState('surfaceTemp');
  const [basemapSatellite, setBasemapSatellite] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState({
    surfaceTemp: true,
    uhi: true,
    ndvi: true,
    albedo: true,
    hvi: true,
    wind: true,
    rainfall: true
  });

  // Timeline Playback state
  const [selectedHour, setSelectedHour] = useState(() => new Date().getHours());
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeMode, setTimeMode] = useState('Now');

  // Modals
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [isZoneDetailsModalOpen, setIsZoneDetailsModalOpen] = useState(false);
  const [isApiAccessModalOpen, setIsApiAccessModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  // AI Chat Assistant State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: "Meteo Intelligence Global Ops online. Search any location worldwide to analyze local microclimates, urban heat island intensity, satellite thermal radiance, and real-time air quality."
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatBusy, setIsChatBusy] = useState(false);

  // Diurnal sinusoidal temperature offset derived from hour scrubber
  const diurnalOffset = useMemo(() => {
    return Math.sin((selectedHour - 9) * (Math.PI / 12)) * 4.8;
  }, [selectedHour]);

  // Timeline animation loop
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setSelectedHour((prev) => (prev + 1) % 24);
    }, 1200);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // 1. Fetch live data for current global location (Weather, Air Quality, GIS Microclimate)
  const fetchLocationData = useCallback(async (loc) => {
    try {
      // A. Open-Meteo High-Resolution Worldwide Meteorological Forecast
      const weatherPromise = fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}` +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,weather_code,uv_index,visibility' +
        '&hourly=temperature_2m,relative_humidity_2m,weather_code' +
        '&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7'
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      // B. Open-Meteo Worldwide Air Quality (US AQI & PM2.5)
      const aqiPromise = fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lng}` +
        '&current=us_aqi,pm2_5,pm10'
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const [wData, aqData] = await Promise.all([weatherPromise, aqiPromise]);

      if (wData && wData.current) {
        setLiveWeather({ ...wData, _forLocation: `${loc.lat},${loc.lng}` });
      }

      if (aqData && aqData.current) {
        setLiveAqi({
          aqi: aqData.current.us_aqi ?? 0,
          pm25: aqData.current.pm2_5 ?? 0,
          pm10: aqData.current.pm10 ?? 0,
          live: true
        });
      } else {
        setLiveAqi({ aqi: 0, pm25: 0, pm10: 0, live: false });
      }

      const baseAirTemp = wData?.current?.temperature_2m || 28;
      // Synthesize realistic local microclimate zones and IoT nodes for this place
      const localZones = generateGlobalCityZones(loc.lat, loc.lng, loc.name, baseAirTemp);
      const localSensors = generateGlobalCitySensors(loc.lat, loc.lng, loc.name, baseAirTemp);

      setZones(localZones);
      setSensors(localSensors);

      // FIX: user er select kora zone refresh e reset hobe na.
      // Age theke selected thakle same code er notun zone data diye update hobe,
      // na thakle default Industrial hotspot select hobe.
      setSelectedZone((prev) => {
        if (prev) {
          const same = localZones.find((z) => z.code === prev.code);
          if (same) return same;
        }
        return localZones[1] || localZones[0];
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Global Location Fetch Error]:', err);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (isMounted) await fetchLocationData(currentLocation);
    };
    run();
    const interval = setInterval(run, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentLocation, fetchLocationData]);

  // Load backend projects
  useEffect(() => {
    api.getSummary().then(r => r.success && setSummary(r.data)).catch(() => {});
    api.getProjects().then(r => r.success && setProjects(r.data)).catch(() => {});
  }, []);

  // 2. Worldwide Live Geocoding Search as user types
  const handleSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!q.trim() || q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=6&language=en&format=json`
        );
        const data = await res.json();
        if (data && Array.isArray(data.results)) {
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);
  };

  // 3. User selects a place from search results
  const handleSelectLocation = (place) => {
    const newLoc = {
      name: place.name,
      country: place.country || '',
      countryCode: place.country_code || '',
      admin1: place.admin1 || '',
      lat: place.latitude,
      lng: place.longitude,
      population: place.population || 500000
    };

    setCurrentLocation(newLoc);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
    setFlyTrigger((p) => p + 1);

    setNavNotification(
      `📍 Focused on ${newLoc.name}, ${newLoc.country} (${newLoc.lat.toFixed(2)}°, ${newLoc.lng.toFixed(2)}°) — Live Data Synced.`
    );
    setTimeout(() => setNavNotification(''), 4500);

    // Prompt AI Assistant with the new city
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'ai',
        text: `Switched operational domain to ${newLoc.name}, ${newLoc.country}. Meteorological and particulate telemetry synchronized for coordinates [${newLoc.lat.toFixed(3)}°N, ${newLoc.lng.toFixed(3)}°E].`
      }
    ]);
  };

  // Handle direct Enter key in search box
  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelectLocation(searchResults[0]);
      } else if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery.trim())}&count=1&language=en&format=json`
          );
          const data = await res.json();
          if (data && data.results && data.results.length > 0) {
            handleSelectLocation(data.results[0]);
          } else {
            setNavNotification(`No location found for "${searchQuery}". Try another city name.`);
            setTimeout(() => setNavNotification(''), 4000);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
    }
  };

  // Handle AI Chat submit
  const handleSendChat = async (e, customPrompt = '') => {
    if (e) e.preventDefault();
    const q = (customPrompt || chatInput).trim();
    if (!q || isChatBusy) return;

    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setIsChatBusy(true);

    try {
      const res = await api.sendChatMessage({
        message: q,
        focusZone: selectedZone?.code,
        studyArea: `${currentLocation.name}, ${currentLocation.country}`
      });
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: res.reply || `Analysis completed for ${currentLocation.name} microclimate domain.` }
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: err.message || 'Error communicating with AI microclimate service.' }
      ]);
    } finally {
      setIsChatBusy(false);
    }
  };

  // Handle Sidebar Navigation click with genuine interactive actions
  const handleNavClick = (itemName) => {
    setActiveNav(itemName);

    if (itemName === 'Dashboard') {
      setActiveLayer('surfaceTemp');
      setBasemapSatellite(false);
      setLayerVisibility(prev => ({ ...prev, surfaceTemp: true }));
      setNavNotification(`Dashboard reset to ${currentLocation.name} Microclimate Overview.`);
      setSelectedZone(zones[0]);
      setFlyTrigger((prev) => prev + 1);
    } else if (itemName === 'Live Weather' || itemName === 'Temperature') {
      setActiveLayer('surfaceTemp');
      setLayerVisibility(prev => ({ ...prev, surfaceTemp: true }));
      setNavNotification(`Active Layer: Surface Land Temperature (LST Infrared) for ${currentLocation.name}.`);
    } else if (itemName === 'Radar' || itemName === 'Rainfall') {
      setActiveLayer('rainfall');
      setLayerVisibility(prev => ({ ...prev, rainfall: true }));
      setNavNotification(`Precipitation Radar Mode: Monitoring convective moisture in ${currentLocation.name}.`);
    } else if (itemName === 'Wind') {
      setActiveLayer('wind');
      setLayerVisibility(prev => ({ ...prev, wind: true }));
      setNavNotification(`Surface Wind Vector layer active for ${currentLocation.name}.`);
    } else if (itemName === 'Satellite') {
      setBasemapSatellite((prev) => !prev);
      setNavNotification('Toggled High-Resolution Esri Satellite & MODIS Basemap.');
    } else if (itemName === 'Air Quality') {
      setActiveLayer('hvi');
      setLayerVisibility(prev => ({ ...prev, hvi: true }));
      setNavNotification(`Air Quality Mode Active: Real-time AQI ${liveAqi.aqi} in ${currentLocation.name}.`);
    } else if (itemName === 'Marine') {
      const riverZone = zones.find((z) => z.code === 'RIVER-FRONT');
      if (riverZone) {
        setSelectedZone(riverZone);
        setFlyTrigger((prev) => prev + 1);
        setNavNotification(`Focused on ${currentLocation.name} Waterfront Riparian Cooling Corridor.`);
      }
    } else if (itemName === 'Alerts') {
      setIsAlertsModalOpen(true);
      setNavNotification(`Viewing municipal heat stress advisories.`);
    } else if (itemName === 'Climate Analytics') {
      setIsAnalyticsModalOpen(true);
      setNavNotification(`Opened Operational Analytics & LOOCV Machine Learning Engine.`);
    } else if (itemName === 'Reports') {
      setIsAuditModalOpen(true);
    } else if (itemName === 'API Access') {
      setIsApiAccessModalOpen(true);
    } else if (itemName === 'Settings') {
      setIsSettingsModalOpen(true);
    }

    setTimeout(() => setNavNotification(''), 4000);
  };

  // 24h Diurnal chart data derived from backend & zones
  const diurnalChartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const h = i * 2;
      const hourStr = `${String(h).padStart(2, '0')}:00`;
      const baseRural = 20 + Math.sin((h - 8) * (Math.PI / 12)) * 6;
      const baseUrban = baseRural + 5.5 + Math.sin((h - 14) * (Math.PI / 12)) * 2.5;
      const pressure = 1014 - Math.sin((h - 6) * (Math.PI / 12)) * 6;

      return {
        time: hourStr,
        urbanTemp: Number(baseUrban.toFixed(1)),
        ruralTemp: Number(baseRural.toFixed(1)),
        pressure: Math.round(pressure)
      };
    });
  }, []);

  const cur = liveWeather?.current || {
    temperature_2m: 26.5,
    apparent_temperature: 28.0,
    relative_humidity_2m: 64,
    wind_speed_10m: 12.5,
    surface_pressure: 1012.0,
    uv_index: 4.8,
    visibility: 15000,
    weather_code: 0
  };

  const daily = liveWeather?.daily || {
    temperature_2m_max: [30, 31, 32, 31, 30, 31, 32],
    temperature_2m_min: [19, 20, 21, 20, 19, 20, 21]
  };

  // Compute 7-day outlook names dynamically based on current day
  const outlookDays = useMemo(() => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = lastUpdated;
    return Array.from({ length: 7 }, (_, i) => {
      if (i === 0) return 'Today';
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return dayLabels[d.getDay()];
    });
  }, [lastUpdated]);

  // Compute real hourly forecasts for the next 8 hours from live Open-Meteo feed
  const hourlySlots = useMemo(() => {
    const currentH = lastUpdated.getHours();
    return [0, 2, 4, 6, 8].map((offset, idx) => {
      const targetH = (currentH + offset) % 24;
      const hourlyTemp = liveWeather?.hourly?.temperature_2m
        ? liveWeather.hourly.temperature_2m[currentH + offset]
        : null;
      const tempVal = hourlyTemp !== null && hourlyTemp !== undefined
        ? Math.round(hourlyTemp)
        : Math.round((cur.temperature_2m || 26) + (idx % 2 === 0 ? 1 : -1));
      return {
        label: offset === 0 ? 'Now' : `+${offset}h`,
        timeStr: `${String(targetH).padStart(2, '0')}:00`,
        hour: targetH,
        temp: tempVal
      };
    });
  }, [lastUpdated, liveWeather, cur.temperature_2m]);

  // Active zone
  const currentZone = selectedZone || zones[0] || {
    name: `${currentLocation.name} Urban Core`,
    code: 'CBD-CORE',
    category: 'Commercial High-Density',
    surfaceTemp: (cur.temperature_2m || 26) + 6.8,
    currentTemp: (cur.temperature_2m || 26) + 4.2,
    uhiIntensity: 6.8,
    hviScore: 82,
    albedo: 0.12,
    humidity: cur.relative_humidity_2m || 64,
    windSpeed: cur.wind_speed_10m || 12.5,
    treeCanopyCoverage: 8,
    description: `High thermal mass downtown canyon in ${currentLocation.name}.`,
    coordinates: { lat: currentLocation.lat, lng: currentLocation.lng }
  };

  const aqiCategory = getAqiCategory(liveAqi.aqi);

  // FIX: duplicate 'Alerts' item remove kora hoyeche, badge ekhon real count
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Live Weather', icon: CloudSun },
    { name: 'Radar', icon: Radar },
    { name: 'Wind', icon: Wind },
    { name: 'Rainfall', icon: CloudRain },
    { name: 'Temperature', icon: Thermometer },
    { name: 'Satellite', icon: Satellite },
    { name: 'Air Quality', icon: Activity },
    { name: 'Marine', icon: Waves },
    { name: 'Alerts', icon: Bell, badge: activeAlerts.length || undefined },
    { name: 'Climate Analytics', icon: BarChart3 },
    { name: 'Reports', icon: FileText },
    { name: 'API Access', icon: Key },
    { name: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen w-full px-2 py-3 sm:px-5 sm:py-5">
      {/* Dynamic Toast / Notification Pill */}
      {navNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[4000] flex items-center gap-2 rounded-full border border-sky-400/40 bg-slate-900/95 px-4 py-2 text-xs font-semibold text-sky-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{navNotification}</span>
        </div>
      )}

      {/* ================= TOP HERO SECTION ================= */}
      <section className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-0.5 text-[10px] font-bold tracking-wider text-sky-400 uppercase">
            <Sparkles className="h-3 w-3" /> Worldwide Climate Intelligence
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Built for Predictability.{' '}
            <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Designed for Global Operations.
            </span>
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Meteo Intelligence provides real-time microclimate analytics, urban heat island intensity, satellite thermal overlays,
            and atmospheric prediction for any location worldwide.
          </p>
        </div>

        {/* 4 Feature Pills */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { title: 'Global Coverage', desc: 'Any city or territory', icon: Globe, color: 'text-sky-400' },
            { title: 'AI Intelligence', desc: 'Gemini 3.5 Copilot', icon: Brain, color: 'text-purple-400' },
            { title: 'Microclimate GIS', desc: 'Real-time LST & UHI', icon: Network, color: 'text-emerald-400' },
            { title: 'Live Air Quality', desc: 'Open-Meteo & OpenAQ', icon: ShieldCheck, color: 'text-amber-400' }
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="meteo-glass flex items-center gap-2.5 px-3 py-1.5 text-xs"
              >
                <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${feat.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-white leading-tight">{feat.title}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{feat.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= MAIN DASHBOARD WINDOW ================= */}
      <div className="meteo-glass p-2 sm:p-4">
        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4 px-1">
          {/* Brand Logo */}
          <div
            onClick={() => handleNavClick('Dashboard')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Leaf className="h-5 w-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-base">
                <span>METEO</span>
                <span className="text-sky-400 font-light">INTELLIGENCE</span>
              </div>
              <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                Global Microclimate Ops
              </div>
            </div>
          </div>

          {/* WORLDWIDE GEOCODING SEARCH BAR */}
          <div className="relative flex-1 max-w-sm">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-400 focus-within:border-sky-500 shadow-inner">
              {isSearching ? (
                <Loader2 className="h-3.5 w-3.5 text-sky-400 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5 text-slate-500" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                onChange={handleSearchInput}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search any place worldwide (e.g. Kolkata, London, Tokyo...)"
                className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    searchInputRef.current?.focus();
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <kbd className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                Enter
              </kbd>
            </div>

            {/* Live Worldwide Autocomplete Results & Popular Metros Dropdown */}
            {isSearchFocused && (searchResults.length > 0 || !searchQuery.trim()) && (
              <div className="absolute top-10 left-0 z-[3000] w-full max-h-80 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1 mb-1 px-2 text-[10px] uppercase font-bold text-slate-500">
                  <span>{searchResults.length > 0 ? 'Worldwide Search Results' : '🌟 Popular Metros (Click to Jump)'}</span>
                  <span className="font-mono text-sky-400">{searchResults.length > 0 ? `${searchResults.length} matches` : 'Global'}</span>
                </div>
                {(searchResults.length > 0 ? searchResults : POPULAR_GLOBAL_CITIES).map((place) => (
                  <div
                    key={`${place.id || place.name}-${place.latitude}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectLocation(place);
                    }}
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs hover:bg-slate-900 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getFlagEmoji(place.country_code)}</span>
                      <div>
                        <div className="font-semibold text-white leading-tight">{place.name}</div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          {[place.admin1, place.country].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-sky-400">
                      {place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}°
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Global Location Badge (Click to Re-center) */}
          <button
            onClick={() => {
              setFlyTrigger((p) => p + 1);
              setNavNotification(`Map re-centered to ${currentLocation.name} (${currentLocation.lat.toFixed(2)}°, ${currentLocation.lng.toFixed(2)}°)`);
            }}
            title="Click to re-center map"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 cursor-pointer hover:border-sky-500 hover:text-white transition-colors"
          >
            <span className="text-sm">{getFlagEmoji(currentLocation.countryCode)}</span>
            <span className="font-semibold">{currentLocation.name}</span>
            <span className="font-mono text-[10px] text-slate-500">
              {currentLocation.lat.toFixed(2)}°, {currentLocation.lng.toFixed(2)}°
            </span>
          </button>

          {/* AI Assistant Pill Button */}
          <button
            onClick={() => {
              const chatElem = document.getElementById('ai-chat-section');
              if (chatElem) {
                chatElem.scrollIntoView({ behavior: 'smooth' });
                const inputElem = chatElem.querySelector('input');
                if (inputElem) inputElem.focus();
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/20 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>AI Assistant</span>
          </button>

          {/* LIVE status indicator */}
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wider">LIVE</span>
            <span className="font-mono text-[10px] text-slate-400">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Reports & Audit Brief trigger */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-600 to-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:opacity-90 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Audit Brief</span>
          </button>
        </header>

        {/* Dashboard Core: Left Sidebar + Center Map/Gauges + Right Sidebar */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* ================= 1. LEFT SIDEBAR RAIL ================= */}
          <aside className="lg:col-span-2 hidden xl:flex flex-col gap-1 border-r border-slate-800/80 pr-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'nav-pill-active'
                      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="mt-4 border-t border-slate-800 pt-3">
              <button
                onClick={() => setIsProposeModalOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Propose Cooling</span>
              </button>
            </div>
          </aside>

          {/* ================= 2. CENTER STAGE (MAP + GAUGES) ================= */}
          <section className="lg:col-span-8 xl:col-span-7 flex flex-col gap-3">
            {/* Interactive Global Weather Map */}
            <div className="relative min-h-[480px] w-full flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-[#030814] shadow-2xl">
              {/* Floating Top-Left Layers Control */}
              <div className={`absolute top-3 left-3 z-[1000] w-52 rounded-xl border border-slate-800/80 bg-slate-950/85 p-2.5 backdrop-blur-md shadow-xl text-xs transition-opacity duration-500 ${globeVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 font-bold uppercase tracking-wider text-slate-300 text-[10px]">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3 text-sky-400" /> Layers
                  </span>
                  <span className="text-slate-500 font-mono">Real GIS</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  {[
                    { id: 'surfaceTemp', label: 'Surface LST', icon: Thermometer, color: 'text-rose-400' },
                    { id: 'uhi', label: 'UHI ΔT Intensity', icon: Flame, color: 'text-amber-400' },
                    { id: 'ndvi', label: 'Vegetation NDVI', icon: Leaf, color: 'text-emerald-400' },
                    { id: 'albedo', label: 'Surface Albedo', icon: Sun, color: 'text-cyan-400' },
                    { id: 'hvi', label: 'Heat Vulnerability', icon: AlertTriangle, color: 'text-purple-400' },
                    { id: 'wind', label: 'Surface Wind Draft', icon: Wind, color: 'text-sky-400' },
                    { id: 'rainfall', label: 'Doppler Rain Runoff', icon: CloudRain, color: 'text-teal-400' }
                  ].map((layer) => {
                    const Icon = layer.icon;
                    const isSelected = activeLayer === layer.id;

                    return (
                      <div
                        key={layer.id}
                        onClick={() => {
                          setActiveLayer(layer.id);
                          setLayerVisibility((prev) => ({ ...prev, [layer.id]: true }));
                          setNavNotification(`Switched map rendering to ${layer.label}`);
                        }}
                        className={`flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-500/15 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Icon className={`h-3 w-3 ${layer.color}`} /> {layer.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={!!layerVisibility[layer.id]}
                          onChange={(e) => {
                            e.stopPropagation();
                            setLayerVisibility((prev) => ({ ...prev, [layer.id]: !prev[layer.id] }));
                          }}
                          className="rounded border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Worldwide Leaflet Map with Inverted Dark Tiles (No Horizontal Repetition) */}
              <MapContainer
                center={[currentLocation.lat, currentLocation.lng]}
                zoom={12}
                minZoom={2}
                maxZoom={18}
                maxBounds={[[-85, -180], [85, 180]]}
                maxBoundsViscosity={1.0}
                zoomControl={false}
                style={{ position: 'absolute', inset: 0, background: '#030814' }}
              >
                <MapController
                  center={[currentLocation.lat, currentLocation.lng]}
                  flyTrigger={flyTrigger}
                  onZoomChange={handleMapZoom}
                />

                {/* Basemap: Street or Satellite with noWrap={true} to eliminate tile repetition */}
                {!basemapSatellite ? (
                  <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="uhi-tiles-dark"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    noWrap={true}
                    bounds={[[-85, -180], [85, 180]]}
                    maxZoom={19}
                  />
                ) : (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Tiles &copy; Esri"
                    noWrap={true}
                    bounds={[[-85, -180], [85, 180]]}
                    maxZoom={19}
                  />
                )}

                <ZoomControl position="bottomright" />

                {/* Dynamic Zone Polygons for the Current City */}
                {zones.map((zone) => {
                  const isSelected = currentZone.code === zone.code;
                  const isVisible = layerVisibility[activeLayer] !== false;
                  const fillColor = getZoneColor(zone, activeLayer, diurnalOffset);

                  return (
                    <Polygon
                      key={`${zone.code}-${activeLayer}-${isSelected}-${diurnalOffset.toFixed(1)}`}
                      positions={zone.polygon}
                      pathOptions={{
                        color: isSelected ? '#ffffff' : fillColor,
                        fillColor: isVisible ? fillColor : 'transparent',
                        fillOpacity: isVisible ? (isSelected ? 0.70 : 0.45) : 0.08,
                        weight: isSelected ? 2.8 : 1.4
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedZone(zone);
                          setFlyTrigger((p) => p + 1);
                        }
                      }}
                    >
                      <Tooltip sticky>
                        <div className="text-xs p-1">
                          <b className="text-white block">{zone.name}</b>
                          <span className="text-slate-300 font-mono text-[10px]">
                            LST: {((zone.surfaceTemp || 32) + diurnalOffset).toFixed(1)}°C • UHI ΔT: +{zone.uhiIntensity}°C • Albedo: {zone.albedo}
                          </span>
                        </div>
                      </Tooltip>
                    </Polygon>
                  );
                })}

                {/* IoT Sensor Weather Stations */}
                {sensors.map((s) => (
                  <CircleMarker
                    key={s.stationId}
                    center={[s.lat, s.lng]}
                    radius={6}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: '#38bdf8',
                      fillOpacity: 0.95,
                      weight: 1.8
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 min-w-[180px]">
                        <b className="text-sky-400 block mb-1">{s.name}</b>
                        <div className="text-[11px] text-slate-300 space-y-0.5">
                          <div>Air Temp: <b>{s.lastReading?.airTemp}°C</b></div>
                          <div>Surface LST: <b>{s.lastReading?.surfaceTemp}°C</b></div>
                          <div>Humidity: <b>{s.lastReading?.humidity}%</b></div>
                          <div>Wind: <b>{s.lastReading?.windSpeed} m/s</b></div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

                {/* Radar rings */}
                {(activeNav === 'Radar' || activeNav === 'Rainfall' || activeLayer === 'rainfall') && (
                  <>
                    <Circle
                      center={[currentLocation.lat, currentLocation.lng]}
                      radius={10000}
                      pathOptions={{
                        color: '#06b6d4',
                        fillColor: '#06b6d4',
                        fillOpacity: 0.08,
                        weight: 1.5,
                        dashArray: '4 4'
                      }}
                    />
                    <Circle
                      center={[currentLocation.lat, currentLocation.lng]}
                      radius={5000}
                      pathOptions={{
                        color: '#10b981',
                        fillColor: '#10b981',
                        fillOpacity: 0.12,
                        weight: 1.5
                      }}
                    />
                  </>
                )}
              </MapContainer>

              <HoloGlobe
                visible={globeVisible}
                lat={currentLocation.lat}
                lng={currentLocation.lng}
                label={currentLocation.name}
              />

              {/* Floating Anomaly / Selected Zone Badge (Bottom-Left) */}
              <div className="absolute bottom-3 left-3 z-[1000] w-72 rounded-xl border border-slate-800/80 bg-slate-950/90 p-3 backdrop-blur-md shadow-2xl text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Flame className="h-4 w-4 text-rose-500 animate-pulse" />
                    <span className="truncate">{currentZone.name}</span>
                  </div>
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300 border border-rose-500/30">
                    HVI {currentZone.hviScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                  <div>Surface LST: <b className="text-rose-400 font-mono">{((currentZone.surfaceTemp || 32) + diurnalOffset).toFixed(1)}°C</b></div>
                  <div>Ambient Air: <b className="text-amber-300 font-mono">{((currentZone.currentTemp || 28) + diurnalOffset * 0.7).toFixed(1)}°C</b></div>
                  <div>UHI Excess ΔT: <b className="text-sky-300 font-mono">+{currentZone.uhiIntensity}°C</b></div>
                  <div>Canopy Coverage: <b className="text-emerald-400 font-mono">{currentZone.treeCanopyCoverage || 12}%</b></div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSimulatorModalOpen(true)}
                    className="flex-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-sky-500 transition-colors text-center cursor-pointer shadow-sm"
                  >
                    Simulator
                  </button>
                  <button
                    onClick={() => setIsZoneDetailsModalOpen(true)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors text-center cursor-pointer"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => {
                      if (currentZone.coordinates) {
                        setFlyTrigger((p) => p + 1);
                        setNavNotification(`Tracing microclimate boundary for ${currentZone.name}`);
                      }
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="View Track"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Floating Bottom-Right Map Dynamic Legend */}
              <div className={`absolute bottom-3 right-3 z-[1000] flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-[10px] text-slate-300 backdrop-blur-md transition-opacity duration-500 ${globeVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {activeNav === 'Wind' || activeLayer === 'wind' ? (
                  <>
                    <span>0.5 m/s (Canyon)</span>
                    <div className="h-2 w-24 rounded-full legend-gradient-wind" />
                    <span className="text-sky-400 font-bold">5.0 m/s (Ventilated)</span>
                  </>
                ) : activeNav === 'Rainfall' || activeNav === 'Radar' || activeLayer === 'rainfall' ? (
                  <>
                    <span>0.0 mm/h (Dry)</span>
                    <div className="h-2 w-24 rounded-full legend-gradient-rain" />
                    <span className="text-teal-400 font-bold">50 mm/h (Convective)</span>
                  </>
                ) : (
                  <>
                    <span>Cool Haven (20°C)</span>
                    <div className="h-2 w-24 rounded-full legend-gradient-heat" />
                    <span className="text-rose-400 font-bold">Extreme Heat (45°C+)</span>
                  </>
                )}
              </div>
            </div>

            {/* Bottom 6 Circular Arc Gauges Strip */}
            <div className="meteo-glass grid grid-cols-3 gap-2 sm:grid-cols-6 p-2">
              <MeteoRadialGauge
                value={Math.round(cur.wind_speed_10m || 12)}
                max={60}
                unit="km/h"
                label="Wind"
                color="#38bdf8"
                sub="Live Sensor"
                icon={Wind}
              />
              <MeteoRadialGauge
                value={cur.weather_code >= 51 ? '4.8' : '0.0'}
                max={50}
                unit="mm"
                label="Rainfall"
                color="#06b6d4"
                sub={cur.weather_code >= 51 ? 'Precipitation' : 'Dry corridor'}
                icon={CloudRain}
              />
              <MeteoRadialGauge
                value={Math.round(cur.surface_pressure || 1012)}
                max={1050}
                unit="hPa"
                label="Pressure"
                color="#a855f7"
                sub="Barometric"
                icon={Gauge}
              />
              <MeteoRadialGauge
                value={cur.relative_humidity_2m || 60}
                max={100}
                unit="%"
                label="Humidity"
                color="#34d399"
                sub="Moisture"
                icon={Droplets}
              />
              <MeteoRadialGauge
                value={Number(cur.uv_index || 0).toFixed(0)}
                max={12}
                unit="UV"
                label="UV Index"
                color="#fbbf24"
                sub={cur.uv_index > 5 ? 'High' : 'Moderate'}
                icon={Sun}
              />
              <MeteoRadialGauge
                value={Math.round((cur.visibility || 15000) / 1000)}
                max={25}
                unit="km"
                label="Visibility"
                color="#38bdf8"
                sub="Atmospheric"
                icon={Eye}
              />
            </div>
          </section>

          {/* ================= 3. RIGHT SIDEBAR (FORECAST ANALYTICS) ================= */}
          <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3">
            {/* Current Conditions Card */}
            <div className="meteo-glass p-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Current Conditions</span>
                <span className="font-mono text-slate-500">{currentLocation.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-extrabold text-white tracking-tight">
                    {Math.round((cur.temperature_2m || 26) + diurnalOffset * 0.4)}°<span className="text-2xl text-slate-400 font-light">C</span>
                  </div>
                  <div className="text-xs font-medium text-sky-400 mt-0.5">
                    {getWeatherCondition(cur.weather_code)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Feels like {Math.round((cur.apparent_temperature || 28) + diurnalOffset * 0.4)}°C
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                  <Sun className="h-9 w-9 text-amber-400 animate-spin" style={{ animationDuration: '30s' }} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-2.5">
                <div>Humidity: <b className="text-slate-200">{cur.relative_humidity_2m || 60}%</b></div>
                <div>Wind: <b className="text-slate-200">{Math.round(cur.wind_speed_10m || 12)} km/h</b></div>
                <div>Pressure: <b className="text-slate-200">{Math.round(cur.surface_pressure || 1012)} hPa</b></div>
                <div>Visibility: <b className="text-slate-200">{Math.round((cur.visibility || 15000) / 1000)} km</b></div>
              </div>
            </div>

            {/* Hourly Forecast */}
            <div className="meteo-glass p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Hourly Forecast
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {hourlySlots.map((slot) => (
                  <div
                    key={slot.label}
                    onClick={() => setSelectedHour(slot.hour)}
                    className="rounded-xl bg-slate-900/60 p-2 border border-slate-800/60 cursor-pointer hover:border-sky-500 transition-colors"
                  >
                    <div className="text-[10px] text-slate-400">{slot.label}</div>
                    <Sun className="h-3.5 w-3.5 text-amber-400 mx-auto my-1" />
                    <div className="text-xs font-bold text-white">{slot.temp}°</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7-Day Heat Outlook with Glowing Range Bars */}
            <div className="meteo-glass p-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                7-Day Heat & UHI Outlook
              </div>
              <div className="space-y-0.5">
                {outlookDays.map((day, i) => (
                  <DayOutlookRow
                    key={`${day}-${i}`}
                    day={day}
                    min={daily.temperature_2m_min?.[i] || (18 + (i % 3))}
                    max={daily.temperature_2m_max?.[i] || (29 + (i % 4))}
                  />
                ))}
              </div>
            </div>

            {/* Air Quality Index (Real-time US AQI & PM2.5) */}
            <div
              onClick={() => handleNavClick('Air Quality')}
              className="meteo-glass p-3.5 cursor-pointer hover:border-sky-500/40 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                <span>Air Quality Index (US)</span>
                <span className="text-[10px] text-slate-500 font-mono">Live Sync</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className={`text-3xl font-extrabold ${aqiCategory.color}`}>
                    {liveAqi.aqi}
                  </span>
                  <span className={`ml-2 rounded px-2 py-0.5 text-xs font-bold ${aqiCategory.bg} ${aqiCategory.color}`}>
                    {aqiCategory.label}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  PM2.5: <b className="text-white">{liveAqi.pm25.toFixed(1)} µg/m³</b>
                </div>
              </div>

              {/* Sparkline curve */}
              <div className="mt-2.5 h-9 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={diurnalChartData}>
                    <Area
                      type="monotone"
                      dataKey="urbanTemp"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fill="url(#aqiGradient)"
                    />
                    <defs>
                      <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Heat Hazard Alerts (LIVE: Open-Meteo weather + air quality) */}
            <div id="alerts-section" className="meteo-glass p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <AlertTriangle className="h-4 w-4" /> Thermal Hazard Advisories
                </span>
                <button
                  onClick={() => setIsAlertsModalOpen(true)}
                  className="text-[10px] font-mono text-sky-400 hover:underline cursor-pointer"
                >
                  View All ({activeAlerts.length})
                </button>
              </div>

              <div className="space-y-1.5">
                {!alertsLive ? (
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-2 text-xs text-slate-400">
                    Loading live conditions for {currentLocation.name}...
                  </div>
                ) : activeAlerts.length === 0 ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2 text-xs">
                    <div className="font-semibold text-emerald-300">All Clear — No active thermal hazards</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Live conditions in {currentLocation.name} are within safe thresholds.
                    </div>
                  </div>
                ) : (
                  activeAlerts.slice(0, 2).map((alt) => {
                    const tone = ALERT_TONES[alt.severity] || ALERT_TONES.Advisory;
                    return (
                      <div
                        key={alt.id}
                        onClick={() => setIsAlertsModalOpen(true)}
                        className={`rounded-xl border p-2 text-xs cursor-pointer transition-colors ${tone.box}`}
                      >
                        <div className={`flex items-center justify-between gap-2 font-semibold ${tone.title}`}>
                          <span>{alt.title}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] uppercase font-bold ${tone.badge}`}>
                            {alt.severity}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                          {alt.description}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* ================= 4. BOTTOM THREE PANELS ================= */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Panel A (Left): AI Climate Intelligence Copilot */}
          <div id="ai-chat-section" className="meteo-glass lg:col-span-4 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      AI Climate Intelligence Copilot
                    </h3>
                    <p className="text-[10px] text-slate-400">Powered by Gemini 3.5 & Microclimate Engine</p>
                  </div>
                </div>
              </div>

              {/* Chat bubbles */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs mb-3">
                {chatMessages.slice(-3).map((msg, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-2.5 leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-sky-600 text-white ml-6 text-right'
                        : 'bg-slate-900/90 text-slate-200 border border-slate-800 mr-4'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isChatBusy && (
                  <div className="flex items-center gap-1.5 text-purple-300 text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />
                    Analyzing regional microclimate telemetry with Gemini...
                  </div>
                )}
              </div>
            </div>

            {/* Quick Prompts & Chat Input */}
            <div>
              <div className="flex flex-wrap gap-1 mb-2">
                {[
                  `${currentLocation.name} cooling priority`,
                  'Explain nocturnal thermal trap',
                  'Simulate cool roofs'
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSendChat(null, s)}
                    className="rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400 hover:text-sky-300 border border-slate-800 cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask anything about ${currentLocation.name} microclimate...`}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isChatBusy || !chatInput.trim()}
                  className="rounded-xl bg-purple-600 px-3 py-2 text-white hover:bg-purple-500 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Panel B (Center): Timeline Playback Controls & Multi-layer Stack */}
          <div className="meteo-glass lg:col-span-4 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Timeline Playback Controls
                    </h3>
                    <p className="text-[10px] text-slate-400">Scrub through diurnal cycles in real-time</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[10px]">
                  {['Now', 'Forecast', 'History'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTimeMode(mode)}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                        timeMode === mode ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Scrubber Controls */}
              <div className="flex items-center gap-3 my-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white hover:bg-sky-400 shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>00:00</span>
                    <span className="font-bold text-sky-400">{String(selectedHour).padStart(2, '0')}:00 Local</span>
                    <span>23:00</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="23"
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Multi-layer legends */}
            <div className="space-y-1.5 border-t border-slate-800/80 pt-3 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Wind Intensity (0 - 35 km/h)</span>
                <div className="h-1.5 w-32 rounded-full legend-gradient-wind" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Thermal Field UHI ΔT (0 - 10°C)</span>
                <div className="h-1.5 w-32 rounded-full legend-gradient-heat" />
              </div>
            </div>
          </div>

          {/* Panel C (Right): Operational Analytics & Temperature Trend */}
          <div id="analytics-section" className="meteo-glass lg:col-span-4 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Operational Analytics
                    </h3>
                    <p className="text-[10px] text-slate-400">24-hour diurnal thermal progression & pressure</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAnalyticsModalOpen(true)}
                  className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                >
                  Full View
                </button>
              </div>

              {/* 4 Mini Radial KPI Gauges */}
              <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-800">
                  <div className="text-[10px] text-slate-400">UHI ΔT</div>
                  <div className="text-sm font-bold text-amber-400">+{currentZone.uhiIntensity || 6.5}°</div>
                </div>
                <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Albedo</div>
                  <div className="text-sm font-bold text-cyan-400">α {currentZone.albedo || 0.12}</div>
                </div>
                <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Canopy</div>
                  <div className="text-sm font-bold text-emerald-400">{currentZone.treeCanopyCoverage || 8}%</div>
                </div>
                <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-800">
                  <div className="text-[10px] text-slate-400">HVI Risk</div>
                  <div className="text-sm font-bold text-rose-400">{currentZone.hviScore || 82}</div>
                </div>
              </div>
            </div>

            {/* Recharts Diurnal Temperature Area Curve */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Diurnal Thermal Progression</span>
                <span className="text-rose-400 font-mono">Peak: +9.2°C @ Midnight</span>
              </div>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={diurnalChartData}>
                    <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} hide />
                    <RTooltip
                      contentStyle={{
                        backgroundColor: '#090d1f',
                        borderColor: '#1e293b',
                        borderRadius: '10px',
                        fontSize: '11px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="urbanTemp"
                      name="Urban Core"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fill="url(#tempGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="ruralTemp"
                      name="Rural Baseline"
                      stroke="#38bdf8"
                      strokeWidth={1.5}
                      fill="transparent"
                      strokeDasharray="3 3"
                    />
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 5. BOTTOM GLOBAL RIBBON ================= */}
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-4 px-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-sky-500/10 text-sky-400">
              <Database className="h-3.5 w-3.5" />
            </div>
            <div>
              <b className="text-white text-sm">200+</b> Data Sources
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <Globe className="h-3.5 w-3.5" />
            </div>
            <div>
              <b className="text-white text-sm">Worldwide</b> Coverage
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-purple-500/10 text-purple-400">
              <Network className="h-3.5 w-3.5" />
            </div>
            <div>
              <b className="text-white text-sm">1.2M+</b> Forecast Points
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-amber-500/10 text-amber-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <div>
              <b className="text-white text-sm">99.9%</b> Uptime SLA
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-rose-500/10 text-rose-400">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <div>
              <b className="text-white text-sm">24/7</b> AI Monitoring
            </div>
          </div>
        </footer>
      </div>

      {/* ================= FULL MODALS ================= */}

      {/* 1. Zone Details Modal */}
      {isZoneDetailsModalOpen && (
        <div className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ZoneDetailPanel
              zone={currentZone}
              onClose={() => setIsZoneDetailsModalOpen(false)}
              onLaunchSimulator={() => {
                setIsZoneDetailsModalOpen(false);
                setIsSimulatorModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Mitigation Simulator Modal */}
      {isSimulatorModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-sky-400" />
                Digital Twin Mitigation Simulator — {currentZone.name}
              </h3>
              <button
                onClick={() => setIsSimulatorModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <MitigationSimulator
              zones={zones}
              selectedZone={currentZone}
              onProjectCreated={() => fetchLocationData(currentLocation)}
            />
          </div>
        </div>
      )}

      {/* 3. API Access Modal */}
      {isApiAccessModalOpen && (
        <div className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                RESTful API Endpoints & Key Management
              </h3>
              <button
                onClick={() => setIsApiAccessModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <div className="font-semibold text-sky-400 mb-1">Configured External Providers (.env)</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>OpenAQ API: <span className="text-emerald-400 font-bold">Connected (97 Delhi Stations)</span></div>
                  <div>Google Gemini AI: <span className="text-emerald-400 font-bold">Active (3.5-flash-lite)</span></div>
                  <div>NASA EOSDIS GIBS: <span className="text-emerald-400 font-bold">MODIS LST Active</span></div>
                  <div>Open-Meteo Feed: <span className="text-emerald-400 font-bold">Worldwide Live</span></div>
                </div>
              </div>

              <div className="font-semibold text-slate-300">Available Platform Endpoints</div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {[
                  { m: 'GET', p: '/api/zones', d: 'All 6 microclimate zones with calculated UTFVI & HVI' },
                  { m: 'GET', p: '/api/sensors', d: 'Real-time telemetry from IoT microclimate stations' },
                  { m: 'POST', p: '/api/simulation/evaluate', d: 'Physics-informed What-If mitigation model' },
                  { m: 'POST', p: '/api/chat', d: 'Gemini-powered AI climate resilience analyst' },
                  { m: 'GET', p: '/api/alerts', d: 'Active thermal stress advisories' }
                ].map((ep) => (
                  <div key={ep.p} className="flex items-center justify-between rounded-lg bg-slate-950/80 p-2 border border-slate-800">
                    <div>
                      <span className="font-bold text-emerald-400 mr-2">{ep.m}</span>
                      <span className="text-slate-200">{ep.p}</span>
                    </div>
                    <span className="text-slate-400 text-[10px] font-sans">{ep.d}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setIsApiAccessModalOpen(false)}
                className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-sky-400" />
                Platform Configuration & Settings
              </h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
                <div>
                  <div className="font-semibold text-slate-200">Worldwide Live Telemetry Polling</div>
                  <div className="text-[10px] text-slate-400">Current interval: 20 seconds</div>
                </div>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-bold">Active</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
                <div>
                  <div className="font-semibold text-slate-200">Thermal Unit Scale</div>
                  <div className="text-[10px] text-slate-400">Metric Celsius (°C) + Kelvin for UTFVI</div>
                </div>
                <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-400 font-bold">°C</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
                <div>
                  <div className="font-semibold text-slate-200">Satellite Imagery Feed</div>
                  <div className="text-[10px] text-slate-400">NASA EOSDIS GIBS Level-7</div>
                </div>
                <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-400 font-bold">Enabled</span>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Alerts Modal (Triggered by Sidebar 'Alerts') */}
      {isAlertsModalOpen && (
        <div className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-rose-500" />
                Urban Heat Stress & Weather Advisories — {currentLocation.name}
              </h3>
              <button
                onClick={() => setIsAlertsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AlertsView alerts={alerts} onRefreshAlerts={() => fetchLocationData(currentLocation)} />
          </div>
        </div>
      )}

      {/* 6. Climate Analytics Modal (Triggered by Sidebar 'Climate Analytics') */}
      {isAnalyticsModalOpen && (
        <div className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                Climate Analytics & LOOCV Machine Learning Engine — {currentLocation.name}
              </h3>
              <button
                onClick={() => setIsAnalyticsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AnalyticsView zones={zones} />
          </div>
        </div>
      )}

      {/* 7. Executive Audit Report Modal */}
      <AuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        zones={zones}
        summary={summary}
        projects={projects}
      />

      {/* 8. Propose Project Modal */}
      <ProposeProjectModal
        isOpen={isProposeModalOpen}
        onClose={() => setIsProposeModalOpen(false)}
        zones={zones}
        onProjectCreated={() => fetchLocationData(currentLocation)}
      />
    </div>
  );
}