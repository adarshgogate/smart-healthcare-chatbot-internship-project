import React, { useState } from "react";
import api from "../api/axios";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  const handleRegister = async () => {
    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
        role,
        specialization: role === "doctor" ? specialization : undefined,
        experience: role === "doctor" ? experience : undefined,
        age: role === "patient" ? age : undefined,
        gender: role === "patient" ? gender : undefined,
      });
      alert("Registration successful! Please login.");
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("patient");
      setSpecialization("");
      setAge("");
      setGender("");
    } catch (err) {
      console.error("Registration failed", err.response?.data || err.message);
      alert("Error registering user");
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <input type="text" placeholder="Username" value={username}
        onChange={(e) => setUsername(e.target.value)} />
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} />

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
      </select>

      {role === "doctor" && (
        <>
          <input type="text" placeholder="Specialization"
            value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
        </>
      )}

      {role === "patient" && (
        <>
          <input type="number" placeholder="Age"
            value={age} onChange={(e) => setAge(e.target.value)} />
          <input type="text" placeholder="Gender"
            value={gender} onChange={(e) => setGender(e.target.value)} />
        </>
      )}

      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

export default Register;
