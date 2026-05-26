import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
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

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      api.get("/admin/stats", { headers }),
      api.get("/admin/users", { headers }),
      api.get("/admin/appointments", { headers }),
    ])
      .then(([statsRes, usersRes, apptRes]) => {
        setStats(statsRes.data);
        setUsers(usersRes.data.users);
        setAppointments(apptRes.data.appointments);
      })
      .catch(() => setError("Failed to load dashboard data"));
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return <CircularProgress sx={{ m: 4 }} />;

  return (
    <Box sx={{ p: 4, backgroundColor: "#f9fafc", minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
        ⚙️ Admin Dashboard
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Users", value: stats.total_users },
          { label: "Total Doctors", value: stats.total_doctors },
          { label: "Total Patients", value: stats.total_patients },
          { label: "Total Appointments", value: stats.total_appointments },
        ].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.label}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Users Table */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" color="secondary" gutterBottom>
          👥 Users
        </Typography>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "#e3f2fd" }}>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Username</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell><b>Role</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Appointments Table */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="secondary" gutterBottom>
          📅 Appointments
        </Typography>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "#e8f5e9" }}>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Patient ID</b></TableCell>
                <TableCell><b>Doctor ID</b></TableCell>
                <TableCell><b>Date</b></TableCell>
                <TableCell><b>Status</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.id}</TableCell>
                  <TableCell>{a.patient_id}</TableCell>
                  <TableCell>{a.doctor_id}</TableCell>
                  <TableCell>{a.date}</TableCell>
                  <TableCell>{a.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default AdminDashboard;
