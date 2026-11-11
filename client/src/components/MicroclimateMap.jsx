import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, Tooltip, ZoomControl } from 'react-leaflet';
import {
  Flame,
  Trees,
  Sun,
  ShieldAlert,
  Radio,
  Wind,
  Droplets,
  Gauge,
  Map as MapIcon,
  Satellite,
  Thermometer
} from 'lucide-react';

// Optional Mapbox token. If it is empty we use free Esri imagery.
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// NASA GIBS needs a date. LST data arrives with a delay, so we ask for 3 days ago.
function getNasaDate() {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString().slice(0, 10);
}

const NASA_LST_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_Land_Surface_Temp_Daily_Day/default/' +
  getNasaDate() +
  '/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png';

// The 4 map layers: button style + legend gradient + legend labels
const LAYERS = [
  {
    id: 'surfaceTemp',
    short: 'LST',
    title: 'Land Surface Temperature (°C)',
    icon: Flame,
    activeClass: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
    gradient: 'linear-gradient(to right, #2fb67c, #e0a526, #ea7a2a, #dc4a2e, #b3261e)',
    labels: ['≤ 32 cool', '38', '≥ 47 extreme']
  },
  {
    id: 'ndvi',
    short: 'NDVI',
    title: 'Vegetation Density (NDVI)',
    icon: Trees,
    activeClass: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    gradient: 'linear-gradient(to right, #7a7468, #c58a2b, #8fbf4a, #2fb67c, #0f7a52)',
    labels: ['0.04 barren', '0.30', '0.75+ dense']
  },
  {
    id: 'albedo',
    short: 'Albedo',
    title: 'Surface Albedo (α)',
    icon: Sun,
    activeClass: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
    gradient: 'linear-gradient(to right, #3d4d58, #6f8aa0, #3f9fd1, #5cc8e6)',
    labels: ['0.08 asphalt', '0.25', '0.75+ cool roof']
  },
  {
    id: 'hvi',
    short: 'HVI',
    title: 'Heat Vulnerability Index',
    icon: ShieldAlert,
    activeClass: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
    gradient: 'linear-gradient(to right, #2fb67c, #e0a526, #ea7a2a, #dc4a2e)',
    labels: ['Low < 35', 'Moderate', 'Critical > 75']
  }
];

// Pick the polygon fill color for the active layer
function getFillColor(layerId, zone) {
  if (layerId === 'surfaceTemp') {
    const t = zone.surfaceTemp;
    if (t >= 45) return '#b3261e';
    if (t >= 42) return '#dc4a2e';
    if (t >= 38) return '#ea7a2a';
    if (t >= 35) return '#e0a526';
    return '#2fb67c';
  }

  if (layerId === 'ndvi') {
    const n = zone.ndvi;
    if (n >= 0.6) return '#0f7a52';
    if (n >= 0.3) return '#2fb67c';
    if (n >= 0.15) return '#8fbf4a';
    if (n >= 0.08) return '#c58a2b';
    return '#7a7468';
  }

  if (layerId === 'albedo') {
    const a = zone.albedo;
    if (a >= 0.35) return '#5cc8e6';
    if (a >= 0.22) return '#3f9fd1';
    if (a >= 0.14) return '#6f8aa0';
    return '#3d4d58';
  }

  // hvi
  const h = zone.hviScore || 50;
  if (h >= 75) return '#dc4a2e';
  if (h >= 55) return '#ea7a2a';
  if (h >= 35) return '#e0a526';
  return '#2fb67c';
}

