import React, { useState } from "react";
import api from "../../api/axios";

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
    const payload = {
      username,
      email,
      password,
      role,
    };

    if (role === "doctor") {
      if (!specialization) {
        alert("Please enter specialization");
        return;
      }
      payload.specialization = specialization;
      payload.experience = Number(experience) || 0;
    }

    if (role === "patient") {
      if (!age || !gender) {
        alert("Please enter age and gender");
        return;
      }
      payload.age = Number(age) || 0;
      payload.gender = gender;
    }

    await api.post("/auth/register", payload);

    alert("Registration successful! Please login.");
    // reset form
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("patient");
    setSpecialization("");
    setExperience("");
    setAge("");
    setGender("");
  } catch (err) {
    console.error("Registration failed", err.response?.data || err.message);
    alert(err.response?.data?.message || "Error registering user");
  }
};


  return (
    <div>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
      </select>

      {role === "doctor" && (
        <>
          <input
            type="text"
            placeholder="Specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          />
          <input
            type="number"
            placeholder="Experience (years)"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
        </>
      )}

      {role === "patient" && (
        <>
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
        </>
      )}

      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

export default Register;
