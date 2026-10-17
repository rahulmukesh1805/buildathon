import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapPin, Navigation as NavIcon, AlertCircle, Layers } from 'lucide-react';

// Category human labels
const CATEGORY_NAMES = {
  electrical_hazard: 'Electrical Hazard',
  burst_water_pipe: 'Burst Water Pipe',
  open_manhole: 'Open Manhole / Pit',
  pothole: 'Pothole / Road Damage',
  sanitation_issue: 'Sanitation / Waste Issue',
  other: 'Other Municipal Issue'
};

export default function IncidentMap({ 
  incidents = [], 
  pickerMode = false, 
  selectedLocation = null, 
  onLocationSelect = null,
  height = '500px',
  interactive = true
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const pickerMarkerRef = useRef(null);

  // Map Filter State (Explorer mode)
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Update Location Picker Pin
  const updatePickerPin = useCallback((lat, lng) => {
    if (!mapInstanceRef.current) return;
    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const pinIcon = L.divIcon({
        className: 'custom-picker-pin',
        html: `
          <div data-ui="true" style="background-color: #0D9488; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });
      pickerMarkerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(mapInstanceRef.current);
      pickerMarkerRef.current.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        if (onLocationSelect) {
          onLocationSelect({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
        }
      });
    }
    mapInstanceRef.current.panTo([lat, lng]);
  }, [onLocationSelect]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up if instance already exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultLat = selectedLocation?.lat || 12.9716;
    const defaultLng = selectedLocation?.lng || 77.5946;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      zoomControl: interactive,
      scrollWheelZoom: interactive,
    });

    // Add OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Click handler for Picker Mode
    if (pickerMode && onLocationSelect) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        updatePickerPin(lat, lng);
        onLocationSelect({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pickerMode, onLocationSelect, updatePickerPin, interactive, selectedLocation?.lat, selectedLocation?.lng]);

  // Sync selected location in picker mode
  useEffect(() => {
    if (pickerMode && selectedLocation?.lat && selectedLocation?.lng && mapInstanceRef.current) {
      updatePickerPin(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation, pickerMode, updatePickerPin]);

  // Render Incident Markers in Explorer Mode
  useEffect(() => {
    if (pickerMode || !mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // Filter incidents
    const filtered = incidents.filter(inc => {
      if (!inc.latitude || !inc.longitude) return false;
      if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && inc.category !== categoryFilter) return false;
      return true;
    });

    const bounds = [];

    filtered.forEach(inc => {
      const isCritical = inc.severity === 'critical';
      const isMedium = inc.severity === 'medium';
      
      const pinBg = isCritical ? '#DC2626' : (isMedium ? '#D97706' : '#059669');
      const pulseClass = isCritical ? 'pulse-critical' : '';

      const icon = L.divIcon({
        className: 'incident-map-marker',
        html: `
          <div class="marker-pin ${pulseClass}" style="background-color: ${pinBg};">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background: ${isCritical ? '#FEE2E2' : '#FEF3C7'}; color: ${isCritical ? '#991B1B' : '#92400E'}; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${inc.severity} Severity
            </span>
            <span style="color: #64748B; font-size: 11px; font-weight: 600;">#${inc.tracking_token}</span>
          </div>
          <h4 style="font-weight: 700; font-size: 13px; color: #0F172A; margin: 0 0 4px 0; line-height: 1.3;">${inc.title}</h4>
          <p style="color: #475569; font-size: 11px; margin: 0 0 6px 0;"><strong>Category:</strong> ${CATEGORY_NAMES[inc.category] || inc.category}</p>
          <p style="color: #64748B; font-size: 11px; margin: 0 0 8px 0;">Location: ${inc.address} ${inc.landmark ? `(${inc.landmark})` : ''}</p>
          <div data-ui="true" style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 6px;">
            <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #0D9488;">Status: ${inc.status.replace('_', ' ')}</span>
            <a href="/track/${inc.tracking_token}" style="font-size: 11px; font-weight: 600; color: #0F766E; text-decoration: underline;">View &rarr;</a>
          </div>
        </div>
      `;

      const marker = L.marker([inc.latitude, inc.longitude], { icon })
        .bindPopup(popupHtml, { maxWidth: 280 });
      
      markersLayerRef.current.addLayer(marker);
      bounds.push([inc.latitude, inc.longitude]);
    });

    // Auto-fit bounds if markers exist
    if (bounds.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [incidents, severityFilter, categoryFilter, pickerMode]);

  // Geolocation Handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeoLocating(false);
        if (pickerMode && onLocationSelect) {
          updatePickerPin(latitude, longitude);
          onLocationSelect({ lat: Number(latitude.toFixed(6)), lng: Number(longitude.toFixed(6)) });
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15);
        }
      },
      (err) => {
        setGeoLocating(false);
        setGeoError(`Location access denied or unavailable: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div data-ui="true" className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white">
      {/* Explorer Controls Bar */}
      {!pickerMode && (
        <div data-ui="true" className="p-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-semibold text-slate-300">Live Infrastructure Hazards</span>
            <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-teal-300 tabular-nums">
              {incidents.filter(i => i.latitude && i.longitude).length} mapped
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Severity Filter */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All</option>
                <option value="critical" className="bg-slate-900">Critical Only</option>
                <option value="medium" className="bg-slate-900">Medium Only</option>
                <option value="low" className="bg-slate-900">Low Only</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">Type:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="all" className="bg-slate-900">All Categories</option>
                <option value="electrical_hazard" className="bg-slate-900">Electrical</option>
                <option value="burst_water_pipe" className="bg-slate-900">Water Pipe</option>
                <option value="open_manhole" className="bg-slate-900">Open Manhole</option>
                <option value="pothole" className="bg-slate-900">Pothole</option>
                <option value="sanitation_issue" className="bg-slate-900">Sanitation</option>
              </select>
            </div>

            <button
              onClick={handleDetectLocation}
              disabled={geoLocating}
              className="flex items-center gap-1 text-xs bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1 rounded-lg transition-colors font-medium disabled:opacity-50"
              title="Pan map to current location"
            >
              <NavIcon className={`w-3.5 h-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
              <span>{geoLocating ? 'Locating...' : 'My Area'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Picker Mode Instruction Bar */}
      {pickerMode && (
        <div data-ui="true" className="p-2.5 bg-teal-50 border-b border-teal-100 flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-4 h-4 text-teal-700" />
            <span>Click on the map to pin the hazard location, or drag the marker to adjust.</span>
          </div>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={geoLocating}
            className="flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-1 rounded text-xs font-semibold disabled:opacity-50"
          >
            <NavIcon className={`w-3 h-3 ${geoLocating ? 'animate-spin' : ''}`} />
            {geoLocating ? 'Finding...' : 'Use My GPS'}
          </button>
        </div>
      )}

      {/* Geolocation Error Alert */}
      {geoError && (
        <div data-ui="true" className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{geoError}</span>
          </div>
          <button onClick={() => setGeoError(null)} className="text-amber-900 font-bold ml-2">&times;</button>
        </div>
      )}

      {/* Leaflet Map Div */}
      <div 
        ref={mapContainerRef} 
        style={{ height }} 
        className="w-full z-0 relative focus:outline-none" 
      />

      {/* Legend & Disclaimer Footer */}
      <div data-ui="true" className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-xs"></span>
            Critical Hazard
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs"></span>
            Medium Priority
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-xs"></span>
            Low Priority
          </span>
        </div>
        <span className="italic">
          OpenStreetMap data. Incident coordinates may be approximate.
        </span>
      </div>
    </div>
  );
}
