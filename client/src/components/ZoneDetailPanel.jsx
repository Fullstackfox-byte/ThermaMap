import React from 'react';
import { 
  X, 
  Flame, 
  Trees, 
  Sun, 
  ShieldAlert, 
  Sliders, 
  MapPin, 
  TrendingUp, 
  Activity, 
  Compass
} from 'lucide-react';

export default function ZoneDetailPanel({ zone, onClose, onLaunchSimulator }) {
  if (!zone) return null;

  const getHviBadge = (score, risk) => {
    if (risk) {
      if (risk === 'Critical') return { bg: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Critical Risk' };
      if (risk === 'High') return { bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'High Risk' };
      if (risk === 'Moderate') return { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Moderate Risk' };
      return { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Low Risk' };
    }
    if (score >= 75) return { bg: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Critical Risk' };
    if (score >= 55) return { bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'High Risk' };
    if (score >= 35) return { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Moderate Risk' };
    return { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Low Risk' };
  };

  const badge = getHviBadge(zone.hviScore, zone.riskCategory);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-tight">{zone.name}</h3>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Code: <span className="font-mono text-slate-300">{zone.code}</span> • Category: <span className="text-slate-300">{zone.category}</span> • Area: <span className="text-slate-300">{zone.areaKm2} km²</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Description */}
      <div className="mt-3 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
        {zone.description}
      </div>

      {/* Primary Microclimate Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-400" /> Land Surface (LST)
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-rose-400">{zone.surfaceTemp}°C</span>
          </div>
          <span className="text-[10px] text-slate-400">Thermal Infrared</span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> UHI Intensity (ΔT)
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-amber-300">+{zone.uhiIntensity}°C</span>
          </div>
          <span className="text-[10px] text-slate-400">vs rural base ({zone.ruralBaselineTemp}°C)</span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-indigo-400" /> UTFVI Anomaly
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-indigo-300">{zone.utfvi}</span>
          </div>
          <span className="text-[10px] text-slate-400 truncate block">{zone.utfviClass}</span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> Heat Vuln (HVI)
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-purple-300">{zone.hviScore}/100</span>
          </div>
          <span className="text-[10px] text-slate-400">Composite index</span>
        </div>
      </div>

      {/* Urban Morphology & Land Cover Bars */}
      <div className="mt-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Urban Morphology & Surface Properties</span>
        </h4>

        {/* Tree Canopy */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Trees className="w-3.5 h-3.5 text-emerald-400" /> Tree Canopy Coverage
            </span>
            <span className="font-semibold text-emerald-400">{zone.treeCanopyCoverage}% (NDVI: {zone.ndvi})</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${zone.treeCanopyCoverage}%` }}
            />
          </div>
        </div>

        {/* Albedo */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-sky-400" /> Surface Albedo (α)
            </span>
            <span className="font-semibold text-sky-300">{zone.albedo} (Reflectivity)</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-sky-400 rounded-full transition-all duration-500"
              style={{ width: `${zone.albedo * 100}%` }}
            />
          </div>
        </div>

        {/* Demographics & Built Up */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div>
            Built-Up Area: <b className="text-slate-200">{zone.builtUpRatio}%</b>
          </div>
          <div>
            Population Density: <b className="text-slate-200">{zone.populationDensity?.toLocaleString()} /km²</b>
          </div>
          <div>
            Elderly (over 65 yr): <b className="text-amber-300">{zone.elderlyRatio}%</b>
          </div>
          <div>
            Cool Roof Adopted: <b className="text-cyan-300">{zone.coolRoofCoverage}%</b>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="mt-4 flex items-center justify-end">
        <button
          onClick={() => onLaunchSimulator(zone)}
          className="flex items-center space-x-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
        >
          <Sliders className="w-4 h-4" />
          <span>Launch What-If Mitigation Simulator for {zone.code}</span>
        </button>
      </div>
    </div>
  );
}
