import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SupabaseModal from './SupabaseModal';
import DemoTourModal from './DemoTourModal';
import { 
  ShieldAlert, 
  MapPin, 
  PlusCircle, 
  Search, 
  LayoutDashboard, 
  Wrench, 
  Bell, 
  Menu, 
  X, 
  RotateCcw,
  UserCheck,
  Volume2,
  VolumeX,
  Sparkles,
  Database
} from 'lucide-react';

export default function Navigation() {
  const { 
    currentRole, 
    setCurrentRole, 
    notifications, 
    markNotificationsRead, 
    resetDemoData, 
    soundMuted, 
    toggleSound,
    isSupabaseConfigured 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [demoTourModalOpen, setDemoTourModalOpen] = useState(false);
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white overflow-x-clip border-b border-zinc-200">
        {/* Top Municipal System Notice Banner */}
        <div className="bg-zinc-950 text-zinc-300 text-sm px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span>Municipal Infrastructure Grid &amp; Hazard Dispatch</span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden md:inline text-zinc-400 font-normal">
              For immediate life-safety emergencies, call 911 / 112.
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {/* Interactive Demo Tour Trigger */}
            <button
              onClick={() => setDemoTourModalOpen(true)}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white px-2.5 py-0.5 rounded border border-zinc-700 font-bold transition-colors"
              title="Start guided 4-step evaluator tour"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-300 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Demo Tour</span>
            </button>

            {/* Supabase Cloud Connection Status */}
            <button
              onClick={() => setSupabaseModalOpen(true)}
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-0.5 rounded border border-zinc-700 text-zinc-300 transition-colors"
              title="Click to view database connection status and setup guide"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-white' : 'bg-zinc-400'}`}></span>
              <Database className="w-3 h-3 text-zinc-400" />
              <span className="text-xs font-semibold hidden sm:inline">
                {isSupabaseConfigured ? 'Cloud Synced' : 'Local Storage'}
              </span>
            </button>

            {/* Reset Seed Data */}
            <button 
              onClick={resetDemoData}
              title="Reset data back to initial seed dataset"
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden lg:inline">Reset Data</span>
            </button>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center border border-zinc-900 transition-transform">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-zinc-950">CivicFix</span>
                  <span className="px-1.5 py-0.5 text-xs font-bold bg-zinc-950 text-white rounded">AI</span>
                </div>
                <p className="text-sm text-zinc-500 font-semibold">Smart Hazard Dispatch</p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/') ? 'text-white bg-zinc-950 font-bold' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                Public Overview
              </Link>
              <Link
                to="/report"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/report') ? 'text-white bg-zinc-950 font-bold' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                <PlusCircle className={`w-4 h-4 ${isActive('/report') ? 'text-white' : 'text-zinc-500'}`} />
                Report Hazard
              </Link>
              <Link
                to="/track"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/track') ? 'text-white bg-zinc-950 font-bold' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                <Search className={`w-4 h-4 ${isActive('/track') ? 'text-white' : 'text-zinc-500'}`} />
                Track Complaint
              </Link>
              <Link
                to="/map"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/map') ? 'text-white bg-zinc-950 font-bold' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                <MapPin className={`w-4 h-4 ${isActive('/map') ? 'text-white' : 'text-zinc-500'}`} />
                Live Map
              </Link>

              {/* Role-Specific Portal Links */}
              <div data-ui="true" className="h-4 w-px bg-zinc-200 mx-1.5" />
              
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'text-white bg-zinc-950 font-bold'
                    : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${isActive('/admin') ? 'text-white' : 'text-zinc-600'}`} />
                Command Center
              </Link>
              <Link
                to="/crew"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/crew')
                    ? 'text-white bg-zinc-950 font-bold'
                    : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                <Wrench className={`w-4 h-4 ${isActive('/crew') ? 'text-white' : 'text-zinc-600'}`} />
                Field Crew
              </Link>
            </nav>

            {/* Right Controls: Sound Toggle + Notification Bell + Role Switcher */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Audio Chime Mute / Unmute Button */}
              <button
                onClick={toggleSound}
                className={`p-2 rounded-lg transition-colors ${
                  soundMuted 
                    ? 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100' 
                    : 'text-zinc-900 hover:bg-zinc-100'
                }`}
                title={soundMuted ? 'Sound alerts are muted (Click to unmute)' : 'Sound alerts enabled (Click to mute)'}
                aria-label="Toggle sound alerts"
              >
                {soundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* Notifications Popover */}
              <div className="relative">
                <button
                  onClick={() => setNotifsOpen(!notifsOpen)}
                  className="relative p-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors"
                  title="Notifications"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-zinc-950 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifsOpen && (
                  <div data-ui="true" className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-zinc-200 shadow-xs py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div data-ui="true" className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
                      <span className="font-bold text-sm text-zinc-950">Incident Alerts &amp; Updates</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markNotificationsRead}
                          className="text-xs text-zinc-600 hover:text-zinc-950 font-semibold underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div data-ui="true" className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-zinc-500">No active notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`p-3.5 hover:bg-zinc-50 transition-colors ${!n.isRead ? 'bg-zinc-100/60' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-zinc-900">{n.title}</p>
                              <span className="text-[10px] text-zinc-400 shrink-0">{n.time}</span>
                            </div>
                            <p className="text-xs text-zinc-600 mt-1">{n.message}</p>
                            {n.trackingToken && (
                              <Link 
                                to={`/track/${n.trackingToken}`}
                                onClick={() => setNotifsOpen(false)}
                                className="inline-block mt-2 text-[11px] font-bold text-zinc-950 hover:underline"
                              >
                                Track #{n.trackingToken} &rarr;
                              </Link>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive User Role Switcher */}
              <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                <span className="hidden xl:inline text-[11px] font-medium text-zinc-600 px-2 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Mode:
                </span>
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="bg-white text-xs font-bold text-zinc-950 py-1.5 px-2.5 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
                  title="Select role to evaluate citizen, admin, or crew permissions"
                >
                  <option value="citizen">Citizen Mode</option>
                  <option value="admin">Municipal Admin</option>
                  <option value="crew">Field Crew</option>
                </select>
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-zinc-700 hover:text-zinc-950 rounded-lg hover:bg-zinc-100"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div data-ui="true" className="lg:hidden border-t border-zinc-200 bg-white px-4 pt-2 pb-4 space-y-1 animate-in fade-in duration-150">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive('/') ? 'text-white bg-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Public Overview
            </Link>
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium ${
                isActive('/report') ? 'text-white bg-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-zinc-500" />
              Report Hazard
            </Link>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium ${
                isActive('/track') ? 'text-white bg-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Search className="w-4 h-4 text-zinc-500" />
              Track Complaint
            </Link>
            <Link
              to="/map"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium ${
                isActive('/map') ? 'text-white bg-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <MapPin className="w-4 h-4 text-zinc-500" />
              Live Hazard Map
            </Link>
            <div data-ui="true" className="pt-2 border-t border-zinc-100">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium ${
                  isActive('/admin') ? 'text-white bg-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-zinc-500" />
                Municipal Command Center
              </Link>
              <Link
                to="/crew"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium ${
                  isActive('/crew') ? 'text-white bg-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Wrench className="w-4 h-4 text-zinc-500" />
                Field Crew Work Orders
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Supabase Diagnostic & Setup Modal */}
      <SupabaseModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />

      {/* Interactive End-to-End Walkthrough Tour Modal */}
      <DemoTourModal
        isOpen={demoTourModalOpen}
        onClose={() => setDemoTourModalOpen(false)}
      />
    </>
  );
}
