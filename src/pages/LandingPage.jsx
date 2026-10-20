import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import IncidentMap from '../components/IncidentMap';
import { 
  PlusCircle, 
  Search, 
  ArrowRight,
  ExternalLink,
  Info,
  MapPin,
  Cpu,
  Radio
} from 'lucide-react';

const HAZARD_SAMPLES = [
  {
    id: 'sample-pothole',
    title: 'Severe Asphalt Trenching',
    location: '4th Ave & Pine St (Ward 3)',
    category: 'Road Infrastructure',
    severity: 'High',
    severityColor: 'text-zinc-100 bg-zinc-800 border-zinc-700',
    confidence: '98.8%',
    dept: 'Public Works Highway Div',
    sla: '45 mins'
  },
  {
    id: 'sample-wire',
    title: 'Exposed 480V Powerline',
    location: 'Elm Blvd & 12th St (Ward 1)',
    category: 'Electrical Safety',
    severity: 'Critical',
    severityColor: 'text-white bg-zinc-950 border-zinc-600 font-bold',
    confidence: '99.4%',
    dept: 'Emergency Grid Engineering',
    sla: '15 mins'
  },
  {
    id: 'sample-water',
    title: 'High-Pressure Main Surge',
    location: 'Oak Crest Lane (Ward 7)',
    category: 'Water & Utilities',
    severity: 'High',
    severityColor: 'text-zinc-100 bg-zinc-800 border-zinc-700',
    confidence: '97.2%',
    dept: 'Municipal Water & Sewerage',
    sla: '30 mins'
  }
];

