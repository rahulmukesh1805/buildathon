import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import ReportHazardPage from './pages/ReportHazardPage';
import TrackComplaintPage from './pages/TrackComplaintPage';
import AdminDashboard from './pages/AdminDashboard';
import CrewDashboard from './pages/CrewDashboard';
import MapPage from './pages/MapPage';
import { ShieldAlert, CheckCircle2, AlertCircle, Info } from 'lucide-react';

function ToastContainer() {
  const { toast } = useApp();
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200" data-ui="true">
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        isSuccess ? 'bg-emerald-900 text-white border-emerald-700' :
        isError ? 'bg-red-900 text-white border-red-700' :
        'bg-navy-900 text-white border-slate-700'
      }`}>
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
        {isError && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />}
        <div className="text-xs font-medium leading-relaxed">
          {toast.message}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-teal-600 text-white flex items-center justify-center font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">CivicFix AI</span>
              <span className="px-1.5 py-0.5 text-xs bg-slate-800 text-teal-300 font-bold rounded">v1.0</span>
            </div>
            <p className="text-slate-300 max-w-md leading-relaxed text-sm">
              Smart municipal infrastructure hazard reporting, transparent priority triage, crew dispatch coordination, and citizen tracking platform.
            </p>
            <p className="text-sm text-slate-400 leading-normal">
              CivicFix AI is an infrastructure incident management system. It is not an emergency response hotline. In life-threatening emergencies, contact official emergency services directly.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white text-base mb-3">Citizen Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/report" className="hover:text-teal-300 transition-colors">Report Infrastructure Hazard</Link></li>
              <li><Link to="/track" className="hover:text-teal-300 transition-colors">Track Complaint by Token</Link></li>
              <li><Link to="/map" className="hover:text-teal-300 transition-colors">Live Incident Map</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-base mb-3">Municipal Operations</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/admin" className="hover:text-teal-300 transition-colors">Operations Command Center</Link></li>
              <li><Link to="/crew" className="hover:text-teal-300 transition-colors">Field Crew Work Orders</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <p>© 2026 CivicFix AI Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for civic resilience and transparent infrastructure maintenance.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-dvh flex flex-col bg-slate-50 text-slate-800">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/report" element={<ReportHazardPage />} />
              <Route path="/track" element={<TrackComplaintPage />} />
              <Route path="/track/:token" element={<TrackComplaintPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/crew" element={<CrewDashboard />} />
              <Route path="/map" element={<MapPage />} />
            </Routes>
          </main>
          <Footer />
          <ToastContainer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
