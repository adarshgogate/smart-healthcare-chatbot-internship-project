import React, { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import api from "../api/axios";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(100%); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .pr-overlay { animation: overlayIn 0.22s ease both; }
  .pr-panel   { animation: slideIn 0.3s cubic-bezier(.22,1,.36,1) both; }
  .pr-section { animation: fadeUp 0.28s ease both; }
  .pr-section:nth-child(1) { animation-delay: 0.05s; }
  .pr-section:nth-child(2) { animation-delay: 0.10s; }
  .pr-section:nth-child(3) { animation-delay: 0.15s; }

  .pr-tab { transition: all 0.18s ease; }
  .pr-tab:hover { opacity: 0.8; }

  .pr-msg-row { transition: background 0.15s; }
  .pr-msg-row:hover { background: rgba(13,148,136,0.04) !important; }

  .pr-appt-card { transition: box-shadow 0.18s, transform 0.18s; }
  .pr-appt-card:hover { box-shadow: 0 6px 24px rgba(13,148,136,0.14) !important; transform: translateY(-1px); }

  .pr-close-btn:hover { background: rgba(255,255,255,0.22) !important; transform: scale(1.08); }
  .pr-close-btn { transition: all 0.18s; }

  .pr-filter-input {
    border: 1.5px solid rgba(13,148,136,0.25);
    border-radius: 10px;
    padding: 7px 12px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    background: #f8fefd;
    color: #134e4a;
    outline: none;
    transition: border-color 0.2s;
  }
  .pr-filter-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }

  .pr-clear-btn {
    padding: 7px 14px;
    border-radius: 10px;
    border: 1.5px solid rgba(239,68,68,0.3);
    background: #fef2f2;
    color: #dc2626;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.18s;
  }
  .pr-clear-btn:hover { background: #ef4444; color: white; border-color: #ef4444; }

  .pr-scroll::-webkit-scrollbar { width: 5px; }
  .pr-scroll::-webkit-scrollbar-track { background: transparent; }
  .pr-scroll::-webkit-scrollbar-thumb { background: #99f6e4; border-radius: 10px; }
`;

const STATUS_COLORS = {
  Confirmed: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  Pending:   { bg: "#fef9c3", color: "#713f12", dot: "#eab308" },
  Completed: { bg: "#ede9fe", color: "#4c1d95", dot: "#8b5cf6" },
  Cancelled: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  Rejected:  { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};

function StatusPill({ status }) {
  const s = STATUS_COLORS[status] || { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

function SectionHeader({ icon, title, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: "linear-gradient(135deg, #0d9488, #0891b2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, flexShrink: 0,
      }}>{icon}</div>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#134e4a" }}>{title}</h3>
      {count !== undefined && (
        <span style={{
          marginLeft: "auto", background: "#f0fdf9",
          border: "1px solid #99f6e4", borderRadius: 20,
          padding: "2px 10px", fontSize: 12, fontWeight: 600, color: "#0f766e",
        }}>{count} records</span>
      )}
    </div>
  );
}

function PatientReport({ patientId, patientName, onClose }) {
  const [report, setReport]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [tab, setTab]           = useState("overview");

  // ── Date filter state ──
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo]     = useState("");

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setTab("overview");
    setFilterFrom("");
    setFilterTo("");

    const token = localStorage.getItem("token");
    api.get(`/patients/${patientId}/report`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setReport(res.data.data || res.data))
      .catch(() => setError("Failed to load patient report. Please try again."))
      .finally(() => setLoading(false));
  }, [patientId]);

  // ── Derived ──
  const chatCount = report?.conversation_history?.length || 0;
  const apptCount = report?.appointment_history?.length  || 0;

  const predictions = report?.conversation_history
    ?.filter(m => m.prediction)
    ?.reduce((acc, m) => {
      if (!acc.find(p => p.prediction === m.prediction)) acc.push(m);
      return acc;
    }, []) || [];

  // ✅ Latest = last inserted (highest index)
  const latestAppt = report?.appointment_history
  ?.slice()
  .sort((a, b) => b.appointment_id - a.appointment_id)[0];

  // ✅ Reversed list = newest booked first
  const reversedAppointments = report?.appointment_history
  ? [...report.appointment_history].sort((a, b) => b.appointment_id - a.appointment_id)
  : [];

  // ✅ Date-filtered appointments (applied on top of reversed)
  const filteredAppointments = reversedAppointments.filter(appt => {
    if (!appt.date) return true;
    if (filterFrom && appt.date < filterFrom) return false;
    if (filterTo   && appt.date > filterTo)   return false;
    return true;
  });

  const hasFilter = filterFrom || filterTo;

  const tabs = [
    { id: "overview",     label: "Overview",     icon: "📊" },
    { id: "chat",         label: "Chat History", icon: "💬", count: chatCount },
    { id: "appointments", label: "Appointments", icon: "📅", count: apptCount },
  ];

  return (
    <>
      <style>{css}</style>

      <div className="pr-overlay" onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(15,30,30,0.45)",
        backdropFilter: "blur(4px)", zIndex: 1000,
      }} />

      <div className="pr-panel pr-scroll" style={{
        position: "fixed", top: 0, right: 0,
        width: "min(640px, 100vw)", height: "100vh",
        background: "linear-gradient(160deg, #f0faf7 0%, #e8f4f8 50%, #f5f0ff 100%)",
        zIndex: 1001, display: "flex", flexDirection: "column",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, #0d9488 0%, #0891b2 60%, #6366f1 100%)",
          color: "white", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: "rgba(255,255,255,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, flexShrink: 0,
              border: "2px solid rgba(255,255,255,0.35)",
            }}>
              {(report?.patient_name || patientName || "P")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" }}>
                {report?.patient_name || patientName || `Patient #${patientId}`}
              </h2>
              {report?.email && (
                <p style={{ margin: "3px 0 0", fontSize: 13, opacity: 0.85 }}>✉️ {report.email}</p>
              )}
              <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.7 }}>
                ID #{patientId} · Full Medical Report
              </p>
            </div>
            <button className="pr-close-btn" onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.35)",
              color: "white", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>✕</button>
          </div>

          {report && (
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {[
                { icon: "💬", label: `${chatCount} messages` },
                { icon: "📅", label: `${apptCount} appointments` },
                { icon: "🔬", label: `${predictions.length} diagnoses` },
              ].map((s, i) => (
                <span key={i} style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 20, padding: "4px 12px",
                  fontSize: 12, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 5,
                }}>{s.icon} {s.label}</span>
              ))}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: "flex", gap: 4, padding: "12px 24px 0",
          background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(13,148,136,0.12)", flexShrink: 0,
        }}>
          {tabs.map(t => (
            <button key={t.id} className="pr-tab" onClick={() => setTab(t.id)} style={{
              padding: "9px 16px", borderRadius: "10px 10px 0 0", border: "none",
              background: tab === t.id ? "linear-gradient(135deg,#0d9488,#0891b2)" : "transparent",
              color: tab === t.id ? "white" : "#475569",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
            }}>
              {t.icon} {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span style={{
                  background: tab === t.id ? "rgba(255,255,255,0.25)" : "#e0f2fe",
                  color: tab === t.id ? "white" : "#0891b2",
                  borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700,
                }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }} className="pr-scroll">

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "60px 0" }}>
              <CircularProgress size={32} style={{ color: "#0d9488" }} />
              <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Loading patient report…</p>
            </div>
          )}

          {!loading && error && (
            <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 14, padding: "20px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
              <p style={{ color: "#991b1b", fontSize: 14, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* ══ OVERVIEW ══ */}
          {!loading && !error && report && tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Patient Info */}
              <div className="pr-section" style={{ background: "white", borderRadius: 16, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(13,148,136,0.1)" }}>
                <SectionHeader icon="👤" title="Patient Information" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Full Name",    value: report.patient_name },
                    { label: "Email",        value: report.email },
                    { label: "Patient ID",   value: `#${report.patient_id}` },
                    { label: "Total Visits", value: `${apptCount} appointments` },
                  ].map((f, i) => (
                    <div key={i} style={{ background: "#f8fefd", borderRadius: 10, padding: "10px 14px" }}>
                      <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 600, color: "#134e4a" }}>{f.value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnoses */}
              {predictions.length > 0 && (
                <div className="pr-section" style={{ background: "white", borderRadius: 16, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(13,148,136,0.1)" }}>
                  <SectionHeader icon="🔬" title="AI Diagnoses Summary" count={predictions.length} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {predictions.map((p, i) => {
                      const conf = Number(p.confidence) || 0;
                      const barColor = conf >= 70 ? "#22c55e" : conf >= 40 ? "#eab308" : "#ef4444";
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: "linear-gradient(135deg,#f0fdf9,#e0f2fe)", border: "1px solid #99f6e4" }}>
                          <span style={{ fontSize: 20 }}>🦠</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#134e4a" }}>{p.prediction}</p>
                            {p.recommended_doctor && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>👨‍⚕️ {p.recommended_doctor}</p>}
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{p.timestamp}</p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: barColor }}>{conf}%</p>
                            <div style={{ width: 60, height: 4, background: "#e2e8f0", borderRadius: 4, marginTop: 4, overflow: "hidden" }}>
                              <div style={{ width: `${conf}%`, height: "100%", background: barColor, borderRadius: 4 }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ✅ Latest Appointment */}
              {latestAppt && (
                <div className="pr-section" style={{ background: "white", borderRadius: 16, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(13,148,136,0.1)" }}>
                  <SectionHeader icon="📅" title="Latest Appointment" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Date",   value: `📅 ${latestAppt.date}` },
                      { label: "Time",   value: `🕐 ${latestAppt.time}` },
                      { label: "Status", value: <StatusPill status={latestAppt.status} /> },
                      { label: "Notes",  value: latestAppt.description || "—" },
                    ].map((f, i) => (
                      <div key={i} style={{ background: "#f8fefd", borderRadius: 10, padding: "10px 14px" }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</p>
                        <div style={{ marginTop: 4, fontSize: 13.5, fontWeight: 600, color: "#134e4a" }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {predictions.length === 0 && apptCount === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🗂️</div>
                  <p style={{ color: "#64748b", fontSize: 14 }}>No medical history found for this patient.</p>
                </div>
              )}
            </div>
          )}

          {/* ══ CHAT HISTORY ══ */}
          {!loading && !error && report && tab === "chat" && (
            <div className="pr-section">
              <SectionHeader icon="💬" title="Conversation History" count={chatCount} />
              {chatCount === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <p style={{ color: "#64748b", fontSize: 14 }}>No chat messages found.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {report.conversation_history.map((msg, i) => {
                    const isUser = msg.sender === "user" || msg.sender === "patient";
                    return (
                      <div key={i} className="pr-msg-row" style={{
                        padding: "12px 14px", borderRadius: 12,
                        borderLeft: `3px solid ${isUser ? "#0891b2" : "#0d9488"}`,
                        background: isUser ? "#f0f9ff" : "#f0fdf9", marginBottom: 8,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", color: isUser ? "#0891b2" : "#0d9488" }}>
                            {isUser ? "👤 Patient" : "🤖 Bot"}
                          </span>
                          <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>{msg.timestamp}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13.5, color: "#1e293b", lineHeight: 1.55 }}>{msg.text}</p>
                        {msg.prediction && (
                          <div style={{ marginTop: 8, background: "linear-gradient(135deg,#f0fdf9,#e0f2fe)", border: "1px solid #99f6e4", borderRadius: 8, padding: "6px 12px", display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#0f766e" }}>🔬 {msg.prediction}</span>
                            {msg.confidence && <span style={{ fontSize: 12, color: "#64748b" }}>Confidence: <strong>{msg.confidence}%</strong></span>}
                            {msg.recommended_doctor && <span style={{ fontSize: 12, color: "#64748b" }}>👨‍⚕️ {msg.recommended_doctor}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ APPOINTMENTS ══ */}
          {!loading && !error && report && tab === "appointments" && (
            <div className="pr-section">
              <SectionHeader icon="📅" title="Appointment History" count={filteredAppointments.length} />

              {/* ✅ Date Filter Bar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                padding: "14px 16px", marginBottom: 16,
                background: "white", borderRadius: 14,
                border: "1px solid rgba(13,148,136,0.12)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", whiteSpace: "nowrap" }}>
                  🗓 Filter by Date:
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>From</label>
                  <input
                    type="date"
                    className="pr-filter-input"
                    value={filterFrom}
                    onChange={e => setFilterFrom(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>To</label>
                  <input
                    type="date"
                    className="pr-filter-input"
                    value={filterTo}
                    onChange={e => setFilterTo(e.target.value)}
                  />
                </div>
                {hasFilter && (
                  <button
                    className="pr-clear-btn"
                    onClick={() => { setFilterFrom(""); setFilterTo(""); }}
                  >
                    ✕ Clear
                  </button>
                )}
                {hasFilter && (
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#0f766e", fontWeight: 600, background: "#f0fdf9", padding: "4px 10px", borderRadius: 20, border: "1px solid #99f6e4" }}>
                    {filteredAppointments.length} of {apptCount} shown
                  </span>
                )}
              </div>

              {filteredAppointments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                  <p style={{ color: "#64748b", fontSize: 14 }}>
                    {hasFilter ? "No appointments found for the selected date range." : "No appointments found."}
                  </p>
                  {hasFilter && (
                    <button className="pr-clear-btn" onClick={() => { setFilterFrom(""); setFilterTo(""); }} style={{ marginTop: 10 }}>
                      ✕ Clear Filter
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* ✅ Newest booked first */}
                  {filteredAppointments.map((appt, i) => (
                    <div key={i} className="pr-appt-card" style={{
                      background: "white", borderRadius: 14, padding: "16px 18px",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                      border: "1px solid rgba(13,148,136,0.1)",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)", color: "white", borderRadius: 8, padding: "3px 9px", fontSize: 12, fontWeight: 700 }}>
                            #{i + 1}
                          </span>
                          <span style={{ background: "#f0fdf9", color: "#0f766e", borderRadius: 8, padding: "3px 10px", fontSize: 12.5, fontWeight: 600 }}>
                            📅 {appt.date}
                          </span>
                          <span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 8, padding: "3px 10px", fontSize: 12.5, fontWeight: 600 }}>
                            🕐 {appt.time}
                          </span>
                        </div>
                        <StatusPill status={appt.status} />
                      </div>
                      {appt.description && (
                        <p style={{ margin: 0, fontSize: 13.5, color: "#475569", background: "#f8fafc", borderRadius: 8, padding: "8px 12px", lineHeight: 1.5 }}>
                          📝 {appt.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default PatientReport;