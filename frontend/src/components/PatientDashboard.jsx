import React, { useEffect, useState } from "react";
import api from "../api/axios";

function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const patientId = localStorage.getItem("patientId"); 
  // Assuming you store patient ID in localStorage after login

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get(`/appointments?patient_id=${patientId}`);
      setAppointments(res.data);
    } catch (err) {
      console.error("Error fetching patient appointments", err);
    }
  };

  const bookAppointment = async () => {
    try {
      await api.post("/appointments", {
        patient_id: patientId,
        doctor_id: doctorId,
        date
      });
      setDoctorId("");
      setDate("");
      fetchAppointments(); // refresh list
    } catch (err) {
      console.error("Error booking appointment", err);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await api.delete(`/appointments/${id}`);
      fetchAppointments(); // refresh list
    } catch (err) {
      console.error("Error cancelling appointment", err);
    }
  };

  return (
    <div>
      <h2>Patient Dashboard</h2>
      <h3>Book Appointment</h3>

      <div>
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
        <button onClick={bookAppointment}>Book Appointment</button>
      </div>

      <h3>My Appointments</h3>
      <table border="1" style={{ marginTop: "10px" }}>
        <thead>
          <tr>
            <th>Doctor ID</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => (
            <tr key={appt.id}>
              <td>{appt.doctor_id}</td>
              <td>{appt.date}</td>
              <td>{appt.status}</td>
              <td>
                <button onClick={() => cancelAppointment(appt.id)}>Cancel</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PatientDashboard;
