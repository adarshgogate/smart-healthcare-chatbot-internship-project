import React, { useEffect, useState } from "react";
import api from "../../api/axios";

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const doctorId = localStorage.getItem("role_id"); // stored at login

  // Fetch appointments for this doctor
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get("/appointments");
        const doctorAppointments = res.data.filter(
          (a) => String(a.doctor_id) === String(doctorId)
        );
        console.log(res.data);
        setAppointments(doctorAppointments);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      }
    };
    fetchAppointments();
  }, [doctorId]);

  // Update appointment status
  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/appointments/${id}`, { status: newStatus });
      setAppointments(
        appointments.map((a) =>
          a.appointment_id === id ? { ...a, status: newStatus } : a
        )
      );
      alert(`Appointment marked as ${newStatus}`);
    } catch (err) {
      console.error("Failed to update appointment", err);
      alert("Error updating appointment");
    }
  };

  // Cancel appointment
  const handleDelete = async (id) => {
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(appointments.filter((a) => a.appointment_id !== id));
      alert("Appointment deleted successfully");
    } catch (err) {
      console.error("Failed to delete appointment", err);
      alert("Error deleting appointment");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Doctor Dashboard</h2>
      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.appointment_id}>
                <td>{a.patient_id}</td>
                <td>{a.date}</td>
                <td>{a.time}</td>
                <td>{a.description}</td>
                <td>
                  <span
                    className={`badge ${
                      a.status === "Confirmed"
                        ? "bg-success"
                        : a.status === "Pending"
                        ? "bg-warning"
                        : a.status === "Completed"
                        ? "bg-primary"
                        : "bg-danger"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td>
                  {a.status === "Pending" && (
                    <button
                      className="btn btn-sm btn-success me-2"
                      onClick={() => handleStatusChange(a.appointment_id, "Confirmed")}
                    >
                      Confirm
                    </button>
                  )}
                  {a.status === "Confirmed" && (
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => handleStatusChange(a.appointment_id, "Completed")}
                    >
                      Complete
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(a.appointment_id)}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DoctorDashboard;
