import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  ThumbsUp, 
  TrendingDown, 
  Trees, 
  Zap, 
  DollarSign, 
  Sun, 
  Building, 
  Droplet,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function MitigationProjectsView({ projects, onOpenProposeModal, onRefreshProjects }) {
  const [filterType, setFilterType] = useState('ALL');
  const [votingId, setVotingId] = useState(null);

  const getInterventionIcon = (type) => {
    switch (type) {
      case 'COOL_ROOFS':
        return <Sun className="w-4 h-4 text-sky-400" />;
      case 'URBAN_FORESTRY_CANOPY':
        return <Trees className="w-4 h-4 text-emerald-400" />;
      case 'PERMEABLE_COOL_PAVEMENTS':
        return <Building className="w-4 h-4 text-amber-400" />;
      case 'BLUE_INFRASTRUCTURE':
        return <Droplet className="w-4 h-4 text-cyan-400" />;
      default:
        return <Layers className="w-4 h-4 text-purple-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IMPLEMENTED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'APPROVED':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case 'UNDER_REVIEW':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleVote = async (id) => {
    setVotingId(id);
    try {
      await api.voteProject(id);
      if (onRefreshProjects) onRefreshProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setVotingId(null);
    }
  };

  const filteredProjects = projects.filter(p => {
    if (filterType === 'ALL') return true;
    return p.interventionType === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Mitigation Action Plans & Municipal Interventions
              </h2>
              <p className="text-xs text-slate-400">
                Data-driven cooling projects tracked from citizen proposal to engineering completion
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenProposeModal}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Propose New Intervention</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1 text-xs">
        {['ALL', 'COOL_ROOFS', 'URBAN_FORESTRY_CANOPY', 'PERMEABLE_COOL_PAVEMENTS', 'BLUE_INFRASTRUCTURE'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterType(cat)}
            className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
              filterType === cat
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat === 'ALL' && 'All Interventions'}
            {cat === 'COOL_ROOFS' && 'Cool Roofs'}
            {cat === 'URBAN_FORESTRY_CANOPY' && 'Urban Forestry'}
            {cat === 'PERMEABLE_COOL_PAVEMENTS' && 'Permeable Pavements'}
            {cat === 'BLUE_INFRASTRUCTURE' && 'Blue Infrastructure'}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project) => (
          <div 
            key={project.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div>
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center space-x-1.5">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    {getInterventionIcon(project.interventionType)}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{project.zoneCode}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-sm font-bold text-white leading-snug">{project.title}</h4>
              <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                {project.description}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-rose-400" /> Temp Reduction
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    -{project.projectedTempReduction}°C
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Trees className="w-3 h-3 text-emerald-400" /> CO₂ Offset
                  </span>
                  <span className="text-sm font-bold text-emerald-300">
                    {project.projectedCarbonOffsetTons} t/yr
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Energy Saved
                  </span>
                  <span className="text-sm font-bold text-amber-300">
                    {project.projectedEnergySavingsMWh} MWh
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-green-400" /> Budget
                  </span>
                  <span className="text-sm font-bold text-slate-200">
                    ${project.estimatedBudget?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Voting and Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </span>

              <button
                onClick={() => handleVote(project.id)}
                disabled={votingId === project.id}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition cursor-pointer"
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${votingId === project.id ? 'animate-spin' : ''}`} />
                <span className="font-semibold">{project.votes || 0}</span>
                <span className="text-slate-400 text-[10px]">Endorse</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
