import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  AlertTriangle, 
  Search, 
  Wrench, 
  Eye, 
  X, 
  Sparkles, 
  Download, 
  Printer, 
  Moon, 
  Sun, 
  Volume2,
  MapPin,
  Lock,
  Satellite
} from 'lucide-react';
import { exportIncidentsToCSV, printMunicipalBriefing } from '../lib/exportUtils';
import IncidentMap from '../components/IncidentMap';

const CREW_TEAMS = [
  { id: 'crew-01', name: 'Crew Alpha — High Voltage Quick Response', dept: 'Electrical Services' },
  { id: 'crew-02', name: 'Crew Bravo — Water & Sewerage Rapid Unit', dept: 'Water Works' },
  { id: 'crew-03', name: 'Crew Charlie — Pothole & Roadway Patch', dept: 'Civil Infrastructure' },
  { id: 'crew-04', name: 'Crew Delta — Sanitation & Environmental Services', dept: 'Sanitation' }
];

const PIE_COLORS = ['#DC2626', '#D97706', '#059669', '#3B82F6', '#0D9488'];

export default function AdminDashboard() {
  const { 
    incidents, 
    verifyIncident, 
    rejectIncident, 
    assignCrew, 
    changePriority, 
    updateStatus 
  } = useApp();

  // Search, Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('urgency'); // 'urgency' | 'newest' | 'oldest'
  const [controlRoomDark, setControlRoomDark] = useState(false);

  // Selected Incident for Detail Drawer
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Action Modals State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState(CREW_TEAMS[0].id);
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [newPriority, setNewPriority] = useState('critical');
  const [priorityReason, setPriorityReason] = useState('');

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolvePhoto, setResolvePhoto] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // KPI Calculations
  const totalCount = incidents.length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'rejected').length;
  const unassignedCount = incidents.filter(i => i.status === 'reported' || (i.status === 'verified' && !i.assigned_crew_id)).length;
  const inProgressCount = incidents.filter(i => i.status === 'in_progress').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;

  // Analytics Data for Recharts
  const categoryChartData = useMemo(() => {
    const counts = {};
    incidents.forEach(i => {
      const catKey = i.category.replace('_', ' ');
      counts[catKey] = (counts[catKey] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [incidents]);

  const statusChartData = useMemo(() => {
    const counts = {};
    incidents.forEach(i => {
      const st = i.status.replace('_', ' ');
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  // Filtered & Sorted Incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesToken = inc.tracking_token?.toLowerCase().includes(q);
        const matchesTitle = inc.title?.toLowerCase().includes(q);
        const matchesLandmark = inc.landmark?.toLowerCase().includes(q);
        const matchesAddress = inc.address?.toLowerCase().includes(q);
        if (!matchesToken && !matchesTitle && !matchesLandmark && !matchesAddress) {
          return false;
        }
      }
      // Severity Filter
      if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
      // Category Filter
      if (categoryFilter !== 'all' && inc.category !== categoryFilter) return false;
      // Status Filter
      if (statusFilter !== 'all' && inc.status !== statusFilter) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'urgency') {
        const score = { critical: 3, medium: 2, low: 1 };
        return (score[b.severity] || 0) - (score[a.severity] || 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return 0;
    });
  }, [incidents, searchTerm, severityFilter, categoryFilter, statusFilter, sortBy]);

  // Paginated Incidents
  const paginatedIncidents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredIncidents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredIncidents, currentPage]);

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage) || 1;

  // Actions
  const handleVerify = (inc) => {
    verifyIncident(inc.id);
    setSelectedIncident(prev => prev?.id === inc.id ? { ...prev, status: 'verified' } : prev);
  };

  const handleConfirmReject = () => {
    if (!selectedIncident) return;
    rejectIncident(selectedIncident.id, rejectReason);
    setRejectModalOpen(false);
    setRejectReason('');
    setSelectedIncident(null);
  };

  const handleConfirmAssign = () => {
    if (!selectedIncident) return;
    const team = CREW_TEAMS.find(c => c.id === selectedCrewId) || CREW_TEAMS[0];
    assignCrew(selectedIncident.id, team.id, team.name, assignmentNotes);
    setAssignModalOpen(false);
    setAssignmentNotes('');
    setSelectedIncident(prev => prev ? { ...prev, assigned_crew_id: team.id, assigned_crew_name: team.name, status: 'assigned' } : null);
  };

  const handleConfirmPriority = () => {
    if (!selectedIncident) return;
    changePriority(selectedIncident.id, newPriority, priorityReason);
    setPriorityModalOpen(false);
    setPriorityReason('');
    setSelectedIncident(prev => prev ? { ...prev, severity: newPriority } : null);
  };

  const handleConfirmResolve = () => {
    if (!selectedIncident) return;
    updateStatus(selectedIncident.id, 'resolved', resolveNotes, 'Municipal Operations Admin', resolvePhoto);
    setResolveModalOpen(false);
    setResolveNotes('');
    setResolvePhoto('');
    setSelectedIncident(null);
  };

  return (
    <div className={`transition-colors duration-200 ${controlRoomDark ? 'bg-slate-950 text-slate-100 min-h-dvh -mt-4 py-8' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${controlRoomDark ? 'text-white' : 'text-navy-950'}`}>
              Incident Operations Command
            </h1>
            <p className={`text-base max-w-2xl leading-relaxed ${controlRoomDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Review citizen infrastructure complaints, evaluate automated computer vision triage ratings, and direct specialized field response crews.
            </p>
          </div>

          {/* Action Tools: Export CSV, Print PDF Briefing, and NOC Dark Mode */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportIncidentsToCSV(filteredIncidents)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors shadow-xs"
              title="Download filtered complaints as CSV spreadsheet"
            >
              <Download className="w-4 h-4 text-teal-700" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => printMunicipalBriefing(incidents)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-colors"
              title="Open official printable municipal briefing"
            >
              <Printer className="w-4 h-4 text-navy-900" />
              <span>Print Briefing</span>
            </button>

            <button
              onClick={() => setControlRoomDark(!controlRoomDark)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors shadow-xs ${
                controlRoomDark
                  ? 'bg-slate-800 border-slate-700 text-teal-300 hover:bg-slate-700'
                  : 'bg-navy-950 border-navy-900 text-slate-200 hover:bg-navy-900'
              }`}
              title="Toggle NOC Control Room Dark Theme"
            >
              {controlRoomDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-teal-400" />}
              <span>{controlRoomDark ? 'Standard Theme' : 'NOC Dark Mode'}</span>
            </button>
          </div>
        </div>

      {/* KPI Command Bar — Numbers First Telemetry */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-3xl sm:text-4xl font-black text-navy-950 tabular-nums block">{totalCount}</span>
          <span className="text-xs font-bold text-slate-700 block">Total Registered</span>
          <span className="text-xs text-slate-500 block">All recorded tickets</span>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-xs space-y-1">
          <span className="text-3xl sm:text-4xl font-black text-red-600 tabular-nums block">{criticalCount}</span>
          <span className="text-xs font-bold text-red-700 block">Critical Hazards</span>
          <span className="text-xs text-slate-500 block">Immediate risk to life</span>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs space-y-1">
          <span className="text-3xl sm:text-4xl font-black text-amber-600 tabular-nums block">{unassignedCount}</span>
          <span className="text-xs font-bold text-amber-800 block">Pending Triage</span>
          <span className="text-xs text-slate-500 block">Awaiting crew dispatch</span>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-teal-200 shadow-xs space-y-1">
          <span className="text-3xl sm:text-4xl font-black text-teal-800 tabular-nums block">{inProgressCount}</span>
          <span className="text-xs font-bold text-teal-900 block">Active Field Repairs</span>
          <span className="text-xs text-slate-500 block">Crews currently on-site</span>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <span className="text-3xl sm:text-4xl font-black text-emerald-600 tabular-nums block">{resolvedCount}</span>
          <span className="text-xs font-bold text-emerald-800 block">Certified Resolved</span>
          <span className="text-xs text-slate-500 block">Repaired &amp; verified</span>
        </div>
      </div>

      {/* Recharts Analytics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-navy-900 mb-4 flex items-center gap-2">
            <span>Hazards by Category Distribution</span>
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B132B', color: '#fff', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-navy-900 mb-4">Status Breakdown</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B132B', color: '#fff', borderRadius: '8px', fontSize: '12px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search token, title, address, or landmark..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">Severity: All</option>
              <option value="critical">Critical</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white max-w-[130px] truncate"
            >
              <option value="all">Type: All</option>
              <option value="electrical_hazard">Electrical</option>
              <option value="burst_water_pipe">Water Pipe</option>
              <option value="open_manhole">Open Manhole</option>
              <option value="pothole">Pothole</option>
              <option value="sanitation_issue">Sanitation</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">Status: All</option>
              <option value="reported">Reported</option>
              <option value="verified">Verified</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="urgency">Sort: Urgency</option>
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>

        </div>
      </div>

      {/* Incident Records Table */}
      <div data-ui="true" className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr data-ui="true" className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Token</th>
                <th className="p-3.5">Hazard Title &amp; Address</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assigned Crew</th>
                <th className="p-3.5">AI Insights</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody data-ui="true" className="divide-y divide-slate-100 text-slate-700">
              {paginatedIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No incidents matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedIncidents.map(inc => {
                  const isCritical = inc.severity === 'critical';
                  const isMedium = inc.severity === 'medium';

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-bold text-navy-950 tabular-nums font-sans text-xs bg-slate-100 px-2 py-1 rounded-md">
                          #{inc.tracking_token}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <p className="font-bold text-navy-950 text-sm line-clamp-1">{inc.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{inc.address}</span>
                        </p>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold capitalize border ${
                          isCritical ? 'bg-red-50 text-red-800 border-red-200' :
                          isMedium ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="capitalize font-semibold text-slate-800 text-xs">
                          {inc.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 whitespace-nowrap">
                        {inc.assigned_crew_name ? (
                          <span className="text-xs font-semibold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                            {inc.assigned_crew_name.split('—')[0]}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {inc.ai_duplicate_flag ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Possible Dup
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 font-medium">
                            {inc.ai_category_suggestion ? 'Classified' : 'Standard'}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedIncident(inc)}
                          className="px-3.5 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-white font-bold text-xs flex items-center gap-1.5 ml-auto transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div data-ui="true" className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredIncidents.length} total filtered)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-white border border-slate-300 disabled:opacity-40 font-semibold text-slate-700"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-white border border-slate-300 disabled:opacity-40 font-semibold text-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Incident Detail Drawer / Modal */}
      {selectedIncident && (
        <div data-ui="true" className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-end animate-in fade-in duration-150">
          <div data-ui="true" className="w-full max-w-xl bg-white h-full border-l border-slate-200 flex flex-col overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-5 bg-navy-900 text-white flex items-center justify-between">
              <div>
                <code className="text-[11px] text-teal-300 font-bold">
                  #{selectedIncident.tracking_token}
                </code>
                <h3 className="text-base font-bold mt-0.5 line-clamp-1">{selectedIncident.title}</h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto text-xs text-slate-700">
              
              {/* Status and Action Buttons */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Current Status:</span>
                  <span className="font-extrabold uppercase px-2 py-0.5 rounded text-navy-900 bg-white border border-slate-200">
                    {selectedIncident.status.replace('_', ' ')}
                  </span>
                </div>

                <div data-ui="true" className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  {selectedIncident.status === 'reported' && (
                    <button
                      onClick={() => handleVerify(selectedIncident)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold transition-colors"
                    >
                      Verify Incident
                    </button>
                  )}

                  <button
                    onClick={() => setAssignModalOpen(true)}
                    className="px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-bold shadow-xs flex items-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Assign Crew
                  </button>

                  <button
                    onClick={() => setPriorityModalOpen(true)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg font-bold"
                  >
                    Adjust Priority
                  </button>

                  <button
                    onClick={() => setResolveModalOpen(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs"
                  >
                    Mark Resolved
                  </button>

                  {selectedIncident.status !== 'rejected' && (
                    <button
                      onClick={() => setRejectModalOpen(true)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>

              {/* AI Triage & Analysis Insight */}
              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-teal-900 text-xs">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>AI Triage &amp; Risk Diagnostic</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Priority Assessment:</strong> {selectedIncident.ai_priority_suggestion || 'Calculated based on municipal risk factors.'}
                </p>
                {selectedIncident.ai_duplicate_flag && (
                  <p className="text-amber-800 font-semibold bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{selectedIncident.ai_flag_reason}</span>
                  </p>
                )}
              </div>

              {/* Full Description & Location */}
              <div className="space-y-3">
                <h4 className="font-bold text-navy-900 text-sm">Incident Description</h4>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  {selectedIncident.description}
                </p>
                <div>
                  <span className="font-semibold text-slate-500">Address: </span>
                  <span className="font-bold text-slate-800">{selectedIncident.address}</span>
                  {selectedIncident.landmark && (
                    <span className="text-slate-500"> ({selectedIncident.landmark})</span>
                  )}
                </div>
                {selectedIncident.reporter_contact && (
                  <div className="bg-slate-100 p-2.5 rounded-lg text-slate-700 text-[11px] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Reporter Contact: {selectedIncident.reporter_name} ({selectedIncident.reporter_contact})</span>
                  </div>
                )}

                {/* Satellite Aerial Site Inspection */}
                {selectedIncident.latitude && selectedIncident.longitude && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                        <Satellite className="w-3.5 h-3.5 text-teal-600" />
                        <span>Satellite Aerial Reconnaissance</span>
                      </h4>
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {selectedIncident.latitude.toFixed(5)}, {selectedIncident.longitude.toFixed(5)}
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xs">
                      <IncidentMap 
                        incidents={[selectedIncident]} 
                        singleIncident={selectedIncident} 
                        height="200px" 
                        defaultMapType="satellite" 
                        showControls={false}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Citizen Audio Voice Note */}
              {selectedIncident.audio_url && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-navy-900">
                    <Volume2 className="w-4 h-4 text-teal-600" />
                    <span>Citizen Audio Voice Memo</span>
                  </div>
                  <audio controls src={selectedIncident.audio_url} className="w-full h-8" />
                  {selectedIncident.audio_transcript && (
                    <p className="text-[11px] text-slate-600 italic">
                      Transcript: "{selectedIncident.audio_transcript}"
                    </p>
                  )}
                </div>
              )}

              {/* Photos */}
              {selectedIncident.photo_url && (
                <div>
                  <h4 className="font-bold text-navy-900 text-sm mb-2">Attached Citizen Photo</h4>
                  <img 
                    src={selectedIncident.photo_url} 
                    alt="Citizen photo" 
                    className="w-full h-48 object-cover rounded-xl border border-slate-200"
                  />
                </div>
              )}

              {/* Audit History Timeline */}
              {selectedIncident.audit_trail && (
                <div className="space-y-2">
                  <h4 className="font-bold text-navy-900 text-sm">Action Audit History</h4>
                  <div className="space-y-2">
                    {selectedIncident.audit_trail.map(log => (
                      <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex justify-between font-semibold">
                          <span className="capitalize text-teal-800">{log.new_status.replace('_', ' ')}</span>
                          <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{log.notes}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">Actor: {log.actor_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div data-ui="true" className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
          <div data-ui="true" className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-navy-900">Reject Incident Report</h3>
            <p className="text-xs text-slate-500">
              Provide a clear administrative reason for rejection (e.g., private property issue, outside municipal jurisdiction, or duplicate).
            </p>
            <textarea
              rows={3}
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Crew Modal */}
      {assignModalOpen && (
        <div data-ui="true" className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
          <div data-ui="true" className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-navy-900">Dispatch Specialized Field Crew</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Unit</label>
              <select
                value={selectedCrewId}
                onChange={(e) => setSelectedCrewId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-navy-900 bg-white"
              >
                {CREW_TEAMS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Instructions (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Bring heavy excavation gear and safety barriers"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Priority Modal */}
      {priorityModalOpen && (
        <div data-ui="true" className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
          <div data-ui="true" className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-navy-900">Adjust Incident Severity Level</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Severity</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-navy-900"
              >
                <option value="critical">Critical (Life Safety)</option>
                <option value="medium">Medium (Infrastructure / Transit)</option>
                <option value="low">Low (Routine)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Rationale</label>
              <input
                type="text"
                placeholder="e.g., Confirmed live conductor near pedestrian walkway"
                value={priorityReason}
                onChange={(e) => setPriorityReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPriorityModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPriority}
                className="px-4 py-2 rounded-lg bg-navy-900 text-white text-xs font-bold"
              >
                Update Priority
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Resolved Modal */}
      {resolveModalOpen && (
        <div data-ui="true" className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
          <div data-ui="true" className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-navy-900">Certify Resolution</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Summary <span className="text-red-500">*</span></label>
              <textarea
                rows={3}
                placeholder="e.g., Replacement conduit installed, water main pressure certified, trench backfilled."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Evidence Photo URL (Optional)</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={resolvePhoto}
                onChange={(e) => setResolvePhoto(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResolveModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
