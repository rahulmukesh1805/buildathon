import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial high-fidelity seed incidents matching municipal operations
export const INITIAL_INCIDENTS = [
  {
    id: 'inc-001',
    tracking_token: 'CF-8421-E9A1',
    title: 'Exposed High-Voltage Cable Hanging Near School Crosswalk',
    description: 'A high-voltage overhead electrical cable snapped during high winds and is dangling 4 feet above the pedestrian walkway near the main gate. Sparks visible intermittently when wet.',
    category: 'electrical_hazard',
    severity: 'critical',
    status: 'in_progress',
    address: '45 Elm Street, North Ward',
    landmark: 'Opposite St. Jude Primary School Gate 2',
    latitude: 12.9716,
    longitude: 77.5946,
    photo_url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80',
    resolution_photo_url: null,
    reporter_name: 'Marcus Vance',
    reporter_contact: '+1 555-019-2831',
    assigned_crew_id: 'crew-01',
    assigned_crew_name: 'Crew Alpha — High Voltage Quick Response',
    resolution_notes: null,
    rejection_reason: null,
    ai_priority_suggestion: 'Critical (Severe hazard to human life, active live electrical conductor)',
    ai_category_suggestion: 'electrical_hazard (confidence: 98%)',
    ai_duplicate_flag: false,
    ai_flag_reason: null,
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    resolved_at: null,
    audit_trail: [
      {
        id: 'aud-001',
        new_status: 'reported',
        notes: 'Incident submitted by citizen Marcus Vance.',
        actor_name: 'Marcus Vance (Citizen)',
        actor_role: 'citizen',
        created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      },
      {
        id: 'aud-002',
        new_status: 'verified',
        notes: 'Hazard confirmed via street sensor & dispatch review. High priority flag attached.',
        actor_name: 'Officer T. Henderson',
        actor_role: 'admin',
        created_at: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
      },
      {
        id: 'aud-003',
        new_status: 'in_progress',
        notes: 'Crew Alpha deployed on-site. Perimeter safety tape erected; isolating feeder grid line.',
        actor_name: 'Captain Miller (Crew Alpha)',
        actor_role: 'crew',
        created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      }
    ]
  },
  {
    id: 'inc-002',
    tracking_token: 'CF-7193-W4B2',
    title: 'Major Water Main Burst Flooding Residential Roadway',
    description: 'A pressurized municipal water conduit fractured under the asphalt, causing water to gush out into traffic lanes. Water pressure in the neighborhood has dropped completely.',
    category: 'burst_water_pipe',
    severity: 'critical',
    status: 'assigned',
    address: '120 Riverside Boulevard',
    landmark: 'Near Community Health Center & Park Entrance',
    latitude: 12.9789,
    longitude: 77.6012,
    photo_url: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80',
    resolution_photo_url: null,
    reporter_name: 'Elena Rostova',
    reporter_contact: '+1 555-014-9922',
    assigned_crew_id: 'crew-02',
    assigned_crew_name: 'Crew Bravo — Water & Sewerage Rapid Unit',
    resolution_notes: null,
    rejection_reason: null,
    ai_priority_suggestion: 'Critical (Flooding active roadway, severe municipal resource loss)',
    ai_category_suggestion: 'burst_water_pipe (confidence: 96%)',
    ai_duplicate_flag: false,
    ai_flag_reason: null,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    resolved_at: null,
    audit_trail: [
      {
        id: 'aud-004',
        new_status: 'reported',
        notes: 'Citizen complaint logged.',
        actor_name: 'Elena Rostova',
        actor_role: 'citizen',
        created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      },
      {
        id: 'aud-005',
        new_status: 'assigned',
        notes: 'Assigned to Crew Bravo with emergency excavation equipment.',
        actor_name: 'Chief Dispatcher Vance',
        actor_role: 'admin',
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      }
    ]
  },
  {
    id: 'inc-003',
    tracking_token: 'CF-9204-M3C8',
    title: 'Missing Heavy Cast-Iron Sewer Manhole Cover on Cyclist Path',
    description: 'The cast iron cover over a 10-foot deep stormwater access shaft has been removed or dislodged. Extremely dangerous for cyclists, joggers, and evening pedestrians.',
    category: 'open_manhole',
    severity: 'critical',
    status: 'verified',
    address: 'Park Avenue West, Lane 4',
    landmark: 'Adjacent to Grand Central Metro Station Exit C',
    latitude: 12.9655,
    longitude: 77.6050,
    photo_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    resolution_photo_url: null,
    reporter_name: 'Devon Thorne',
    reporter_contact: '+1 555-017-4321',
    assigned_crew_id: null,
    assigned_crew_name: null,
    resolution_notes: null,
    rejection_reason: null,
    ai_priority_suggestion: 'Critical (Severe fall danger, subterranean void on pedestrian path)',
    ai_category_suggestion: 'open_manhole (confidence: 97%)',
    ai_duplicate_flag: false,
    ai_flag_reason: null,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    resolved_at: null,
    audit_trail: [
      {
        id: 'aud-006',
        new_status: 'reported',
        notes: 'Complaint submitted with photo verification.',
        actor_name: 'Devon Thorne',
        actor_role: 'citizen',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'aud-007',
        new_status: 'verified',
        notes: 'Verified by Municipal Operations. Marked for immediate barricade and cast replacement.',
        actor_name: 'Admin Desk',
        actor_role: 'admin',
        created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      }
    ]
  },
  {
    id: 'inc-004',
    tracking_token: 'CF-4105-P8D6',
    title: 'Deep Pothole with Sharp Sub-Base Exposed on Commercial Transit Arterial',
    description: 'Two-foot wide pothole with fractured asphalt edges causing tire punctures and vehicular swerving. Water accumulates inside obscuring depth.',
    category: 'pothole',
    severity: 'medium',
    status: 'reported',
    address: '88 Market Street Junction',
    landmark: 'In front of Central Post Office',
    latitude: 12.9820,
    longitude: 77.5890,
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    resolution_photo_url: null,
    reporter_name: 'Amina Khan',
    reporter_contact: '+1 555-018-7711',
    assigned_crew_id: null,
    assigned_crew_name: null,
    resolution_notes: null,
    rejection_reason: null,
    ai_priority_suggestion: 'Medium (Vehicle damage hazard on active bus route)',
    ai_category_suggestion: 'pothole (confidence: 93%)',
    ai_duplicate_flag: false,
    ai_flag_reason: null,
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    resolved_at: null,
    audit_trail: [
      {
        id: 'aud-008',
        new_status: 'reported',
        notes: 'Report received and queued in municipal triage inbox.',
        actor_name: 'Amina Khan',
        actor_role: 'citizen',
        created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      }
    ]
  },
  {
    id: 'inc-005',
    tracking_token: 'CF-3091-S2E5',
    title: 'Overflowing Waste Container Blocking Stormwater Drainage Inflow',
    description: 'Municipal refuse container overflowed with commercial debris spilling into street gutter. Blocks runoff and emitting strong odor.',
    category: 'sanitation_issue',
    severity: 'low',
    status: 'resolved',
    address: '14 Harbor Side Lane',
    landmark: 'Behind Waterfront Fish Market',
    latitude: 12.9602,
    longitude: 77.5855,
    photo_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
    resolution_photo_url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    reporter_name: 'Jordan Lee',
    reporter_contact: '+1 555-011-3490',
    assigned_crew_id: 'crew-03',
    assigned_crew_name: 'Crew Delta — Sanitation & Environmental Services',
    resolution_notes: 'Sanitation crew dispatched with hydraulic compactor truck. Debris cleared, drainage grate cleared and sanitized with municipal biocide.',
    rejection_reason: null,
    ai_priority_suggestion: 'Low (Non-emergency sanitation blockage, routine clearance)',
    ai_category_suggestion: 'sanitation_issue (confidence: 91%)',
    ai_duplicate_flag: false,
    ai_flag_reason: null,
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    audit_trail: [
      {
        id: 'aud-009',
        new_status: 'reported',
        notes: 'Complaint logged.',
        actor_name: 'Jordan Lee',
        actor_role: 'citizen',
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 'aud-010',
        new_status: 'in_progress',
        notes: 'Compactor vehicle on-site.',
        actor_name: 'Supervisor Chen (Crew Delta)',
        actor_role: 'crew',
        created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      },
      {
        id: 'aud-011',
        new_status: 'resolved',
        notes: 'Site cleared, sanitized and verified.',
        actor_name: 'Supervisor Chen (Crew Delta)',
        actor_role: 'crew',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      }
    ]
  }
];

// Helper to generate unique non-guessable tracking token (e.g., CF-9482-K8A1)
export function generateTrackingToken() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let segment1 = '';
  let segment2 = '';
  for (let i = 0; i < 4; i++) {
    segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
    segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CF-${segment1}-${segment2}`;
}
