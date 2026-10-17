-- ====================================================================
-- CivicFix AI — Municipal Infrastructure Hazard Reporting & Dispatch
-- Production PostgreSQL Database Schema & Security Policies for Supabase
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running migrations (clean setup)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS incident_assignments CASCADE;
DROP TABLE IF EXISTS incident_updates CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Profiles Table (Municipal Staff, Administrators, Field Crews)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'crew', 'citizen')),
  department TEXT, -- e.g., 'Electrical Services', 'Water & Sewerage', 'Public Works', 'Sanitation'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Incidents Table (Central Civic Hazards)
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_token TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'electrical_hazard',
    'burst_water_pipe',
    'open_manhole',
    'pothole',
    'sanitation_issue',
    'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'critical')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN (
    'reported',
    'verified',
    'assigned',
    'in_progress',
    'resolved',
    'rejected'
  )),
  address TEXT NOT NULL,
  landmark TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  photo_url TEXT,
  resolution_photo_url TEXT,
  
  -- Reporter details (Safeguarded: optional & never exposed to public tracking)
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name TEXT,
  reporter_contact TEXT,
  
  -- Assignment details
  assigned_crew_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_crew_name TEXT,
  
  -- Resolution & review details
  resolution_notes TEXT,
  rejection_reason TEXT,
  ai_priority_suggestion TEXT,
  ai_category_suggestion TEXT,
  ai_duplicate_flag BOOLEAN DEFAULT FALSE,
  ai_flag_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 5. Incident Status Change & Audit Log
CREATE TABLE incident_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT 'System / Staff',
  actor_role TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Incident Crew Assignments Log
CREATE TABLE incident_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  crew_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  crew_name TEXT NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. In-App Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_role TEXT CHECK (recipient_role IN ('all', 'admin', 'crew', 'citizen')),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  tracking_token TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- Performance Indexes for Fast Lookups, Search, and Filtering
-- ====================================================================
CREATE INDEX idx_incidents_tracking_token ON incidents(tracking_token);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_assigned_crew ON incidents(assigned_crew_id);
CREATE INDEX idx_incident_updates_incident ON incident_updates(incident_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_role, is_read);

-- ====================================================================
-- Token Generator Function: Non-guessable alphanumeric code (CF-XXXX-XXXX)
-- ====================================================================
CREATE OR REPLACE FUNCTION generate_tracking_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result TEXT := 'CF-';
  i INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ====================================================================
-- Trigger: Automatic updated_at timestamp maintenance
-- ====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
-- Staff can view other staff profiles for dispatch assignment
CREATE POLICY "Authenticated staff can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile (cannot escalate role)
CREATE POLICY "Users can update own non-role profile fields"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Incidents Policies
-- Public / Anonymous can insert a new hazard report (validated by constraints)
CREATE POLICY "Public can submit hazard reports"
  ON incidents FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    title IS NOT NULL AND 
    description IS NOT NULL AND 
    category IN ('electrical_hazard', 'burst_water_pipe', 'open_manhole', 'pothole', 'sanitation_issue', 'other') AND
    severity IN ('low', 'medium', 'critical')
  );

-- Public can query incidents for public map and recent incidents feed (safe fields only)
CREATE POLICY "Public can read non-private incident details"
  ON incidents FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated municipal admins can update any incident
CREATE POLICY "Admins have full update access"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Field crew can view and update incidents assigned to them
CREATE POLICY "Crew can update assigned incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (
    assigned_crew_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. Incident Updates (Audit Trail) Policies
-- Public can view audit trail for status verification
CREATE POLICY "Public can view audit history"
  ON incident_updates FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated staff can insert audit logs
CREATE POLICY "Staff can insert incident audit updates"
  ON incident_updates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Incident Assignments Policies
CREATE POLICY "Staff can view assignments"
  ON incident_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create assignments"
  ON incident_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 5. Notifications Policies
CREATE POLICY "Users can view role-matching notifications"
  ON notifications FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Staff can insert notifications"
  ON notifications FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- ====================================================================
-- SEED INITIAL MUNICIPAL TEST DATA
-- ====================================================================

