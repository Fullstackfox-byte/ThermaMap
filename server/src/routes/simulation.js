const express = require('express');
const router = express.Router();
const dataStore = require('server/src/db/dataStore');
const UHIEngine = require('server/src/services/uhiEngine');

// POST /api/simulation/evaluate - Evaluate mitigation scenario
router.post('/evaluate', (req, res) => {
  try {
    const {
      zoneCode,
      coolRoofIncrease = 0,
      canopyIncrease = 0,
      permeablePavementIncrease = 0,
      waterBodiesAdded = 0
    } = req.body || {};

    if (!zoneCode) {
      return res.status(400).json({ success: false, error: 'zoneCode is required' });
    }

    const zone = dataStore.getZoneByCode(zoneCode);
    if (!zone) {
      return res.status(404).json({ success: false, error: 'Target zone not found' });
    }

    const cRoof = Math.max(0, Math.min(100, Number(coolRoofIncrease) || 0));
    const canopy = Math.max(0, Math.min(100, Number(canopyIncrease) || 0));
    const perm = Math.max(0, Math.min(100, Number(permeablePavementIncrease) || 0));
    const water = Math.max(0, Math.min(20, Number(waterBodiesAdded) || 0));

    const result = UHIEngine.simulateMitigation({
      currentTemp: zone.currentTemp,
      currentSurfaceTemp: zone.surfaceTemp,
      currentAlbedo: zone.albedo,
      currentCanopy: zone.treeCanopyCoverage,
      coolRoofIncrease: cRoof,
      canopyIncrease: canopy,
      permeablePavementIncrease: perm,
      waterBodiesAdded: water,
      zoneAreaKm2: zone.areaKm2
    });

    res.json({
      success: true,
      zone: {
        code: zone.code,
        name: zone.name,
        areaKm2: zone.areaKm2
      },
      inputs: {
        coolRoofIncrease: cRoof,
        canopyIncrease: canopy,
        permeablePavementIncrease: perm,
        waterBodiesAdded: water
      },
      simulation: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/simulation/save - Save a simulation run to history
router.post('/save', (req, res) => {
  try {
    const { zoneCode, name, inputs, results } = req.body || {};

    if (!zoneCode || !dataStore.getZoneByCode(zoneCode)) {
      return res.status(400).json({ success: false, error: 'A valid zoneCode is required' });
    }

    if (!inputs || typeof inputs !== 'object' || !results || typeof results !== 'object') {
      return res.status(400).json({ success: false, error: 'inputs and results objects are required' });
    }

    const safeName = String(name || `Simulation-${zoneCode}-${Date.now()}`).slice(0, 80);

    const saved = dataStore.saveSimulation({
      zoneCode,
      name: safeName,
      inputs: {
        coolRoofIncrease: Number(inputs.coolRoofIncrease || 0),
        canopyIncrease: Number(inputs.canopyIncrease || 0),
        permeablePavementIncrease: Number(inputs.permeablePavementIncrease || 0),
        waterBodiesAdded: Number(inputs.waterBodiesAdded || 0)
      },
      results: {
        airTempDrop: Number(results.reductions?.airTempDrop || results.airTempDrop || 0),
        surfaceTempDrop: Number(results.reductions?.surfaceTempDrop || results.surfaceTempDrop || 0),
        annualEnergySavedMWh: Number(results.annualEnergySavedMWh || 0),
        totalCarbonOffsetTons: Number(results.totalCarbonOffsetTons || 0),
        annualFinancialSavingsUSD: Number(results.annualFinancialSavingsUSD || 0)
      }
    });

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/simulation/history - Get past saved simulations
router.get('/history', (req, res) => {
  try {
    const history = dataStore.getSimulations();
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
