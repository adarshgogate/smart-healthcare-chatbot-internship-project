import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import api from "../../api/axios";

/* ─── Design Tokens ──────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #060d12;
    --surface:   #0d1b24;
    --surface2:  #132030;
    --border:    rgba(32,200,180,0.12);
    --teal:      #14b8a6;
    --cyan:      #22d3ee;
    --indigo:    #818cf8;
    --emerald:   #34d399;
    --amber:     #fbbf24;
    --rose:      #fb7185;
    --text:      #e2f4f2;
    --muted:     #5d8a88;
    --card-glow: 0 0 0 1px var(--border), 0 8px 32px rgba(20,184,166,0.06);
  }

  body { background: var(--bg); color: var(--text); font-family: 'Instrument Sans', sans-serif; }

  .admin-shell {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 50% at 20% -10%, rgba(20,184,166,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 110%, rgba(34,211,238,0.06) 0%, transparent 60%),
      var(--bg);
  }

  /* Header */
  .adm-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 40px;
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(20px);
    background: rgba(6,13,18,0.8);
    position: sticky; top: 0; z-index: 100;
  }
  .adm-logo { display: flex; align-items: center; gap: 12px; }
  .adm-logo-icon {
    width: 40px; height: 40px; border-radius: 12px;
    background: linear-gradient(135deg, var(--teal), var(--cyan));
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .adm-logo-text { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--text); }
  .adm-logo-sub  { font-size: 12px; color: var(--muted); font-family: 'DM Mono', monospace; }

  /* Nav tabs */
  .adm-nav { display: flex; gap: 4px; align-items: center; }
  .adm-tab {
    padding: 8px 18px; border-radius: 10px; border: 1px solid transparent;
    font-family: 'Instrument Sans', sans-serif; font-size: 13.5px; font-weight: 500;
    cursor: pointer; transition: all 0.2s; color: var(--muted); background: none;
  }
  .adm-tab:hover { color: var(--text); border-color: var(--border); }
  .adm-tab.active {
    color: var(--teal); border-color: rgba(20,184,166,0.35);
    background: rgba(20,184,166,0.08);
  }
  .adm-tab-badge {
    display: inline-block; background: rgba(20,184,166,0.2); color: var(--teal);
    font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
    padding: 1px 7px; border-radius: 20px; margin-left: 6px;
  }
  .adm-tab.active .adm-tab-badge { background: rgba(20,184,166,0.3); }

  .logout-btn {
    padding: 8px 18px; border-radius: 10px; font-size: 13px; font-weight: 600;
    border: 1px solid rgba(251,113,133,0.3); background: rgba(251,113,133,0.07);
    color: var(--rose); cursor: pointer; font-family: 'Instrument Sans', sans-serif;
    transition: all 0.2s;
  }
  .logout-btn:hover { background: rgba(251,113,133,0.18); border-color: rgba(251,113,133,0.5); }

  /* Main */
  .adm-main { padding: 36px 40px; max-width: 1400px; margin: 0 auto; }

  /* Stat cards */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 36px; }
  @media(max-width: 900px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
  @media(max-width: 480px) { .stat-grid { grid-template-columns: 1fr; } .adm-main { padding: 20px 16px; } .adm-header { padding: 16px; } }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 22px;
    position: relative; overflow: hidden;
    animation: fadeUp 0.5s ease both;
    box-shadow: var(--card-glow);
  }
  .stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--accent-grad);
  }
  .stat-icon {
    width: 44px; height: 44px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; margin-bottom: 14px;
    background: var(--accent-bg);
  }
  .stat-label { font-size: 11px; font-family: 'DM Mono', monospace; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .stat-value { font-family: 'Syne', sans-serif; font-size: 34px; font-weight: 800; color: var(--text); line-height: 1; }
  .stat-sub   { font-size: 12px; color: var(--muted); margin-top: 6px; }

  /* Section headers */
  .section-title {
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
    color: var(--text); margin-bottom: 4px;
    display: flex; align-items: center; gap: 8px;
  }
  .section-sub { font-size: 12px; color: var(--muted); margin-bottom: 20px; font-family: 'DM Mono', monospace; }

  /* Cards */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 18px; padding: 24px;
    box-shadow: var(--card-glow);
    animation: fadeUp 0.5s ease both;
  }

  /* Charts grid */
  .charts-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .charts-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  @media(max-width: 900px) { .charts-grid-2, .charts-grid-3 { grid-template-columns: 1fr; } }

  /* Table */
  .data-table { width: 100%; border-collapse: collapse; font-family: 'Instrument Sans', sans-serif; }
  .data-table thead tr { background: rgba(20,184,166,0.06); }
  .data-table th {
    padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600;
    font-family: 'DM Mono', monospace; color: var(--teal); text-transform: uppercase;
    letter-spacing: 0.06em; border-bottom: 1px solid var(--border);
  }
  .data-table td { padding: 13px 16px; font-size: 13.5px; color: var(--text); border-bottom: 1px solid rgba(32,200,180,0.06); }
  .data-table tbody tr:hover { background: rgba(20,184,166,0.04); }
  .data-table tbody tr:last-child td { border-bottom: none; }

  /* Badges */
  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; font-family: 'Instrument Sans', sans-serif; }

  /* Progress bar */
  .progress-bar-track { background: rgba(20,184,166,0.1); border-radius: 99px; height: 6px; overflow: hidden; flex: 1; }
  .progress-bar-fill  { height: 100%; border-radius: 99px; background: var(--fill); transition: width 1s ease; }

  /* KPI row */
  .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
  @media(max-width: 700px) { .kpi-row { grid-template-columns: 1fr; } }
  .kpi-card {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 14px; padding: 18px 20px;
  }
  .kpi-label { font-size: 11px; font-family: 'DM Mono', monospace; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
  .kpi-value { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; }
  .kpi-desc  { font-size: 11.5px; color: var(--muted); margin-top: 3px; }

  /* Rank list */
  .rank-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(32,200,180,0.06); }
  .rank-item:last-child { border-bottom: none; }
  .rank-num { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--muted); width: 20px; text-align: right; flex-shrink: 0; }
  .rank-name { flex: 1; font-size: 13.5px; font-weight: 500; color: var(--text); }
  .rank-val  { font-family: 'DM Mono', monospace; font-size: 13px; color: var(--teal); font-weight: 500; }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Tooltip override */
  .recharts-tooltip-wrapper .recharts-default-tooltip {
    background: var(--surface2) !important;
    border: 1px solid var(--border) !important;
    border-radius: 10px !important;
    font-family: 'Instrument Sans', sans-serif !important;
    font-size: 13px !important;
    color: var(--text) !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
  }
  .recharts-default-tooltip .recharts-tooltip-label { color: var(--muted) !important; }
