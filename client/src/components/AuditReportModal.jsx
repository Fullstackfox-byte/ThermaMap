import React from 'react';
import { X, Printer, FileText } from 'lucide-react';

export default function AuditReportModal({ isOpen, onClose, zones = [], summary = {}, projects = [] }) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-slate-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Urban Heat Island (UHI) Microclimate Assessment Report
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Municipal Climate Resilience Brief • Document Ref: #UHI-MUNICIPAL-2026
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400">Peak Thermal Anomaly</span>
            <div className="text-xl font-bold text-rose-400 mt-1">+{summary?.peakUHIIntensityDeltaT || '9.5'}°C</div>
            <span className="text-[10px] text-slate-500">above rural baseline (31.8°C)</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400">Monitored Spatial Domain</span>
            <div className="text-xl font-bold text-cyan-300 mt-1">{summary?.totalMonitoredAreaKm2 || '22'} km²</div>
            <span className="text-[10px] text-slate-500">across 6 urban zones</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400">Projected Carbon Offset</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{summary?.totalProjectedCarbonOffsetTons || '770'} tCO₂/yr</div>
            <span className="text-[10px] text-slate-500">via mitigation interventions</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400">Cooling Energy Saved</span>
            <div className="text-xl font-bold text-amber-300 mt-1">{summary?.totalProjectedEnergySavingsMWh || '750'} MWh/yr</div>
            <span className="text-[10px] text-slate-500">reduced peak grid burden</span>
          </div>
        </div>

        {/* Spatial Zone Audit Table */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-3">
            1. Spatial Microclimate Vulnerability Matrix
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Zone Code</th>
                  <th className="p-3">Zone Name & Morphology</th>
                  <th className="p-3">LST (°C)</th>
                  <th className="p-3">UHI ΔT</th>
                  <th className="p-3">UTFVI</th>
                  <th className="p-3">HVI Score</th>
                  <th className="p-3">Canopy / Albedo</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {zones.map((z) => (
                  <tr key={z.code} className="hover:bg-slate-950/40">
                    <td className="p-3 font-mono font-bold text-slate-300">{z.code}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{z.name}</div>
                      <div className="text-[10px] text-slate-400">{z.category}</div>
                    </td>
                    <td className="p-3 font-bold text-rose-400">{z.surfaceTemp}°C</td>
                    <td className="p-3 font-semibold text-amber-300">+{z.uhiIntensity}°C</td>
                    <td className="p-3 font-mono text-indigo-300">{z.utfvi}</td>
                    <td className="p-3 font-bold text-purple-300">{z.hviScore}/100</td>
                    <td className="p-3 text-[11px] text-slate-300">{z.treeCanopyCoverage}% / α={z.albedo}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        z.hviScore >= 75 ? 'bg-red-500/20 text-red-400' :
                        z.hviScore >= 55 ? 'bg-orange-500/20 text-orange-400' :
                        z.hviScore >= 35 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {z.riskCategory}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scientific Formulations Section */}
        <div className="mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            2. Mathematical & Scientific Formulations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="font-bold text-sky-400 block mb-1">Urban Heat Island Intensity (ΔT)</span>
              <p className="font-mono text-slate-300 bg-slate-950 p-2 rounded">
                ΔT_UHI = T_urban - T_rural
              </p>
              <p className="text-slate-400 mt-1">
                Quantifies urban thermal excess above undisturbed rural reference station.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="font-bold text-indigo-400 block mb-1">Urban Thermal Field Variance Index (UTFVI)</span>
              <p className="font-mono text-slate-300 bg-slate-950 p-2 rounded">
                UTFVI = (T_s - T_mean) / T_mean (in Kelvin)
              </p>
              <p className="text-slate-400 mt-1">
                Standard remote sensing index for identifying localized microclimate stress zones.
              </p>
            </div>
          </div>
        </div>

        {/* Active Mitigation Projects Pipeline */}
        {projects && projects.length > 0 && (
          <div className="mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              3. Municipal Mitigation Works Pipeline ({projects.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {projects.slice(0, 6).map((p) => (
                <div key={p.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <div className="font-semibold text-slate-200 truncate">{p.title}</div>
                  <div className="text-slate-400 mt-0.5">Zone: <span className="font-mono text-slate-300">{p.zoneCode}</span> • Status: <span className="text-emerald-400">{p.status}</span></div>
                  <div className="text-[10px] text-slate-500 mt-1">ΔT drop: -{p.projectedTempReduction}°C • {p.projectedCarbonOffsetTons} tCO₂/yr</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Recommendations */}
        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            <b>Targeted Action:</b> Priority high-albedo roof retrofits recommended for Sector 9 Industrial and Old City Quarter.
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Powered by AuraUHI MERN Platform
          </div>
        </div>
      </div>
    </div>
  );
}
