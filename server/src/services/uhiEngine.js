/**
 * Smart Urban Heat Island (UHI) & Microclimate Calculation Engine
 * 
 * Based on empirical urban energy balance models, Oke's boundary layer formulations,
 * and standard remote sensing indices (LST, NDVI, UTFVI, HVI).
 */

class UHIEngine {
  /**
   * Calculates Urban Heat Island Intensity (ΔT)
   * @param {number} urbanTemp - Air temperature in urban zone (°C)
   * @param {number} ruralBaseline - Reference rural baseline air temperature (°C)
   * @returns {number} UHI Intensity (°C)
   */
  static calculateUHIIntensity(urbanTemp, ruralBaseline) {
    return Number((urbanTemp - ruralBaseline).toFixed(2));
  }

  /**
   * Calculates Urban Thermal Field Variance Index (UTFVI)
   * UTFVI = (Ts - Tmean) / Tmean
   * Used to quantitatively classify localized thermal stress and ecological quality.
   * 
   * Classification thresholds:
   *  UTFVI < 0       : None / Cool (Excellent)
   *  0.000 - 0.005   : Weak (Good)
   *  0.005 - 0.010   : Moderate (Normal)
   *  0.010 - 0.015   : Strong (Bad)
   *  0.015 - 0.020   : Strongest (Worse)
   *  > 0.020         : Extreme (Worst)
   * 
   * @param {number} surfaceTemp - Land Surface Temperature (°C)
   * @param {number} meanCitySurfaceTemp - Average city surface temperature (°C)
   */
  static calculateUTFVI(surfaceTemp, meanCitySurfaceTemp) {
    // In Kelvin for physical thermodynamics consistency
    const tsK = surfaceTemp + 273.15;
    const tMeanK = meanCitySurfaceTemp + 273.15;
    const utfvi = (tsK - tMeanK) / tMeanK;

    let classification = "None";
    let ecologicalGrade = "Excellent";

    if (utfvi < 0) {
      classification = "None (Cool Haven)";
      ecologicalGrade = "Excellent";
    } else if (utfvi <= 0.005) {
      classification = "Weak Thermal Anomaly";
      ecologicalGrade = "Good";
    } else if (utfvi <= 0.010) {
      classification = "Moderate Thermal Stress";
      ecologicalGrade = "Normal";
    } else if (utfvi <= 0.015) {
      classification = "Strong Heat Island";
      ecologicalGrade = "Bad";
    } else if (utfvi <= 0.020) {
      classification = "Very Strong Heat Island";
      ecologicalGrade = "Worse";
    } else {
      classification = "Extreme Severe Microclimate";
      ecologicalGrade = "Critical / Hazard";
    }

    return {
      utfvi: Number(utfvi.toFixed(4)),
      classification,
      ecologicalGrade
    };
  }

  /**
   * Calculates Heat Vulnerability Index (HVI) [0 - 100 Scale]
   * Synthesizes Hazard (Surface Temp + UTFVI), Exposure (Population Density),
   * Sensitivity (Elderly Proportion), and Adaptive Capacity (Canopy Deficit + Albedo Deficit).
   */
  static calculateHVI({ surfaceTemp, elderlyRatio, populationDensity, treeCanopyCoverage, albedo }) {
    // Thermal hazard score (0 - 40 pts)
    const thermalHazard = Math.min(40, Math.max(0, (surfaceTemp - 28) * 2.5));

    // Exposure score (0 - 20 pts) based on density (up to 25,000 / km²)
    const exposure = Math.min(20, (populationDensity / 25000) * 20);

    // Demographic sensitivity (0 - 20 pts) based on elderly percentage (up to 30%)
    const sensitivity = Math.min(20, (elderlyRatio / 30) * 20);

    // Lack of adaptive capacity (0 - 20 pts): low canopy & low albedo
    const canopyDeficit = (1 - (treeCanopyCoverage / 100)) * 10;
    const albedoDeficit = (1 - albedo) * 10;
    const adaptiveLack = canopyDeficit + albedoDeficit;

    const totalHVI = Math.min(100, Math.max(0, thermalHazard + exposure + sensitivity + adaptiveLack));

    let riskCategory = "Low";
    if (totalHVI > 75) riskCategory = "Critical";
    else if (totalHVI > 55) riskCategory = "High";
    else if (totalHVI > 35) riskCategory = "Moderate";

    return {
      score: Math.round(totalHVI),
      riskCategory,
      components: {
        thermalHazard: Number(thermalHazard.toFixed(1)),
        exposure: Number(exposure.toFixed(1)),
        sensitivity: Number(sensitivity.toFixed(1)),
        adaptiveDeficit: Number(adaptiveLack.toFixed(1))
      }
    };
  }