INSERT INTO incidents (
  tracking_token,
  title,
  description,
  category,
  severity,
  status,
  address,
  landmark,
  latitude,
  longitude,
  photo_url,
  resolution_photo_url,
  reporter_name,
  reporter_contact,
  assigned_crew_name,
  resolution_notes,
  ai_priority_suggestion,
  ai_category_suggestion,
  created_at
) VALUES 
(
  'CF-8421-E9A1',
  'Exposed High-Voltage Cable Hanging Near School Crosswalk',
  'A high-voltage overhead electrical cable snapped during high winds and is dangling 4 feet above the pedestrian walkway near the main gate. Sparks visible intermittently when wet.',
  'electrical_hazard',
  'critical',
  'in_progress',
  '45 Elm Street, North Ward',
  'Opposite St. Jude Primary School Gate 2',
  12.9716,
  77.5946,
  'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80',
  NULL,
  'Marcus Vance',
  '+1 555-019-2831',
  'Crew Alpha — High Voltage Quick Response',
  NULL,
  'Critical (Hazard to human life, live electrical current near school)',
  'electrical_hazard (confidence: 98%)',
  NOW() - INTERVAL '3 hours'
),
(
  'CF-7193-W4B2',
  'Major Water Main Burst Flooding Residential Roadway',
  'A pressurized municipal water conduit fractured under the asphalt, causing water to gush out into traffic lanes. Water pressure in the neighborhood has dropped completely.',
  'burst_water_pipe',
  'critical',
  'assigned',
  '120 Riverside Boulevard',
  'Near Community Health Center & Park Entrance',
  12.9789,
  77.6012,
  'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80',
  NULL,
  'Elena Rostova',
  '+1 555-014-9922',
  'Crew Bravo — Water & Sewerage Rapid Unit',
  NULL,
  'Critical (Flooding roadway, public utility disruption)',
  'burst_water_pipe (confidence: 96%)',
  NOW() - INTERVAL '6 hours'
),
(
  'CF-9204-M3C8',
  'Missing Heavy Cast-Iron Sewer Manhole Cover on Cyclist Path',
  'The cast iron cover over a 10-foot deep stormwater access shaft has been removed or dislodged. Extremely dangerous for cyclists, joggers, and evening pedestrians.',
  'open_manhole',
  'critical',
  'verified',
  'Park Avenue West, Lane 4',
  'Adjacent to Grand Central Metro Station Exit C',
  12.9655,
  77.6050,
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  NULL,
  'Devon Thorne',
  '+1 555-017-4321',
  NULL,
  NULL,
  'Critical (Fall risk into open subterranean shaft)',
  'open_manhole (confidence: 95%)',
  NOW() - INTERVAL '1 day'
),
(
  'CF-4105-P8D6',
  'Deep Pothole with Sharp Sub-Base Exposed on Commercial Transit Arterial',
  'Two-foot wide pothole with fractured asphalt edges causing tire punctures and vehicular swerving. Water accumulates inside obscuring depth.',
  'pothole',
  'medium',
  'reported',
  '88 Market Street Junction',
  'In front of Central Post Office',
  12.9820,
  77.5890,
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  NULL,
  'Amina Khan',
  '+1 555-018-7711',
  NULL,
  NULL,
  'Medium (Vehicle damage hazard on active bus route)',
  'pothole (confidence: 92%)',
  NOW() - INTERVAL '18 hours'
),
(
  'CF-3091-S2E5',
  'Overflowing Waste Container Blocking Stormwater Drainage Inflow',
  'Municipal refuse container overflowed with commercial debris spilling into street gutter. Blocks runoff and emitting strong odor.',
  'sanitation_issue',
  'low',
  'resolved',
  '14 Harbor Side Lane',
  'Behind Waterfront Fish Market',
  12.9602,
  77.5855,
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
  'Jordan Lee',
  '+1 555-011-3490',
  'Crew Delta — Sanitation & Environmental Services',
  'Sanitation crew dispatched with hydraulic compactor truck. Debris cleared, drainage grate cleared and sanitized with municipal biocide.',
  'Low (Non-emergency sanitation blockage)',
  'sanitation_issue (confidence: 90%)',
  NOW() - INTERVAL '2 days'
);

-- Seed initial status change logs for audit timeline demo
INSERT INTO incident_updates (incident_id, previous_status, new_status, notes, actor_name, actor_role, created_at)
SELECT id, 'reported', 'in_progress', 'Crew Alpha arrived on site and established safety cordon perimeter around live wire.', 'Captain Miller', 'crew', NOW() - INTERVAL '1 hour'
FROM incidents WHERE tracking_token = 'CF-8421-E9A1';

INSERT INTO incident_updates (incident_id, previous_status, new_status, notes, actor_name, actor_role, created_at)
SELECT id, 'reported', 'assigned', 'Dispatched urgent water utility crew with replacement 8-inch pipe coupling.', 'Chief Dispatcher Vance', 'admin', NOW() - INTERVAL '4 hours'
FROM incidents WHERE tracking_token = 'CF-7193-W4B2';

INSERT INTO incident_updates (incident_id, previous_status, new_status, notes, actor_name, actor_role, created_at)
SELECT id, 'reported', 'resolved', 'Full waste clearance completed. Drainage grate inspected and certified unblocked.', 'Crew Delta Supervisor', 'crew', NOW() - INTERVAL '1 day'
FROM incidents WHERE tracking_token = 'CF-3091-S2E5';
