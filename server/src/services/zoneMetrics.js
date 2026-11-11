const dataStore = require('server/src/db/dataStore');
const UHIEngine = require('server/src/services/uhiEngine');

function meanSurfaceTemp(zones) {
  if (!zones.length) return 0;
  return zones.reduce((acc, z) => acc + z.surfaceTemp, 0) / zones.length;
}

function enrichZone(zone, cityMean) {
  const uhiIntensity = UHIEngine.calculateUHIIntensity(zone.currentTemp, zone.ruralBaselineTemp);
  const utfviData = UHIEngine.calculateUTFVI(zone.surfaceTemp, cityMean);
  const hviData = UHIEngine.calculateHVI({
    surfaceTemp: zone.surfaceTemp,
    elderlyRatio: zone.elderlyRatio,
    populationDensity: zone.populationDensity,
    treeCanopyCoverage: zone.treeCanopyCoverage,
    albedo: zone.albedo
  });
  return {
    ...zone,
    uhiIntensity,
    utfvi: utfviData.utfvi,
    utfviClass: utfviData.classification,
    ecologicalGrade: utfviData.ecologicalGrade,
    hviScore: hviData.score,
    riskCategory: hviData.riskCategory,
    hviComponents: hviData.components
  };
}

function getEnrichedZones() {
  const zones = dataStore.getZones();
  const cityMean = meanSurfaceTemp(zones);
  return { cityMean, zones: zones.map((z) => enrichZone(z, cityMean)) };
}

module.exports = { meanSurfaceTemp, enrichZone, getEnrichedZones };