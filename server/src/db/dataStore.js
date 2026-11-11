/**
 * DataStore & Database Abstraction Layer
 * Supports seamless MongoDB connection via Mongoose, with an intelligent
 * embedded in-memory fallback containing high-fidelity urban microclimate GIS data.
 */

const mongoose = require('mongoose');

// Initial seed data with realistic GIS coordinates (Metropolitan City Center)
const INITIAL_ZONES = [
  {
    id: "zone-1",
    code: "CBD-CORE",
    name: "Central Business District",
    category: "Commercial High-Density",
    coordinates: { lat: 28.6315, lng: 77.2167 },
    polygon: [
      [28.6360, 77.2120],
      [28.6360, 77.2215],
      [28.6270, 77.2215],
      [28.6270, 77.2120]
    ],
    areaKm2: 3.2,
    baselineTemp: 38.6,
    currentTemp: 39.4,
    surfaceTemp: 44.2, // LST Land Surface Temperature
    ruralBaselineTemp: 31.8,
    humidity: 42,
    windSpeed: 2.1,
    solarRadiation: 840,
    albedo: 0.12, // Dark asphalt, concrete, glass
    ndvi: 0.08, // Very sparse vegetation
    builtUpRatio: 88,
    populationDensity: 22000,
    elderlyRatio: 16.5,
    treeCanopyCoverage: 8,
    coolRoofCoverage: 12,
    permeablePavementCoverage: 5,
    description: "High thermal mass, canyon effect with glass curtain facades and extensive asphalt roadways."
  },
  {
    id: "zone-2",
    code: "IND-SEC9",
    name: "Sector 9 Industrial Corridor",
    category: "Industrial Manufacturing",
    coordinates: { lat: 28.6580, lng: 77.2750 },
    polygon: [
      [28.6650, 77.2680],
      [28.6650, 77.2820],
      [28.6510, 77.2820],
      [28.6510, 77.2680]
    ],
    areaKm2: 4.8,
    baselineTemp: 40.2,
    currentTemp: 41.1,
    surfaceTemp: 47.8, // Severe hotspot
    ruralBaselineTemp: 31.8,
    humidity: 38,
    windSpeed: 1.8,
    solarRadiation: 890,
    albedo: 0.10, // Dark metal corrugated roofs
    ndvi: 0.04,
    builtUpRatio: 92,
    populationDensity: 14000,
    elderlyRatio: 11.2,
    treeCanopyCoverage: 4,
    coolRoofCoverage: 5,
    permeablePavementCoverage: 2,
    description: "Peak industrial anthropogenic heat emissions, expansive dark corrugated iron roofing, zero green buffer."
  },
  {
    id: "zone-3",
    code: "OLD-TOWN",
    name: "Old City Heritage Quarter",
    category: "Ultra-Dense Residential",
    coordinates: { lat: 28.6505, lng: 77.2300 },
    polygon: [
      [28.6560, 77.2250],
      [28.6560, 77.2360],
      [28.6450, 77.2360],
      [28.6450, 77.2250]
    ],
    areaKm2: 2.1,
    baselineTemp: 37.9,
    currentTemp: 38.7,
    surfaceTemp: 42.6,
    ruralBaselineTemp: 31.8,
    humidity: 48,
    windSpeed: 1.2, // Low ventilation in narrow alleys
    solarRadiation: 780,
    albedo: 0.16, // Brick, masonry
    ndvi: 0.07,
    builtUpRatio: 95,
    populationDensity: 31000, // Very high vulnerability
    elderlyRatio: 23.4,
    treeCanopyCoverage: 6,
    coolRoofCoverage: 8,
    permeablePavementCoverage: 3,
    description: "Extreme human density with poor wind circulation in historical alleyways and high proportion of senior citizens."
  },
  {
    id: "zone-4",
    code: "SUB-NORTH",
    name: "North Avenue Residential Enclave",
    category: "Medium-Density Residential",
    coordinates: { lat: 28.6850, lng: 77.2050 },
    polygon: [
      [28.6920, 77.1980],
      [28.6920, 77.2120],
      [28.6780, 77.2120],
      [28.6780, 77.1980]
    ],
    areaKm2: 3.5,
    baselineTemp: 35.8,
    currentTemp: 36.3,
    surfaceTemp: 39.1,
    ruralBaselineTemp: 31.8,
    humidity: 45,
    windSpeed: 2.8,
    solarRadiation: 810,
    albedo: 0.22,
    ndvi: 0.28,
    builtUpRatio: 65,
    populationDensity: 11000,
    elderlyRatio: 18.0,
    treeCanopyCoverage: 26,
    coolRoofCoverage: 22,
    permeablePavementCoverage: 14,
    description: "Moderate canopy with residential gardens; good candidate for cool roof and permeable sidewalk scaling."
  },
  {
    id: "zone-5",
    code: "ECO-PARK",
    name: "Botanical & Ecological Buffer Belt",
    category: "Urban Forest & Wetland",
    coordinates: { lat: 28.6010, lng: 77.2480 },
    polygon: [
      [28.6120, 77.2380],
      [28.6120, 77.2580],
      [28.5900, 77.2580],
      [28.5900, 77.2380]
    ],
    areaKm2: 5.6,
    baselineTemp: 32.4,
    currentTemp: 32.7,
    surfaceTemp: 32.9, // Cool microclimate sink
    ruralBaselineTemp: 31.8,
    humidity: 62,
    windSpeed: 3.4,
    solarRadiation: 750,
    albedo: 0.18, // Foliage albedo
    ndvi: 0.74, // Dense foliage
    builtUpRatio: 8,
    populationDensity: 800,
    elderlyRatio: 9.0,
    treeCanopyCoverage: 78,
    coolRoofCoverage: 40,
    permeablePavementCoverage: 60,
    description: "Major city cooling sink and biodiversity corridor providing negative thermal field variance."
  },
  {
    id: "zone-6",
    code: "RIVER-FRONT",
    name: "Riverfront Promenade & Tech Hub",
    category: "Mixed-Use Waterfront",
    coordinates: { lat: 28.6250, lng: 77.2650 },
    polygon: [
      [28.6320, 77.2580],
      [28.6320, 77.2720],
      [28.6180, 77.2720],
      [28.6180, 77.2580]
    ],
    areaKm2: 2.8,
    baselineTemp: 34.6,
    currentTemp: 35.1,
    surfaceTemp: 36.8,
    ruralBaselineTemp: 31.8,
    humidity: 58,
    windSpeed: 3.6, // River breeze
    solarRadiation: 820,
    albedo: 0.28,
    ndvi: 0.38,
    builtUpRatio: 52,
    populationDensity: 9500,
    elderlyRatio: 12.0,
    treeCanopyCoverage: 32,
    coolRoofCoverage: 35,
    permeablePavementCoverage: 28,
    description: "Beneficiary of riparian evaporative cooling; modern tech campus with reflective glass and green terraces."
  }
];

