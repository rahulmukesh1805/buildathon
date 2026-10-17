import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, INITIAL_INCIDENTS } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  X, 
  Server, 
  ShieldCheck, 
  UploadCloud
} from 'lucide-react';

export default function SupabaseModal({ isOpen, onClose }) {
  const { showToast } = useApp();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [activeTab, setActiveTab] = useState('status'); // 'status' | 'env' | 'schema'

  if (!isOpen) return null;

  const testConnection = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setTestResult({
        success: false,
        message: 'Supabase credentials are not detected in .env.local. The platform is running securely using LocalStorage.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    const start = performance.now();

    try {
      const { error } = await supabase
        .from('incidents')
        .select('id', { count: 'exact', head: true });

      const duration = Math.round(performance.now() - start);

      if (error) {
        setTestResult({
          success: false,
          message: `Connected to endpoint, but table query returned: ${error.message} (HTTP ${error.code || 'ERR'}). Have you run schema.sql?`,
          duration
        });
      } else {
        setTestResult({
          success: true,
          message: `Connection Verified! Supabase PostgreSQL responded successfully in ${duration}ms.`,
          duration
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `Network or configuration error: ${err.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const seedCloudDatabase = async () => {
    if (!isSupabaseConfigured || !supabase) {
      showToast('error', 'Cannot seed cloud database: Supabase not configured in .env.local');
      return;
    }

    setSeeding(true);
    try {
      // Map seed data to table schema
      const rows = INITIAL_INCIDENTS.map(inc => ({
        tracking_token: inc.tracking_token,
        title: inc.title,
        description: inc.description,
        category: inc.category,
        severity: inc.severity,
        status: inc.status,
        address: inc.address,
        landmark: inc.landmark,
        latitude: inc.latitude,
        longitude: inc.longitude,
        photo_url: inc.photo_url,
        reporter_name: inc.reporter_name,
        reporter_contact: inc.reporter_contact,
        assigned_crew_name: inc.assigned_crew_name,
        ai_priority_suggestion: inc.ai_priority_suggestion,
        ai_category_suggestion: inc.ai_category_suggestion
      }));

      const { error } = await supabase.from('incidents').upsert(rows, { onConflict: 'tracking_token' });
      if (error) throw error;

      showToast('success', `Successfully seeded ${rows.length} municipal hazard records to Supabase!`);
    } catch (err) {
      console.error('Seeding failed:', err);
      showToast('error', `Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const envSample = `VITE_SUPABASE_URL=https://your-project-id.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...your-anon-key`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div data-ui="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 animate-in fade-in duration-200">
      <div data-ui="true" className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        
        {/* Header */}
        <div data-ui="true" className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 text-teal-400 flex items-center justify-center border border-teal-500/40">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Database &amp; Cloud Sync Center</h2>
              <p className="text-[11px] text-slate-400">PostgreSQL Cloud Architecture &amp; Zero-Config Offline Fallback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div data-ui="true" className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors ${
              activeTab === 'status' 
                ? 'border-teal-600 text-teal-900 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connection Status
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors ${
              activeTab === 'env' 
                ? 'border-teal-600 text-teal-900 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            .env.local Setup
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors ${
              activeTab === 'schema' 
                ? 'border-teal-600 text-teal-900 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            SQL Schema &amp; RLS
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {isSupabaseConfigured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {isSupabaseConfigured ? 'Supabase Credentials Detected' : 'Local Storage Fallback Mode Active'}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed text-slate-600">
                    {isSupabaseConfigured
                      ? 'The app is configured to synchronize data with your Supabase PostgreSQL cloud instance.'
                      : 'The app is running out-of-the-box with persistent browser storage and realistic municipal seed data. To persist to cloud PostgreSQL, provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={testConnection}
                  disabled={testing}
                  className="flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Pinging Database...' : 'Test Connection'}</span>
                </button>

                <button
                  onClick={seedCloudDatabase}
                  disabled={seeding || !isSupabaseConfigured}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isSupabaseConfigured
                      ? 'bg-teal-600 hover:bg-teal-500 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{seeding ? 'Uploading Seed Data...' : 'Seed Cloud DB Table'}</span>
                </button>
              </div>

              {/* Test Results Output */}
              {testResult && (
                <div className={`p-3.5 rounded-xl border text-xs font-medium ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                    <span>{testResult.success ? 'Diagnostic Check Passed' : 'Diagnostic Notice'}</span>
                  </div>
                  <p>{testResult.message}</p>
                </div>
              )}

              {/* Architectural features */}
              <div data-ui="true" className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-700 mb-2">Engine Architecture</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Row Level Security (RLS)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <Server className="w-3.5 h-3.5 text-teal-600" />
                    <span>PostgreSQL Foreign Keys</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                To link your Supabase project, create a file named <code className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-700">.env.local</code> in the project root:
              </p>

              <div className="relative bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto">
                <pre><code>{envSample}</code></pre>
                <button
                  onClick={copyEnv}
                  className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-md text-xs flex items-center gap-1 border border-slate-700"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEnv ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl text-xs text-teal-900 space-y-1">
                <p className="font-bold">Where to find these keys:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-600 text-[11px]">
                  <li>Open your Supabase Project Dashboard</li>
                  <li>Navigate to <strong>Project Settings</strong> &gt; <strong>API</strong></li>
                  <li>Copy <strong>Project URL</strong> and <strong>Project API Keys (anon / public)</strong></li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3 text-xs text-slate-600">
              <p>
                The complete SQL schema with tables, performance indexes, UUID generators, and sample data is located in:
              </p>
              <div className="bg-slate-100 p-2.5 rounded-lg text-slate-800 text-[11px] flex items-center justify-between border border-slate-200">
                <code>supabase/schema.sql</code>
                <span className="text-teal-700 font-bold">416 lines DDL</span>
              </div>
              <p className="text-[11px] text-slate-500">
                To apply, open the <strong>SQL Editor</strong> in your Supabase dashboard, paste the contents of <code className="bg-slate-100 px-1 py-0.5 rounded">schema.sql</code>, and click <strong>Run</strong>.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div data-ui="true" className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
