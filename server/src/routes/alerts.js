const express = require('express');
const router = express.Router();
const dataStore = require('../db/dataStore');

const VALID_SEVERITIES = ['Advisory', 'Watch', 'Warning', 'Emergency'];

// GET /api/alerts - Get all heat alerts (optional query ?active=true)
router.get('/', (req, res) => {
  try {
    let alerts = dataStore.getAlerts();
    if (req.query.active === 'true') {
      alerts = alerts.filter(a => a.active);
    }
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/alerts - Trigger a new advisory/warning
router.post('/', (req, res) => {
  try {
    const { severity, zoneCode, title, description, advisories } = req.body || {};
    if (!severity || !zoneCode || !title) {
      return res.status(400).json({ success: false, error: 'severity, zoneCode, and title are required' });
    }

    if (!VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({
        success: false,
        error: `Invalid severity: ${severity}. Must be one of: ${VALID_SEVERITIES.join(', ')}`
      });
    }

    if (!dataStore.getZoneByCode(zoneCode)) {
      return res.status(400).json({
        success: false,
        error: `Zone '${zoneCode}' does not exist.`
      });
    }

    const safeAdvisories = Array.isArray(advisories)
      ? advisories.filter(a => typeof a === 'string' && a.trim().length > 0)
      : (typeof advisories === 'string' && advisories.trim() ? [advisories.trim()] : []);

    const created = dataStore.addAlert({
      severity,
      zoneCode,
      title: String(title).trim().slice(0, 120),
      description: description ? String(description).slice(0, 500) : '',
      advisories: safeAdvisories.length > 0 ? safeAdvisories : ['Stay hydrated and seek shaded or air-conditioned environments.']
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/alerts/:id/resolve - Mark alert as resolved
router.patch('/:id/resolve', (req, res) => {
  try {
    const resolved = dataStore.resolveAlert(req.params.id);
    if (!resolved) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, data: resolved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;