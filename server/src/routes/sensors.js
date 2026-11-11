const express = require('express');
const router = express.Router();
const dataStore = require('../db/dataStore');

// GET /api/sensors - List all IoT sensor stations
router.get('/', (req, res) => {
  try {
    const sensors = dataStore.getSensors();
    res.json({
      success: true,
      count: sensors.length,
      data: sensors
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sensors/:id - Single sensor
router.get('/:id', (req, res) => {
  try {
    const sensor = dataStore.getSensorById(req.params.id);
    if (!sensor) {
      return res.status(404).json({ success: false, error: 'Sensor station not found' });
    }
    res.json({ success: true, data: sensor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sensors/:id/telemetry - Ingest real or simulated sensor telemetry
router.post('/:id/telemetry', (req, res) => {
  try {
    const sensor = dataStore.getSensorById(req.params.id);
    if (!sensor) {
      return res.status(404).json({ success: false, error: 'Sensor station not found' });
    }

    const prev = sensor.lastReading || {};
    const { airTemp, surfaceTemp, humidity, windSpeed, solarRadiation, pm25 } = req.body || {};

    // Validate and safely cast to numbers with fallback to current reading
    const airTempNum = airTemp !== undefined && Number.isFinite(Number(airTemp)) ? Number(airTemp) : prev.airTemp ?? 35.0;
    const surfaceTempNum = surfaceTemp !== undefined && Number.isFinite(Number(surfaceTemp)) ? Number(surfaceTemp) : prev.surfaceTemp ?? 40.0;
    const humidityNum = humidity !== undefined && Number.isFinite(Number(humidity)) ? Math.max(0, Math.min(100, Number(humidity))) : prev.humidity ?? 50;
    const windSpeedNum = windSpeed !== undefined && Number.isFinite(Number(windSpeed)) ? Math.max(0, Number(windSpeed)) : prev.windSpeed ?? 2.0;
    const solarRadiationNum = solarRadiation !== undefined && Number.isFinite(Number(solarRadiation)) ? Math.max(0, Number(solarRadiation)) : prev.solarRadiation ?? 600;
    const pm25Num = pm25 !== undefined && Number.isFinite(Number(pm25)) ? Math.max(0, Number(pm25)) : prev.pm25 ?? 50;

    // Heat Index calculation with guaranteed numbers
    let heatIndex = airTempNum;
    if (airTempNum >= 27 && humidityNum >= 40) {
      const vaporPressure = 6.11 * Math.exp(5417.7530 * ((1 / 273.16) - (1 / (273.15 + airTempNum)))) * (humidityNum / 100);
      heatIndex = Number((airTempNum + (0.5555 * (vaporPressure - 10))).toFixed(1));
    }

    const updated = dataStore.updateSensorReading(req.params.id, {
      airTemp: airTempNum,
      surfaceTemp: surfaceTempNum,
      humidity: humidityNum,
      windSpeed: windSpeedNum,
      solarRadiation: solarRadiationNum,
      pm25: pm25Num,
      heatIndex
    });

    if (updated) {
      updated.lastManualUpdate = Date.now();
    }

    // Also update parent zone current temperatures
    const zone = dataStore.getZoneByCode(sensor.zoneCode);
    if (zone) {
      dataStore.updateZone(zone.code, {
        currentTemp: airTempNum,
        surfaceTemp: surfaceTempNum,
        humidity: humidityNum,
        windSpeed: windSpeedNum
      });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;