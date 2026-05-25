import React, { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import api from "../../api/axios";
import { globalCSS } from "./theme";

const STATUS_ICONS = {
  Confirmed: "✅",
  Pending: "⏳",
  Completed: "🏁",
  Cancelled: "❌",
  Rejected: "🚫",
};

function StatCard({ icon, label, value, color, delay }) {
  return (
    <div
      className={`glass-card card-hover anim-fade-up stagger-${delay}`}
      style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: "#134e4a", margin: 0, lineHeight: 1.2 }}>{value}</p>
      </div>
    </div>
  );
}

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const doctorId = localStorage.getItem("role_id");

  useEffect(() => {
    fetchAppointments();
  }, [doctorId]);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments");
      const doctorAppointments = res.data.filter(
        (a) => String(a.doctor_id) === String(doctorId)
      );
      setAppointments(doctorAppointments);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => a.appointment_id === id ? { ...a, status: newStatus } : a)
      );
    } catch (err) {
      console.error("Failed to update appointment", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) => prev.filter((a) => a.appointment_id !== id));
    } catch (err) {
      console.error("Failed to delete appointment", err);
    }
  };

  const counts = {
    All: appointments.length,
    Pending: appointments.filter((a) => a.status === "Pending").length,
    Confirmed: appointments.filter((a) => a.status === "Confirmed").length,
    Completed: appointments.filter((a) => a.status === "Completed").length,
  };

  const filtered = filter === "All" ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <>
      <style>{globalCSS}</style>
      <div className="page-bg" style={{ minHeight: "100vh" }}>
        {/* Header */}
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>🩺</div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Doctor Dashboard</h1>
              <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>Manage your appointments</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "28px 24px", maxWidth: 1100, margin: "0 auto" }}>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
            <StatCard icon="📋" label="Total"     value={counts.All}       color="#0d9488" delay={1} />
            <StatCard icon="⏳" label="Pending"   value={counts.Pending}   color="#eab308" delay={2} />
            <StatCard icon="✅" label="Confirmed" value={counts.Confirmed} color="#059669" delay={3} />
            <StatCard icon="🏁" label="Completed" value={counts.Completed} color="#6366f1" delay={4} />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: "7px 18px",
                  borderRadius: 20,
                  border: "1.5px solid",
                  borderColor: filter === tab ? "#0d9488" : "rgba(13,148,136,0.25)",
                  background: filter === tab ? "linear-gradient(135deg,#0d9488,#0891b2)" : "white",
                  color: filter === tab ? "white" : "#0d9488",
                  fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.18s",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {tab} {tab !== "All" && appointments.filter(a => a.status === tab).length > 0
                  ? `(${appointments.filter(a => a.status === tab).length})` : ""}
              </button>
            ))}
          </div>

          {/* Table Card */}
          <div className="glass-card anim-fade-up" style={{ overflow: "hidden" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60, gap: 16 }}>
                <CircularProgress size={28} style={{ color: "#0d9488" }} />
                <span style={{ color: "#64748b", fontSize: 15 }}>Loading appointments…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <p style={{ color: "#64748b", fontSize: 15 }}>
                  No {filter !== "All" ? filter.toLowerCase() : ""} appointments found.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <tr key={a.appointment_id}>

                        {/* ✅ PATIENT CELL — shows name + ID */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: "50%",
                              background: "linear-gradient(135deg,#e0f2fe,#ccfbf1)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 700, color: "#0f766e", flexShrink: 0,
                            }}>
                              {a.patient_name?.[0]?.toUpperCase() || "P"}
                            </div>
                            <div>
                              {a.patient_name ? (
                                <>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5, color: "#134e4a" }}>
                                    {a.patient_name}
                                  </p>
                                  <p style={{ margin: 0, fontSize: 11.5, color: "#94a3b8" }}>
                                    ID #{a.patient_id}
                                  </p>
                                </>
                              ) : (
                                <p style={{ margin: 0, fontWeight: 500, fontSize: 13.5, color: "#475569" }}>
                                  Patient #{a.patient_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span style={{
                            background: "#f0fdf9", padding: "4px 10px", borderRadius: 8,
                            fontSize: 13, fontWeight: 500, color: "#0f766e",
                          }}>
                            📅 {a.date}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: "#eff6ff", padding: "4px 10px", borderRadius: 8,
                            fontSize: 13, fontWeight: 500, color: "#1d4ed8",
                          }}>
                            🕐 {a.time}
                          </span>
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          <span style={{
                            display: "-webkit-box", WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical", overflow: "hidden",
                            color: "#475569", fontSize: 13.5,
                          }}>
                            {a.description || "—"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill status-${a.status}`}>
                            {STATUS_ICONS[a.status] || "•"} {a.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                            {a.status === "Pending" && (
                              <>
                                <button
                                  className="btn-success"
                                  onClick={() => handleStatusChange(a.appointment_id, "Confirmed")}
                                  title="Confirm"
                                >
                                  ✅ Confirm
                                </button>
                                <button
                                  className="btn-danger"
                                  onClick={() => handleStatusChange(a.appointment_id, "Rejected")}
                                  title="Reject"
                                >
                                  🚫 Reject
                                </button>
                              </>
                            )}
                            {a.status === "Confirmed" && (
                              <button
                                className="btn-ghost"
                                onClick={() => handleStatusChange(a.appointment_id, "Completed")}
                              >
                                🏁 Complete
                              </button>
                            )}
                            <button
                              className="btn-danger"
                              onClick={() => handleDelete(a.appointment_id)}
                              title="Delete"
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default DoctorDashboard;