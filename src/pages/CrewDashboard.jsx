import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MapPin, 
  CheckCircle2, 
  Camera, 
  Play, 
  Volume2,
  Sparkles
} from 'lucide-react';

const CREW_UNITS = [
  { id: 'crew-01', name: 'Crew Alpha — High Voltage Quick Response', dept: 'Electrical Services' },
  { id: 'crew-02', name: 'Crew Bravo — Water & Sewerage Rapid Unit', dept: 'Water Works' },
  { id: 'crew-03', name: 'Crew Charlie — Pothole & Roadway Patch', dept: 'Civil Infrastructure' },
  { id: 'crew-04', name: 'Crew Delta — Sanitation & Environmental Services', dept: 'Sanitation' }
];

export default function CrewDashboard() {
  const { incidents, activeCrew, setActiveCrew, updateStatus } = useApp();

  // Selected incident for action modal
  const [activeTask, setActiveTask] = useState(null);
  const [actionType, setActionType] = useState('progress'); // 'progress' | 'notes' | 'resolve'
  const [fieldNotes, setFieldNotes] = useState('');
  const [completionPhotoPreview, setCompletionPhotoPreview] = useState(null);

  // Filter incidents for currently active crew
  const crewIncidents = incidents.filter(
    inc => inc.assigned_crew_id === activeCrew.id || 
           inc.assigned_crew_name?.toLowerCase().includes(activeCrew.name.toLowerCase().split('—')[0].trim())
  );

  const activeWorkOrders = crewIncidents.filter(inc => inc.status !== 'resolved' && inc.status !== 'rejected');
  const completedOrders = crewIncidents.filter(inc => inc.status === 'resolved');

  // Handle Photo selection for resolution
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setCompletionPhotoPreview(loadEvt.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Perform Status Transition
  const handleExecuteAction = () => {
    if (!activeTask) return;

    if (actionType === 'progress') {
      updateStatus(
        activeTask.id,
        'in_progress',
        fieldNotes || `Crew arrived on site and initiated diagnostics.`,
        activeCrew.name
      );
    } else if (actionType === 'resolve') {
      if (!fieldNotes.trim()) {
        alert('Please provide completion notes describing work performed.');
        return;
      }
      updateStatus(
        activeTask.id,
        'resolved',
        fieldNotes,
        activeCrew.name,
        completionPhotoPreview || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80'
      );
    } else if (actionType === 'notes') {
      updateStatus(
        activeTask.id,
        activeTask.status,
        `Field Log: ${fieldNotes}`,
        activeCrew.name
      );
    }

    setActiveTask(null);
    setFieldNotes('');
    setCompletionPhotoPreview(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header and Crew Identity Switcher */}
      <div data-ui="true" className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Field Crew Work Orders
          </h1>
          <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
            Active municipal work orders, GPS navigation coordinates, on-site safety status transitions, and certified completion photo logging.
          </p>
        </div>

        {/* Crew Department Switcher */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 self-start md:self-auto">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Active Unit Roster:
          </label>
          <select
            value={activeCrew.id}
            onChange={(e) => {
              const found = CREW_UNITS.find(u => u.id === e.target.value);
              if (found) setActiveCrew(found);
            }}
            className="bg-white text-xs font-bold text-navy-950 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
          >
            {CREW_UNITS.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-4xl font-black text-navy-950 tabular-nums block">{crewIncidents.length}</span>
          <span className="text-xs font-bold text-slate-700 block">Assigned Tickets</span>
          <span className="text-xs text-slate-500 block">Total dispatched to this unit</span>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs space-y-1">
          <span className="text-4xl font-black text-amber-600 tabular-nums block">{activeWorkOrders.length}</span>
          <span className="text-xs font-bold text-amber-800 block">Active On-Site</span>
          <span className="text-xs text-slate-500 block">Under active field repair</span>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs space-y-1">
          <span className="text-4xl font-black text-emerald-600 tabular-nums block">{completedOrders.length}</span>
          <span className="text-xs font-bold text-emerald-800 block">Certified Completed</span>
          <span className="text-xs text-slate-500 block">Verified &amp; cleared by crew</span>
        </div>
      </div>

      {/* Active Work Orders List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-navy-950">
          Active Assigned Orders ({activeWorkOrders.length})
        </h2>

        {activeWorkOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-navy-950">All Dispatched Orders Completed</h3>
            <p className="text-sm text-slate-600">There are currently no outstanding assigned hazards for {activeCrew.name}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeWorkOrders.map(task => {
              const isCritical = task.severity === 'critical';
              const isInProgress = task.status === 'in_progress';

              return (
                <div 
                  key={task.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-5 shadow-xs"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-950 bg-slate-100 px-2.5 py-1 rounded-md tabular-nums font-sans">
                        #{task.tracking_token}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md capitalize border ${
                        isCritical ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {task.severity}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-navy-950 leading-snug">{task.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{task.address} {task.landmark ? `(${task.landmark})` : ''}</span>
                      </p>
                    </div>

                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {task.description}
                    </p>

                    {task.audio_url && (
                      <div data-ui="true" className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                          <Volume2 className="w-4 h-4 text-teal-700" />
                          <span>Citizen Voice Recording</span>
                        </div>
                        <audio controls src={task.audio_url} className="w-full h-8" />
                        {task.audio_transcript && (
                          <p className="text-xs text-slate-600 italic">"{task.audio_transcript}"</p>
                        )}
                      </div>
                    )}

                    {task.photo_url && (
                      <div className="pt-1">
                        <img 
                          src={task.photo_url} 
                          alt="Citizen evidence" 
                          className="w-full h-44 object-cover rounded-xl border border-slate-200"
                        />
                      </div>
                    )}
                  </div>

                  {/* Quick Crew Action Bar */}
                  <div data-ui="true" className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {!isInProgress ? (
                      <button
                        onClick={() => {
                          setActiveTask(task);
                          setActionType('progress');
                        }}
                        className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Work On-Site</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveTask(task);
                          setActionType('resolve');
                        }}
                        className="flex-1 py-2.5 px-4 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Certify Completed Repair</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveTask(task);
                        setActionType('notes');
                      }}
                      className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors border border-slate-200"
                      title="Add field verification notes"
                    >
                      <span>Field Log</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed History */}
      {completedOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-navy-900">Recently Resolved by {activeCrew.name}</h3>
          <div data-ui="true" className="divide-y divide-slate-100">
            {completedOrders.map(c => (
              <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <code className="font-bold text-slate-600 mr-2">#{c.tracking_token}</code>
                  <span className="font-semibold text-slate-800">{c.title}</span>
                  <p className="text-emerald-700 mt-0.5 text-[11px] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 inline shrink-0" />
                    <span>{c.resolution_notes}</span>
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(c.resolved_at || c.updated_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field Action Dialog */}
      {activeTask && (
        <div data-ui="true" className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
          <div data-ui="true" className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-navy-900">
              {actionType === 'progress' ? 'Acknowledge & Begin Work' :
               actionType === 'resolve' ? 'Submit Resolution & Proof' :
               'Record Field Verification Note'}
            </h3>
            
            <p className="text-xs text-slate-500">
              Order #{activeTask.tracking_token}: {activeTask.title}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {actionType === 'resolve' ? 'Work Summary & Action Taken *' : 'Field Notes / Observation'}
              </label>
              <textarea
                rows={3}
                placeholder={actionType === 'resolve' ? 'e.g. Cleared drainage blockage, tested with high pressure flow, sanitized perimeter.' : 'e.g. Perimeter safety cordon established, waiting on grid shutoff.'}
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {actionType === 'resolve' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Resolution Photo Evidence (Optional)
                </label>
                {completionPhotoPreview ? (
                  <div className="relative inline-block rounded-xl overflow-hidden border border-slate-300">
                    <img src={completionPhotoPreview} alt="Resolution" className="w-40 h-28 object-cover" />
                    <button
                      type="button"
                      onClick={() => setCompletionPhotoPreview(null)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full text-xs"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50">
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-medium text-slate-600">Attach After-Repair Photo</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setCompletionPhotoPreview('https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80')}
                      className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>Use Certified Demo Repair Photo</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveTask(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
