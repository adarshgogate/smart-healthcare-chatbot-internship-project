import React, { useEffect, useState } from "react";
import api from "../api/axios";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");

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

      <table border="1" style={{ marginTop: "10px" }}>
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
                <button onClick={() => updateAppointment(appt.id, "confirmed")}>
                  Confirm
                </button>
                <button onClick={() => updateAppointment(appt.id, "completed")}>
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
