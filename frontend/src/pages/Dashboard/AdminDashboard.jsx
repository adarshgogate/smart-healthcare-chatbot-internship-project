import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import api from "../../api/axios";
import { globalCSS } from "./theme";

const ROLE_COLORS = {
  admin:   { bg: "#fef3c7", color: "#92400e", icon: "⚙️" },
  doctor:  { bg: "#dbeafe", color: "#1e40af", icon: "🩺" },
  patient: { bg: "#dcfce7", color: "#166534", icon: "💙" },
};

const STATUS_COLORS = {
  Confirmed: { bg: "#dcfce7", color: "#166534" },
  Pending:   { bg: "#fef9c3", color: "#854d0e" },
  Completed: { bg: "#ede9fe", color: "#4c1d95" },
  Cancelled: { bg: "#fee2e2", color: "#991b1b" },
  Rejected:  { bg: "#fee2e2", color: "#991b1b" },
};

function StatCard({ icon, label, value, color, delay }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow: "0 4px 24px rgba(13,148,136,0.08)",
        padding: "22px 24px",
        display: "flex", alignItems: "center", gap: 16,
        animation: `fadeUp 0.4s ease both`,
        animationDelay: `${delay * 0.08}s`,
      }}
    >
      <div style={{
        width: 54, height: 54, borderRadius: 15,
        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#134e4a", margin: 0, lineHeight: 1.2 }}>{value}</p>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats]               = useState(null);
  const [users, setUsers]               = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError]               = useState("");
  const [activeTab, setActiveTab]       = useState("users");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setError("No token found. Please login again."); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      api.get("/admin/stats", { headers }),
      api.get("/admin/users", { headers }),
      api.get("/admin/appointments", { headers }),
    ])
      .then(([statsRes, usersRes, apptRes]) => {
        setStats(statsRes.data);
        setUsers(usersRes.data.users);
        setAppointments(apptRes.data.appointments);
      })
      .catch(() => setError("Failed to load dashboard data"));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0fdf9" }}>
      <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 14, padding: "20px 28px", color: "#991b1b", fontWeight: 600 }}>
        ⚠️ {error}
      </div>
    </div>
  );

  if (!stats) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0fdf9", gap: 14 }}>
      <CircularProgress size={28} style={{ color: "#0d9488" }} />
      <span style={{ color: "#64748b", fontSize: 15 }}>Loading dashboard…</span>
    </div>
  );

  const tabs = [
    { id: "users",        label: "👥 Users",        count: users.length },
    { id: "appointments", label: "📅 Appointments",  count: appointments.length },
  ];

  return (
    <>
      <style>{globalCSS}</style>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="page-bg" style={{ minHeight: "100vh" }}>

        {/* ── Header ── */}
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>⚙️</div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Admin Dashboard</h1>
              <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>System overview & management</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>

          {/* ── Stat Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 32 }}>
            <StatCard icon="👤" label="Total Users"        value={stats.total_users}        color="#0d9488" delay={1} />
            <StatCard icon="🩺" label="Total Doctors"      value={stats.total_doctors}      color="#0891b2" delay={2} />
            <StatCard icon="💙" label="Total Patients"     value={stats.total_patients}     color="#059669" delay={3} />
            <StatCard icon="📋" label="Total Appointments" value={stats.total_appointments} color="#6366f1" delay={4} />
          </div>

          {/* ── Tab Row + Logout ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "9px 20px", borderRadius: 14,
                  border: "1.5px solid",
                  borderColor: activeTab === tab.id ? "#0d9488" : "rgba(13,148,136,0.22)",
                  background: activeTab === tab.id
                    ? "linear-gradient(135deg,#0d9488,#0891b2)"
                    : "rgba(255,255,255,0.85)",
                  color: activeTab === tab.id ? "white" : "#0d9488",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: activeTab === tab.id ? "0 4px 14px rgba(8,145,178,0.25)" : "none",
                }}
              >
                {tab.label}
                <span style={{
                  background: activeTab === tab.id ? "rgba(255,255,255,0.3)" : "#0d9488",
                  color: "white", borderRadius: 20,
                  padding: "1px 8px", fontSize: 11, fontWeight: 700,
                }}>{tab.count}</span>
              </button>
            ))}

            {/* Logout — far right */}
            <button
              onClick={handleLogout}
              style={{
                marginLeft: "auto", padding: "9px 20px", borderRadius: 14,
                border: "1.5px solid rgba(239,68,68,0.35)",
                background: "rgba(254,242,242,0.85)",
                color: "#dc2626", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 6,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "linear-gradient(135deg,#ef4444,#dc2626)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.borderColor = "#ef4444";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(254,242,242,0.85)";
                e.currentTarget.style.color = "#dc2626";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
              }}
            >
              🚪 Logout
            </button>
          </div>

          {/* ── Users Table ── */}
          {activeTab === "users" && (
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
              borderRadius: 18, border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 4px 24px rgba(13,148,136,0.08)", overflow: "hidden",
              animation: "fadeUp 0.35s ease both",
            }}>
              <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#134e4a", margin: 0 }}>👥 All Users</h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>{users.length} registered accounts</p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg,#f0fdf9,#e0f2fe)" }}>
                      {["ID", "Username", "Email", "Role"].map(h => (
                        <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => {
                      const rc = ROLE_COLORS[u.role] || { bg: "#f1f5f9", color: "#475569", icon: "👤" };
                      return (
                        <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafffe", transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f0fdf9"}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafffe"}
                        >
                          <td style={{ padding: "13px 18px", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>#{u.id}</td>
                          <td style={{ padding: "13px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: "50%",
                                background: `linear-gradient(135deg,#e0f2fe,#ccfbf1)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, fontWeight: 700, color: "#0f766e",
                              }}>{u.username?.[0]?.toUpperCase() || "U"}</div>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#134e4a" }}>{u.username}</span>
                            </div>
                          </td>
                          <td style={{ padding: "13px 18px", fontSize: 13, color: "#475569" }}>{u.email}</td>
                          <td style={{ padding: "13px 18px" }}>
                            <span style={{
                              background: rc.bg, color: rc.color,
                              padding: "4px 12px", borderRadius: 20,
                              fontSize: 12, fontWeight: 700,
                            }}>{rc.icon} {u.role}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Appointments Table ── */}
          {activeTab === "appointments" && (
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
              borderRadius: 18, border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 4px 24px rgba(13,148,136,0.08)", overflow: "hidden",
              animation: "fadeUp 0.35s ease both",
            }}>
              <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#134e4a", margin: 0 }}>📅 All Appointments</h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>{appointments.length} total appointments</p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg,#f0fdf9,#e0f2fe)" }}>
                      {["ID", "Patient ID", "Doctor ID", "Date", "Status"].map(h => (
                        <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a, i) => {
                      const sc = STATUS_COLORS[a.status] || { bg: "#f1f5f9", color: "#475569" };
                      return (
                        <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafffe", transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f0fdf9"}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafffe"}
                        >
                          <td style={{ padding: "13px 18px", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>#{a.id}</td>
                          <td style={{ padding: "13px 18px" }}>
                            <span style={{ background: "#f0fdf9", color: "#0f766e", padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                              💙 {a.patient_id}
                            </span>
                          </td>
                          <td style={{ padding: "13px 18px" }}>
                            <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                              🩺 {a.doctor_id}
                            </span>
                          </td>
                          <td style={{ padding: "13px 18px" }}>
                            <span style={{ background: "#f8fafc", color: "#475569", padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
                              📅 {a.date}
                            </span>
                          </td>
                          <td style={{ padding: "13px 18px" }}>
                            <span style={{
                              background: sc.bg, color: sc.color,
                              padding: "4px 12px", borderRadius: 20,
                              fontSize: 12, fontWeight: 700,
                            }}>{a.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default AdminDashboard;