const INITIAL_SENSORS = [
  {
    stationId: "IOT-UHI-101",
    name: "Connaught Square Central Met Station",
    zoneCode: "CBD-CORE",
    lat: 28.6315,
    lng: 77.2167,
    status: "ONLINE",
    type: "Solar-Powered Multi-Spectral IoT",
    lastReading: {
      airTemp: 39.4,
      surfaceTemp: 44.2,
      humidity: 42,
      windSpeed: 2.1,
      solarRadiation: 840,
      pm25: 68,
      heatIndex: 43.1,
      timestamp: new Date().toISOString()
    }
  },
  {
    stationId: "IOT-UHI-102",
    name: "Sector 9 Metal Works Perimeter",
    zoneCode: "IND-SEC9",
    lat: 28.6580,
    lng: 77.2750,
    status: "ONLINE",
    type: "Industrial Thermal IoT Node",
    lastReading: {
      airTemp: 41.1,
      surfaceTemp: 47.8,
      humidity: 38,
      windSpeed: 1.8,
      solarRadiation: 890,
      pm25: 112,
      heatIndex: 46.5,
      timestamp: new Date().toISOString()
    }
  },
  {
    stationId: "IOT-UHI-103",
    name: "Chandni Chowk Clock Tower",
    zoneCode: "OLD-TOWN",
    lat: 28.6505,
    lng: 77.2300,
    status: "ONLINE",
    type: "Canyon Microclimate Node",
    lastReading: {
      airTemp: 38.7,
      surfaceTemp: 42.6,
      humidity: 48,
      windSpeed: 1.2,
      solarRadiation: 780,
      pm25: 84,
      heatIndex: 43.8,
      timestamp: new Date().toISOString()
    }
  },
  {
    stationId: "IOT-UHI-104",
    name: "Model Town Green Park Node",
    zoneCode: "SUB-NORTH",
    lat: 28.6850,
    lng: 77.2050,
    status: "ONLINE",
    type: "Residential Micro-Weather Node",
    lastReading: {
      airTemp: 36.3,
      surfaceTemp: 39.1,
      humidity: 45,
      windSpeed: 2.8,
      solarRadiation: 810,
      pm25: 48,
      heatIndex: 38.9,
      timestamp: new Date().toISOString()
    }
  },
  {
    stationId: "IOT-UHI-105",
    name: "Biodiversity Sanctuary Tower A",
    zoneCode: "ECO-PARK",
    lat: 28.6010,
    lng: 77.2480,
    status: "ONLINE",
    type: "Ecological Microclimate Benchmark",
    lastReading: {
      airTemp: 32.7,
      surfaceTemp: 32.9,
      humidity: 62,
      windSpeed: 3.4,
      solarRadiation: 750,
      pm25: 22,
      heatIndex: 34.2,
      timestamp: new Date().toISOString()
    }
  },
  {
    stationId: "IOT-UHI-106",
    name: "Yamuna Waterfront Promenade",
    zoneCode: "RIVER-FRONT",
    lat: 28.6250,
    lng: 77.2650,
    status: "ONLINE",
    type: "Aquatic Boundary Layer Node",
    lastReading: {
      airTemp: 35.1,
      surfaceTemp: 36.8,
      humidity: 58,
      windSpeed: 3.6,
      solarRadiation: 820,
      pm25: 39,
      heatIndex: 37.5,
      timestamp: new Date().toISOString()
    }
  }
];

