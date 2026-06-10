import React, { useEffect, useState } from "react";
import api from "../api/axios";

function AppointmentRow({ appt, onCancel, onUpdate }) {
  return (
    <tr key={appt.appointment_id}>
      <td>{appt.patient_id}</td>
      <td>{appt.doctor_id}</td>
      <td>{appt.date}</td>
      <td>{appt.status}</td>
      <td>
        {/* ✅ FIX: Cancel now calls /cancel route (status update), not DELETE */}
        <button
          onClick={() => onCancel(appt.appointment_id)}
          disabled={["Cancelled", "Completed"].includes(appt.status)}
          style={{ opacity: ["Cancelled", "Completed"].includes(appt.status) ? 0.5 : 1 }}
        >
          Cancel
        </button>
        <button
          onClick={() => onUpdate(appt.appointment_id, "Confirmed")}
          disabled={appt.status !== "Pending"}
        >
          Confirm
        </button>
        <button
          onClick={() => onUpdate(appt.appointment_id, "Completed")}
          disabled={appt.status !== "Confirmed"}
        >
          Complete
        </button>
      </td>
    </tr>
  );
}

function ChatbotPrediction({ pred, onBook }) {
  // ✅ FIX: useState used correctly — not inside .map(), extracted to its own component
  const [selectedDate, setSelectedDate] = useState("");

  return (
    <div style={{ marginBottom: "1rem" }}>
      <strong>
        {pred.disease} ({pred.confidence}%)
      </strong>
      <p>
        Doctor: {pred.doctor_name} ({pred.recommended_specialist})
      </p>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        min={new Date().toISOString().split("T")[0]}
        style={{ marginBottom: "10px" }}
      />

      <div>
        {pred.available_slots.map((slot) => (
          <button
            key={slot}
            onClick={() => onBook(pred.doctor_id, pred.recommended_specialist, slot, selectedDate)}
            disabled={!selectedDate}
            title={!selectedDate ? "Please select a date first" : ""}
            style={{
              marginRight: "8px",
              marginBottom: "6px",
              backgroundColor: selectedDate ? "#10b981" : "#6b7280",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: selectedDate ? "pointer" : "not-allowed",
            }}
          >
            🟢 {slot}
          </button>
        ))}

        {pred.booked_slots.map((slot) => (
          <button
            key={slot}
            disabled
            style={{
              marginRight: "8px",
              marginBottom: "6px",
              backgroundColor: "#f87171",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              opacity: 0.6,
              cursor: "not-allowed",
              textDecoration: "line-through",
            }}
          >
            🔴 {slot}
          </button>
        ))}
      </div>
    </div>
  );
}

function Appointments({ chatbotResponse }) {
  const [appointments, setAppointments] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data);
    } catch (err) {
      console.error("Error fetching appointments", err);
    }
  };

  const addAppointment = async () => {
    if (!patientId || !doctorId || !date) {
      setMessage("⚠️ Please fill in Patient ID, Doctor ID, and Date.");
      return;
    }
    try {
      await api.post("/appointments", {
        patient_id: patientId,
        doctor_id: doctorId,
        date,
      });
      setPatientId("");
      setDoctorId("");
      setDate("");
      setMessage("✅ Appointment booked successfully.");
      fetchAppointments();
    } catch (err) {
      console.error("Error adding appointment", err);
      setMessage("❌ Error booking appointment.");
    }
  };

  const bookFromChatbot = async (doctorId, specialization, slot, date) => {
    if (!date) {
      setMessage("⚠️ Please select a date before booking a slot.");
      return;
    }
    try {
      const res = await api.post(
        "/appointments/book",
        { doctor_id: doctorId, specialization, slot, date },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (res.data.success) {
        setMessage(`📌 Appointment request sent to Doctor ID ${doctorId} for ${slot} on ${date}. Awaiting doctor approval.`);
        fetchAppointments();
      } else {
        setMessage(`⚠️ ${res.data.message}`);
      }
    } catch (err) {
      console.error("Error booking appointment", err);
      setMessage("❌ Error booking appointment.");
    }
  };

  // ✅ FIX: cancelAppointment calls PUT /cancel — sets status to "Cancelled", does NOT delete
  const cancelAppointment = async (id) => {
    try {
      console.log("Cancelling (not deleting):", id); //confirm this fires
      const res = await api.put(`/appointments/${id}/cancel`);
      // ✅ FIX: update the specific appointment in state directly, no full re-fetch needed
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointment_id === id ? res.data.appointment : a
        )
      );
      setMessage("✅ Appointment cancelled successfully.");
    } catch (err) {
      console.error("Error cancelling appointment", err);
      setMessage("❌ Error cancelling appointment.");
    }
  };

  const updateAppointment = async (id, status) => {
    try {
      const res = await api.put(`/appointments/${id}`, { status });
      // ✅ FIX: update the specific appointment in state directly
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointment_id === id ? res.data.appointment : a
        )
      );
      setMessage(`✅ Appointment marked as ${status}.`);
    } catch (err) {
      console.error("Error updating appointment", err);
      setMessage("❌ Error updating appointment.");
    }
  };

  return (
    <div>
      <h3>Manage Appointments</h3>

      {/* Manual booking form */}
      <div>
        <input
          type="text"
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Doctor ID"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button onClick={addAppointment}>Book Appointment</button>
      </div>

      {/* Chatbot suggestions section */}
      {chatbotResponse && chatbotResponse.predictions && (
        <div style={{ marginTop: "20px" }}>
          <h4>Chatbot Suggestions</h4>
          <p>{chatbotResponse.reply}</p>

          {/* ✅ FIX: each prediction is its own component so useState is valid */}
          {chatbotResponse.predictions.map((pred, idx) => (
            <ChatbotPrediction
              key={idx}
              pred={pred}
              onBook={bookFromChatbot}
            />
          ))}

          {message && (
            <p style={{ marginTop: "10px", fontWeight: "500" }}>{message}</p>
          )}
        </div>
      )}

      {message && !chatbotResponse?.predictions && (
        <p style={{ marginTop: "10px", fontWeight: "500" }}>{message}</p>
      )}

      {/* Appointment list */}
      <table border="1" style={{ marginTop: "20px", width: "100%" }}>
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Doctor ID</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => (
            <AppointmentRow
              key={appt.appointment_id}
              appt={appt}
              onCancel={cancelAppointment}
              onUpdate={updateAppointment}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Appointments;