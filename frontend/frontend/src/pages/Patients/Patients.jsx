import React, { useEffect, useState } from "react";
import api from "../api/axios";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Fetch patients on load
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data);
    } catch (err) {
      console.error("Error fetching patients", err);
    }
  };

  const addPatient = async () => {
    try {
      await api.post("/patients", { name, age, gender });
      setName("");
      setAge("");
      setGender("");
      fetchPatients(); // refresh list
    } catch (err) {
      console.error("Error adding patient", err);
    }
  };

  const deletePatient = async (id) => {
    try {
      await api.delete(`/patients/${id}`);
      fetchPatients(); // refresh list
    } catch (err) {
      console.error("Error deleting patient", err);
    }
  };

  return (
    <div>
      <h3>Manage Patients</h3>

      <div>
        <input
          type="text"
          placeholder="Patient Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <input
          type="text"
          placeholder="Gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        />
        <button onClick={addPatient}>Add Patient</button>
      </div>

      <table border="1" style={{ marginTop: "10px" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((pat) => (
            <tr key={pat.id}>
              <td>{pat.name}</td>
              <td>{pat.age}</td>
              <td>{pat.gender}</td>
              <td>
                <button onClick={() => deletePatient(pat.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Patients;
