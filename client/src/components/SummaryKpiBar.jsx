import React from 'react';
import { Flame, Trees, Zap, Radio } from 'lucide-react';

// Tailwind needs full class names, so each tone is written out in full here
const TONES = {
  heat: { icon: 'bg-rose-500/10 text-rose-400', value: 'text-rose-400', bar: 'bg-rose-500' },
  green: { icon: 'bg-emerald-500/10 text-emerald-400', value: 'text-emerald-400', bar: 'bg-emerald-500' },
  amber: { icon: 'bg-amber-500/10 text-amber-400', value: 'text-amber-400', bar: 'bg-amber-500' },
  water: { icon: 'bg-cyan-500/10 text-cyan-400', value: 'text-cyan-400', bar: 'bg-cyan-500' }
};

export default function SummaryKpiBar({ summary }) {
  if (!summary) return null;

  const energy = summary.totalProjectedEnergySavingsMWh || 750;

  const cards = [
    {
      label: 'Peak UHI intensity',
      value: `+${summary.peakUHIIntensityDeltaT || '9.5'}`,
      unit: '°C',
      note: `Avg surface temp ${summary.avgCitySurfaceTemp || '40.6'}°C`,
      icon: Flame,
      tone: 'heat'
    },
    {
      label: 'Projected CO₂ offset',
      value: `${summary.totalProjectedCarbonOffsetTons || '770'}`,
      unit: 't / yr',
      note: `${summary.mitigationProjectsCount || '3'} active mitigation works`,
      icon: Trees,
      tone: 'green'
    },
    {
      label: 'Energy savings potential',
      value: `${energy}`,
      unit: 'MWh / yr',
      note: `Est. cooling savings $${Math.round(energy * 120).toLocaleString()}`,
      icon: Zap,
      tone: 'amber'
    },
    {
      label: 'Monitored coverage',
      value: `${summary.totalMonitoredAreaKm2 || '22'}`,
      unit: 'km²',
      note: `${summary.activeIoTStationsCount || '6'} IoT stations reporting`,
      icon: Radio,
      tone: 'water'
    }
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const tone = TONES[card.tone];

        return (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-sm"
          >
            <span className={`absolute inset-y-3 left-0 w-[3px] rounded-r-full ${tone.bar}`} />

            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {card.label}
              </span>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span className={`font-mono text-2xl font-semibold tracking-tight ${tone.value}`}>
                {card.value}
              </span>
              <span className="text-xs text-slate-400">{card.unit}</span>
            </div>

            <div className="mt-1 truncate text-[11px] text-slate-500">{card.note}</div>
          </div>
        );
      })}
    </div>
  );
}