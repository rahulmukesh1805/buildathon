import React from 'react';
import { useApp } from '../context/AppContext';
import IncidentMap from '../components/IncidentMap';
import { Info } from 'lucide-react';

export default function MapPage() {
  const { incidents } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-navy-950 tracking-tight">
            Live Municipal Infrastructure Map
          </h1>
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
            Geographic overview of public infrastructure hazards with real-time severity markers, target department routing, and certified field resolution statuses.
          </p>
        </div>
      </div>

      <IncidentMap incidents={incidents} height="650px" />
      
      <div data-ui="true" className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0" />
        <span>
          Select any marker to inspect hazard title, reported timestamp, department jurisdiction, and direct link to the citizen tracking ledger.
        </span>
      </div>
    </div>
  );
}
