import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { globalCSS } from "./theme";

const STATUS_ICONS = {
  Confirmed: "✅", Pending: "⏳", Completed: "🏁",
  Cancelled: "❌", Rejected: "🚫", Updated: "✏️",
};

function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [booking, setBooking] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const patientId = localStorage.getItem("role_id");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [patientId]);

  const fetchData = async () => {
    try {
      const [doctorRes, apptRes] = await Promise.all([
        api.get("/doctors"),
        api.get(`/appointments?patient_id=${patientId}`),
      ]);
      setDoctors(doctorRes.data.doctors || doctorRes.data);
      const list = apptRes.data.appointments || apptRes.data;
      setAppointments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  const bookAppointment = async () => {
    if (!patientId) return alert("Patient ID missing. Please login again.");
    if (!doctorId || !date || !time) return alert("Please fill all required fields.");
    setBooking(true);
    try {
      await api.post("/appointments", { patient_id: patientId, doctor_id: doctorId, date, time, description });
      setDoctorId(""); setDate(""); setTime(""); setDescription("");
      await fetchData();
      setActiveTab("appointments");
    } catch (err) {
      console.error("Error booking", err);
      alert("Error booking appointment");
    } finally {
      setBooking(false);
    }
  };

  const updateAppointment = async (id, appt) => {
    try {
      await api.put(`/appointments/${id}`, {
        date: appt.newDate || appt.date,
        time: appt.newTime || appt.time,
        description: appt.newDescription || appt.description,
        patient_id: patientId, doctor_id: appt.doctor_id, status: "Updated",
      });
      await fetchData();
    } catch (err) {
      console.error("Error updating", err);
    }
  };

  const deleteAppointment = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) => prev.filter((a) => a.appointment_id !== id));
    } catch (err) {
      console.error("Error deleting", err);
    }
  };

  const tabs = [
    { id: "appointments", label: "📋 My Appointments", count: appointments.length },
    { id: "book", label: "➕ Book Appointment", count: null },
    { id: "chatbot", label: "🤖 AI Assistant", count: null },
  ];

  return (
    <>
      <style>{globalCSS}</style>
      <div className="page-bg">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>💙</div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Patient Dashboard</h1>
                <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>Your health, managed</p>
              </div>
            </div>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "Total", value: appointments.length, bg: "rgba(255,255,255,0.18)" },
                { label: "Pending", value: appointments.filter(a => a.status === "Pending").length, bg: "rgba(234,179,8,0.25)" },
                { label: "Confirmed", value: appointments.filter(a => a.status === "Confirmed").length, bg: "rgba(34,197,94,0.25)" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: s.bg, borderRadius: 12, padding: "8px 16px", textAlign: "center",
                  backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)",
                }}>
                  <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 11, opacity: 0.85, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 20px", maxWidth: 1100, margin: "0 auto" }}>
          {/* Tab Nav */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => tab.id === "chatbot" ? (window.location.href = "/chatbot") : setActiveTab(tab.id)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 14,
                  border: "1.5px solid",
                  borderColor: activeTab === tab.id ? "#0d9488" : "rgba(13,148,136,0.22)",
                  background: activeTab === tab.id
                    ? "linear-gradient(135deg,#0d9488,#0891b2)"
                    : "rgba(255,255,255,0.8)",
                  color: activeTab === tab.id ? "white" : "#0d9488",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: activeTab === tab.id ? "0 4px 14px rgba(8,145,178,0.3)" : "none",
                }}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span style={{
                    background: activeTab === tab.id ? "rgba(255,255,255,0.3)" : "#0d9488",
                    color: activeTab === tab.id ? "white" : "white",
                    borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700,
                  }}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* --- Book Appointment Tab --- */}
          {activeTab === "book" && (
            <div className="glass-card anim-fade-up" style={{ padding: "28px 24px", maxWidth: 680 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#134e4a", marginBottom: 6 }}>
                📅 Book an Appointment
              </h2>
              <p style={{ fontSize: 13.5, color: "#64748b", marginBottom: 24 }}>
                Fill in the details and we'll connect you with your doctor.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Doctor Select */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>
                    Select Doctor *
                  </label>
                  <div style={{ position: "relative" }}>
                    <select
                      className="field"
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                      style={{ paddingRight: 36 }}
                    >
                      <option value="">— Choose a doctor —</option>
                      {Array.isArray(doctors) && doctors.map((doc) => (
                        <option key={doc.doctor_id} value={doc.doctor_id}>
                          {doc.name} · {doc.specialization}
                        </option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#0d9488" }}>▾</span>
                  </div>
                </div>

                {/* Date & Time */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>Date *</label>
                    <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>Time *</label>
                    <input className="field" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>
                    Reason for Visit
                  </label>
                  <textarea
                    className="field"
                    rows={3}
                    placeholder="Describe your symptoms or reason…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </div>

                <button
                  className="btn-primary"
                  onClick={bookAppointment}
                  disabled={booking}
                  style={{ alignSelf: "flex-start", padding: "13px 32px", borderRadius: 14 }}
                >
                  {booking ? "⏳ Booking…" : "📅 Confirm Booking"}
                </button>
              </div>
            </div>
          )}

          {/* --- Appointments Tab --- */}
          {activeTab === "appointments" && (
            <div className="glass-card anim-fade-up" style={{ overflow: "hidden" }}>
              {appointments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 24px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                  <p style={{ color: "#64748b", fontSize: 15, marginBottom: 16 }}>No appointments yet.</p>
                  <button className="btn-primary" onClick={() => setActiveTab("book")}>
                    ➕ Book Your First Appointment
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th style={{ textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt) => (
                        <tr key={appt.appointment_id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: "50%",
                                background: "linear-gradient(135deg,#e0f2fe,#ccfbf1)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, fontWeight: 700, color: "#0f766e", flexShrink: 0,
                              }}>
                                {appt.doctor_name?.[0] || "D"}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5, color: "#134e4a" }}>{appt.doctor_name}</p>
                                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{appt.specialization}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <input
                              type="date"
                              className="field"
                              defaultValue={appt.date}
                              onChange={(e) => (appt.newDate = e.target.value)}
                              style={{ width: 145, padding: "7px 10px", fontSize: 13 }}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              className="field"
                              defaultValue={appt.time}
                              onChange={(e) => (appt.newTime = e.target.value)}
                              style={{ width: 120, padding: "7px 10px", fontSize: 13 }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="field"
                              defaultValue={appt.description}
                              onChange={(e) => (appt.newDescription = e.target.value)}
                              style={{ width: 160, padding: "7px 10px", fontSize: 13 }}
                            />
                          </td>
                          <td>
                            <span className={`status-pill status-${appt.status || "Pending"}`}>
                              {STATUS_ICONS[appt.status] || "⏳"} {appt.status || "Pending"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                              <button className="btn-ghost" onClick={() => updateAppointment(appt.appointment_id, appt)}>
                                ✏️ Update
                              </button>
                              <button className="btn-danger" onClick={() => deleteAppointment(appt.appointment_id)}>
                                🗑 Cancel
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
          )}
        </div>
      </div>
    </>
  );
}

export default PatientDashboard;