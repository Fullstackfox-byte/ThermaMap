import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Clock,
  MapPin,
  LifeBuoy,
  Droplet,
  Umbrella,
  BellRing
} from 'lucide-react';

export default function AlertsView({ alerts, onResolve }) {
  const handleResolve = (id) => {
    if (onResolve) onResolve(id);
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'Emergency':
        return {
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          card: 'border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900',
          icon: <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
        };
      case 'Warning':
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          card: 'border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900',
          icon: <ShieldAlert className="w-5 h-5 text-amber-400" />
        };
      default:
        return {
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
          card: 'border-slate-800 bg-slate-900',
          icon: <BellRing className="w-5 h-5 text-blue-400" />
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Real-Time Heat Hazard & Extreme Microclimate Early Warning System
            </h2>
            <p className="text-xs text-slate-400">
              Advisories auto-generated from live Open-Meteo weather and air quality thresholds
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Live Data Refresh: Every 20s</span>
        </div>
      </div>

      {/* Active Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-sm text-emerald-300">
            All Clear — live conditions are within safe thresholds. No active thermal hazards.
          </div>
        )}

        {alerts.map((alert) => {
          const style = getSeverityStyle(alert.severity);
          return (
            <div
              key={alert.id}
              className={`border rounded-2xl p-5 shadow-xl transition-all ${style.card} ${!alert.active ? 'opacity-60 grayscale' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {style.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-white">{alert.title}</h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {alert.severity}
                      </span>
                      {!alert.active && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span className="flex items-center gap-1 font-mono text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" /> {alert.zoneCode}
                      </span>
                      <span>•</span>
                      <span>Observed: {new Date(alert.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {alert.source && (
                        <>
                          <span>•</span>
                          <span>{alert.source}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {alert.active && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs px-3.5 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer self-start sm:self-auto"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 mt-3">
                {alert.description}
              </p>

              {/* Advisories list */}
              {alert.advisories && alert.advisories.length > 0 && (
                <div className="mt-4 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Recommended Public Safety Actions:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {alert.advisories.map((adv, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-slate-200">
                        <span className="text-rose-400 font-bold shrink-0">•</span>
                        <span>{adv}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* General Heat Resilience Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 font-bold">
            <Droplet className="w-4 h-4" />
            <span>Hydration & Cooling</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Drink water regularly, even before feeling thirsty. Use public cooling centres or air-conditioned buildings during peak heat hours.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold">
            <Umbrella className="w-4 h-4" />
            <span>Shade & Sun Protection</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Prefer shaded walkways, wear light-coloured breathable clothing, and avoid direct sun between noon and 4 PM.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 font-bold">
            <LifeBuoy className="w-4 h-4" />
            <span>Vulnerable Group Care</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Check on elderly people, children and outdoor workers. Never leave anyone in a parked vehicle.
          </p>
        </div>
      </div>
    </div>
  );
}