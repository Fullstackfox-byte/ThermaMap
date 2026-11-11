import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Flame, 
  Trees, 
  Sun, 
  Droplet, 
  Zap, 
  DollarSign, 
  CheckCircle, 
  Save, 
  RefreshCw, 
  ArrowRight,
  TrendingDown,
  Building
} from 'lucide-react';
import { api } from '../services/api';

export default function MitigationSimulator({ zones, selectedZone, onProjectCreated }) {
  const [currentZoneCode, setCurrentZoneCode] = useState(
    selectedZone ? selectedZone.code : (zones[0]?.code || 'IND-SEC9')
  );

  // Intervention Sliders
  const [coolRoofIncrease, setCoolRoofIncrease] = useState(30);
  const [canopyIncrease, setCanopyIncrease] = useState(25);
  const [permeablePavementIncrease, setPermeablePavementIncrease] = useState(20);
  const [waterBodiesAdded, setWaterBodiesAdded] = useState(3);

  // State
  const [simulationResult, setSimulationResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Find active zone object
  const activeZone = zones.find(z => z.code === currentZoneCode) || zones[0];

  // Sync when selectedZone prop changes from map click (official React pattern for adjusting state from props)
  const [prevSelectedCode, setPrevSelectedCode] = useState(selectedZone?.code);
  if (selectedZone && selectedZone.code !== prevSelectedCode) {
    setPrevSelectedCode(selectedZone.code);
    setCurrentZoneCode(selectedZone.code);
  }

  // Evaluate whenever inputs change
  useEffect(() => {
    if (!currentZoneCode) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      setIsEvaluating(true);
      api.evaluateMitigation({
        zoneCode: currentZoneCode,
        coolRoofIncrease: Number(coolRoofIncrease),
        canopyIncrease: Number(canopyIncrease),
        permeablePavementIncrease: Number(permeablePavementIncrease),
        waterBodiesAdded: Number(waterBodiesAdded)
      })
      .then(res => {
        if (isMounted && res.success) {
          setSimulationResult(res.simulation);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsEvaluating(false);
      });
    }, 150); // slight debounce for smooth dragging

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentZoneCode, coolRoofIncrease, canopyIncrease, permeablePavementIncrease, waterBodiesAdded]);

  // Reset to default
  const handleReset = () => {
    setCoolRoofIncrease(0);
    setCanopyIncrease(0);
    setPermeablePavementIncrease(0);
    setWaterBodiesAdded(0);
  };

  // Preset scenarios
  const applyPreset = (presetName) => {
    if (presetName === 'aggressive_green') {
      setCoolRoofIncrease(20);
      setCanopyIncrease(40);
      setPermeablePavementIncrease(15);
      setWaterBodiesAdded(4);
    } else if (presetName === 'cool_roofs_max') {
      setCoolRoofIncrease(60);
      setCanopyIncrease(15);
      setPermeablePavementIncrease(10);
      setWaterBodiesAdded(1);
    } else if (presetName === 'balanced') {
      setCoolRoofIncrease(30);
      setCanopyIncrease(25);
      setPermeablePavementIncrease(20);
      setWaterBodiesAdded(3);
    }
  };

  // Save as project proposal
  const handleSaveAsProposal = async () => {
    if (!simulationResult) return;
    setIsSaving(true);
    try {
      const budgetEstimate = Math.round(
        (coolRoofIncrease * 1200) + 
        (canopyIncrease * 1800) + 
        (permeablePavementIncrease * 900) + 
        (waterBodiesAdded * 4000)
      );

      const payload = {
        title: `${activeZone?.name} Integrated Thermal Mitigation Plan`,
        zoneCode: currentZoneCode,
        interventionType: 'INTEGRATED_MITIGATION',
        targetCoveragePercent: Math.round((coolRoofIncrease + canopyIncrease) / 2),
        estimatedBudget: budgetEstimate,
        projectedTempReduction: simulationResult.reductions.airTempDrop,
        projectedEnergySavingsMWh: simulationResult.coBenefits.annualEnergySavedMWh,
        projectedCarbonOffsetTons: simulationResult.coBenefits.totalCarbonOffsetTons,
        description: `Physics-informed mitigation proposal: +${coolRoofIncrease}% Cool Roofs, +${canopyIncrease}% Urban Canopy, +${permeablePavementIncrease}% Permeable Pavement, and ${waterBodiesAdded} micro-water features.`
      };

      const res = await api.createProject(payload);
      if (res.success) {
        setSaveSuccessMessage('Mitigation proposal successfully recorded and submitted to municipal ledger!');
        if (onProjectCreated) onProjectCreated();
        setTimeout(() => setSaveSuccessMessage(null), 4500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Zone Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  UHI Mitigation Digital Twin & Scenario Simulator
                </h2>
                <p className="text-xs text-slate-400">
                  Simulate urban microclimate cooling interventions using empirical energy balance equations
                </p>
              </div>
            </div>
          </div>

          {/* Zone Selector Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-400">Target Urban Zone:</span>
            <select
              value={currentZoneCode}
              onChange={(e) => setCurrentZoneCode(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-rose-500"
            >
              {zones.map((z) => (
                <option key={z.code} value={z.code}>
                  {z.name} ({z.code} - LST: {z.surfaceTemp}°C)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Intervention Presets:</span>
            <button
              onClick={() => applyPreset('balanced')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition"
            >
              Balanced Urban Cool
            </button>
            <button
              onClick={() => applyPreset('aggressive_green')}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs border border-emerald-800/60 transition"
            >
              Maximum Green Canopy
            </button>
            <button
              onClick={() => applyPreset('cool_roofs_max')}
              className="px-2.5 py-1 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 text-xs border border-sky-800/60 transition"
            >
              High-Albedo Roofs
            </button>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Sliders</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sliders on Left, Live Computed Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Column */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rose-400" />
            <span>Intervention Parameters for {activeZone?.code}</span>
          </h3>

          {/* Slider 1: Cool Roofs */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                <Sun className="w-4 h-4" /> High-Albedo Cool Roof Retrofit
              </span>
              <span className="font-mono text-white bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/30">
                +{coolRoofIncrease}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="70"
              step="5"
              value={coolRoofIncrease}
              onChange={(e) => setCoolRoofIncrease(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Baseline α={activeZone?.albedo})</span>
              <span>35% Target</span>
              <span>70% Full Commercial Retrofit</span>
            </div>
          </div>

          {/* Slider 2: Urban Tree Canopy */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <Trees className="w-4 h-4" /> Urban Tree Canopy Expansion (NDVI)
              </span>
              <span className="font-mono text-white bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                +{canopyIncrease}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={canopyIncrease}
              onChange={(e) => setCanopyIncrease(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Current canopy: {activeZone?.treeCanopyCoverage}%)</span>
              <span>25% Shaded Corridors</span>
              <span>50% Miyawaki Forest Scaling</span>
            </div>
          </div>

          {/* Slider 3: Permeable Pavements */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Building className="w-4 h-4" /> Permeable / Cool Pavement Retrofit
              </span>
              <span className="font-mono text-white bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                +{permeablePavementIncrease}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={permeablePavementIncrease}
              onChange={(e) => setPermeablePavementIncrease(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Impermeable Asphalt)</span>
              <span>30% Sidewalks</span>
              <span>60% Roadways & Plazas</span>
            </div>
          </div>

          {/* Slider 4: Blue Infrastructure */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <Droplet className="w-4 h-4" /> Water Retention & Misting Installations
              </span>
              <span className="font-mono text-white bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                {waterBodiesAdded} Units
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={waterBodiesAdded}
              onChange={(e) => setWaterBodiesAdded(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 Installations</span>
              <span>4 Public Mist Corridors</span>
              <span>8 Wetland Nodes</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Results Column */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                <span>Predicted Microclimate Cooling Efficacy</span>
              </h3>
              {isEvaluating && (
                <span className="text-[11px] text-amber-400 animate-pulse flex items-center gap-1 font-mono">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Computing...
                </span>
              )}
            </div>

            {simulationResult ? (
              <div className="mt-4 space-y-4">
                {/* Temperature Drop Highlights */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Ambient Air Temp Drop */}
                  <div className="bg-gradient-to-br from-emerald-950/50 to-slate-950/80 p-4 rounded-xl border border-emerald-500/30">
                    <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-emerald-400" /> Air Temperature Cooling
                    </span>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-emerald-400">
                        -{simulationResult.reductions.airTempDrop}°C
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      Baseline: <span className="line-through text-slate-500">{simulationResult.baseline.airTemp}°C</span> → <span className="text-emerald-300 font-bold">{simulationResult.simulated.airTemp}°C</span>
                    </div>
                  </div>

                  {/* Surface LST Drop */}
                  <div className="bg-gradient-to-br from-cyan-950/50 to-slate-950/80 p-4 rounded-xl border border-cyan-500/30">
                    <span className="text-xs text-cyan-300 font-medium flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-cyan-400" /> Surface (LST) Cooling
                    </span>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-cyan-400">
                        -{simulationResult.reductions.surfaceTempDrop}°C
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      Baseline: <span className="line-through text-slate-500">{simulationResult.baseline.surfaceTemp}°C</span> → <span className="text-cyan-300 font-bold">{simulationResult.simulated.surfaceTemp}°C</span>
                    </div>
                  </div>
                </div>

                {/* Physics Breakdown of Cooling Source */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                    Cooling Contribution Breakdown:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-sky-300">Cool Roof Albedo:</span>
                      <span className="font-bold text-sky-400">-{simulationResult.reductions.breakdown.coolRoofContribution}°C</span>
                    </div>
                    <div className="flex justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-emerald-300">Tree Shading & Evap:</span>
                      <span className="font-bold text-emerald-400">-{simulationResult.reductions.breakdown.canopyContribution}°C</span>
                    </div>
                    <div className="flex justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-amber-300">Permeable Pavement:</span>
                      <span className="font-bold text-amber-400">-{simulationResult.reductions.breakdown.permeablePavementContribution}°C</span>
                    </div>
                    <div className="flex justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-cyan-300">Misting & Water:</span>
                      <span className="font-bold text-cyan-400">-{simulationResult.reductions.breakdown.blueInfrastructureContribution}°C</span>
                    </div>
                  </div>
                </div>

                {/* Co-Benefits Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Energy Saved
                    </div>
                    <div className="text-base font-bold text-amber-300 mt-1">
                      {simulationResult.coBenefits.annualEnergySavedMWh}
                    </div>
                    <div className="text-[10px] text-slate-500">MWh / year</div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Trees className="w-3 h-3 text-emerald-400" /> Carbon Offset
                    </div>
                    <div className="text-base font-bold text-emerald-300 mt-1">
                      {simulationResult.coBenefits.totalCarbonOffsetTons}
                    </div>
                    <div className="text-[10px] text-slate-500">tons CO₂ / yr</div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <DollarSign className="w-3 h-3 text-green-400" /> Cost Savings
                    </div>
                    <div className="text-base font-bold text-green-300 mt-1">
                      ${simulationResult.coBenefits.annualFinancialSavingsUSD.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500">/ yr (HVAC)</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Success Banner */}
          {saveSuccessMessage && (
            <div className="flex items-center space-x-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs p-3 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Save Action Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveAsProposal}
              disabled={isSaving || !simulationResult || simulationResult.reductions.airTempDrop === 0}
              className={`flex items-center space-x-2 text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer ${
                simulationResult?.reductions?.airTempDrop > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Submitting to Municipal Ledger...' : 'Save as Mitigation Proposal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
