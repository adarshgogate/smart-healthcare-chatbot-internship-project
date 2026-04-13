import React, { useState } from "react";
import api from "../../api/axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 const handleLogin = async () => {
  try {
    const response = await api.post("/auth/login", { email, password });
    const { access_token, user_id, role, role_id } = response.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("user_id", user_id);
    localStorage.setItem("role", role);
    localStorage.setItem("role_id", role_id);

    alert("Login successful!");

    // ✅ Redirect based on role
    if (role === "admin") {
      window.location.href = "/admin";
    } else if (role === "doctor") {
      window.location.href = "/doctor";
    } else if (role === "patient") {
      window.location.href = "/patient";
    } else {
      window.location.href = "/"; // fallback
    }
  } catch (err) {
    console.error("Login failed", err.response?.data || err.message);
    alert("Invalid credentials");
  }
};


  return (
    <div>
      <h2>Login</h2>
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
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
