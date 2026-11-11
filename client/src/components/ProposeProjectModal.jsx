import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function ProposeProjectModal({ isOpen, onClose, zones, onProjectCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    zoneCode: zones[0]?.code || 'CBD-CORE',
    interventionType: 'COOL_ROOFS',
    targetCoveragePercent: 25,
    estimatedBudget: 60000,
    projectedTempReduction: 1.5,
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const projectedEnergySavingsMWh = Math.round(formData.projectedTempReduction * 140);
      const projectedCarbonOffsetTons = Math.round(projectedEnergySavingsMWh * 0.82);

      const res = await api.createProject({
        ...formData,
        targetCoveragePercent: Number(formData.targetCoveragePercent),
        estimatedBudget: Number(formData.estimatedBudget),
        projectedTempReduction: Number(formData.projectedTempReduction),
        projectedEnergySavingsMWh,
        projectedCarbonOffsetTons
      });

      if (res.success) {
        if (onProjectCreated) onProjectCreated();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Propose Microclimate Intervention</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Project Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Old City Cool Roofs & Micro-Misting Corridor"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Zone</label>
              <select
                value={formData.zoneCode}
                onChange={(e) => setFormData({ ...formData, zoneCode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
              >
                {zones.map((z) => (
                  <option key={z.code} value={z.code}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Intervention Type</label>
              <select
                value={formData.interventionType}
                onChange={(e) => setFormData({ ...formData, interventionType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
              >
                <option value="COOL_ROOFS">High-Albedo Cool Roofs</option>
                <option value="URBAN_FORESTRY_CANOPY">Urban Forestry & Canopy</option>
                <option value="PERMEABLE_COOL_PAVEMENTS">Permeable Cool Pavements</option>
                <option value="BLUE_INFRASTRUCTURE">Water Retention & Fountains</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Coverage (%)</label>
              <input
                type="number"
                min="5"
                max="100"
                value={formData.targetCoveragePercent}
                onChange={(e) => setFormData({ ...formData, targetCoveragePercent: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Estimated Budget ($)</label>
              <input
                type="number"
                min="5000"
                step="5000"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Predicted Drop (°C)</label>
              <input
                type="number"
                min="0.2"
                max="5.0"
                step="0.1"
                value={formData.projectedTempReduction}
                onChange={(e) => setFormData({ ...formData, projectedTempReduction: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Intervention Description</label>
            <textarea
              rows={3}
              placeholder="Outline the spatial methodology, materials to be applied, and expected community benefit..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-3 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-medium shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Submit Proposal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
