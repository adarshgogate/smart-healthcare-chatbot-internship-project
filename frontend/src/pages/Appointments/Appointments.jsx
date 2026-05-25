import React, { useEffect, useState } from "react";
import api from "../api/axios";

function Appointments({ chatbotResponse }) {
  const [appointments, setAppointments] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");

  // Fetch appointments on load
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

  // Manual booking (existing flow)
  const addAppointment = async () => {
    try {
      await api.post("/appointments", {
        patient_id: patientId,
        doctor_id: doctorId,
        date
      });
      setPatientId("");
      setDoctorId("");
      setDate("");
      fetchAppointments(); // refresh list
    } catch (err) {
      console.error("Error adding appointment", err);
    }
  };

  // Booking directly from chatbot suggestions
  const bookFromChatbot = async (doctorName, specialization, slot) => {
    try {
      const res = await api.post("/appointments/book", {
        doctorName,
        specialization,
        slot
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (res.data.success) {
        setMessage(`📌 Appointment request sent to ${doctorName} for ${slot}. Awaiting doctor approval.`);
        fetchAppointments();
      } else {
        setMessage(`⚠️ ${res.data.message}`);
      }


    } catch (err) {
      console.error("Error booking appointment", err);
      setMessage("❌ Error booking appointment");
    }
  };

  const deleteAppointment = async (id) => {
    try {
      await api.delete(`/appointments/${id}`);
      fetchAppointments(); // refresh list
    } catch (err) {
      console.error("Error deleting appointment", err);
    }
  };

  const updateAppointment = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      fetchAppointments(); // refresh list
    } catch (err) {
      console.error("Error updating appointment", err);
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
          {chatbotResponse.predictions.map((pred, idx) => (
            <div key={idx} style={{ marginBottom: "1rem" }}>
              <strong>{pred.disease} ({pred.confidence}%)</strong>
              <p>Doctor: {pred.doctor_name} ({pred.recommended_specialist})</p>
              <div>
                {(pred.available_slots.concat(pred.booked_slots) || []).map(slot => {
                  const isBooked = (pred.booked_slots || []).includes(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() =>
                        !isBooked &&
                        bookFromChatbot(pred.doctor_name, pred.recommended_specialist, slot)
                      }
                      disabled={isBooked}
                      style={{
                        marginRight: "8px",
                        opacity: isBooked ? 0.5 : 1,
                        cursor: isBooked ? "not-allowed" : "pointer",
                        backgroundColor: isBooked ? "#f87171" : "#10b981",
                        color: "white",
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: "4px"
                      }}
                    >
                      🕐 {slot}
                    </button>
                  );
                })}

              </div>
            </div>
          ))}
          {message && <p>{message}</p>}
        </div>
      )}

      {/* Appointment list */}
      <table border="1" style={{ marginTop: "20px" }}>
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
            <tr key={appt.id}>
              <td>{appt.patient_id}</td>
              <td>{appt.doctor_id}</td>
              <td>{appt.date}</td>
              <td>{appt.status}</td>
              <td>
                <button onClick={() => deleteAppointment(appt.id)}>Cancel</button>
                <button onClick={() => updateAppointment(appt.id, "Confirmed")}>
                  Confirm
                </button>
                <button onClick={() => updateAppointment(appt.id, "Completed")}>
                  Complete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Appointments;