  /**
   * Run Physics-Informed What-If Mitigation Scenario Simulation
   * Evaluates the thermal, energy, and carbon impact of urban interventions.
   * 
   * Interventions:
   * @param {object} params
   * @param {number} params.currentTemp - Baseline zone air temperature (°C)
   * @param {number} params.currentSurfaceTemp - Baseline surface temperature (°C)
   * @param {number} params.currentAlbedo - Current surface albedo (0.05 - 0.90)
   * @param {number} params.currentCanopy - Current tree canopy coverage (%)
   * @param {number} params.coolRoofIncrease - Additional cool roof coverage (%)
   * @param {number} params.canopyIncrease - Additional urban canopy coverage (%)
   * @param {number} params.permeablePavementIncrease - Permeable pavement coverage (%)
   * @param {number} params.waterBodiesAdded - Water/misting features count
   * @param {number} params.zoneAreaKm2 - Zone land area in km²
   */
  static simulateMitigation(params) {
    const {
      currentTemp,
      currentSurfaceTemp,
      currentAlbedo = 0.15,
      currentCanopy = 10,
      coolRoofIncrease = 0,
      canopyIncrease = 0,
      permeablePavementIncrease = 0,
      waterBodiesAdded = 0,
      zoneAreaKm2 = 2.5
    } = params;

    // Sanitize and bound inputs to prevent unphysical calculations
    const safeCoolRoof = Math.max(0, Math.min(100, Number(coolRoofIncrease) || 0));
    const maxCanopyAddition = Math.max(0, 85 - currentCanopy);
    const safeCanopyIncrease = Math.max(0, Math.min(maxCanopyAddition, Number(canopyIncrease) || 0));
    const safePermeable = Math.max(0, Math.min(100, Number(permeablePavementIncrease) || 0));
    const safeWaterBodies = Math.max(0, Math.min(20, Number(waterBodiesAdded) || 0));

    // 1. Albedo modification cooling effect:
    // Typical high-albedo roof increases effective surface albedo by ~0.55 on treated area.
    // Every 0.1 increase in city-wide albedo yields approx 0.5°C to 0.8°C ambient air temp reduction.
    const albedoDeltaEffective = (safeCoolRoof / 100) * 0.55 * 0.4; // 40% roof surface proportion
    const tempDropAlbedo = albedoDeltaEffective * 6.5; 

    // 2. Vegetative Canopy cooling effect (Evapotranspiration + Solar Interception):
    // Standard rule: ~0.042°C ambient air temperature reduction per +1% tree canopy increase.
    const tempDropCanopy = safeCanopyIncrease * 0.042;

    // 3. Permeable / Cool Pavements:
    // Evaporative moisture release and lower thermal mass.
    const tempDropPavement = safePermeable * 0.018;

    // 4. Blue Infrastructure (Water Fountains / Micro-wetlands):
    // Localized evaporative cooling corridor effect (~0.25°C per installed installation up to 1.2°C cap).
    const tempDropWater = Math.min(1.2, safeWaterBodies * 0.25);

    // Total Net Air Temperature Reduction (°C), physically capped at max 7.5°C
    const rawTotalReduction = tempDropAlbedo + tempDropCanopy + tempDropPavement + tempDropWater;
    const totalTempReduction = Number(Math.min(7.5, rawTotalReduction).toFixed(2));
    
    // Surface temperature drops even more significantly (typically 1.8x to 2.5x of air temp drop)
    const surfaceTempReduction = Number((totalTempReduction * 2.1).toFixed(2));

    const simulatedAirTemp = Number((currentTemp - totalTempReduction).toFixed(2));
    const simulatedSurfaceTemp = Number((currentSurfaceTemp - surfaceTempReduction).toFixed(2));

    // Simulated new albedo & canopy
    const simulatedAlbedo = Number(Math.min(0.85, currentAlbedo + albedoDeltaEffective).toFixed(2));
    const simulatedCanopy = Math.min(85, currentCanopy + safeCanopyIncrease);

    // Quantified Socio-Economic & Environmental Co-benefits:
    // Cooling Energy Savings:
    // Approx 4.8% reduction in HVAC electric consumption per 1°C ambient drop.
    // Average urban commercial/residential building density consumes ~120,000 kWh/km²/day in summer.
    const summerDays = 120;
    const baseDailyKWh = zoneAreaKm2 * 110000;
    const energyReductionPercent = Math.min(30, totalTempReduction * 4.8);
    const annualEnergySavedMWh = Math.round((baseDailyKWh * (energyReductionPercent / 100) * summerDays) / 1000);

    // Carbon Offset:
    // Grid electricity emission factor ~0.82 kg CO2 / kWh + Tree carbon sequestration (approx 22 kg CO2 / mature tree / yr)
    const treeCountEstimate = Math.round((canopyIncrease / 100) * zoneAreaKm2 * 1000000 / 30); // ~1 tree per 30m² canopy
    const treeSequestrationTons = (treeCountEstimate * 22) / 1000;
    const avoidedPowerEmissionsTons = (annualEnergySavedMWh * 1000 * 0.82) / 1000;
    const totalCarbonOffsetTons = Math.round(treeSequestrationTons + avoidedPowerEmissionsTons);

    // Estimated Financial ROI (Assuming $0.12 or ₹8.5 / kWh electricity cost)
    const annualFinancialSavingsUSD = Math.round(annualEnergySavedMWh * 1000 * 0.12);

    return {
      baseline: {
        airTemp: currentTemp,
        surfaceTemp: currentSurfaceTemp,
        albedo: currentAlbedo,
        canopyPercent: currentCanopy
      },
      simulated: {
        airTemp: simulatedAirTemp,
        surfaceTemp: simulatedSurfaceTemp,
        albedo: simulatedAlbedo,
        canopyPercent: simulatedCanopy
      },
      reductions: {
        airTempDrop: totalTempReduction,
        surfaceTempDrop: surfaceTempReduction,
        breakdown: {
          coolRoofContribution: Number(tempDropAlbedo.toFixed(2)),
          canopyContribution: Number(tempDropCanopy.toFixed(2)),
          permeablePavementContribution: Number(tempDropPavement.toFixed(2)),
          blueInfrastructureContribution: Number(tempDropWater.toFixed(2))
        }
      },
      coBenefits: {
        energySavingsPercent: Number(energyReductionPercent.toFixed(1)),
        annualEnergySavedMWh,
        totalCarbonOffsetTons,
        annualFinancialSavingsUSD,
        estimatedTreesPlanted: treeCountEstimate
      }
    };
  }
}

module.exports = UHIEngine;
