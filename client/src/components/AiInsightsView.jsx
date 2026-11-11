import React, { useState, useEffect } from 'react';
import { Brain, Flame, ShieldAlert, Info } from 'lucide-react';
import { api } from '../services/api';

const PRIORITY_STYLE = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
};

export default function AiInsightsView({ zones }) {
  const [model, setModel] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [recs, setRecs] = useState([]);
  const [zoneFilter, setZoneFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([api.getAiModel(), api.getHotspots()])
      .then(([m, h]) => {
        if (!mounted) return;
        if (m.success) setModel(m.data);
        if (h.success) setHotspots(h.data);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) {
          setError('AI service unreachable. Is the server running?');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    api.getRecommendations(zoneFilter)
      .then((r) => { if (mounted && r.success) setRecs(r.data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [zoneFilter]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        Training and validating model...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-rose-900 rounded-2xl p-8 text-center text-rose-300">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Brain className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">LST Prediction Model</h3>
          {model?.reliability === 'INSUFFICIENT_SAMPLE_SIZE' && (
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Indicative only
            </span>
          )}
        </div>

        {model?.trained ? (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-400">
              {model.modelType} predicting {model.target}. Samples: <b className="text-slate-200">{model.n}</b>. Validation: leave-one-out cross-validation.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                ['Train R²', model.metrics.trainR2],
                ['Train RMSE (°C)', model.metrics.trainRMSE],
                ['LOOCV R²', model.metrics.loocvR2],
                ['LOOCV RMSE (°C)', model.metrics.loocvRMSE],
                ['LOOCV MAE (°C)', model.metrics.loocvMAE]
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-[10px] text-slate-500 uppercase">{label}</div>
                  <div className="text-lg font-bold text-white">{value}</div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-2">Feature</th>
                    <th>Effect on LST per unit (°C)</th>
                    <th>Std. coefficient</th>
                    <th>Pearson r with LST</th>
                  </tr>
                </thead>
                <tbody>
                  {model.importance.map((f) => {
                    const corr = model.correlations.find((c) => c.feature === f.feature);
                    return (
                      <tr key={f.feature} className="border-b border-slate-900 text-slate-300">
                        <td className="py-2">{f.label}</td>
                        <td>{f.coefficientPerUnit}</td>
                        <td>{f.standardizedCoefficient}</td>
                        <td>{corr ? corr.pearsonR : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {model.warnings.map((w) => (
              <div key={w} className="flex gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
            <p className="text-[11px] text-slate-500">{model.dataProvenance}</p>
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-400">{model?.reason || 'Model not available.'}</p>
        )}
      </div>

      {/* Hotspots */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Flame className="w-5 h-5 text-rose-400" />
          <h3 className="text-sm font-semibold text-white">Statistical Hotspot Detection</h3>
          <span className="ml-auto text-[10px] text-slate-500">z-score of LST vs study-area mean</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-500 border-b border-slate-800">
              <tr><th className="py-2">Zone</th><th>LST (°C)</th><th>z-score</th><th>Class</th></tr>
            </thead>
            <tbody>
              {hotspots.map((h) => (
                <tr key={h.code} className="border-b border-slate-900 text-slate-300">
                  <td className="py-2">{h.name}</td>
                  <td>{h.surfaceTemp}</td>
                  <td className={h.zScore >= 1 ? 'text-rose-400 font-bold' : ''}>{h.zScore}</td>
                  <td>{h.hotspotClass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Mitigation Recommendations ({recs.length})</h3>
          </div>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="sm:ml-auto bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5"
          >
            <option value="">All zones</option>
            {zones.map((z) => (
              <option key={z.code} value={z.code}>{z.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recs.length === 0 && (
            <p className="text-xs text-slate-500">No intervention rules triggered for this selection.</p>
          )}
          {recs.map((r, i) => (
            <div key={`${r.zoneCode}-${r.type}-${i}`} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">{r.title}</span>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${PRIORITY_STYLE[r.priority]}`}>
                  {r.priority}
                </span>
              </div>
              <div className="text-slate-400 mt-1">{r.zoneName}</div>
              <p className="text-slate-300 mt-2">{r.reason}</p>
              <p className="text-slate-500 mt-2 font-mono text-[10px]">Rule: {r.triggeredRule}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900 rounded-lg p-2">
                  <div className="text-[10px] text-slate-500">Air ΔT</div>
                  <div className="font-bold text-emerald-400">-{r.expectedBenefit.airTempDropC}°C</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-2">
                  <div className="text-[10px] text-slate-500">Energy MWh/yr</div>
                  <div className="font-bold text-amber-300">{r.expectedBenefit.annualEnergySavedMWh}</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-2">
                  <div className="text-[10px] text-slate-500">CO₂ t/yr</div>
                  <div className="font-bold text-sky-300">{r.expectedBenefit.carbonOffsetTons}</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Model estimate for: {r.assumption}. Not a measured result.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}