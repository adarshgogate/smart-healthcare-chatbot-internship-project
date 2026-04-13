import React, { useEffect, useState } from "react";
import api from "../../api/axios";

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
        // Fetch doctors
        const doctorRes = await api.get("/doctors");
        // Some APIs return { doctors: [...] }, others return just [...]
        const doctorList = doctorRes.data.doctors || doctorRes.data;
        setDoctors(doctorList);

        // Fetch appointments for this patient
        const appointmentRes = await api.get(
          `/appointments?patient_id=${patientId}`,
        );
        const appointmentList =
          appointmentRes.data.appointments || appointmentRes.data;
        setAppointments(appointmentList);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    fetchData();

    // ✅ Optional: auto-refresh every 10 seconds
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
      if (err.response && err.response.data.error) {
        alert(err.response.data.error); // shows "This doctor is already booked..."
      } else {
        console.error("Error booking appointment", err);
      }
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
    <div>
      <h2>Patient Dashboard</h2>
      <h3>Book Appointment</h3>

      <div>
        <label>Select Doctor:</label>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">-- Select Doctor --</option>
          {Array.isArray(doctors) &&
            doctors.map((doc) => (
              <option key={doc.doctor_id} value={doc.doctor_id}>
                {doc.name} ({doc.specialization})
              </option>
            ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <input
          type="text"
          placeholder="Reason for visit"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button onClick={bookAppointment}>Book Appointment</button>
      </div>

      <h3>My Appointments</h3>
      <table border="1" style={{ marginTop: "10px" }}>
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Date</th>
            <th>Time</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => (
            <tr key={appt.appointment_id}>
              <td>
                {appt.doctor_id} - {appt.doctor_name}
              </td>
              <td>
                <input
                  type="date"
                  defaultValue={appt.date}
                  onChange={(e) => (appt.newDate = e.target.value)}
                />
              </td>
              <td>
                <input
                  type="time"
                  defaultValue={appt.time}
                  onChange={(e) => (appt.newTime = e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  defaultValue={appt.description}
                  onChange={(e) => (appt.newDescription = e.target.value)}
                />
              </td>
              <td>{appt.status || "Pending"}</td>
              <td>
                <button
                  onClick={() => updateAppointment(appt.appointment_id, appt)}
                >
                  Update
                </button>
                <button onClick={() => deleteAppointment(appt.appointment_id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PatientDashboard;
