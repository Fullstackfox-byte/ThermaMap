const express = require('express');
const router = express.Router();
const dataStore = require('../db/dataStore');
const { requireAuth, requireRole } = require('../middleware/auth');

const VALID_INTERVENTIONS = [
  'COOL_ROOFS',
  'URBAN_FORESTRY_CANOPY',
  'PERMEABLE_COOL_PAVEMENTS',
  'BLUE_INFRASTRUCTURE',
  'GREEN_CORRIDORS'
];

const VALID_STATUSES = ['PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS', 'IMPLEMENTED'];

// In-memory rate limiting map for votes (ip:projectId -> lastVoteTimestamp)
const recentVotes = new Map();

// GET /api/mitigation/projects - List all projects
router.get('/projects', (req, res) => {
  try {
    const projects = dataStore.getMitigationProjects();
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/mitigation/projects - Create/propose project
router.post('/projects', (req, res) => {
  try {
    const {
      title,
      zoneCode,
      interventionType,
      targetCoveragePercent,
      estimatedBudget,
      projectedTempReduction,
      projectedEnergySavingsMWh,
      projectedCarbonOffsetTons,
      description
    } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Project title is required' });
    }

    if (!zoneCode || !dataStore.getZoneByCode(zoneCode)) {
      return res.status(400).json({ success: false, error: `Invalid zoneCode: ${zoneCode}. Zone does not exist.` });
    }

    if (!interventionType || !VALID_INTERVENTIONS.includes(interventionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid interventionType. Allowed types: ${VALID_INTERVENTIONS.join(', ')}`
      });
    }

    const coverage = targetCoveragePercent !== undefined && Number.isFinite(Number(targetCoveragePercent))
      ? Math.max(1, Math.min(100, Number(targetCoveragePercent)))
      : 15;
    const budget = estimatedBudget !== undefined && Number.isFinite(Number(estimatedBudget))
      ? Math.max(0, Number(estimatedBudget))
      : 50000;
    const tempDrop = projectedTempReduction !== undefined && Number.isFinite(Number(projectedTempReduction))
      ? Math.max(0.1, Math.min(10, Number(projectedTempReduction)))
      : 1.2;
    const energySaved = projectedEnergySavingsMWh !== undefined && Number.isFinite(Number(projectedEnergySavingsMWh))
      ? Math.max(0, Number(projectedEnergySavingsMWh))
      : Math.round(tempDrop * 140);
    const carbonOffset = projectedCarbonOffsetTons !== undefined && Number.isFinite(Number(projectedCarbonOffsetTons))
      ? Math.max(0, Number(projectedCarbonOffsetTons))
      : Math.round(energySaved * 0.82);

    const created = dataStore.addMitigationProject({
      title: title.trim().slice(0, 100),
      zoneCode,
      interventionType,
      targetCoveragePercent: coverage,
      estimatedBudget: budget,
      projectedTempReduction: tempDrop,
      projectedEnergySavingsMWh: energySaved,
      projectedCarbonOffsetTons: carbonOffset,
      status: 'PROPOSED',
      description: description ? String(description).slice(0, 500) : 'Community proposed urban microclimate cooling initiative.'
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/mitigation/projects/:id/vote - Endorse/vote for project (rate-limited against spam)
router.post('/projects/:id/vote', (req, res) => {
  try {
    const projectId = req.params.id;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local';
    const voteKey = `${clientIp}:${projectId}`;
    const now = Date.now();

    // Limit to 1 vote per IP per project every 60 seconds
    const lastVote = recentVotes.get(voteKey) || 0;
    if (now - lastVote < 60000) {
      return res.status(429).json({
        success: false,
        error: 'You have already voted for this project recently. Please wait a moment.'
      });
    }

    const updated = dataStore.voteMitigationProject(projectId);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    recentVotes.set(voteKey, now);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/mitigation/projects/:id/status - Update project status (requires Admin authentication)
router.patch('/projects/:id/status', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }
    const updated = dataStore.updateProjectStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;