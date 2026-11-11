const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const dataStore = require('server/src/db/dataStore');
const zonesRouter = require('server/src/routes/zones');
const sensorsRouter = require('server/src/routes/sensors');
const mitigationRouter = require('server/src/routes/mitigation');
const simulationRouter = require('server/src/routes/simulation');
const alertsRouter = require('server/src/routes/alerts');
const analyticsRouter = require('server/src/routes/analytics');
const authRouter = require('server/src/routes/auth');
const aiRouter = require('server/src/routes/ai');
const chatRouter = require('server/src/routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Security middleware
app.use(helmet());
// localhost / 127.0.0.1 er jekono port (5173, 5174 ...) allow kora hocche
const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origin === CLIENT_ORIGIN || LOCAL_ORIGIN_RE.test(origin)) return cb(null, true);
      return cb(null, false);
    }
  })
);
app.use(express.json({ limit: '100kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, try again later' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts, try again later' }
});
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/zones', zonesRouter);
app.use('/api/sensors', sensorsRouter);
app.use('/api/mitigation', mitigationRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/chat', chatRouter);

const SIMULATE_TELEMETRY = process.env.SIMULATE_TELEMETRY !== 'false';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'Smart Urban Heat Island Mitigation & Microclimate Mapping',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    databaseMode: dataStore.isLiveMongo()
      ? 'MongoDB connected (app data is still served from the in-memory store)'
      : 'Embedded DataStore',
    telemetryMode: SIMULATE_TELEMETRY ? 'SIMULATED (demo)' : 'DISABLED',
    geminiKeyConfigured: Boolean((process.env.GEMINI_API_KEY || '').trim())
  });
});

// Unknown API route
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.type === 'entity.parse.failed' ? 400 : err.status || 500;
  res.status(status).json({ success: false, error: status === 500 ? 'Internal server error' : err.message });
});

// DEMO ONLY: simulated IoT telemetry (mean-reversion random walk). Disable with SIMULATE_TELEMETRY=false.
function startLiveTelemetryPulse() {
  setInterval(() => {
    const sensors = dataStore.getSensors();
    const now = Date.now();
    sensors.forEach((s) => {
      // If sensor was manually updated via POST within last 60 seconds, do not overwrite it
      if (s.lastManualUpdate && (now - s.lastManualUpdate < 60000)) {
        return;
      }

      // Mean-reversion random walk: gently pulls temperatures back toward baseline
      const baseAir = s.baseAirTemp || 38.0;
      const baseSurface = s.baseSurfaceTemp || 43.0;
      const currentAir = s.lastReading?.airTemp ?? baseAir;
      const currentSurface = s.lastReading?.surfaceTemp ?? baseSurface;

      const airPull = (baseAir - currentAir) * 0.08;
      const surfacePull = (baseSurface - currentSurface) * 0.08;

      const deltaTemp = (Math.random() - 0.5) * 0.15 + airPull;
      const deltaSurface = (Math.random() - 0.5) * 0.2 + surfacePull;
      const deltaHumidity = (Math.random() - 0.5) * 0.4 + ((s.baseHumidity || 45) - (s.lastReading?.humidity || 45)) * 0.05;
      const deltaSolar = (Math.random() - 0.5) * 5 + ((s.baseSolar || 800) - (s.lastReading?.solarRadiation || 800)) * 0.03;

      const newAirTemp = Number((currentAir + deltaTemp).toFixed(1));
      const newSurfaceTemp = Number((currentSurface + deltaSurface).toFixed(1));
      const newHumidity = Math.max(20, Math.min(95, Math.round((s.lastReading?.humidity ?? 45) + deltaHumidity)));
      const newSolar = Math.max(100, Math.round((s.lastReading?.solarRadiation ?? 800) + deltaSolar));

      dataStore.updateSensorReading(s.stationId, {
        airTemp: newAirTemp,
        surfaceTemp: newSurfaceTemp,
        humidity: newHumidity,
        solarRadiation: newSolar
      });

      const zone = dataStore.getZoneByCode(s.zoneCode);
      if (zone) {
        dataStore.updateZone(zone.code, {
          currentTemp: newAirTemp,
          surfaceTemp: newSurfaceTemp,
          humidity: newHumidity,
          solarRadiation: newSolar
        });
      }
    });
  }, 5000);
}

async function bootstrap() {
  await dataStore.init();
  if (SIMULATE_TELEMETRY) startLiveTelemetryPulse();

  app.listen(PORT, () => {
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
    console.log('================================================================');
    console.log('  Smart Urban Heat Island (UHI) & Microclimate Server Started');
    console.log(`  Listening on: http://localhost:${PORT}`);
    console.log(`  API Status: http://localhost:${PORT}/api/health`);
    console.log(`  Gemini key: ${geminiKey ? `set (${geminiKey.startsWith('AQ.') ? 'Vertex express' : 'AI Studio'} format)` : 'MISSING'}`);
    console.log('================================================================');
  });
}

bootstrap();