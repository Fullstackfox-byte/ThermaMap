const express = require('express');
const router = express.Router();
const dataStore = require('server/src/db/dataStore');
const { getEnrichedZones, enrichZone, meanSurfaceTemp } = require('server/src/services/zoneMetrics');

// GET /api/zones - Get all microclimate zones with calculated metrics
router.get('/', (req, res) => {
  try {
    const { cityMean, zones } = getEnrichedZones();
    res.json({
      success: true,
      count: zones.length,
      cityMeanSurfaceTemp: Number(cityMean.toFixed(2)),
      data: zones
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/zones/:code - Get single zone details
router.get('/:code', (req, res) => {
  try {
    const rawZone = dataStore.getZoneByCode(req.params.code);
    if (!rawZone) {
      return res.status(404).json({ success: false, error: 'Zone not found' });
    }

    const allZones = dataStore.getZones();
    const cityMean = meanSurfaceTemp(allZones);
    const enriched = enrichZone(rawZone, cityMean);

    // Associated sensors & mitigation projects
    const sensors = dataStore.getSensors().filter(s => s.zoneCode === enriched.code);
    const projects = dataStore.getMitigationProjects().filter(p => p.zoneCode === enriched.code);
    const activeAlerts = dataStore.getAlerts().filter(a => a.zoneCode === enriched.code && a.active);

    res.json({
      success: true,
      data: {
        ...enriched,
        sensors,
        projects,
        activeAlerts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
