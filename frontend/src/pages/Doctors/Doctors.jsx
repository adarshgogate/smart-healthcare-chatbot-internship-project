import React, { useEffect, useState } from "react";
import api from "../api/axios";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");

  // Fetch doctors on load
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error("Error fetching doctors", err);
    }
  };

  const addDoctor = async () => {
    try {
      await api.post("/doctors", { name, specialization });
      setName("");
      setSpecialization("");
      fetchDoctors(); // refresh list
    } catch (err) {
      console.error("Error adding doctor", err);
    }
  };

  const deleteDoctor = async (id) => {
    try {
      await api.delete(`/doctors/${id}`);
      fetchDoctors(); // refresh list
    } catch (err) {
      console.error("Error deleting doctor", err);
    }
  };

  return (
    <div>
      <h3>Manage Doctors</h3>

      <div>
        <input
          type="text"
          placeholder="Doctor Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Specialization"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        />
        <button onClick={addDoctor}>Add Doctor</button>
      </div>

      <table border="1" style={{ marginTop: "10px" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Specialization</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.name}</td>
              <td>{doc.specialization}</td>
              <td>
                <button onClick={() => deleteDoctor(doc.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Doctors;