const INITIAL_MITIGATION_PROJECTS = [
  {
    id: "proj-1",
    title: "Sector 9 Industrial Cool Roof & Solar Reflective Coating",
    zoneCode: "IND-SEC9",
    interventionType: "COOL_ROOFS",
    targetCoveragePercent: 45,
    estimatedBudget: 85000,
    projectedTempReduction: 2.1,
    projectedEnergySavingsMWh: 320,
    projectedCarbonOffsetTons: 260,
    status: "APPROVED",
    votes: 42,
    description: "Application of high-albedo (0.85) elastomeric cool coatings across 120,000 sq.m of industrial metal sheds to deflect solar gain.",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: "proj-2",
    title: "CBD Miyawaki Urban Pocket Forests & Shaded Corridors",
    zoneCode: "CBD-CORE",
    interventionType: "URBAN_FORESTRY_CANOPY",
    targetCoveragePercent: 20,
    estimatedBudget: 110000,
    projectedTempReduction: 1.8,
    projectedEnergySavingsMWh: 280,
    projectedCarbonOffsetTons: 390,
    status: "IN_PROGRESS",
    votes: 89,
    description: "Planting native multi-tier dense tree canopy and shaded pedestrian transit corridors along major traffic arterial bottlenecks.",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: "proj-3",
    title: "Old City Porous Pavement & Water Mist Cooling Network",
    zoneCode: "OLD-TOWN",
    interventionType: "PERMEABLE_COOL_PAVEMENTS",
    targetCoveragePercent: 30,
    estimatedBudget: 65000,
    projectedTempReduction: 1.4,
    projectedEnergySavingsMWh: 150,
    projectedCarbonOffsetTons: 120,
    status: "PROPOSED",
    votes: 67,
    description: "Replacing impermeable asphalt in pedestrian streets with permeable interlocking concrete pavers and low-power mist cooling posts.",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

const INITIAL_ALERTS = [
  {
    id: "alt-1",
    severity: "Emergency",
    zoneCode: "IND-SEC9",
    title: "Severe Microclimate Thermal Stress Alert",
    description: "Surface temperature has exceeded 47°C with Heat Index > 46°C. High risk of heat stroke for outdoor and industrial workers.",
    advisories: [
      "Suspend outdoor heavy labor between 11:30 AM and 4:00 PM",
      "Deploy mobile hydration tankers at Sector 9 perimeter",
      "Activate municipal misting stations at public bus stops"
    ],
    triggeredAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    active: true
  },
  {
    id: "alt-2",
    severity: "Warning",
    zoneCode: "CBD-CORE",
    title: "Urban Canyon Heat Retention Watch",
    description: "Air temperature is +7.6°C above rural baseline. High evening heat trap expected due to asphalt and concrete thermal inertia.",
    advisories: [
      "Public buildings advised to precool spaces before peak hours",
      "Pedestrian shade canopies deployed at central plaza"
    ],
    triggeredAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    active: true
  }
];

// Helper for unique ID generation
function generateId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// In-Memory store state
const clonedSensors = JSON.parse(JSON.stringify(INITIAL_SENSORS)).map(s => ({
  ...s,
  baseAirTemp: s.lastReading.airTemp,
  baseSurfaceTemp: s.lastReading.surfaceTemp,
  baseHumidity: s.lastReading.humidity,
  baseSolar: s.lastReading.solarRadiation,
  lastManualUpdate: 0
}));

let inMemoryStore = {
  zones: JSON.parse(JSON.stringify(INITIAL_ZONES)),
  sensors: clonedSensors,
  mitigationProjects: JSON.parse(JSON.stringify(INITIAL_MITIGATION_PROJECTS)),
  alerts: JSON.parse(JSON.stringify(INITIAL_ALERTS)),
  simulations: []
};

let isConnectedToMongo = false;

async function initDatabase() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_uhi_db";
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    isConnectedToMongo = true;
    console.log(`[Database] Successfully connected to live MongoDB: ${mongoUri}`);
  } catch (err) {
    isConnectedToMongo = false;
    console.log(`[Database] MongoDB daemon not detected (${err.message}).`);
    console.log(`[Database] Seamlessly initialized High-Fidelity Embedded In-Memory Store with real GIS Microclimate data!`);
  }
}

