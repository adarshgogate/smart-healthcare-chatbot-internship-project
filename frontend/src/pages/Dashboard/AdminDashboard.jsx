import { useEffect, useState } from "react";
import api from "../../api/axios";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found. Please login again.");
      return;
    }

    // Fetch stats
    api.
    get("/admin/stats", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
})

      .then((res) => setStats(res.data))
      .catch((err) => setError("Failed to load stats"));

    // Fetch users
    api
      .get("/admin/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      .then((res) => setUsers(res.data.users))
      .catch((err) => setError("Failed to load users"));

    // Fetch appointments
    api
      .get("/admin/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAppointments(res.data.appointments))
      .catch((err) => setError("Failed to load appointments"));
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!stats) return <p>Loading Admin Dashboard...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>⚙️ Admin Dashboard</h1>

      <h2>Overview</h2>
      <ul>
        <li>Total Users: {stats.total_users}</li>
        <li>Total Doctors: {stats.total_doctors}</li>
        <li>Total Patients: {stats.total_patients}</li>
        <li>Total Appointments: {stats.total_appointments}</li>
      </ul>

      <h2>👥 Users</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>📅 Appointments</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Patient ID</th>
            <th>Doctor ID</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{a.patient_id}</td>
              <td>{a.doctor_id}</td>
              <td>{a.date}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
