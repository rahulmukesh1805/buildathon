import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import IncidentMap from '../components/IncidentMap';
import VoiceRecorder from '../components/VoiceRecorder';
import { classifyHazardCategory, assessHazardPriority, detectDuplicates } from '../lib/aiEngine';
import { 
  Upload, 
  X, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Loader2,
  Lock,
  Volume2,
  MapPin,
  Building2
} from 'lucide-react';

const CATEGORIES = [
  { value: 'electrical_hazard', label: 'Electrical Hazard', desc: 'Fallen cable, sparking transformer, exposed wiring' },
  { value: 'burst_water_pipe', label: 'Burst Water Pipe', desc: 'Conduit burst, road flooding, high pressure gushing' },
  { value: 'open_manhole', label: 'Open Manhole / Shaft', desc: 'Missing cast-iron lid, deep drainage hole' },
  { value: 'pothole', label: 'Pothole / Road Defect', desc: 'Sub-base crater, broken asphalt, tire puncture hazard' },
  { value: 'sanitation_issue', label: 'Sanitation / Waste Issue', desc: 'Overflowing refuse container, blocked drain gutter' },
  { value: 'other', label: 'Other Municipal Issue', desc: 'General municipal infrastructure hazard' }
];

export default function ReportHazardPage() {
  const { submitIncident, incidents } = useApp();
  const navigate = useNavigate();

  // Form State
  const [category, setCategory] = useState('electrical_hazard');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [location, setLocation] = useState({ lat: 12.9716, lng: 77.5946 });
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  
  // Photo State
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState(null);

  // Audio Note State
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioTranscript, setAudioTranscript] = useState('');

  // Form Validation & UI State
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Derived AI Assistant Suggestions (synchronously calculated without extra render cascades)
  const aiCategorySuggestion = useMemo(() => {
    if (description.trim().length <= 15) return null;
    const catResult = classifyHazardCategory(`${title} ${description}`);
    return catResult.category && catResult.confidence >= 65 ? catResult : null;
  }, [title, description]);

  const aiPrioritySuggestion = useMemo(() => {
    if (description.trim().length <= 15) return null;
    return assessHazardPriority(category, `${title} ${description}`, landmark);
  }, [category, title, description, landmark]);

  const duplicateWarning = useMemo(() => {
    if (description.trim().length <= 15) return null;
    const dup = detectDuplicates({
      category,
      title,
      description,
      latitude: location.lat,
      longitude: location.lng
    }, incidents);
    return dup.isDuplicate ? dup : null;
  }, [category, title, description, location, incidents]);

  // Autofill realistic demo data for evaluators
  const handleAutofillDemo = () => {
    setCategory('electrical_hazard');
    setTitle('Live High-Voltage Overhead Wire Dangling Near Pedestrian Walkway');
    setDescription('Overhead electrical wire severed during wind gusts and dangling approximately 4 feet above the sidewalk. Sparks observed on pavement when ground is wet.');
    setAddress('45 Elm Street, North Ward');
    setLandmark('Opposite St. Jude Primary School Gate 2');
    setSeverity('critical');
    setLocation({ lat: 12.9722, lng: 77.5955 });
    setReporterName('Marcus Vance');
    setReporterContact('+1 555-019-2831');
    setPhotoPreview('https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80');
  };

  // Handle Photo File Upload & Validation
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhotoError(null);

    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Invalid file type. Only JPG, PNG, or WEBP photos are accepted.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setPhotoError('Photo file size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setPhotoPreview(loadEvt.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoError(null);
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!title.trim() || title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters long.';
    }
    if (!description.trim() || description.trim().length < 15) {
      errs.description = 'Please provide a clear description (at least 15 characters).';
    }
    if (!address.trim() || address.trim().length < 4) {
      errs.address = 'Street address or location name is required.';
    }
    if (!location || !location.lat || !location.lng) {
      errs.location = 'Please select a valid map point for municipal crew navigation.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    const result = await submitIncident({
      category,
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      landmark: landmark.trim(),
      severity,
      latitude: location.lat,
      longitude: location.lng,
      photoUrl: photoPreview,
      audioUrl: audioUrl,
      audioTranscript: audioTranscript,
      reporterName: reporterName.trim() || null,
      reporterContact: reporterContact.trim() || null,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmittedIncident(result.incident);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCopyToken = () => {
    if (!submittedIncident?.tracking_token) return;
    navigator.clipboard.writeText(submittedIncident.tracking_token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
  };

  // Success Confirmation Screen
  if (submittedIncident) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div data-ui="true" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-teal-900 text-white p-8 sm:p-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-teal-800 text-teal-200 flex items-center justify-center mx-auto mb-2 border border-teal-700">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Municipal Hazard Logged Successfully
            </h2>
            <p className="text-teal-200 text-sm max-w-lg mx-auto leading-relaxed">
              Your report has been entered into the municipal dispatch registry and queued for immediate on-site crew assignment.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Unique Tracking Token Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
              <span className="text-xs font-bold text-slate-600 block">
                Official Resolution Tracking Token
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl sm:text-4xl font-black text-navy-950 tracking-wider tabular-nums">
                  #{submittedIncident.tracking_token}
                </span>
                <button
                  onClick={handleCopyToken}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1.5 border border-teal-200 transition-colors"
                  title="Copy token to clipboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Save this token to inspect live triage verification, dispatched technician logs, and certified repair evidence.
              </p>
            </div>

            {/* Summary Details */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 capitalize">
                  {CATEGORIES.find(c => c.value === submittedIncident.category)?.label || submittedIncident.category}
                </span>
                <span className="text-xs font-bold capitalize px-3 py-1 rounded-lg bg-red-50 text-red-800 border border-red-200">
                  {submittedIncident.severity} Severity
                </span>
              </div>
              <h3 className="text-lg font-bold text-navy-950">{submittedIncident.title}</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{submittedIncident.description}</p>
              
              <div data-ui="true" className="pt-3 border-t border-slate-100 text-xs text-slate-600 flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {submittedIncident.address}</span>
                {submittedIncident.landmark && <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-slate-400" /> {submittedIncident.landmark}</span>}
                {submittedIncident.audio_url && (
                  <span className="flex items-center gap-1.5 text-teal-800 font-semibold">
                    <Volume2 className="w-4 h-4 text-teal-700" />
                    Audio Attachment Recorded
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={`/track/${submittedIncident.tracking_token}`}
                className="flex-1 py-3.5 px-4 bg-teal-700 hover:bg-teal-600 text-white font-bold text-base rounded-xl text-center transition-colors flex items-center justify-center gap-2"
              >
                <span>Track This Incident Live</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  setSubmittedIncident(null);
                  setTitle('');
                  setDescription('');
                  setAddress('');
                  setLandmark('');
                  setPhotoPreview(null);
                  setAudioUrl(null);
                  setAudioTranscript('');
                }}
                className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl text-center transition-colors border border-slate-200"
              >
                Submit Another Report
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Editorial Header (No Eyebrows) */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
            Report Municipal Hazard
          </h1>
          <p className="text-base text-slate-600 max-w-xl leading-relaxed">
            Directly connect your report to municipal dispatch crews with automated AI priority triage and duplicate prevention.
          </p>
        </div>

        {/* 1-Click Demo Autofill for Evaluators */}
        <button
          type="button"
          onClick={handleAutofillDemo}
          className="self-start sm:self-auto flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
          title="Autofill a realistic high-risk municipal hazard for evaluation"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Autofill Demo Hazard</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Category Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-navy-950">1. Infrastructure Hazard Category</h3>
            <p className="text-xs text-slate-500 mt-0.5">Select the category that best matches the physical infrastructure failure</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.value;
              return (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-xl text-left border transition-colors ${
                    isSelected
                      ? 'border-teal-700 bg-teal-900 text-white ring-2 ring-teal-600/30'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 bg-slate-50/50'
                  }`}
                >
                  <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-navy-950'}`}>
                    {cat.label}
                  </p>
                  <p className={`text-xs mt-1 leading-snug ${isSelected ? 'text-teal-200' : 'text-slate-500'}`}>
                    {cat.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* AI Category Auto-Detect Suggestion */}
          {aiCategorySuggestion && aiCategorySuggestion.category !== category && (
            <div data-ui="true" className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-teal-950">
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Automated Category Match: </span>
                <span>Based on text description, this aligns with <strong>{CATEGORIES.find(c => c.value === aiCategorySuggestion.category)?.label}</strong> ({aiCategorySuggestion.confidence}% confidence).</span>
              </div>
              <button
                type="button"
                onClick={() => setCategory(aiCategorySuggestion.category)}
                className="px-2.5 py-1 bg-teal-700 hover:bg-teal-600 text-white rounded-md font-bold text-xs shrink-0"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Description & Title */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-navy-950">2. Incident Details &amp; Voice Telemetry</h3>
            <p className="text-xs text-slate-500 mt-0.5">Describe what is broken, visible hazards to pedestrians/traffic, and urgent risks</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Incident Headline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Live electrical wire dangling near bus stop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                errors.title ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
              }`}
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Physical Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Detail visible damage, estimated depth, road blockage, sparks, water pressure, or pedestrian safety threats..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                errors.description ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
              }`}
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          {/* Voice Memo Recording */}
          <div>
            <VoiceRecorder
              onAudioRecorded={(url, transcript) => {
                setAudioUrl(url);
                setAudioTranscript(transcript);
              }}
              onAudioRemoved={() => {
                setAudioUrl(null);
                setAudioTranscript('');
              }}
              onTranscriptAppend={(spokenText) => {
                setDescription(prev => (prev ? `${prev} ${spokenText}` : spokenText));
              }}
            />
          </div>

          {/* AI Priority & Urgency Suggestion */}
          {aiPrioritySuggestion && (
            <div data-ui="true" className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-800">
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-navy-950">Automated Triage Rating: </span>
                <span className="capitalize font-bold text-teal-900">{aiPrioritySuggestion.suggestedSeverity}</span>
                <span className="text-slate-600"> &bull; {aiPrioritySuggestion.reason}</span>
              </div>
            </div>
          )}

          {/* Duplicate Detection Warning Banner */}
          {duplicateWarning && (
            <div data-ui="true" className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-bold text-amber-950">Similar Active Hazard Located Nearby</p>
                <p className="leading-relaxed">{duplicateWarning.reason}</p>
                <p className="text-amber-800 text-[11px] italic">
                  You may still proceed if this is an independent incident; municipal teams review each ticket.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Location Pinpoint & Address */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-navy-950">3. Physical Location &amp; Map Coordinates</h3>
            <p className="text-xs text-slate-500 mt-0.5">Specify the nearest street junction and click on the map to pin accurate GPS coordinates</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Street Address / Cross Street <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., 45 Elm Street, North Ward"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                  errors.address ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Prominent Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Opposite Primary School Gate 2"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Map Location Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Interactive Satellite Map Pinpoint</span>
                <span className="text-[11px] text-slate-500">Switch between Satellite, Hybrid, and Street views to pinpoint ground details.</span>
              </div>
              <span className="text-xs font-semibold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 tabular-nums self-start">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            </div>
            <IncidentMap
              pickerMode={true}
              selectedLocation={location}
              onLocationSelect={(coords) => setLocation(coords)}
              height="320px"
              defaultMapType="satellite"
            />
          </div>
        </div>

        {/* Step 4: Severity & Photo Upload */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-navy-950">4. Severity &amp; Photographic Evidence</h3>
            <p className="text-xs text-slate-500 mt-0.5">Rate urgency level and provide photographic evidence for dispatch verification</p>
          </div>

          {/* Severity Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Reported Severity Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { val: 'low', label: 'Low', badge: 'Routine, non-urgent repair' },
                { val: 'medium', label: 'Medium', badge: 'Active vehicular hazard' },
                { val: 'critical', label: 'Critical', badge: 'Immediate danger to human life' }
              ].map(s => (
                <button
                  type="button"
                  key={s.val}
                  onClick={() => setSeverity(s.val)}
                  className={`p-4 rounded-xl border text-center transition-colors ${
                    severity === s.val
                      ? s.val === 'critical' ? 'border-red-600 bg-red-50 ring-2 ring-red-400 text-red-950 font-bold'
                        : s.val === 'medium' ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-400 text-amber-950 font-bold'
                        : 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-400 text-emerald-950 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <p className="text-sm font-bold capitalize">{s.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.badge}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload with Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Attach Hazard Photo (Optional)
            </label>
            
            {photoPreview ? (
              <div className="relative inline-block rounded-xl overflow-hidden border border-slate-300 shadow-xs">
                <img src={photoPreview} alt="Hazard preview" className="w-56 h-40 object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-teal-600 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-bold text-slate-800">Select or drop hazard photograph</span>
                <span className="text-xs text-slate-400 mt-0.5">JPG, PNG or WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}

            {photoError && <p className="text-xs text-red-600 mt-1.5">{photoError}</p>}
          </div>

        </div>

        {/* Step 5: Reporter Contact (Optional) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-navy-950">5. Reporter Contact (Optional)</h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-md border border-teal-200">
              <Lock className="w-3.5 h-3.5 text-teal-700" />
              Privacy Masked
            </span>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed">
            Contact information is strictly reserved for on-duty field crews requiring physical gate access. It is never displayed on public tracking records.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Name</label>
              <input
                type="text"
                placeholder="Marcus Vance"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number or Email</label>
              <input
                type="text"
                placeholder="+1 555-019-2831"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-bold text-base transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting to Dispatch...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Submit Hazard Report</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
