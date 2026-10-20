import React from 'react';
import { useApp } from '../context/AppContext';
import IncidentMap from '../components/IncidentMap';
import { Info, Satellite, Layers, ShieldCheck } from 'lucide-react';

export default function MapPage() {
  const { incidents } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wide border border-teal-200">
              <Satellite className="w-3 h-3 text-teal-700" />
              Orbital GIS Network
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-World Satellite Imagery Active
            </span>
          </div>
          <h1 className="text-3xl font-black text-navy-950 tracking-tight">
            Live Municipal Infrastructure Satellite Map
          </h1>
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
            High-resolution orbital satellite photography and multi-layer GIS tracking real-time municipal hazards, civic triage priorities, and verified field crew resolution coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg shadow-xs font-semibold text-navy-950">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>Dual Satellite &amp; Road Feeds</span>
          </div>
        </div>
      </div>

      <IncidentMap 
        incidents={incidents} 
        height="650px" 
        defaultMapType="satellite" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div data-ui="true" className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            <strong>Interactive Controls:</strong> Toggle between <strong>Satellite</strong> (raw orbital imagery), <strong>Hybrid</strong> (satellite + labeled roads/boundaries), and <strong>Street</strong> views using the top-right layer switch on the map.
          </span>
        </div>

        <div data-ui="true" className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 text-xs text-teal-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <span>
            <strong>Pinpoint Inspection:</strong> Click on any marker pin to inspect the reported hazard description, severity priority, municipal department jurisdiction, and citizen tracking dossier link.
          </span>
        </div>
      </div>
    </div>
  );
}