export default function LandingPage() {
  const { incidents, playSound } = useApp();
  const [quickToken, setQuickToken] = useState('');
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [monthlyReports, setMonthlyReports] = useState(380);
  const [simulationTriggered, setSimulationTriggered] = useState(false);
  const navigate = useNavigate();

  // Metrics computation from real database
  const totalCount = incidents.length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'rejected').length;
  const inProgressCount = incidents.filter(i => i.status === 'in_progress' || i.status === 'assigned').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;

  const activeSample = HAZARD_SAMPLES[activeSampleIndex];

  const handleQuickTrack = (e) => {
    e.preventDefault();
    if (quickToken.trim()) {
      navigate(`/track/${quickToken.trim().toUpperCase()}`);
    }
  };

  const handleSimulateDispatch = () => {
    setSimulationTriggered(true);
    if (playSound) {
      playSound('alert');
    }
    setTimeout(() => setSimulationTriggered(false), 2400);
  };

  const recentIncidents = incidents.slice(0, 6);

  // Live calculation for capacity estimator
  const hoursSaved = Math.round(monthlyReports * 3.8);
  const estimatedDaysToResolution = (4.2 - (monthlyReports / 2000) * 1.8).toFixed(1);

  return (
    <div className="space-y-20 pb-24">
      
      {/* Hero Section — Product Performs Direction (Split Stage, No Eyebrows, High Scale Contrast) */}
      <section className="bg-zinc-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Display Headline, Narrative & Primary Actions */}
          <div className="lg:col-span-7 space-y-8">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight">
              Public Hazards. Real-time Dispatch.
            </h1>

            <p className="text-lg sm:text-xl text-zinc-400 max-w-xl leading-relaxed">
              Direct citizen reporting connected with verified municipal dispatch crews, AI triage classification, and open public resolution logs.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                to="/report"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-base transition-colors text-center shadow-xs"
              >
                <PlusCircle className="w-5 h-5 shrink-0 text-zinc-950" />
                <span>Report an Infrastructure Hazard</span>
              </Link>

              <form onSubmit={handleQuickTrack} className="flex-1 max-w-sm flex items-center">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Enter Token (e.g. CF-8421)"
                    value={quickToken}
                    onChange={(e) => setQuickToken(e.target.value)}
                    className="w-full bg-zinc-900 text-white text-sm pl-4 pr-12 py-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-white tabular-nums placeholder:text-zinc-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg flex items-center justify-center transition-colors font-bold"
                    title="Track complaint"
                  >
                    <Search className="w-4 h-4 text-zinc-950" />
                  </button>
                </div>
              </form>
            </div>

            {/* Public Safety Notice */}
            <div className="pt-2 max-w-xl">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-base text-zinc-300 flex items-start gap-3">
                <Info className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                <p>
                  CivicFix AI coordinates municipal infrastructure repairs. For immediate life-safety emergencies, dial 911 or 112 directly.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Working Interface Fragment (data-ui="true") */}
          <div className="lg:col-span-5">
            <div 
              data-ui="true" 
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white space-y-5"
            >
              <div data-ui="true" className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-zinc-200">Live Hazard Triage Engine</span>
                </div>
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Telemetry Active</span>
                </span>
              </div>

              {/* Sample Selector Tabs */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-400">Select simulated municipal report:</p>
                <div className="grid grid-cols-3 gap-2">
                  {HAZARD_SAMPLES.map((sample, idx) => (
                    <button
                      key={sample.id}
                      onClick={() => setActiveSampleIndex(idx)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold text-center transition-colors border ${
                        activeSampleIndex === idx
                          ? 'bg-white text-zinc-950 border-white font-bold'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                      }`}
                    >
                      {sample.category.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Triage Detail Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{activeSample.title}</h4>
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{activeSample.location}</span>
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${activeSample.severityColor}`}>
                    {activeSample.severity}
                  </span>
                </div>

                <div data-ui="true" className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-zinc-400 block">AI Confidence</span>
                    <span className="font-bold text-white text-sm tabular-nums">{activeSample.confidence}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Response SLA</span>
                    <span className="font-bold text-white text-sm tabular-nums">&lt; {activeSample.sla}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-400 block">Routing Target</span>
                    <span className="font-medium text-zinc-200 text-xs">{activeSample.dept}</span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleSimulateDispatch}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border ${
                      simulationTriggered
                        ? 'bg-zinc-800 text-white border-zinc-700'
                        : 'bg-white hover:bg-zinc-200 text-zinc-950 border-white font-bold'
                    }`}
                  >
                    <Radio className="w-4 h-4" />
                    <span>{simulationTriggered ? 'Dispatch Routed to On-Duty Crew' : 'Simulate Emergency Route'}</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-zinc-400 flex items-center justify-between pt-1">
                <span>Autonomous GIS Geofencing</span>
                <span className="font-semibold text-zinc-300">SLA Grade 1A</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Composed Editorial Telemetry (Numbers First, No Eyebrows, Tone Fill) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 sm:p-10 space-y-8 border border-zinc-200 shadow-xs">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 leading-tight">
              Municipal Operations Telemetry
            </h2>
            <p className="text-base text-zinc-600 mt-2 leading-relaxed">
              Active incident load across public utility zones with automated severity triage and public audit logging.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-2">
            <div className="space-y-1">
              <span className="text-5xl font-black text-zinc-950 tabular-nums block">
                {totalCount}
              </span>
              <span className="text-base font-bold text-zinc-950 block mt-2">
                Total Registered Incidents
              </span>
              <p className="text-base text-zinc-600 leading-normal">
                Public complaints filed and verified across active wards
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-5xl font-black text-zinc-950 tabular-nums block">
                {criticalCount}
              </span>
              <span className="text-base font-bold text-zinc-950 block mt-2">
                Critical Hazards
              </span>
              <p className="text-base text-zinc-600 leading-normal">
                Urgent structural or electrical life-safety risks
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-5xl font-black text-zinc-800 tabular-nums block">
                {inProgressCount}
              </span>
              <span className="text-base font-bold text-zinc-800 block mt-2">
                Under Active Repair
              </span>
              <p className="text-base text-zinc-600 leading-normal">
                Field dispatch crews currently deployed on-site
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-5xl font-black text-zinc-700 tabular-nums block">
                {resolvedCount}
              </span>
              <span className="text-base font-bold text-zinc-700 block mt-2">
                Certified Resolved
              </span>
              <p className="text-base text-zinc-600 leading-normal">
                Inspected, repaired, and photograph verified
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Metric Section — Figure Set by a Slider */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-950 text-white rounded-2xl p-8 sm:p-12 border border-zinc-900 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                Monthly District Capacity
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                Adjust the monthly complaint volume to calculate operational hours saved by automated vision categorization, GPS triage, and direct work-order dispatch.
              </p>

              <div data-ui="true" className="pt-4 max-w-md space-y-3">
                <div className="flex justify-between text-sm text-zinc-300 font-semibold">
                  <span>Monthly Complaints</span>
                  <span className="text-white font-bold tabular-nums text-base">{monthlyReports} reports</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={monthlyReports}
                  onChange={(e) => setMonthlyReports(Number(e.target.value))}
                  className="w-full accent-white cursor-pointer h-2.5 bg-zinc-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>50 (Small Ward)</span>
                  <span>750 (Metro District)</span>
                  <span>1,500+ (Urban Core)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <span className="text-5xl font-black text-white tabular-nums block">
                    {hoursSaved}
                  </span>
                  <span className="text-sm font-semibold text-zinc-300 block mt-2">
                    Triage Hours Saved
                  </span>
                  <span className="text-sm text-zinc-400 mt-1 block">Staff hours per month</span>
                </div>
                <div>
                  <span className="text-5xl font-black text-white tabular-nums block">
                    {estimatedDaysToResolution}d
                  </span>
                  <span className="text-sm font-semibold text-zinc-300 block mt-2">
                    Estimated Resolution
                  </span>
                  <span className="text-sm text-zinc-400 mt-1 block">Average clearance time</span>
                </div>
              </div>

              <div data-ui="true" className="pt-4 text-sm text-zinc-400 leading-relaxed">
                Calculated on automated computer vision geocoding and instant crew dispatch routing versus traditional telephone and paper complaint pipelines.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works — Narrative Split (Tone filled surfaces, no outlined boxes) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 leading-tight">
              From Citizen Report to Certified Repair
            </h2>
            <p className="text-base text-zinc-600 leading-relaxed">
              A transparent civic resolution pipeline connecting public detection directly to verified field work orders, removing administrative bottlenecks.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-100 rounded-2xl p-6 border border-zinc-200">
              <h3 className="text-base font-bold text-zinc-950">1. Citizen Telemetry</h3>
              <p className="text-base text-zinc-700 mt-2 leading-relaxed">
                Citizens submit photos with automatic browser GPS location coordinates and optional voice note transcription.
              </p>
            </div>

            <div className="bg-zinc-100 rounded-2xl p-6 border border-zinc-200">
              <h3 className="text-base font-bold text-zinc-950">2. Automated Neural Triage</h3>
              <p className="text-base text-zinc-700 mt-2 leading-relaxed">
                Computer vision verifies hazard legitimacy and routes directly to the designated department (Highways, Energy, Water) with strict SLA timers.
              </p>
            </div>

            <div className="bg-zinc-100 rounded-2xl p-6 border border-zinc-200">
              <h3 className="text-base font-bold text-zinc-950">3. Verified On-Scene Dispatch</h3>
              <p className="text-base text-zinc-700 mt-2 leading-relaxed">
                Field teams navigate to site, complete physical repairs, and upload GPS-verified photo evidence before resolving the public ticket.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Hazard Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                🛰️ Real-World Satellite GIS
              </span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-950">Live Municipal Hazard Satellite Map</h2>
            <p className="text-base text-zinc-600">
              Explore municipal hazard reports overlaid on real-world high-resolution satellite imagery and labeled road networks.
            </p>
          </div>
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-950 hover:underline"
          >
            <span>Open Fullscreen Map</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <IncidentMap incidents={incidents} height="420px" defaultMapType="satellite" />
      </section>

      {/* Recently Reported Incidents Feed (Tabular Municipal Dispatch Log) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-950">Recent Public Incident Reports</h2>
            <p className="text-base text-zinc-600">Official log of public infrastructure complaints and current resolution stages.</p>
          </div>
          <Link
            to="/track"
            className="text-sm font-bold text-zinc-950 hover:underline flex items-center gap-1"
          >
            <span>Track by Token</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tabular Municipal Incident Log List */}
        <div data-ui="true" className="border border-zinc-200 rounded-2xl bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table data-ui="true" className="w-full text-left text-sm">
              <thead data-ui="true" className="bg-zinc-50 text-zinc-800 font-bold border-b border-zinc-200">
                <tr>
                  <th className="py-3.5 px-5">Tracking Token</th>
                  <th className="py-3.5 px-5">Incident Title</th>
                  <th className="py-3.5 px-5">Location</th>
                  <th className="py-3.5 px-5">Severity</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody data-ui="true">
                {recentIncidents.map((inc) => {
                  const isCritical = inc.severity === 'critical';
                  const isMedium = inc.severity === 'medium';

                  return (
                    <tr data-ui="true" key={inc.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-b-0">
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="text-xs font-bold text-zinc-950 bg-zinc-100 px-2 py-1 rounded border border-zinc-200 tabular-nums font-sans">
                          #{inc.tracking_token}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-zinc-950 max-w-xs">
                        <div className="truncate text-sm">{inc.title}</div>
                        <div className="text-xs text-zinc-600 font-normal truncate mt-0.5">
                          {inc.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 truncate max-w-[220px] text-xs">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{inc.address}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                          isCritical ? 'bg-zinc-950 text-white border-zinc-950' :
                          isMedium ? 'bg-zinc-200 text-zinc-900 border-zinc-300' :
                          'bg-zinc-100 text-zinc-800 border-zinc-200'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="font-semibold text-zinc-700 capitalize flex items-center gap-2 text-xs">
                          <span className={`w-2 h-2 rounded-full ${
                            inc.status === 'resolved' ? 'bg-zinc-950' :
                            inc.status === 'in_progress' ? 'bg-zinc-600' :
                            'bg-zinc-400'
                          }`} />
                          <span>{inc.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <Link
                          to={`/track/${inc.tracking_token}`}
                          className="font-bold text-zinc-950 hover:underline inline-flex items-center gap-1 text-xs"
                        >
                          <span>Track</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
