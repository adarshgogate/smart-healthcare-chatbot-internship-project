import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";

function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [doctors, setDoctors] = useState([]);
  const patientId = localStorage.getItem("role_id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const doctorRes = await api.get("/doctors");
        const doctorList = doctorRes.data.doctors || doctorRes.data;
        setDoctors(doctorList);

        const appointmentRes = await api.get(`/appointments?patient_id=${patientId}`);
        const appointmentList = appointmentRes.data.appointments || appointmentRes.data;
        setAppointments(appointmentList);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [patientId]);

  const bookAppointment = async () => {
    if (!patientId) {
      alert("Patient ID missing. Please login again.");
      return;
    }
    try {
      await api.post("/appointments", {
        patient_id: patientId,
        doctor_id: doctorId,
        date,
        time,
        description,
      });
      setDoctorId("");
      setDate("");
      setTime("");
      setDescription("");
      const res = await api.get(`/appointments?patient_id=${patientId}`);
      setAppointments(res.data);
    } catch (err) {
      console.error("Error booking appointment", err);
    }
  };

  const updateAppointment = async (id, appt) => {
    try {
      await api.put(`/appointments/${id}`, {
        date: appt.newDate || appt.date,
        time: appt.newTime || appt.time,
        description: appt.newDescription || appt.description,
        patient_id: patientId,
        doctor_id: appt.doctor_id,
        status: "Updated",
      });
      alert("Appointment updated!");
      const res = await api.get(`/appointments?patient_id=${patientId}`);
      setAppointments(res.data);
    } catch (err) {
      console.error("Error updating appointment", err);
    }
  };

  const deleteAppointment = async (id) => {
    try {
      await api.delete(`/appointments/${id}`);
      alert("Appointment deleted!");
      const res = await api.get(`/appointments?patient_id=${patientId}`);
      setAppointments(res.data);
    } catch (err) {
      console.error("Error deleting appointment", err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        Patient Dashboard
      </Typography>

      {/* Chatbot Access */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Chatbot</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Ask health questions and book appointments via chatbot.
          </Typography>
          <Button variant="contained" onClick={() => (window.location.href = "/chatbot")}>
            Open Chatbot
          </Button>
        </CardContent>
      </Card>

      {/* Appointment Booking Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Book Appointment</Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2 }}>
            <Select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              displayEmpty
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">-- Select Doctor --</MenuItem>
              {Array.isArray(doctors) &&
                doctors.map((doc) => (
                  <MenuItem key={doc.doctor_id} value={doc.doctor_id}>
                    {doc.name} ({doc.specialization})
                  </MenuItem>
                ))}
            </Select>
            <TextField
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <TextField
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <TextField
              placeholder="Reason for visit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            <Button variant="contained" color="success" onClick={bookAppointment}>
              Book
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Appointment List */}
      <Card>
        <CardContent>
          <Typography variant="h6">My Appointments</Typography>
          <Paper sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appt) => (
                  <TableRow key={appt.appointment_id}>
                    <TableCell>
                      {appt.doctor_name} ({appt.specialization})
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        defaultValue={appt.date}
                        onChange={(e) => (appt.newDate = e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="time"
                        defaultValue={appt.time}
                        onChange={(e) => (appt.newTime = e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        defaultValue={appt.description}
                        onChange={(e) => (appt.newDescription = e.target.value)}
                      />
                    </TableCell>
                    <TableCell>{appt.status || "Pending"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => updateAppointment(appt.appointment_id, appt)}
                      >
                        Update
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={() => cancelAppointment (appt.appointment_id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
}

export default PatientDashboard;
