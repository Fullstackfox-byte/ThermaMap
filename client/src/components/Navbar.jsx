import React from 'react';
import {
  Leaf,
  Map as MapIcon,
  Sliders,
  BarChart3,
  Brain,
  CheckSquare,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';

const NAV_GROUPS = [
  {
    title: 'Monitor',
    items: [
      { id: 'map', label: 'Microclimate Map', icon: MapIcon },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'alerts', label: 'Heat Alerts', icon: AlertTriangle }
    ]
  },
  {
    title: 'Model',
    items: [
      { id: 'simulator', label: 'Mitigation Simulator', icon: Sliders },
      { id: 'ai', label: 'AI Insights', icon: Brain }
    ]
  },
  {
    title: 'Act',
    items: [{ id: 'projects', label: 'Projects', icon: CheckSquare }]
  }
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  activeAlertsCount
}) {
  // On small screens the sidebar is a drawer. On large screens it can collapse to an icon rail.
  const widthClass = collapsed ? 'lg:w-[76px]' : 'lg:w-64';
  const mobileClass = mobileOpen ? 'translate-x-0' : '-translate-x-full';
  // Labels are hidden only on large screens when collapsed
  const labelClass = collapsed ? 'lg:hidden' : '';

  const handleClick = (id) => {
    setActiveTab(id);
    onCloseMobile();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[2000] flex w-64 flex-col border-r border-slate-800 bg-slate-900 transition-all duration-200 lg:static lg:z-auto lg:translate-x-0 ${widthClass} ${mobileClass}`}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4">
        <button
          onClick={() => handleClick('map')}
          className={`flex items-center gap-3 ${collapsed ? 'lg:mx-auto' : ''}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <Leaf className="h-5 w-5 text-emerald-400" />
          </span>
          <span className={`text-left ${labelClass}`}>
            <span className="block text-[15px] font-semibold leading-tight tracking-tight text-white">
              AuraUHI
            </span>
            <span className="block text-[11px] leading-tight text-slate-400">
              Climate Intelligence
            </span>
          </span>
        </button>

        <button
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div
              className={`mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 ${labelClass}`}
            >
              {group.title}
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badge = item.id === 'alerts' && activeAlertsCount > 0 ? activeAlertsCount : null;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleClick(item.id)}
                    title={item.label}
                    className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                      collapsed ? 'lg:justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className={`flex-1 truncate text-left ${labelClass}`}>{item.label}</span>

                    {badge && (
                      <span
                        className={`rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white ${
                          collapsed ? 'lg:absolute lg:right-1.5 lg:top-1.5' : ''
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-3 border-t border-slate-800 p-3">
        <div
          className={`flex items-center gap-2 rounded-xl bg-slate-950/60 px-3 py-2 text-[11px] text-slate-400 ${
            collapsed ? 'lg:justify-center lg:px-0' : ''
          }`}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
          <span className={labelClass}>Simulated IoT feed (demo)</span>
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}