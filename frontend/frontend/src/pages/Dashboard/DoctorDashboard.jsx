import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { CheckCircle, Cancel, DoneAll } from "@mui/icons-material";
import api from "../../api/axios";

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const doctorId = localStorage.getItem("role_id"); // stored at login

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get("/appointments");
        const doctorAppointments = res.data.filter(
          (a) => String(a.doctor_id) === String(doctorId)
        );
        setAppointments(doctorAppointments);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [doctorId]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/appointments/${id}`, { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointment_id === id ? { ...a, status: newStatus } : a
        )
      );
    } catch (err) {
      console.error("Failed to update appointment", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) => prev.filter((a) => a.appointment_id !== id));
    } catch (err) {
      console.error("Failed to delete appointment", err);
    }
  };

  const statusChip = (status) => {
    const colors = {
      Confirmed: "success",
      Pending: "warning",
      Completed: "primary",
      Cancelled: "error",
    };
    return <Chip label={status} color={colors[status] || "default"} />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Doctor Dashboard
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : appointments.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No appointments found.
        </Typography>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Patient ID</b></TableCell>
                <TableCell><b>Date</b></TableCell>
                <TableCell><b>Time</b></TableCell>
                <TableCell><b>Description</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell align="center"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((a) => (
                <TableRow key={a.appointment_id}>
                  <TableCell>{a.patient_id}</TableCell>
                  <TableCell>{a.date}</TableCell>
                  <TableCell>{a.time}</TableCell>
                  <TableCell>{a.description}</TableCell>
                  <TableCell>{statusChip(a.status)}</TableCell>
                  <TableCell align="center">
                    {a.status === "Pending" && (
                      <Tooltip title="Confirm">
                        <IconButton
                          color="success"
                          onClick={() =>
                            handleStatusChange(a.appointment_id, "Confirmed")
                          }
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    )}
                    {a.status === "Confirmed" && (
                      <Tooltip title="Mark Completed">
                        <IconButton
                          color="primary"
                          onClick={() =>
                            handleStatusChange(a.appointment_id, "Completed")
                          }
                        >
                          <DoneAll />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Cancel">
                      <IconButton
                        color="error"
                        onClick={() => handleCancel(a.appointment_id)}
                      >
                        <Cancel />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default DoctorDashboard;
