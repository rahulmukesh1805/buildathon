import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  LayoutDashboard, 
  Wrench, 
  Search, 
  X,
  Compass
} from 'lucide-react';

export default function DemoTourModal({ isOpen, onClose }) {
  const { setCurrentRole, incidents, showToast } = useApp();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: 'Welcome to CivicFix AI Walkthrough Tour',
      badge: 'Overview',
      icon: <Compass className="w-6 h-6 text-teal-400" />,
      desc: 'This interactive tour walks you through the entire end-to-end municipal hazard lifecycle in 4 clear stages: Citizen Reporting, AI Triage, Admin Dispatch, Crew Repair, and Public Verification.',
      actionLabel: 'Begin Interactive Tour',
      onExecute: () => {
        setCurrentStep(1);
      }
    },
    {
      title: 'Stage 1: Citizen Hazard Intake & AI Assistant',
      badge: 'Citizen Portal',
      icon: <ShieldAlert className="w-6 h-6 text-amber-400" />,
      desc: 'Citizens report hazards with photos, voice notes, and exact map pins. The transparent AI engine instantly classifies the category, assesses hazard severity, and warns if a duplicate exists within 350 meters.',
      actionLabel: 'Go to Citizen Report Page',
      onExecute: () => {
        setCurrentRole('citizen');
        navigate('/report');
        onClose();
        showToast('info', 'Stage 1: Try filling the form or click "Autofill Demo Hazard" on the report page!');
      }
    },
    {
      title: 'Stage 2: Municipal Command Center & Triage',
      badge: 'Admin Dispatcher',
      icon: <LayoutDashboard className="w-6 h-6 text-blue-400" />,
      desc: 'City dispatchers review real-time KPI counters, Recharts analytics, and AI priority recommendations. Dispatchers can verify incidents, assign specialized crews, or export reports to CSV/PDF.',
      actionLabel: 'Switch to Command Center',
      onExecute: () => {
        setCurrentRole('admin');
        navigate('/admin');
        onClose();
        showToast('info', 'Stage 2: Switched to Municipal Command Center. Review incoming hazards and assign a crew!');
      }
    },
    {
      title: 'Stage 3: Field Crew Mobile Work Orders',
      badge: 'Field Technician',
      icon: <Wrench className="w-6 h-6 text-emerald-400" />,
      desc: 'Field technicians receive assigned work orders on mobile/tablet, navigate to coordinates, transition status to "In Progress", and upload photographic proof of work upon completion.',
      actionLabel: 'Open Field Crew Orders',
      onExecute: () => {
        setCurrentRole('crew');
        navigate('/crew');
        onClose();
        showToast('info', 'Stage 3: Switched to Crew Alpha. Update work order status and attach completion proof!');
      }
    },
    {
      title: 'Stage 4: Transparent Public Resolution Tracking',
      badge: 'Citizen Verification',
      icon: <Search className="w-6 h-6 text-cyan-400" />,
      desc: 'Citizens track their complaint via a non-guessable token (e.g., #CF-8421-E9A1). The 5-stage timeline displays verified timestamps, audit logs, and before/after repair photos without leaking personal data.',
      actionLabel: 'Track Sample Complaint',
      onExecute: () => {
        setCurrentRole('citizen');
        const token = incidents[0]?.tracking_token || 'CF-8421-E9A1';
        navigate(`/track/${token}`);
        onClose();
        showToast('info', `Stage 4: Inspecting live 5-stage timeline for #${token}!`);
      }
    }
  ];

  const step = tourSteps[currentStep];

  return (
    <div data-ui="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 animate-in fade-in duration-200">
      <div data-ui="true" className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div data-ui="true" className="bg-navy-900 text-white px-6 py-5 flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              {step.icon}
            </div>
            <div>
              <span className="text-xs font-semibold text-teal-400 bg-teal-950 px-2.5 py-1 rounded border border-teal-800">
                {step.badge} • Step {currentStep + 1} of {tourSteps.length}
              </span>
              <h2 className="text-base font-bold text-white mt-1.5">{step.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {step.desc}
          </p>

          {/* Stepper Progress Indicator */}
          <div className="flex items-center justify-between gap-1 pt-2">
            {tourSteps.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-teal-500' : idx < currentStep ? 'bg-navy-800' : 'bg-slate-200'
                }`}
                title={`Go to Step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div data-ui="true" className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {currentStep < tourSteps.length - 1 ? (
              <button
                onClick={() => {
                  step.onExecute();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition-colors"
              >
                <span>{step.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  step.onExecute();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <span>{step.actionLabel}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
