# CivicFix AI — Smart Municipal Infrastructure Hazard Reporting & Dispatch Platform

A centralized civic infrastructure portal connecting citizen hazard reports with municipal dispatch crews, automated AI priority triage, and transparent public resolution tracking.

---

## 🚀 How to Run Tomorrow Morning

When you open your terminal or IDE tomorrow, just run:

```bash
# 1. Open the project folder
cd "c:\Users\Rahul Mukesh\OneDrive\Desktop\Buildathon"

# 2. Start the local development server
npm run dev
```

Open your browser at: **`http://localhost:5173/`**

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Vite, JavaScript
- **Styling**: Tailwind CSS with custom municipal civic theme (Deep Navy `#0B132B`, White, Teal `#0D9488`, and severity badges)
- **Routing**: React Router DOM (Role-aware navigation for Citizens, Admins, and Field Crews)
- **Maps**: Leaflet + OpenStreetMap (interactive dual-mode: Explorer & Location Pin Picker)
- **Icons**: Lucide React
- **Analytics**: Recharts (category bar charts and status distribution pie charts)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) policies and seed data
- **AI Triage**: Rule-based transparent heuristic engine (NLP category classification, hazard priority scoring, and duplicate detection)

---

## 📂 Project Structure ("Less Files" Design)

```
Buildathon/
├── .env.example                # Supabase & app configuration template
├── supabase/
│   └── schema.sql             # Complete PostgreSQL DDL with RLS, triggers & seed data
├── src/
│   ├── components/
│   │   ├── Navigation.jsx     # Header with role switcher (Citizen, Admin, Crew), notifications & alerts
│   │   └── IncidentMap.jsx    # Dual-mode Leaflet map (Explorer view & Pin Picker)
│   ├── context/
│   │   └── AppContext.jsx     # Central state, role switching, Supabase sync & localStorage fallback
│   ├── lib/
│   │   ├── supabase.js        # Supabase client, config detector, and mock seed dataset
│   │   └── aiEngine.js        # Transparent AI category classifier, priority scorer, and duplicate detector
│   ├── pages/
│   │   ├── LandingPage.jsx    # Hero, live KPIs, map preview, recent incidents feed
│   │   ├── ReportHazardPage.jsx # Validated form with AI auto-detect, duplicate alert, map picker & token generation
│   │   ├── TrackComplaintPage.jsx # 5-step visual timeline, before/after photos, privacy masking
│   │   ├── AdminDashboard.jsx # Command center, Recharts analytics, filters, drawer & action dialogs
│   │   ├── CrewDashboard.jsx  # Field technician work orders, status transitions & completion photo
│   │   └── MapPage.jsx        # Dedicated fullscreen interactive hazard map
│   ├── App.jsx                # Router, global toast notifications & municipal footer
│   ├── index.css              # Tailwind directives, Leaflet styles & pulse animations
│   └── main.jsx
├── index.html
├── package.json
└── tailwind.config.js
```

---

## 👥 User Roles & Features

### 1. 👤 Citizen Mode
- **Report Hazards**: Electrical wires, burst pipes, open manholes, potholes, sanitation issues.
- **Voice Note & Speech-to-Text**: Record hands-free audio notes with animated audio waveform, live speech-to-text transcript appending, and playback controls.
- **1-Click Demo Autofill**: Instantly populates realistic high-risk hazards for fast evaluation.
- **AI-Assisted Intake**: Real-time category suggestions and transparent priority calculation as you describe the problem.
- **Duplicate Protection**: Warns if a similar complaint was recently logged within 350 meters.
- **Non-guessable Tracking Tokens**: Generated code (e.g., `CF-8421-E9A1`) to monitor progress without exposing personal phone/email.
- **5-Stage Timeline**: Track from *Reported ➔ Verified ➔ Assigned ➔ In Progress ➔ Resolved* with before/after photos and audio memo review.

### 2. 🛡️ Municipal Administrator (Command Center)
- **Live KPI Counters**: Total complaints, critical risks, unassigned queue, active repairs, resolved items.
- **NOC Dark Mode**: 1-click toggle for Control Room high-contrast dark emergency dispatch theme.
- **Export to CSV**: Download complete incident logs and coordinates as formatted CSV spreadsheet.
- **Print Municipal Briefing / PDF**: Generate official printable operational briefing report with KPI summary and active hazards.
- **Recharts Analytics**: Category distribution and status breakdown graphs.
- **Citizen Voice Note Player**: Listen to attached citizen voice recordings directly in the Incident Review Drawer.
- **Administrative Actions**: Verify incident, Reject with custom reason, Dispatch specialized crew, Adjust severity, or Mark resolved.
- **Audit Log**: Full timestamped trail of who took what action.

### 3. 🔧 Field Crew Mode
- **Assigned Work Orders**: Filtered to the selected crew (Electrical, Water Works, Road Patch, Sanitation).
- **Citizen Audio Memo Playback**: Listen to citizen audio notes on-site before initiating repairs.
- **Status Transitions**: Move work order to *In-Progress*, add on-site notes, and certify *Resolved*.
- **Proof of Work**: Upload after-repair completion photo (with 1-click certified demo repair photo) and resolution notes.

### 4. 🧭 Interactive Evaluation & Cloud Features
- **4-Stage Demo Walkthrough Tour**: Guided interactive tour (`DemoTourModal`) walking evaluators through the complete lifecycle.
- **Supabase Cloud Diagnostics Modal**: Test connection latency, copy `.env.local` templates, and 1-click seed cloud PostgreSQL table.
- **Zero-Dependency Synthetic Sound Effects**: Web Audio API chimes for notifications, submissions, and dispatches with quick mute toggle.
- **Mobile Bottom Navigation Bar**: Floating handheld dock for phone screens.

---

## 🗄️ Supabase Setup (Optional for Persistent Cloud DB)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run `supabase/schema.sql`.
3. In this project, create `.env.local`:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. *Zero-config fallback*: If `.env.local` is not configured, the app runs completely out-of-the-box using the built-in local persistent state with pre-populated realistic municipal data!

---

## 🚢 Vercel Deployment

1. Push this folder to a GitHub repository:
   ```bash
   git add .
   git commit -m "feat: CivicFix AI infrastructure platform"
   git push origin main
   ```
2. Import the repo into [Vercel](https://vercel.com).
3. Under Environment Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (if using Supabase).
4. Click **Deploy**.
