import React, { useState } from "react";
import api from "../../api/axios";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  Link
} from "@mui/material";

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
      const payload = { username, email, password, role };

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
      window.location.href = "/login";

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
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        background: "linear-gradient(135deg, #66bb6a, #43a047)" // modern gradient
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          width: "100%",
          p: 4,
          boxShadow: 8,
          borderRadius: 4,
          backgroundColor: "#fff"
        }}
      >
        <CardContent>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#2e7d32" }}
          >
            Create Account
          </Typography>
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            mb={3}
          >
            Fill in your details to register
          </Typography>

          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />

            <TextField
              select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              fullWidth
            >
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
            </TextField>

            {role === "doctor" && (
              <>
                <TextField
                  label="Specialization"
                  variant="outlined"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Experience (years)"
                  type="number"
                  variant="outlined"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  fullWidth
                />
              </>
            )}

            {role === "patient" && (
              <>
                <TextField
                  label="Age"
                  type="number"
                  variant="outlined"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  fullWidth
                />
                <TextField
                  select
                  label="Gender"
                  variant="outlined"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </>
            )}

            <Button
              variant="contained"
              color="success"
              onClick={handleRegister}
              fullWidth
              sx={{
                py: 1.5,
                fontWeight: "bold",
                fontSize: "1rem",
                borderRadius: 2
              }}
            >
              Register
            </Button>

            <Typography variant="body2" align="center" mt={2}>
              Already have an account?{" "}
              <Link href="/login" underline="hover" sx={{ color: "#2e7d32" }}>
                Login here
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Register;
