/**
 * Rule-based mitigation recommendation engine.
 * Rules are transparent thresholds (listed in `triggeredRule`), so every
 * recommendation is explainable. Expected cooling is computed with UHIEngine's
 * empirical coefficients and is labelled as a MODEL ESTIMATE, never as a measurement.
 */
const UHIEngine = require('server/src/services/uhiEngine');

function priorityFromZone(zone) {
  const score = zone.hviScore;
  if (score >= 75 || zone.utfvi > 0.02) return 'CRITICAL';
  if (score >= 55 || zone.utfvi > 0.015) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
}

function estimate(zone, inputs) {
  const sim = UHIEngine.simulateMitigation({
    currentTemp: zone.currentTemp,
    currentSurfaceTemp: zone.surfaceTemp,
    currentAlbedo: zone.albedo,
    currentCanopy: zone.treeCanopyCoverage,
    zoneAreaKm2: zone.areaKm2,
    ...inputs
  });
  return {
    airTempDropC: sim.reductions.airTempDrop,
    surfaceTempDropC: sim.reductions.surfaceTempDrop,
    annualEnergySavedMWh: sim.coBenefits.annualEnergySavedMWh,
    carbonOffsetTons: sim.coBenefits.totalCarbonOffsetTons,
    basis: 'MODEL_ESTIMATE (empirical coefficients in UHIEngine, not measured)'
  };
}

const RULES = [
  {
    type: 'TREE_PLANTATION',
    title: 'Tree plantation / urban canopy expansion',
    applies: (z) => z.treeCanopyCoverage < 15 || z.ndvi < 0.2,
    rule: 'canopy < 15% OR NDVI < 0.20',
    reason: (z) => `Canopy is only ${z.treeCanopyCoverage}% and NDVI is ${z.ndvi}; low vegetation gives little shade or evapotranspiration.`,
    inputs: () => ({ canopyIncrease: 10 }),
    assumption: '+10 percentage points canopy'
  },
  {
    type: 'COOL_ROOFS',
    title: 'Cool (high-albedo) roofs',
    applies: (z) => z.builtUpRatio > 70 && z.coolRoofCoverage < 20,
    rule: 'built-up > 70% AND cool-roof coverage < 20%',
    reason: (z) => `Built-up ratio is ${z.builtUpRatio}% with albedo ${z.albedo} and only ${z.coolRoofCoverage}% cool-roof coverage.`,
    inputs: () => ({ coolRoofIncrease: 30 }),
    assumption: '+30 percentage points cool-roof coverage'
  },
  {
    type: 'GREEN_ROOFS',
    title: 'Green roofs on dense buildings',
    applies: (z) => z.builtUpRatio > 80 && z.treeCanopyCoverage < 10,
    rule: 'built-up > 80% AND canopy < 10% (no ground space for trees)',
    reason: (z) => `Built-up ratio ${z.builtUpRatio}% leaves little ground for trees (canopy ${z.treeCanopyCoverage}%), so rooftop vegetation is the practical option.`,
    inputs: () => ({ canopyIncrease: 5, coolRoofIncrease: 10 }),
    assumption: '+5 pp canopy-equivalent and +10 pp reflective roof'
  },
  {
    type: 'REFLECTIVE_PERMEABLE_PAVEMENT',
    title: 'Reflective / permeable road and pavement surfaces',
    applies: (z) => z.builtUpRatio > 60 && z.permeablePavementCoverage < 10,
    rule: 'built-up > 60% AND permeable pavement < 10%',
    reason: (z) => `Only ${z.permeablePavementCoverage}% of surfaces are permeable in a ${z.builtUpRatio}% built-up zone.`,
    inputs: () => ({ permeablePavementIncrease: 20 }),
    assumption: '+20 pp permeable / reflective pavement'
  },
  {
    type: 'WATER_SENSITIVE_PLANNING',
    title: 'Water-sensitive urban design (ponds, misting, bioswales)',
    applies: (z) => z.ndvi < 0.15 && z.windSpeed < 2.5,
    rule: 'NDVI < 0.15 AND wind speed < 2.5 m/s',
    reason: (z) => `Low vegetation (NDVI ${z.ndvi}) with weak ventilation (${z.windSpeed} m/s) traps heat; evaporative features help.`,
    inputs: () => ({ waterBodiesAdded: 2 }),
    assumption: '2 water / misting features'
  }
];

function recommendForZone(zone) {
  const priority = priorityFromZone(zone);
  return RULES.filter((r) => r.applies(zone)).map((r) => ({
    zoneCode: zone.code,
    zoneName: zone.name,
    type: r.type,
    title: r.title,
    priority,
    reason: r.reason(zone),
    triggeredRule: r.rule,
    assumption: r.assumption,
    expectedBenefit: estimate(zone, r.inputs()),
    supportingData: {
      surfaceTemp: zone.surfaceTemp,
      uhiIntensity: zone.uhiIntensity,
      utfvi: zone.utfvi,
      hviScore: zone.hviScore,
      ndvi: zone.ndvi,
      builtUpRatio: zone.builtUpRatio,
      treeCanopyCoverage: zone.treeCanopyCoverage,
      albedo: zone.albedo
    }
  }));
}

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function recommendAll(zones) {
  return zones
    .flatMap(recommendForZone)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.supportingData.hviScore - a.supportingData.hviScore);
}

module.exports = { recommendForZone, recommendAll };