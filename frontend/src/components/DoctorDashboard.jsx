import React, { useEffect, useState } from "react";
import api from "../api/axios";

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const doctorId = localStorage.getItem("doctorId"); 
  // Assuming you store doctor ID in localStorage after login

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get(`/appointments?doctor_id=${doctorId}`);
      setAppointments(res.data);
    } catch (err) {
      console.error("Error fetching doctor appointments", err);
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
      <h2>Doctor Dashboard</h2>
      <h3>My Appointments</h3>

      <table border="1" style={{ marginTop: "10px" }}>
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => (
            <tr key={appt.id}>
              <td>{appt.patient_id}</td>
              <td>{appt.date}</td>
              <td>{appt.status}</td>
              <td>
                <button onClick={() => updateAppointment(appt.id, "confirmed")}>
                  Confirm
                </button>
                <button onClick={() => updateAppointment(appt.id, "completed")}>
                  Complete
                </button>
                <button onClick={() => updateAppointment(appt.id, "cancelled")}>
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DoctorDashboard;
