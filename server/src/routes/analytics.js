const express = require('express');
const router = express.Router();
const dataStore = require('server/src/db/dataStore');
const { getEnrichedZones } = require('server/src/services/zoneMetrics');

// GET /api/analytics/diurnal - 24-Hour Diurnal Temperature Profile
router.get('/diurnal', (req, res) => {
  try {
    const diurnalData = [
      { time: '00:00', ruralTemp: 26.2, urbanCbdTemp: 33.1, industrialTemp: 34.0, mitigatedTemp: 29.8, uhiDelta: 6.9 },
      { time: '02:00', ruralTemp: 24.8, urbanCbdTemp: 31.9, industrialTemp: 32.5, mitigatedTemp: 28.3, uhiDelta: 7.1 },
      { time: '04:00', ruralTemp: 23.9, urbanCbdTemp: 30.6, industrialTemp: 31.2, mitigatedTemp: 27.1, uhiDelta: 6.7 },
      { time: '06:00', ruralTemp: 24.5, urbanCbdTemp: 29.8, industrialTemp: 30.4, mitigatedTemp: 26.8, uhiDelta: 5.3 },
      { time: '08:00', ruralTemp: 28.0, urbanCbdTemp: 32.5, industrialTemp: 33.8, mitigatedTemp: 29.9, uhiDelta: 4.5 },
      { time: '10:00', ruralTemp: 31.2, urbanCbdTemp: 36.2, industrialTemp: 38.0, mitigatedTemp: 33.4, uhiDelta: 5.0 },
      { time: '12:00', ruralTemp: 33.5, urbanCbdTemp: 38.9, industrialTemp: 40.8, mitigatedTemp: 35.8, uhiDelta: 5.4 },
      { time: '14:00', ruralTemp: 34.2, urbanCbdTemp: 40.5, industrialTemp: 42.6, mitigatedTemp: 37.1, uhiDelta: 6.3 },
      { time: '16:00', ruralTemp: 33.8, urbanCbdTemp: 40.1, industrialTemp: 42.2, mitigatedTemp: 36.8, uhiDelta: 6.3 },
      { time: '18:00', ruralTemp: 31.4, urbanCbdTemp: 38.2, industrialTemp: 39.8, mitigatedTemp: 34.9, uhiDelta: 6.8 },
      { time: '20:00', ruralTemp: 28.9, urbanCbdTemp: 36.4, industrialTemp: 37.6, mitigatedTemp: 32.8, uhiDelta: 7.5 },
      { time: '22:00', ruralTemp: 27.4, urbanCbdTemp: 34.7, industrialTemp: 35.8, mitigatedTemp: 31.2, uhiDelta: 7.3 }
    ];

    res.json({
      success: true,
      description: "24-hour diurnal thermal progression highlighting nighttime thermal inertia and canopy/albedo mitigation effects",
      data: diurnalData
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/correlations - NDVI vs Temp, Albedo vs UTFVI
router.get('/correlations', (req, res) => {
  try {
    const { zones } = getEnrichedZones();

    const correlationPoints = zones.map(z => ({
      zoneName: z.name,
      zoneCode: z.code,
      ndvi: z.ndvi,
      albedo: z.albedo,
      surfaceTemp: z.surfaceTemp,
      currentTemp: z.currentTemp,
      treeCanopyCoverage: z.treeCanopyCoverage,
      utfvi: z.utfvi
    }));

    res.json({
      success: true,
      data: correlationPoints
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/rankings - Zones sorted by Heat Vulnerability Index
router.get('/rankings', (req, res) => {
  try {
    const { zones } = getEnrichedZones();

    const ranked = zones.map(zone => ({
      code: zone.code,
      name: zone.name,
      category: zone.category,
      currentTemp: zone.currentTemp,
      surfaceTemp: zone.surfaceTemp,
      uhiIntensity: zone.uhiIntensity,
      utfvi: zone.utfvi,
      ecologicalGrade: zone.ecologicalGrade,
      hviScore: zone.hviScore,
      riskCategory: zone.riskCategory,
      hviComponents: zone.hviComponents
    })).sort((a, b) => b.hviScore - a.hviScore); // Highest vulnerability first

    res.json({ success: true, count: ranked.length, data: ranked });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/summary - High-level Executive KPIs
router.get('/summary', (req, res) => {
  try {
    const zones = dataStore.getZones();
    const sensors = dataStore.getSensors();
    const projects = dataStore.getMitigationProjects();
    const alerts = dataStore.getAlerts().filter(a => a.active);

    const hasZones = zones.length > 0;
    const totalArea = zones.reduce((acc, z) => acc + (z.areaKm2 || 0), 0);
    const avgUrbanTemp = hasZones ? (zones.reduce((acc, z) => acc + (z.currentTemp || 0), 0) / zones.length) : 0;
    const avgSurfaceTemp = hasZones ? (zones.reduce((acc, z) => acc + (z.surfaceTemp || 0), 0) / zones.length) : 0;
    const ruralBase = zones[0]?.ruralBaselineTemp || 31.8;
    const peakUHI = hasZones ? Math.max(...zones.map(z => (z.currentTemp || 0) - (z.ruralBaselineTemp || 31.8))) : 0;

    const totalProjectedCarbonOffset = projects.reduce((acc, p) => acc + (p.projectedCarbonOffsetTons || 0), 0);
    const totalProjectedEnergySavings = projects.reduce((acc, p) => acc + (p.projectedEnergySavingsMWh || 0), 0);
    const totalMitigationBudget = projects.reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);

    res.json({
      success: true,
      data: {
        totalMonitoredAreaKm2: Number(totalArea.toFixed(1)),
        activeIoTStationsCount: sensors.filter(s => s.status === 'ONLINE').length,
        avgCityAirTemp: Number(avgUrbanTemp.toFixed(1)),
        avgCitySurfaceTemp: Number(avgSurfaceTemp.toFixed(1)),
        ruralBaselineTemp: ruralBase,
        peakUHIIntensityDeltaT: Number(peakUHI.toFixed(1)),
        activeHeatAlertsCount: alerts.length,
        mitigationProjectsCount: projects.length,
        totalProjectedCarbonOffsetTons: totalProjectedCarbonOffset,
        totalProjectedEnergySavingsMWh: totalProjectedEnergySavings,
        totalMitigationInvestmentUSD: totalMitigationBudget,
        databaseMode: dataStore.isLiveMongo() ? 'MongoDB (Live Atlas/Local)' : 'High-Performance Embedded In-Memory Store'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
