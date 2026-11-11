const express = require('express');
const router = express.Router();
const zoneMetrics = require('server/src/services/zoneMetrics');
const ml = require('server/src/services/mlService');
const { recommendAll, recommendForZone } = require('server/src/services/recommendationEngine');

function stripPrivate(trained) {
  const { _model, _rows, ...safe } = trained;
  return safe;
}

// GET /api/ai/model - train + validate on current zone data, returns real computed metrics
router.get('/model', (req, res) => {
  try {
    const { zones } = zoneMetrics.getEnrichedZones();
    const trained = ml.trainAndValidate(zones);
    res.json({
      success: true,
      data: {
        ...stripPrivate(trained),
        correlations: ml.correlations(zones),
        dataProvenance: 'Zone attributes currently loaded in the DataStore (demo/seed unless replaced with satellite-derived values).'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ai/hotspots - statistical hotspot detection
router.get('/hotspots', (req, res) => {
  try {
    const { zones, cityMean } = zoneMetrics.getEnrichedZones();
    res.json({
      success: true,
      method: 'Z-score of LST against study-area distribution (statistical, not a trained probability model)',
      cityMeanSurfaceTemp: Number(cityMean.toFixed(2)),
      data: ml.detectHotspots(zones)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai/predict-lst - predicted LST from land-cover features (predicted, NOT observed)
router.post('/predict-lst', (req, res) => {
  try {
    const { ndvi, builtUpRatio, albedo } = req.body || {};
    const vals = [ndvi, builtUpRatio, albedo].map(Number);
    if (vals.some((v) => !Number.isFinite(v))) {
      return res.status(400).json({ success: false, error: 'ndvi, builtUpRatio and albedo must be numbers' });
    }
    if (vals[0] < -1 || vals[0] > 1 || vals[1] < 0 || vals[1] > 100 || vals[2] < 0 || vals[2] > 1) {
      return res.status(400).json({ success: false, error: 'Out of range: ndvi [-1,1], builtUpRatio [0,100], albedo [0,1]' });
    }
    const { zones } = zoneMetrics.getEnrichedZones();
    const trained = ml.trainAndValidate(zones);
    if (!trained.trained) return res.status(422).json({ success: false, error: trained.reason });
    res.json({
      success: true,
      data: {
        predictedSurfaceTempC: ml.predictLST(trained, { ndvi: vals[0], builtUpRatio: vals[1], albedo: vals[2] }),
        kind: 'PREDICTED',
        loocvRMSE: trained.metrics.loocvRMSE,
        warnings: trained.warnings
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ai/recommendations?zone=CODE
router.get('/recommendations', (req, res) => {
  try {
    const { zones } = zoneMetrics.getEnrichedZones();
    let data;
    if (req.query.zone) {
      const zone = zones.find((z) => z.code === req.query.zone);
      if (!zone) return res.status(404).json({ success: false, error: 'Zone not found' });
      data = recommendForZone(zone);
    } else {
      data = recommendAll(zones);
    }
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;