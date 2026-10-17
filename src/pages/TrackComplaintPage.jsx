import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  CheckCircle2, 
  MapPin, 
  AlertTriangle, 
  Lock, 
  Camera, 
  ChevronRight, 
  ShieldCheck,
  Volume2,
  Clock,
  User
} from 'lucide-react';

const STAGES = [
  { key: 'reported', label: 'Reported', desc: 'Complaint registered by citizen' },
  { key: 'verified', label: 'Verified', desc: 'Confirmed by municipal triage desk' },
  { key: 'assigned', label: 'Assigned', desc: 'Dispatched to specialized field crew' },
  { key: 'in_progress', label: 'In Progress', desc: 'Crew on-site actively conducting repair' },
  { key: 'resolved', label: 'Resolved', desc: 'Inspected and certified cleared' }
];

const STATUS_INDEX = {
  reported: 0,
  verified: 1,
  assigned: 2,
  in_progress: 3,
  resolved: 4,
  rejected: -1
};

export default function TrackComplaintPage() {
  const { token: urlToken } = useParams();
  const navigate = useNavigate();
  const { getIncidentByToken, incidents } = useApp();

  const [inputToken, setInputToken] = useState(urlToken || '');
  const [manualToken, setManualToken] = useState('');

  // Derive current incident directly from active route or manual search without cascading effect
  const activeToken = (urlToken || manualToken).trim().toUpperCase();
  const currentIncident = activeToken ? getIncidentByToken(activeToken) : null;
  const searched = Boolean(activeToken);

  const handleSearch = (e) => {
    e?.preventDefault();
    const clean = inputToken.trim().toUpperCase();
    if (!clean) return;
    setManualToken(clean);
    navigate(`/track/${clean}`);
  };

  const currentStageIndex = currentIncident ? STATUS_INDEX[currentIncident.status] : 0;
  const isRejected = currentIncident?.status === 'rejected';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Editorial Header (No Eyebrows) */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
          Public Hazard Tracking Dossier
        </h1>
        <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
          Verify live dispatch milestones, assigned municipal personnel, audio telemetry, and GPS-certified photo resolution records.
        </p>
      </div>

      {/* Search Bar Terminal */}
      <div data-ui="true" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter Tracking Token (e.g., CF-8421-E9A1)"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 tabular-nums text-base uppercase focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold text-navy-950 placeholder:text-slate-400 placeholder:normal-case"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
          </div>
          <button
            type="submit"
            className="px-7 py-3.5 bg-teal-700 hover:bg-teal-600 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span>Track Dossier</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Token Shortcuts */}
        <div data-ui="true" className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Sample Active Dossiers:</span>
          {incidents.slice(0, 4).map(inc => (
            <button
              key={inc.id}
              onClick={() => {
                setInputToken(inc.tracking_token);
                navigate(`/track/${inc.tracking_token}`);
              }}
              className="tabular-nums bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-800 px-2.5 py-1 rounded-md transition-colors text-xs font-semibold border border-slate-200"
            >
              #{inc.tracking_token} &bull; <span className="capitalize">{inc.status.replace('_', ' ')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Not Found State */}
      {searched && !currentIncident && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-navy-950">No Registered Incident Found</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            No public hazard record matches token <strong className="text-navy-900">"{inputToken}"</strong>. Please confirm the token from your submission receipt.
          </p>
        </div>
      )}

      {/* Current Incident Dossier */}
      {currentIncident && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Header Card: Token, Title, Status & Stepper */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-8">
            
            <div data-ui="true" className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-bold text-navy-950 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 tabular-nums">
                    #{currentIncident.tracking_token}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg capitalize border ${
                    currentIncident.severity === 'critical' ? 'bg-red-50 text-red-800 border-red-200' :
                    currentIncident.severity === 'medium' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {currentIncident.severity} Severity
                  </span>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg capitalize border border-slate-200">
                    {currentIncident.category.replace('_', ' ')}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-navy-950 leading-tight">
                  {currentIncident.title}
                </h2>

                <p className="text-sm text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{currentIncident.address} {currentIncident.landmark ? `(${currentIncident.landmark})` : ''}</span>
                </p>
              </div>

              <div className="sm:text-right shrink-0">
                <span className="text-xs font-semibold text-slate-500 block">Resolution State</span>
                <span className={`inline-flex items-center gap-2 mt-1.5 px-3.5 py-1.5 rounded-lg text-sm font-bold capitalize border ${
                  isRejected ? 'bg-slate-100 text-slate-800 border-slate-300' :
                  currentIncident.status === 'resolved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  currentIncident.status === 'in_progress' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  'bg-teal-50 text-teal-800 border-teal-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    isRejected ? 'bg-slate-500' :
                    currentIncident.status === 'resolved' ? 'bg-emerald-600' :
                    currentIncident.status === 'in_progress' ? 'bg-amber-500' :
                    'bg-teal-600'
                  }`} />
                  <span>{currentIncident.status.replace('_', ' ')}</span>
                </span>
              </div>
            </div>

            {/* Rejection Advisory */}
            {isRejected && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Incident Flagged as Non-Actionable or Duplicate</span>
                </p>
                <p className="text-red-800 text-xs leading-relaxed">
                  <strong>Municipal Finding:</strong> {currentIncident.rejection_reason || 'Does not fall within municipal jurisdiction or represents a verified duplicate.'}
                </p>
              </div>
            )}

            {/* Resolution Progress Stepper */}
            {!isRejected && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy-950">Resolution Milestones</h3>
                  <span className="text-xs font-semibold text-teal-800">
                    Step {Math.min(currentStageIndex + 1, STAGES.length)} of {STAGES.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {STAGES.map((stg, idx) => {
                    const isCompleted = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;

                    return (
                      <div 
                        key={stg.key}
                        className={`p-3.5 rounded-xl border transition-colors ${
                          isCurrent
                            ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20'
                            : isCompleted
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-white border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                            isCompleted ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <span className={`text-sm font-bold ${isCurrent ? 'text-teal-900' : isCompleted ? 'text-navy-950' : 'text-slate-500'}`}>
                            {stg.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">
                          {stg.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Incident Information & Photographic Evidence Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Detailed Report Information */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-navy-950">Intake Dossier &amp; Crew Details</h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-1">Hazard Description</span>
                  <p className="text-base text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {currentIncident.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Reported At
                    </span>
                    <span className="font-semibold text-slate-800 block">
                      {new Date(currentIncident.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Dispatched Crew
                    </span>
                    <span className="font-semibold text-slate-800 block">
                      {currentIncident.assigned_crew_name || 'Pending Crew Allocation'}
                    </span>
                  </div>
                </div>

                {currentIncident.resolution_notes && (
                  <div>
                    <span className="text-xs font-bold text-slate-600 block mb-1">
                      Official Clearance Certification
                    </span>
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-1">
                      <p className="text-sm font-semibold text-emerald-950 leading-relaxed">
                        {currentIncident.resolution_notes}
                      </p>
                    </div>
                  </div>
                )}

                {currentIncident.audio_url && (
                  <div data-ui="true" className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-teal-700" />
                      <span>Citizen Audio Telemetry Attachment</span>
                    </span>
                    <audio controls src={currentIncident.audio_url} className="w-full h-8" />
                    {currentIncident.audio_transcript && (
                      <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100">
                        "{currentIncident.audio_transcript}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Citizen Privacy Safeguard Note */}
              <div data-ui="true" className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Reporter identity and internal dispatch radio telemetry are securely masked on this public ledger.</span>
              </div>
            </div>

            {/* Right Column: Visual Photographic Evidence */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span>Photographic Evidence</span>
                </h3>

                <div className="space-y-4">
                  {/* Before Photo */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-600 block">Initial Hazard Condition</span>
                    {currentIncident.photo_url ? (
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <img 
                          src={currentIncident.photo_url} 
                          alt="Initial hazard evidence"
                          className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-36 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-500">
                        No photograph submitted with report
                      </div>
                    )}
                  </div>

                  {/* After Photo */}
                  {currentIncident.resolution_photo_url && (
                    <div data-ui="true" className="space-y-1.5 pt-3 border-t border-slate-100">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Certified Resolution Evidence</span>
                      </span>
                      <div className="overflow-hidden rounded-xl border border-emerald-300 ring-2 ring-emerald-500/20 bg-emerald-50">
                        <img 
                          src={currentIncident.resolution_photo_url} 
                          alt="Certified repair evidence"
                          className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Public Audit Trail Log */}
              {currentIncident.audit_trail && currentIncident.audit_trail.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-navy-950">Verified Dispatch Audit Trail</h3>
                  <div className="space-y-2.5">
                    {currentIncident.audit_trail.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-navy-900 capitalize bg-slate-200 px-2 py-0.5 rounded">
                            {log.new_status.replace('_', ' ')}
                          </span>
                          <span className="text-slate-500 tabular-nums">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700">{log.notes}</p>
                        <span className="text-slate-400 block text-[11px] font-medium">Logged by: {log.actor_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