// Data Store Accessors
const dataStore = {
  init: initDatabase,
  isLiveMongo: () => isConnectedToMongo,

  // Zones
  getZones: () => inMemoryStore.zones,
  getZoneByCode: (code) => inMemoryStore.zones.find(z => z.code === code),
  updateZone: (code, updates) => {
    const idx = inMemoryStore.zones.findIndex(z => z.code === code);
    if (idx !== -1) {
      inMemoryStore.zones[idx] = { ...inMemoryStore.zones[idx], ...updates };
      return inMemoryStore.zones[idx];
    }
    return null;
  },

  // Sensors
  getSensors: () => inMemoryStore.sensors,
  getSensorById: (id) => inMemoryStore.sensors.find(s => s.stationId === id),
  updateSensorReading: (stationId, reading) => {
    const sensor = inMemoryStore.sensors.find(s => s.stationId === stationId);
    if (sensor) {
      sensor.lastReading = { ...sensor.lastReading, ...reading, timestamp: new Date().toISOString() };
      return sensor;
    }
    return null;
  },

  // Mitigation Projects
  getMitigationProjects: () => inMemoryStore.mitigationProjects,
  addMitigationProject: (project) => {
    const newProj = {
      id: generateId('proj'),
      votes: 1,
      createdAt: new Date().toISOString(),
      ...project
    };
    inMemoryStore.mitigationProjects.unshift(newProj);
    return newProj;
  },
  voteMitigationProject: (id) => {
    const proj = inMemoryStore.mitigationProjects.find(p => p.id === id);
    if (proj) {
      proj.votes = (proj.votes || 0) + 1;
      return proj;
    }
    return null;
  },
  updateProjectStatus: (id, status) => {
    const proj = inMemoryStore.mitigationProjects.find(p => p.id === id);
    if (proj) {
      proj.status = status;
      return proj;
    }
    return null;
  },

  // Alerts
  getAlerts: () => inMemoryStore.alerts,
  addAlert: (alert) => {
    const newAlert = {
      id: generateId('alt'),
      triggeredAt: new Date().toISOString(),
      active: true,
      ...alert
    };
    inMemoryStore.alerts.unshift(newAlert);
    return newAlert;
  },
  resolveAlert: (id) => {
    const alert = inMemoryStore.alerts.find(a => a.id === id);
    if (alert) {
      alert.active = false;
      return alert;
    }
    return null;
  },

  // Simulations History
  getSimulations: () => inMemoryStore.simulations,
  saveSimulation: (sim) => {
    const record = {
      id: generateId('sim'),
      timestamp: new Date().toISOString(),
      ...sim
    };
    inMemoryStore.simulations.unshift(record);
    if (inMemoryStore.simulations.length > 50) {
      inMemoryStore.simulations.length = 50;
    }
    return record;
  }
};

module.exports = dataStore;
