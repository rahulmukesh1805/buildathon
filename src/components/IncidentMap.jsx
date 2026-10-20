import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation as NavIcon, 
  AlertCircle, 
  Layers, 
  Maximize2, 
  Compass, 
  Globe, 
  Sparkles,
  Check
} from 'lucide-react';

// Category human labels
const CATEGORY_NAMES = {
  electrical_hazard: 'Electrical Hazard',
  burst_water_pipe: 'Burst Water Pipe',
  open_manhole: 'Open Manhole / Pit',
  pothole: 'Pothole / Road Damage',
  sanitation_issue: 'Sanitation / Waste Issue',
  other: 'Other Municipal Issue'
};

// Real-World Satellite, Hybrid, and Street Map Providers
const MAP_LAYERS = {
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    shortName: 'Satellite',
    icon: '🛰️',
    description: 'High-resolution real-world orbital satellite imagery',
    badgeText: 'Orbital Imagery (Esri World Imagery)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
    hasOverlay: false
  },
  hybrid: {
    id: 'hybrid',
    name: 'Satellite Hybrid',
    shortName: 'Hybrid',
    icon: '🗺️',
    description: 'High-res satellite photo with roads, landmarks & street labels',
    badgeText: 'Satellite + Street Overlays',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri, Maxar | Roads & Labels: Esri Reference',
    hasOverlay: true,
    overlayUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    overlayTransportationUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
  },
  streets: {
    id: 'streets',
    name: 'Street Map',
    shortName: 'Streets',
    icon: '🏙️',
    description: 'Vector-style street map with municipal road names',
    badgeText: 'OpenStreetMap Cartography',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    hasOverlay: false
  }
};

