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

  // Manual booking
  const addAppointment = async () => {
    try {
      await api.post("/appointments", {
        patient_id: patientId,
        doctor_id: doctorId,
        date,
      });
      setPatientId("");
      setDoctorId("");
      setDate("");
      fetchAppointments();
    } catch (err) {
      console.error("Error adding appointment", err);
    }
  };

  // Booking from chatbot suggestions
  const bookFromChatbot = async (doctorName, specialization, slot) => {
    try {
      const res = await api.post(
        "/appointments/book",
        { doctorName, specialization, slot },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (res.data.success) {
        setMessage(
          `📌 Appointment request sent to ${doctorName} for ${slot}. Awaiting doctor approval.`
        );
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
      fetchAppointments();
    } catch (err) {
      console.error("Error deleting appointment", err);
    }
  };

  const updateAppointment = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      fetchAppointments();
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

          {chatbotResponse.predictions.map((pred, idx) => {
            // Build a unified, sorted list of slots with their booked state.
            // Each source array is mapped independently so isBooked is always correct.
            const availableSlots = (pred.available_slots || []).map((slot) => ({
              slot,
              isBooked: false,
            }));
            const bookedSlots = (pred.booked_slots || []).map((slot) => ({
              slot,
              isBooked: true,
            }));

            const allSlots = [...availableSlots, ...bookedSlots].sort((a, b) =>
              a.slot.localeCompare(b.slot)
            );

            return (
              <div key={idx} style={{ marginBottom: "1rem" }}>
                <strong>
                  {pred.disease} ({pred.confidence}%)
                </strong>
                <p>
                  Doctor: {pred.doctor_name} ({pred.recommended_specialist})
                </p>

                <div>
                  {allSlots.map(({ slot, isBooked }) => (
                    <button
                      key={slot}
                      onClick={() =>
                        !isBooked &&
                        bookFromChatbot(
                          pred.doctor_name,
                          pred.recommended_specialist,
                          slot
                        )
                      }
                      disabled={isBooked}
                      title={isBooked ? "This slot is already booked" : `Book ${slot}`}
                      style={{
                        marginRight: "8px",
                        marginBottom: "6px",
                        opacity: isBooked ? 0.6 : 1,
                        cursor: isBooked ? "not-allowed" : "pointer",
                        backgroundColor: isBooked ? "#f87171" : "#10b981",
                        color: "white",
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: "4px",
                        fontWeight: "500",
                      }}
                    >
                      {isBooked ? "🔴" : "🟢"} {slot}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {message && (
            <p style={{ marginTop: "10px", fontWeight: "500" }}>{message}</p>
          )}
        </div>
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
            <tr key={appt.appointment_id}>
              <td>{appt.patient_id}</td>
              <td>{appt.doctor_id}</td>
              <td>{appt.date}</td>
              <td>{appt.status}</td>
              <td>
                <button onClick={() => deleteAppointment(appt.appointment_id)}>
                  Cancel
                </button>
                <button
                  onClick={() =>
                    updateAppointment(appt.appointment_id, "Confirmed")
                  }
                >
                  Confirm
                </button>
                <button
                  onClick={() =>
                    updateAppointment(appt.appointment_id, "Completed")
                  }
                >
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