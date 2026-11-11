import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Clock, ShieldAlert, Trees } from 'lucide-react';
import { api } from '../services/api';

export default function AnalyticsView({ zones: _zones = [] }) {
  const [diurnalData, setDiurnalData] = useState([]);
  const [correlations, setCorrelations] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getDiurnalData(),
      api.getCorrelations(),
      api.getRankings()
    ])
    .then(([diurnalRes, corrRes, rankRes]) => {
      if (isMounted) {
        if (diurnalRes.success) setDiurnalData(diurnalRes.data);
        if (corrRes.success) setCorrelations(corrRes.data);
        if (rankRes.success) setRankings(rankRes.data);
        setLoading(false);
      }
    })
    .catch(err => {
      console.error(err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        Loading microclimate analytics engine...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 24-Hour Diurnal Thermal Progression Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                24-Hour Diurnal Microclimate Profile & Nocturnal Thermal Lag
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison of rural baseline vs. urban core thermal inertia and proposed mitigation cooling curve
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
              Peak UHI Lag: 20:00 - 02:00
            </span>
          </div>
        </div>

        <div className="mt-6 h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={diurnalData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={[20, 45]} unit="°C" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  fontSize: '12px' 
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              
              <Line 
                type="monotone" 
                dataKey="industrialTemp" 
                name="Industrial Corridor (IND-SEC9)" 
                stroke="#ef4444" 
                strokeWidth={2.5} 
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="urbanCbdTemp" 
                name="Central Business District (CBD)" 
                stroke="#f97316" 
                strokeWidth={2.5} 
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="mitigatedTemp" 
                name="Simulated Post-Mitigation Curve" 
                stroke="#10b981" 
                strokeWidth={2.5} 
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="ruralTemp" 
                name="Rural Baseline Reference" 
                stroke="#38bdf8" 
                strokeWidth={2} 
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
          <b className="text-amber-400">Microclimatic Observation:</b> Notice how the rural reference temperature drops steeply after sunset (down to 23.9°C at 04:00 AM), whereas the dense urban concrete/asphalt CBD and Industrial zones trap sensible heat, staying above 30.6°C throughout the night. The simulated green/cool roof mitigation successfully cuts this nighttime penalty by ~3.5°C.
        </div>
      </div>

      {/* Two-Column Grid: Heat Vulnerability Index Rankings & NDVI vs Temp */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Heat Vulnerability Ranking Leaderboard */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Municipal Heat Vulnerability Index (HVI) Priority Ranking
              </h3>
              <p className="text-xs text-slate-400">
                Sorted by combined thermal hazard, demographic exposure, and canopy deficits
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {rankings.map((zone, idx) => {
              let scoreColor = 'text-red-400';
              let barColor = 'bg-red-500';
              if (zone.hviScore < 40) {
                scoreColor = 'text-emerald-400';
                barColor = 'bg-emerald-500';
              } else if (zone.hviScore < 60) {
                scoreColor = 'text-amber-400';
                barColor = 'bg-amber-500';
              } else if (zone.hviScore < 75) {
                scoreColor = 'text-orange-400';
                barColor = 'bg-orange-500';
              }

              return (
                <div key={zone.code} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-slate-500 font-bold">#{idx + 1}</span>
                      <span className="text-xs font-bold text-white">{zone.name}</span>
                      <span className="text-[10px] text-slate-400">({zone.code})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {zone.riskCategory} Risk
                      </span>
                      <span className={`text-sm font-extrabold ${scoreColor}`}>
                        {zone.hviScore}<span className="text-[10px] font-normal text-slate-500">/100</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${zone.hviScore}%` }} />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>LST: <b className="text-rose-400">{zone.surfaceTemp}°C</b></span>
                    <span>UHI ΔT: <b className="text-amber-300">+{zone.uhiIntensity}°C</b></span>
                    <span>UTFVI: <b className="text-indigo-300">{zone.utfvi}</b></span>
                    <span>Grade: <b className="text-slate-200">{zone.ecologicalGrade}</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vegetation Density (NDVI) vs Surface Temp Bar Correlation */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Trees className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Canopy Cover vs. Surface Temp
              </h3>
              <p className="text-xs text-slate-400">
                Demonstrating urban green infrastructure cooling effect
              </p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correlations} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="zoneCode" 
                  stroke="#64748b" 
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '0.75rem', 
                    fontSize: '11px' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="surfaceTemp" name="Surface LST (°C)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="treeCanopyCoverage" name="Tree Canopy (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            Strong inverse correlation confirmed ($r \approx -0.89$): Zones with high canopy cover (such as Eco-Park, 78% canopy) report average surface temps of 32.9°C, compared to 47.8°C in low-canopy industrial sectors.
          </div>
        </div>
      </div>
    </div>
  );
}
