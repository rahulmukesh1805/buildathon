import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, INITIAL_INCIDENTS, generateTrackingToken } from '../lib/supabase';
import { assessHazardPriority, detectDuplicates } from '../lib/aiEngine';
import { playSuccessSound, playAlertSound, playDispatchSound, isSoundMuted, setSoundMuted } from '../lib/soundEffects';

const AppContext = createContext();

const STORAGE_KEY = 'civicfix_incidents_v1';
const NOTIFS_KEY = 'civicfix_notifications_v1';

export function AppProvider({ children }) {
  // Sound preferences
  const [soundMuted, setSoundMutedState] = useState(() => isSoundMuted());

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMutedState(next);
    setSoundMuted(next);
    if (!next) {
      playDispatchSound();
    }
  };

  // Current user role: 'citizen' | 'admin' | 'crew'
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('civicfix_role') || 'citizen';
  });

  // Current active crew identity (when in crew mode)
  const [activeCrew, setActiveCrew] = useState({
    id: 'crew-01',
    name: 'Crew Alpha — High Voltage Quick Response',
    department: 'Electrical Services'
  });

  // Incidents collection
  const [incidents, setIncidents] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed parsing local storage incidents', e);
    }
    return INITIAL_INCIDENTS;
  });

  // Notifications collection
  const [notifications, setNotifications] = useState(() => {
    try {
      const savedNotifs = localStorage.getItem(NOTIFS_KEY);
      if (savedNotifs) return JSON.parse(savedNotifs);
    } catch (e) {
      console.warn('Failed parsing local storage notifications', e);
    }
    return [
      {
        id: 'notif-1',
        title: 'New High-Risk Hazard Reported',
        message: 'Live electrical cable hanging near St. Jude Primary School requires dispatch.',
        time: '15m ago',
        isRead: false,
        trackingToken: 'CF-8421-E9A1',
        severity: 'critical'
      },
      {
        id: 'notif-2',
        title: 'Work Order Assigned',
        message: 'Crew Bravo assigned to 120 Riverside Blvd burst water conduit.',
        time: '1h ago',
        isRead: false,
        trackingToken: 'CF-7193-W4B2',
        severity: 'critical'
      }
    ];
  });

  // Toast notification state
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize role change with localStorage
  useEffect(() => {
    localStorage.setItem('civicfix_role', currentRole);
  }, [currentRole]);

  // Synchronize incidents with localStorage fallback
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
  }, [incidents]);

  // Synchronize notifications with localStorage
  useEffect(() => {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Show toast notification helper
  const showToast = (type, message) => {
    setToast({ type, message, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Optional: Attempt to fetch real Supabase incidents on mount if configured
  useEffect(() => {
    async function loadSupabaseIncidents() {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setIncidents(data);
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local dataset', err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSupabaseIncidents();
  }, []);

  // Citizen Submit Hazard
  const submitIncident = async (reportData) => {
    setIsLoading(true);
    try {
      const trackingToken = generateTrackingToken();
      
      // AI Priority Assessment
      const aiPriority = assessHazardPriority(
        reportData.category,
        `${reportData.title} ${reportData.description}`,
        reportData.landmark
      );

      // AI Duplicate Detection
      const dupCheck = detectDuplicates(reportData, incidents);

      const newRecord = {
        id: `inc-${Date.now()}`,
        tracking_token: trackingToken,
        title: reportData.title,
        description: reportData.description,
        category: reportData.category,
        severity: reportData.severity || aiPriority.suggestedSeverity || 'medium',
        status: 'reported',
        address: reportData.address,
        landmark: reportData.landmark || '',
        latitude: reportData.latitude || null,
        longitude: reportData.longitude || null,
        photo_url: reportData.photoUrl || null,
        audio_url: reportData.audioUrl || null,
        audio_transcript: reportData.audioTranscript || null,
        resolution_photo_url: null,
        reporter_name: reportData.reporterName || 'Anonymous Citizen',
        reporter_contact: reportData.reporterContact || null,
        assigned_crew_id: null,
        assigned_crew_name: null,
        resolution_notes: null,
        rejection_reason: null,
        ai_priority_suggestion: `${aiPriority.suggestedSeverity.toUpperCase()}: ${aiPriority.reason}`,
        ai_category_suggestion: reportData.category,
        ai_duplicate_flag: dupCheck.isDuplicate,
        ai_flag_reason: dupCheck.isDuplicate ? dupCheck.reason : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: null,
        audit_trail: [
          {
            id: `aud-${Date.now()}`,
            new_status: 'reported',
            notes: 'Hazard successfully registered in the municipal intake system.',
            actor_name: reportData.reporterName ? `${reportData.reporterName} (Citizen)` : 'Citizen Report',
            actor_role: 'citizen',
            created_at: new Date().toISOString()
          }
        ]
      };

      // Persist to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('incidents').insert([{
          tracking_token: newRecord.tracking_token,
          title: newRecord.title,
          description: newRecord.description,
          category: newRecord.category,
          severity: newRecord.severity,
          status: 'reported',
          address: newRecord.address,
          landmark: newRecord.landmark,
          latitude: newRecord.latitude,
          longitude: newRecord.longitude,
          photo_url: newRecord.photo_url,
          reporter_name: newRecord.reporter_name,
          reporter_contact: newRecord.reporter_contact,
          ai_priority_suggestion: newRecord.ai_priority_suggestion,
          ai_category_suggestion: newRecord.ai_category_suggestion,
          ai_duplicate_flag: newRecord.ai_duplicate_flag,
          ai_flag_reason: newRecord.ai_flag_reason
        }]);
        if (error) {
          console.warn('Supabase write error, saved locally:', error.message);
        }
      }

      // Update state
      setIncidents(prev => [newRecord, ...prev]);

      // Add system notification for municipal team
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: `New Incident #${trackingToken}`,
        message: `${newRecord.title} reported at ${newRecord.address}`,
        time: 'Just now',
        isRead: false,
        trackingToken: newRecord.tracking_token,
        severity: newRecord.severity
      };
      setNotifications(prev => [newNotif, ...prev]);

      if (newRecord.severity === 'critical') {
        playAlertSound();
      } else {
        playSuccessSound();
      }

      showToast('success', `Complaint submitted! Tracking Token: ${trackingToken}`);
      return { success: true, incident: newRecord };
    } catch (err) {
      console.error('Failed to submit incident:', err);
      showToast('error', 'Error submitting incident. Please check details and try again.');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Look up incident by tracking token
  const getIncidentByToken = (token) => {
    if (!token) return null;
    const cleanToken = token.trim().toUpperCase();
    return incidents.find(
      inc => inc.tracking_token?.toUpperCase() === cleanToken
    ) || null;
  };

  // Administrator verifies an incident
  const verifyIncident = (id, notes = 'Verified by Municipal Operations desk.') => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== id) return inc;
      const updated = {
        ...inc,
        status: 'verified',
        updated_at: new Date().toISOString(),
        audit_trail: [
          ...(inc.audit_trail || []),
          {
            id: `aud-${Date.now()}`,
            new_status: 'verified',
            notes,
            actor_name: 'Municipal Administrator Desk',
            actor_role: 'admin',
            created_at: new Date().toISOString()
          }
        ]
      };
      return updated;
    }));
    playDispatchSound();
    showToast('success', 'Incident marked as Verified.');
  };

  // Administrator rejects an incident with reason
  const rejectIncident = (id, reason) => {
    if (!reason || !reason.trim()) {
      showToast('error', 'Rejection reason is required.');
      return;
    }
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== id) return inc;
      return {
        ...inc,
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
        audit_trail: [
          ...(inc.audit_trail || []),
          {
            id: `aud-${Date.now()}`,
            new_status: 'rejected',
            notes: `Rejected: ${reason}`,
            actor_name: 'Municipal Administrator',
            actor_role: 'admin',
            created_at: new Date().toISOString()
          }
        ]
      };
    }));
    showToast('info', 'Incident marked as Rejected.');
  };

  // Administrator assigns field crew
  const assignCrew = (incidentId, crewId, crewName, instructions = '') => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== incidentId) return inc;
      return {
        ...inc,
        assigned_crew_id: crewId,
        assigned_crew_name: crewName,
        status: inc.status === 'in_progress' ? 'in_progress' : 'assigned',
        updated_at: new Date().toISOString(),
        audit_trail: [
          ...(inc.audit_trail || []),
          {
            id: `aud-${Date.now()}`,
            new_status: 'assigned',
            notes: `Dispatched to ${crewName}.${instructions ? ` Directives: ${instructions}` : ''}`,
            actor_name: 'Chief Municipal Dispatcher',
            actor_role: 'admin',
            created_at: new Date().toISOString()
          }
        ]
      };
    }));
    playDispatchSound();
    showToast('success', `Dispatched to ${crewName}.`);
  };

  // Change priority (Administrator)
  const changePriority = (incidentId, newSeverity, rationale = '') => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== incidentId) return inc;
      return {
        ...inc,
        severity: newSeverity,
        updated_at: new Date().toISOString(),
        audit_trail: [
          ...(inc.audit_trail || []),
          {
            id: `aud-${Date.now()}`,
            new_status: inc.status,
            notes: `Severity modified to ${newSeverity.toUpperCase()}.${rationale ? ` Reason: ${rationale}` : ''}`,
            actor_name: 'Municipal Administrator',
            actor_role: 'admin',
            created_at: new Date().toISOString()
          }
        ]
      };
    }));
    showToast('info', `Priority adjusted to ${newSeverity.toUpperCase()}`);
  };

  // Crew or Admin updates status (e.g. In Progress, Resolved)
  const updateStatus = (incidentId, newStatus, notes, actorName = 'Field Crew', resolutionPhoto = null) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== incidentId) return inc;
      const isResolved = newStatus === 'resolved';
      return {
        ...inc,
        status: newStatus,
        resolution_notes: isResolved ? notes : inc.resolution_notes,
        resolution_photo_url: resolutionPhoto || inc.resolution_photo_url,
        resolved_at: isResolved ? new Date().toISOString() : inc.resolved_at,
        updated_at: new Date().toISOString(),
        audit_trail: [
          ...(inc.audit_trail || []),
          {
            id: `aud-${Date.now()}`,
            new_status: newStatus,
            notes: notes || `Status updated to ${newStatus}`,
            actor_name: actorName,
            actor_role: currentRole,
            created_at: new Date().toISOString()
          }
        ]
      };
    }));
    if (newStatus === 'resolved') {
      playSuccessSound();
    } else {
      playDispatchSound();
    }
    showToast('success', `Status updated to ${newStatus.toUpperCase().replace('_', ' ')}.`);
  };

  // Mark all notifications read
  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Reset to initial seed dataset for clean demo evaluation
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIncidents(INITIAL_INCIDENTS);
    showToast('info', 'Demo municipal dataset restored.');
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        activeCrew,
        setActiveCrew,
        incidents,
        notifications,
        isLoading,
        toast,
        submitIncident,
        getIncidentByToken,
        verifyIncident,
        rejectIncident,
        assignCrew,
        changePriority,
        updateStatus,
        markNotificationsRead,
        resetDemoData,
        showToast,
        soundMuted,
        toggleSound,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