export default function IncidentMap({ 
  incidents = [], 
  pickerMode = false, 
  selectedLocation = null, 
  onLocationSelect = null,
  height = '500px',
  interactive = true,
  defaultMapType = 'satellite', // 'satellite' | 'hybrid' | 'streets'
  allowLayerSwitch = true,
  showControls = true,
  singleIncident = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const pickerMarkerRef = useRef(null);
  const baseTileRef = useRef(null);
  const overlayTilesRef = useRef([]);

  // Active Map Layer State
  const [mapType, setMapType] = useState(defaultMapType in MAP_LAYERS ? defaultMapType : 'satellite');

  // Map Filter State (Explorer mode)
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Switch Base Layer & Overlays seamlessly without resetting map position or zoom
  const updateMapTiles = useCallback((layerKey) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const config = MAP_LAYERS[layerKey] || MAP_LAYERS.satellite;

    // Remove existing base layer
    if (baseTileRef.current) {
      try {
        map.removeLayer(baseTileRef.current);
      } catch (e) {
        // Safe catch
      }
      baseTileRef.current = null;
    }

    // Remove existing overlays
    if (overlayTilesRef.current && overlayTilesRef.current.length > 0) {
      overlayTilesRef.current.forEach(layer => {
        try {
          map.removeLayer(layer);
        } catch (e) {
          // Safe catch
        }
      });
      overlayTilesRef.current = [];
    }

    // Add new base tile layer
    const newBase = L.tileLayer(config.url, {
      maxZoom: config.maxZoom || 19,
      maxNativeZoom: 19,
      attribution: config.attribution
    }).addTo(map);

    // Push base layer underneath markers and overlays
    newBase.bringToBack();
    baseTileRef.current = newBase;

    // If hybrid mode, add high-resolution street and place reference overlays
    if (config.hasOverlay) {
      const overlays = [];
      if (config.overlayTransportationUrl) {
        const transLayer = L.tileLayer(config.overlayTransportationUrl, {
          maxZoom: 19,
          maxNativeZoom: 19
        }).addTo(map);
        overlays.push(transLayer);
      }
      if (config.overlayUrl) {
        const placesLayer = L.tileLayer(config.overlayUrl, {
          maxZoom: 19,
          maxNativeZoom: 19
        }).addTo(map);
        overlays.push(placesLayer);
      }
      overlayTilesRef.current = overlays;
    }

    setMapType(layerKey);
  }, []);

  // Update Location Picker Pin with high-contrast radar styling for satellite visibility
  const updatePickerPin = useCallback((lat, lng) => {
    if (!mapInstanceRef.current) return;
    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const pinIcon = L.divIcon({
        className: 'custom-picker-pin',
        html: `
          <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(13, 148, 136, 0.45); animation: pulse-ring 2s cubic-bezier(0.45, 0, 0.55, 1) infinite;"></div>
            <div style="background-color: #0D9488; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 0 0 2px rgba(0,0,0,0.4), 0 4px 14px rgba(0,0,0,0.6); position: relative; z-index: 2;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38]
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

    const targetIncident = singleIncident || (incidents.length === 1 ? incidents[0] : null);

    const defaultLat = selectedLocation?.lat || targetIncident?.latitude || 12.9716;
    const defaultLng = selectedLocation?.lng || targetIncident?.longitude || 77.5946;
    const defaultZoom = targetIncident ? 16 : (selectedLocation ? 16 : 13);

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: interactive,
      scrollWheelZoom: interactive,
    });

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Initial tile layer setup (real world satellite imagery by default)
    const initialConfig = MAP_LAYERS[mapType] || MAP_LAYERS.satellite;
    const baseTile = L.tileLayer(initialConfig.url, {
      maxZoom: initialConfig.maxZoom || 19,
      maxNativeZoom: 19,
      attribution: initialConfig.attribution
    }).addTo(map);
    baseTile.bringToBack();
    baseTileRef.current = baseTile;

    if (initialConfig.hasOverlay) {
      const overlays = [];
      if (initialConfig.overlayTransportationUrl) {
        overlays.push(L.tileLayer(initialConfig.overlayTransportationUrl, { maxZoom: 19, maxNativeZoom: 19 }).addTo(map));
      }
      if (initialConfig.overlayUrl) {
        overlays.push(L.tileLayer(initialConfig.overlayUrl, { maxZoom: 19, maxNativeZoom: 19 }).addTo(map));
      }
      overlayTilesRef.current = overlays;
    }

    // Click handler for Picker Mode
    if (pickerMode && onLocationSelect) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        updatePickerPin(lat, lng);
        onLocationSelect({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
      });
    }

    // Invalidate size to ensure full container rendering
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pickerMode, onLocationSelect, updatePickerPin, interactive]);

  // Sync selected location in picker mode
  useEffect(() => {
    if (pickerMode && selectedLocation?.lat && selectedLocation?.lng && mapInstanceRef.current) {
      updatePickerPin(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation, pickerMode, updatePickerPin]);

  // Render Incident Markers in Explorer Mode or Single Incident Mode
  useEffect(() => {
    if (pickerMode || !mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // Determine list of incidents to display
    const rawIncidents = singleIncident ? [singleIncident] : incidents;

    // Filter incidents
    const filtered = rawIncidents.filter(inc => {
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
          <div class="marker-pin ${pulseClass}" style="background-color: ${pinBg}; box-shadow: 0 0 0 2.5px #ffffff, 0 0 0 3.5px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.6);">
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
        <div style="font-family: inherit; font-size: 12px; min-width: 230px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background: ${isCritical ? '#FEE2E2' : '#FEF3C7'}; color: ${isCritical ? '#991B1B' : '#92400E'}; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${inc.severity} Severity
            </span>
            <span style="color: #64748B; font-size: 11px; font-weight: 600;">#${inc.tracking_token}</span>
          </div>
          <h4 style="font-weight: 700; font-size: 13px; color: #0F172A; margin: 0 0 4px 0; line-height: 1.3;">${inc.title}</h4>
          <p style="color: #475569; font-size: 11px; margin: 0 0 6px 0;"><strong>Category:</strong> ${CATEGORY_NAMES[inc.category] || inc.category}</p>
          <p style="color: #64748B; font-size: 11px; margin: 0 0 8px 0;">Location: ${inc.address} ${inc.landmark ? `(${inc.landmark})` : ''}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 6px;">
            <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #0D9488;">Status: ${inc.status.replace('_', ' ')}</span>
            <a href="/track/${inc.tracking_token}" style="font-size: 11px; font-weight: 600; color: #0F766E; text-decoration: underline;">View Dossier &rarr;</a>
          </div>
        </div>
      `;

      const marker = L.marker([inc.latitude, inc.longitude], { icon })
        .bindPopup(popupHtml, { maxWidth: 280 });
      
      markersLayerRef.current.addLayer(marker);
      bounds.push([inc.latitude, inc.longitude]);
    });

    // Auto-fit bounds if markers exist and not single incident view
    if (bounds.length > 1 && mapInstanceRef.current && !singleIncident) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (bounds.length === 1 && mapInstanceRef.current) {
      mapInstanceRef.current.setView(bounds[0], 16);
    }
  }, [incidents, severityFilter, categoryFilter, pickerMode, singleIncident]);

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
          mapInstanceRef.current.setView([latitude, longitude], 16);
        }
      },
      (err) => {
        setGeoLocating(false);
        setGeoError(`Location access denied or unavailable: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Recenter / Fit All Incidents
  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const validIncidents = incidents.filter(i => i.latitude && i.longitude);
    if (validIncidents.length > 0) {
      const bounds = validIncidents.map(i => [i.latitude, i.longitude]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      mapInstanceRef.current.setView([12.9716, 77.5946], 13);
    }
  };

  const currentLayerConfig = MAP_LAYERS[mapType] || MAP_LAYERS.satellite;

  return (
    <div data-ui="true" className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md">
      
      {/* Explorer Controls Bar */}
      {!pickerMode && showControls && (
        <div data-ui="true" className="p-3 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-teal-950/80 border border-teal-800/60 px-2 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span className="text-xs font-bold text-teal-300">Live Satellite GIS</span>
            </div>
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Infrastructure Hazard Telemetry</span>
            <span className="text-[11px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-teal-300 tabular-nums">
              {incidents.filter(i => i.latitude && i.longitude).length} mapped
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Severity Filter */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 text-slate-300">
              <span className="text-[11px] text-slate-400 font-medium">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Severities</option>
                <option value="critical" className="bg-slate-900 text-white">Critical Only</option>
                <option value="medium" className="bg-slate-900 text-white">Medium Only</option>
                <option value="low" className="bg-slate-900 text-white">Low Only</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 text-slate-300">
              <span className="text-[11px] text-slate-400 font-medium">Type:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer max-w-[130px] truncate"
              >
                <option value="all" className="bg-slate-900 text-white">All Categories</option>
                <option value="electrical_hazard" className="bg-slate-900 text-white">Electrical</option>
                <option value="burst_water_pipe" className="bg-slate-900 text-white">Water Pipe</option>
                <option value="open_manhole" className="bg-slate-900 text-white">Open Manhole</option>
                <option value="pothole" className="bg-slate-900 text-white">Pothole</option>
                <option value="sanitation_issue" className="bg-slate-900 text-white">Sanitation</option>
              </select>
            </div>

            {/* Fit All Incidents */}
            <button
              onClick={handleFitAll}
              type="button"
              className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg transition-colors font-medium border border-slate-700"
              title="Fit map view to all incidents"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Fit All</span>
            </button>

            {/* Locate Me */}
            <button
              onClick={handleDetectLocation}
              disabled={geoLocating}
              type="button"
              className="flex items-center gap-1 text-xs bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1 rounded-lg transition-colors font-semibold disabled:opacity-50 shadow-xs"
              title="Pan map to current GPS location"
            >
              <NavIcon className={`w-3.5 h-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
              <span>{geoLocating ? 'Locating...' : 'My Area'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Picker Mode Instruction Bar */}
      {pickerMode && (
        <div data-ui="true" className="p-3 bg-slate-900 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/40">
              <MapPin className="w-3.5 h-3.5" />
            </span>
            <span className="font-medium text-slate-200">
              Click map or drag the radar pin to set the exact hazard coordinates. Switch to <strong className="text-teal-300">Satellite view</strong> to spot streets, roads, and structures.
            </span>
          </div>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={geoLocating}
            className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
          >
            <NavIcon className={`w-3.5 h-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
            {geoLocating ? 'Acquiring GPS...' : 'Use My GPS'}
          </button>
        </div>
      )}

      {/* Geolocation Error Alert */}
      {geoError && (
        <div data-ui="true" className="bg-amber-950/90 border-b border-amber-800 px-3 py-1.5 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{geoError}</span>
          </div>
          <button onClick={() => setGeoError(null)} className="text-amber-300 hover:text-white font-bold ml-2">&times;</button>
        </div>
      )}

      {/* Real-World Satellite Layer Switcher Overlay (Top-Right of Map) */}
      {allowLayerSwitch && (
        <div data-ui="true" className="absolute top-3 right-3 z-[1000] flex items-center bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/70 shadow-xl text-white">
          <div className="flex items-center gap-0.5">
            {Object.values(MAP_LAYERS).map(layer => {
              const isActive = mapType === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => updateMapTiles(layer.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md ring-1 ring-teal-400/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title={layer.description}
                >
                  <span className="text-sm leading-none">{layer.icon}</span>
                  <span className="tracking-tight text-[11px] sm:text-xs">{layer.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Real-World Satellite High-Res Tag (Top-Left of Map Canvas) */}
      <div data-ui="true" className="absolute bottom-10 left-3 z-[900] pointer-events-none hidden sm:flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-[10px] text-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-white">{currentLayerConfig.icon} {currentLayerConfig.name}</span>
        <span className="text-slate-400">| {currentLayerConfig.badgeText}</span>
      </div>

      {/* Leaflet Map Div */}
      <div 
        ref={mapContainerRef} 
        style={{ height }} 
        className="w-full z-0 relative focus:outline-none" 
      />

      {/* Legend & Satellite Metadata Footer */}
      <div data-ui="true" className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-xs ring-1 ring-white/30"></span>
            Critical Hazard
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs ring-1 ring-white/30"></span>
            Medium Priority
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-xs ring-1 ring-white/30"></span>
            Low Priority
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-[11px]">
          <span className="italic">
            {mapType === 'satellite' || mapType === 'hybrid' 
              ? 'Real-world high-resolution orbital satellite photography (Esri / Maxar World Imagery)' 
              : 'OpenStreetMap cartographic data'}
          </span>
        </div>
      </div>
    </div>
  );
}