`;

/* ─── Color Palette ─────────────────────────────────────────────── */
const PALETTE = ["#14b8a6","#22d3ee","#818cf8","#34d399","#fbbf24","#fb7185","#a78bfa","#38bdf8"];

const STATUS_CFG = {
  Confirmed: { bg:"rgba(52,211,153,0.15)", color:"#34d399", dot:"#34d399" },
  Pending:   { bg:"rgba(251,191,36,0.15)",  color:"#fbbf24", dot:"#fbbf24" },
  Completed: { bg:"rgba(129,140,248,0.15)", color:"#818cf8", dot:"#818cf8" },
  Cancelled: { bg:"rgba(251,113,133,0.15)", color:"#fb7185", dot:"#fb7185" },
  Rejected:  { bg:"rgba(251,113,133,0.15)", color:"#fb7185", dot:"#fb7185" },
};
const ROLE_CFG = {
  admin:   { bg:"rgba(251,191,36,0.15)",  color:"#fbbf24", icon:"⚙️" },
  doctor:  { bg:"rgba(34,211,238,0.15)",  color:"#22d3ee", icon:"🩺" },
  patient: { bg:"rgba(52,211,153,0.15)",  color:"#34d399", icon:"💙" },
};

/* ─── Custom Tooltip ─────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0d1b24", border:"1px solid rgba(32,200,180,0.18)", borderRadius:10, padding:"10px 14px", fontFamily:"'Instrument Sans',sans-serif" }}>
      <p style={{ fontSize:12, color:"#5d8a88", marginBottom:6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize:13, color: p.color || "#14b8a6", fontWeight:600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Small Stat Card ────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, accentGrad, accentBg, delay }) {
  return (
    <div className="stat-card" style={{ "--accent-grad": accentGrad, "--accent-bg": accentBg, animationDelay:`${delay*0.07}s` }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? "—"}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [stats, setStats]               = useState(null);
  const [users, setUsers]               = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors]           = useState([]);
  const [error, setError]               = useState("");
  const [activeTab, setActiveTab]       = useState("overview");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setError("No token found. Please login again."); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      api.get("/admin/stats",        { headers }),
      api.get("/admin/users",        { headers }),
      api.get("/admin/appointments", { headers }),
      api.get("/admin/doctors",      { headers }),
    ])
      .then(([sR, uR, aR, dR]) => {
        setStats(sR.data);
        setUsers(uR.data.users ?? []);
        setAppointments(aR.data.appointments ?? []);
        setDoctors(dR.data ?? []);
      })
      .catch(() => setError("Failed to load dashboard data."));
  }, []);

  /* ── Derived analytics ── */
  const analytics = (() => {
    if (!appointments.length) return null;

    // Helper: look up a username from users array by user_id
    // Doctors and patients both have a user_id that maps to User.id
    const userById = {};
    users.forEach(u => { userById[u.id] = u.username; });

    // Also build doctor_id → username map
    // doctors[] from /admin/doctors has { id (user_id), username, email }
    const doctorNameById = {};
    doctors.forEach(d => { doctorNameById[d.id] = d.username; });

    // 1. Status breakdown
    const statusMap = {};
    appointments.forEach(a => { statusMap[a.status] = (statusMap[a.status] || 0) + 1; });
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // 2. Monthly trend
    const monthMap = {};
    appointments.forEach(a => {
      if (!a.date) return;
      const key = a.date.slice(0, 7);
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    const trendData = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // 3. Top doctors by bookings — with real names
    const drMap = {};
    appointments.forEach(a => { drMap[a.doctor_id] = (drMap[a.doctor_id] || 0) + 1; });
    const topDoctors = Object.entries(drMap)
      .map(([id, count]) => ({
        id: Number(id),
        count,
        name: doctorNameById[Number(id)] || userById[Number(id)] || `Doctor #${id}`,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 4. Patient activity — with real names
    // appointment.patient_id is Patient.patient_id (not user_id directly),
    // so fall back gracefully if not found
    const ptMap = {};
    appointments.forEach(a => { ptMap[a.patient_id] = (ptMap[a.patient_id] || 0) + 1; });
    const topPatients = Object.entries(ptMap)
      .map(([id, count]) => ({
        id: Number(id),
        count,
        // patient_id may equal user_id in many setups; try both lookups
        name: userById[Number(id)] || `Patient #${id}`,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 5. Cancellation rate
    const cancelled = (statusMap["Cancelled"] || 0) + (statusMap["Rejected"] || 0);
    const cancelRate = ((cancelled / appointments.length) * 100).toFixed(1);

    // 6. Day-of-week load
    const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const dayMap = { Sun:0,Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0 };
    appointments.forEach(a => {
      if (!a.date) return;
      const d = new Date(a.date);
      dayMap[dayNames[d.getDay()]]++;
    });
    const dayData = dayNames.map(d => ({ day: d, count: dayMap[d] }));

    // 7. Role distribution
    const roleMap = {};
    users.forEach(u => { roleMap[u.role] = (roleMap[u.role] || 0) + 1; });
    const roleData = Object.entries(roleMap).map(([name, value]) => ({ name, value }));

    // 8. Doctor bar chart (top 6) — real names
    const drBarData = topDoctors.slice(0, 6).map(d => ({
      name: d.name.length > 14 ? d.name.slice(0, 13) + "…" : d.name,
      count: d.count,
    }));

    return { statusData, trendData, topDoctors, topPatients, cancelRate, dayData, roleData, drBarData };
  })();

  const tabs = [
    { id: "overview",      label: "Overview",      icon: "◈" },
    { id: "appointments",  label: "Appointments",   icon: "◷" },
    { id: "users",         label: "Users",          icon: "◉" },
    { id: "analytics",     label: "Analytics",      icon: "◆" },
  ];

  if (error) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d12" }}>
      <div style={{ background:"rgba(251,113,133,0.1)", border:"1px solid rgba(251,113,133,0.3)", borderRadius:14, padding:"20px 28px", color:"#fb7185", fontWeight:600, fontFamily:"'Instrument Sans',sans-serif" }}>
        ⚠️ {error}
      </div>
    </div>
  );

  if (!stats) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#060d12", gap:12 }}>
      <CircularProgress size={24} style={{ color:"#14b8a6" }} />
      <span style={{ color:"#5d8a88", fontFamily:"'DM Mono',monospace", fontSize:14 }}>loading system data...</span>
    </div>
  );

  const cancelRate = analytics?.cancelRate ?? "0.0";
  const confirmed  = appointments.filter(a => a.status === "Confirmed").length;
  const pending    = appointments.filter(a => a.status === "Pending").length;

  return (
    <>
      <style>{CSS}</style>
      <div className="admin-shell">

        {/* ── Header ── */}
        <header className="adm-header">
          <div className="adm-logo">
            <div className="adm-logo-icon">⚙️</div>
            <div>
              <div className="adm-logo-text">AdminPanel</div>
              <div className="adm-logo-sub">v2.0 · advanced analytics</div>
            </div>
          </div>

          <nav className="adm-nav">
            {tabs.map(t => (
              <button key={t.id} className={`adm-tab ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>
            ↪ Logout
          </button>
        </header>

        <main className="adm-main">

          {/* ════════════════════ OVERVIEW TAB ════════════════════ */}
          {activeTab === "overview" && (
            <>
              {/* Stat cards */}
              <div className="stat-grid">
                <StatCard icon="👤" label="Total Users"   value={stats.total_users}
                  accentGrad="linear-gradient(90deg,#14b8a6,#22d3ee)" accentBg="rgba(20,184,166,0.12)" delay={1}
                  sub={`${users.filter(u=>u.role==="admin").length} admins`} />
                <StatCard icon="🩺" label="Doctors"       value={stats.total_doctors}
                  accentGrad="linear-gradient(90deg,#22d3ee,#38bdf8)" accentBg="rgba(34,211,238,0.12)" delay={2}
                  sub="registered practitioners" />
                <StatCard icon="💙" label="Patients"      value={stats.total_patients}
                  accentGrad="linear-gradient(90deg,#34d399,#14b8a6)" accentBg="rgba(52,211,153,0.12)" delay={3}
                  sub="active patients" />
                <StatCard icon="📋" label="Appointments"  value={stats.total_appointments}
                  accentGrad="linear-gradient(90deg,#818cf8,#a78bfa)" accentBg="rgba(129,140,248,0.12)" delay={4}
                  sub={`${cancelRate}% cancellation rate`} />
              </div>

              {/* KPI row */}
              <div className="kpi-row" style={{ animationDelay:"0.3s" }}>
                <div className="kpi-card">
                  <div className="kpi-label">Confirmed</div>
                  <div className="kpi-value" style={{ color:"#34d399" }}>{confirmed}</div>
                  <div className="kpi-desc">{appointments.length ? ((confirmed/appointments.length)*100).toFixed(1) : 0}% of total appointments</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Pending Review</div>
                  <div className="kpi-value" style={{ color:"#fbbf24" }}>{pending}</div>
                  <div className="kpi-desc">awaiting confirmation</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Cancel Rate</div>
                  <div className="kpi-value" style={{ color:"#fb7185" }}>{cancelRate}%</div>
                  <div className="kpi-desc">cancelled + rejected</div>
                </div>
              </div>

              {/* Charts row */}
              {analytics && (
                <div className="charts-grid-2">
                  {/* Trend */}
                  <div className="card">
                    <div className="section-title">📈 Booking Trend</div>
                    <div className="section-sub">monthly appointments over time</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={analytics.trendData}>
                        <defs>
                          <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(32,200,180,0.08)" />
                        <XAxis dataKey="month" tick={{ fill:"#5d8a88", fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill:"#5d8a88", fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="count" name="Appointments" stroke="#14b8a6" strokeWidth={2.5} fill="url(#tealGrad)" dot={{ fill:"#14b8a6", r:4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Status pie */}
                  <div className="card">
                    <div className="section-title">🥧 Status Breakdown</div>
                    <div className="section-sub">distribution by appointment status</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={analytics.statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                          paddingAngle={4} dataKey="value" nameKey="name">
                          {analytics.statusData.map((entry, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize:12, fontFamily:"'Instrument Sans',sans-serif", color:"#5d8a88" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Day load */}
              {analytics && (
                <div className="card" style={{ marginBottom:20 }}>
                  <div className="section-title">📅 Weekly Load Pattern</div>
                  <div className="section-sub">number of appointments per day of week</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.dayData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(32,200,180,0.08)" />
                      <XAxis dataKey="day" tick={{ fill:"#5d8a88", fontSize:12, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:"#5d8a88", fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Appointments" radius={[6,6,0,0]}>
                        {analytics.dayData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* ════════════════════ ANALYTICS TAB ════════════════════ */}
          {activeTab === "analytics" && analytics && (
            <>
              <div style={{ marginBottom:28 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#e2f4f2", marginBottom:4 }}>Advanced Analytics</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#5d8a88" }}>deep-dive metrics across all dimensions</div>
              </div>

              {/* Top doctors + Top patients */}
              <div className="charts-grid-2" style={{ marginBottom:20 }}>
                <div className="card">
                  <div className="section-title">🩺 Top Doctors by Bookings</div>
                  <div className="section-sub">ranked by appointment count</div>
                  {analytics.topDoctors.map((d, i) => {
                    const max = analytics.topDoctors[0].count;
                    return (
                      <div key={d.id} className="rank-item">
                        <span className="rank-num">{i + 1}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13.5, fontWeight:600, color:"#e2f4f2", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                            🩺 {d.name}
                          </div>
                          <div style={{ fontSize:11, color:"#5d8a88", fontFamily:"'DM Mono',monospace" }}>ID #{d.id}</div>
                        </div>
                        <div className="progress-bar-track" style={{ "--fill": PALETTE[i % PALETTE.length], maxWidth:120 }}>
                          <div className="progress-bar-fill" style={{ width:`${(d.count/max)*100}%`, background:PALETTE[i % PALETTE.length] }} />
                        </div>
                        <span className="rank-val">{d.count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="card">
                  <div className="section-title">💙 Most Active Patients</div>
                  <div className="section-sub">ranked by total appointments booked</div>
                  {analytics.topPatients.map((p, i) => {
                    const max = analytics.topPatients[0].count;
                    return (
                      <div key={p.id} className="rank-item">
                        <span className="rank-num">{i + 1}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13.5, fontWeight:600, color:"#e2f4f2", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                            💙 {p.name}
                          </div>
                          <div style={{ fontSize:11, color:"#5d8a88", fontFamily:"'DM Mono',monospace" }}>ID #{p.id}</div>
                        </div>
                        <div className="progress-bar-track" style={{ maxWidth:120 }}>
                          <div className="progress-bar-fill" style={{ width:`${(p.count/max)*100}%`, background:PALETTE[(i+3) % PALETTE.length] }} />
                        </div>
                        <span className="rank-val">{p.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Doctor bar + role pie */}
              <div className="charts-grid-2" style={{ marginBottom:20 }}>
                <div className="card">
                  <div className="section-title">📊 Doctor Booking Volume</div>
                  <div className="section-sub">top 6 doctors by appointment count</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={analytics.drBarData} layout="vertical" barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(32,200,180,0.08)" horizontal={false} />
                      <XAxis type="number" tick={{ fill:"#5d8a88", fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill:"#5d8a88", fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} width={72} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Bookings" radius={[0,6,6,0]}>
                        {analytics.drBarData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <div className="section-title">👥 User Role Distribution</div>
                  <div className="section-sub">breakdown of system users by role</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={analytics.roleData} cx="50%" cy="50%" outerRadius={90}
                        paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                        labelLine={false}>
                        {analytics.roleData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status + Weekly full charts */}
              <div className="charts-grid-2">
                <div className="card">
                  <div className="section-title">📉 Appointment Status Split</div>
                  <div className="section-sub">all statuses with counts</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analytics.statusData} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(32,200,180,0.08)" />
                      <XAxis dataKey="name" tick={{ fill:"#5d8a88", fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:"#5d8a88", fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Count" radius={[6,6,0,0]}>
                        {analytics.statusData.map((entry) => {
                          const cfg = STATUS_CFG[entry.name] || {};
                          return <Cell key={entry.name} fill={cfg.dot || PALETTE[0]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <div className="section-title">📅 Weekly Load Pattern</div>
                  <div className="section-sub">busiest days of the week</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analytics.dayData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(32,200,180,0.08)" />
                      <XAxis dataKey="day" tick={{ fill:"#5d8a88", fontSize:12, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:"#5d8a88", fontSize:11, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Appointments" radius={[6,6,0,0]}>
                        {analytics.dayData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cancellation KPI highlight */}
              <div className="card" style={{ marginTop:20, display:"flex", alignItems:"center", gap:32, flexWrap:"wrap" }}>
                <div>
                  <div className="section-title" style={{ marginBottom:6 }}>⚠️ Cancellation Rate</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:48, fontWeight:800, color:"#fb7185", lineHeight:1 }}>{cancelRate}%</div>
                  <div style={{ fontSize:13, color:"#5d8a88", marginTop:8 }}>
                    {(analytics.statusData.find(s=>s.name==="Cancelled")?.value||0) + (analytics.statusData.find(s=>s.name==="Rejected")?.value||0)} cancelled/rejected out of {appointments.length} total
                  </div>
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#5d8a88", marginBottom:8, fontFamily:"'DM Mono',monospace" }}>
                    <span>completion</span><span>{(100 - parseFloat(cancelRate)).toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar-track" style={{ height:12 }}>
                    <div className="progress-bar-fill" style={{ width:`${100 - parseFloat(cancelRate)}%`, background:"linear-gradient(90deg,#14b8a6,#34d399)" }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#5d8a88", marginTop:8, fontFamily:"'DM Mono',monospace" }}>
                    <span>cancellation</span><span>{cancelRate}%</span>
                  </div>
                  <div className="progress-bar-track" style={{ height:12, marginTop:4 }}>
                    <div className="progress-bar-fill" style={{ width:`${cancelRate}%`, background:"linear-gradient(90deg,#fb7185,#f43f5e)" }} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ════════════════════ APPOINTMENTS TAB ════════════════════ */}
          {activeTab === "appointments" && (
            <div className="card">
              <div style={{ padding:"0 0 16px", borderBottom:"1px solid var(--border)", marginBottom:20 }}>
                <div className="section-title">📅 All Appointments <span style={{ color:"#5d8a88", fontWeight:400, fontSize:13 }}>— {appointments.length} total</span></div>
                <div className="section-sub" style={{ marginBottom:0 }}>full appointment ledger with status</div>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {["ID","Patient","Doctor","Date","Status"].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a, i) => {
                      const sc = STATUS_CFG[a.status] || { bg:"rgba(255,255,255,0.05)", color:"#5d8a88", dot:"#5d8a88" };
                      return (
                        <tr key={a.id}>
                          <td style={{ fontFamily:"'DM Mono',monospace", color:"#5d8a88" }}>#{a.id}</td>
                          <td>
                            <span style={{ background:"rgba(52,211,153,0.1)", color:"#34d399", padding:"3px 10px", borderRadius:8, fontSize:13, fontFamily:"'DM Mono',monospace" }}>
                              💙 {a.patient_id}
                            </span>
                          </td>
                          <td>
                            <span style={{ background:"rgba(34,211,238,0.1)", color:"#22d3ee", padding:"3px 10px", borderRadius:8, fontSize:13, fontFamily:"'DM Mono',monospace" }}>
                              🩺 {a.doctor_id}
                            </span>
                          </td>
                          <td style={{ fontFamily:"'DM Mono',monospace", color:"#5d8a88", fontSize:13 }}>{a.date}</td>
                          <td>
                            <span className="badge" style={{ background:sc.bg, color:sc.color }}>
                              <span style={{ width:6, height:6, borderRadius:"50%", background:sc.dot, flexShrink:0 }} />
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════════════ USERS TAB ════════════════════ */}
          {activeTab === "users" && (
            <div className="card">
              <div style={{ padding:"0 0 16px", borderBottom:"1px solid var(--border)", marginBottom:20 }}>
                <div className="section-title">👥 All Users <span style={{ color:"#5d8a88", fontWeight:400, fontSize:13 }}>— {users.length} accounts</span></div>
                <div className="section-sub" style={{ marginBottom:0 }}>complete user registry</div>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {["ID","User","Email","Role"].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const rc = ROLE_CFG[u.role] || { bg:"rgba(255,255,255,0.05)", color:"#5d8a88", icon:"👤" };
                      return (
                        <tr key={u.id}>
                          <td style={{ fontFamily:"'DM Mono',monospace", color:"#5d8a88" }}>#{u.id}</td>
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(20,184,166,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:"#14b8a6", flexShrink:0 }}>
                                {u.username?.[0]?.toUpperCase() || "U"}
                              </div>
                              <span style={{ fontWeight:600, color:"#e2f4f2" }}>{u.username}</span>
                            </div>
                          </td>
                          <td style={{ color:"#5d8a88", fontSize:13 }}>{u.email}</td>
                          <td>
                            <span className="badge" style={{ background:rc.bg, color:rc.color }}>
                              {rc.icon} {u.role}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}