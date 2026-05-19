import React, { useState } from "react";
import api from "../../api/axios";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Link,
} from "@mui/material";

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

      if (role === "admin") {
        window.location.href = "/admin";
      } else if (role === "doctor") {
        window.location.href = "/doctor";
      } else if (role === "patient") {
        window.location.href = "/patient";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Login failed", err.response?.data || err.message);
      alert("Invalid credentials");
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        background: "linear-gradient(135deg, #42a5f5, #478ed1)",
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", p: 3, boxShadow: 6, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom color="primary">
            Welcome Back
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" mb={2}>
            Please login to continue
          </Typography>

          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ py: 1.5, fontWeight: "bold" }}
            onClick={handleLogin}   // ✅ now calls the login function
          >
            Login
          </Button>

          <Typography variant="body2" align="center" mt={2}>
            Don’t have an account?{" "}
            <Link href="/register" underline="hover" color="primary">
              Register here
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