export default function MicroclimateMap({ zones = [], sensors = [], selectedZone, onSelectZone, theme }) {
  const [activeLayer, setActiveLayer] = useState('surfaceTemp');
  const [basemap, setBasemap] = useState('map'); // 'map' or 'satellite'
  const [showNasaLst, setShowNasaLst] = useState(false);
  const center = [28.64, 77.235];

  const currentLayer = LAYERS.find((l) => l.id === activeLayer);
  const isDark = theme !== 'light';
  const isSatellite = basemap === 'satellite';

  // On satellite imagery the white outline is always easier to see
  const getZoneStyle = (zone) => {
    const isSelected = selectedZone && selectedZone.code === zone.code;
    const fillColor = getFillColor(activeLayer, zone);
    const selectedStroke = isDark || isSatellite ? '#ffffff' : '#0f1a14';

    return {
      color: isSelected ? selectedStroke : fillColor,
      weight: isSelected ? 3 : 1.5,
      opacity: 0.95,
      fillColor,
      fillOpacity: isSelected ? 0.6 : 0.38,
      dashArray: isSelected ? '5 4' : null
    };
  };

  return (
    <div className="relative h-[70vh] max-h-[820px] min-h-[480px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
      {/* Row 1 (top-left): data layer switcher */}
      <div className="absolute left-3 top-3 z-[1000] flex items-center gap-1 rounded-2xl border border-slate-700/70 bg-slate-900/90 p-1 shadow-xl backdrop-blur-md">
        {LAYERS.map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;

          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              title={layer.title}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? `${layer.activeClass} ring-1 ring-inset`
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{layer.short}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2 (below it): basemap + NASA satellite temperature overlay */}
      <div className="absolute left-3 top-[58px] z-[1000] flex items-center gap-1 rounded-2xl border border-slate-700/70 bg-slate-900/90 p-1 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setBasemap('map')}
          title="Street map"
          className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
            !isSatellite
              ? 'bg-slate-700 text-slate-100'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
          }`}
        >
          <MapIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Map</span>
        </button>

        <button
          onClick={() => setBasemap('satellite')}
          title="Satellite imagery"
          className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
            isSatellite
              ? 'bg-slate-700 text-slate-100'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
          }`}
        >
          <Satellite className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Satellite</span>
        </button>

        <span className="mx-0.5 h-5 w-px bg-slate-700" />

        <button
          onClick={() => setShowNasaLst(!showNasaLst)}
          title="NASA MODIS land surface temperature (about 1 km, daily)"
          className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
            showNasaLst
              ? 'bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
          }`}
        >
          <Thermometer className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">NASA LST</span>
        </button>
      </div>

      {/* Legend (bottom-left) */}
      <div className="absolute bottom-3 left-3 z-[1000] w-[230px] rounded-2xl border border-slate-700/70 bg-slate-900/90 p-3 text-xs shadow-xl backdrop-blur-md sm:w-[270px]">
        <div className="mb-2 font-semibold text-slate-200">{currentLayer.title}</div>
        <div className="h-2 w-full rounded-full" style={{ background: currentLayer.gradient }} />
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-400">
          {currentLayer.labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        {showNasaLst && (
          <div className="mt-2.5 border-t border-slate-700/70 pt-2 text-[11px] text-slate-400">
            NASA MODIS LST overlay is ON (real satellite data, ~1 km, cloud gaps are normal).
          </div>
        )}

        <div className="mt-2.5 flex items-center gap-2 border-t border-slate-700/70 pt-2 text-[11px] text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full border border-white bg-rose-500" />
          <span>IoT station (demo) · click a zone to inspect</span>
        </div>
      </div>

      {/* Leaflet map */}
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        {/* Basemap: street map */}
        {!isSatellite && (
          <TileLayer
            key={isDark ? 'tiles-dark' : 'tiles-light'}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            className={isDark ? 'uhi-tiles-dark' : 'uhi-tiles-light'}
            maxZoom={19}
          />
        )}

        {/* Basemap: satellite (Mapbox if token exists, otherwise free Esri) */}
        {isSatellite && MAPBOX_TOKEN && (
          <TileLayer
            key="sat-mapbox"
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; OpenStreetMap &copy; Maxar'
            url={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`}
            tileSize={512}
            zoomOffset={-1}
            maxZoom={19}
          />
        )}
        {isSatellite && !MAPBOX_TOKEN && (
          <TileLayer
            key="sat-esri"
            attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        {/* NASA MODIS land surface temperature overlay */}
        {showNasaLst && (
          <TileLayer
            key="nasa-lst"
            attribution="Imagery &copy; NASA EOSDIS GIBS"
            url={NASA_LST_URL}
            opacity={0.6}
            maxNativeZoom={7}
            maxZoom={19}
          />
        )}

        <ZoomControl position="bottomright" />

        {/* Microclimate zone polygons */}
        {zones.map((zone) => (
          <Polygon
            key={`${zone.code}-${activeLayer}-${selectedZone?.code === zone.code}-${isDark}-${isSatellite}`}
            positions={zone.polygon}
            pathOptions={getZoneStyle(zone)}
            eventHandlers={{ click: () => onSelectZone(zone) }}
          >
            <Tooltip sticky direction="top" opacity={1}>
              <div className="p-0.5 text-xs">
                <div className="font-semibold text-slate-100">{zone.name}</div>
                <div className="text-[10px] text-slate-400">{zone.category}</div>
                <div className="mt-1 flex items-center gap-3 font-mono">
                  <span className="font-semibold text-rose-400">LST {zone.surfaceTemp}°C</span>
                  <span className="text-amber-300">ΔT +{zone.uhiIntensity || 5.0}°C</span>
                </div>
              </div>
            </Tooltip>
          </Polygon>
        ))}

        {/* IoT sensor markers */}
        {sensors.map((sensor) => (
          <CircleMarker
            key={sensor.stationId}
            center={[sensor.lat, sensor.lng]}
            radius={7}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#ea7a2a',
              fillOpacity: 0.95,
              weight: 2
            }}
          >
            <Popup>
              <div className="min-w-[220px] space-y-2 p-1 text-xs">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                    <Radio className="h-3.5 w-3.5 text-rose-400" />
                    <span>{sensor.name}</span>
                  </div>
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                    {sensor.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  Station ID: <span className="font-mono text-slate-200">{sensor.stationId}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-[11px]">
                  <div>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Flame className="h-3 w-3 text-rose-400" /> Air temp
                    </span>
                    <span className="text-sm font-semibold text-slate-100">
                      {sensor.lastReading?.airTemp}°C
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Gauge className="h-3 w-3 text-amber-400" /> Surface LST
                    </span>
                    <span className="text-sm font-semibold text-amber-300">
                      {sensor.lastReading?.surfaceTemp}°C
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Droplets className="h-3 w-3 text-cyan-400" /> Humidity
                    </span>
                    <span className="font-semibold text-slate-200">{sensor.lastReading?.humidity}%</span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Wind className="h-3 w-3 text-sky-400" /> Wind
                    </span>
                    <span className="font-semibold text-slate-200">{sensor.lastReading?.windSpeed} m/s</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <span>
                    Heat index: <b className="text-rose-400">{sensor.lastReading?.heatIndex || 41}°C</b>
                  </span>
                  <span>
                    PM2.5: <b className="text-yellow-400">{sensor.lastReading?.pm25 || 50} µg/m³</b>
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}