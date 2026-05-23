import React, { useState, useEffect, useRef } from "react";
import { Snackbar, Alert, CircularProgress } from "@mui/material";
import api from "../api/axios";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardHeader,
  CardContent,
  Chip,
  Avatar,
} from "@mui/material";

function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loadingSlot, setLoadingSlot] = useState(null);

  const handleBookAppointment = async (doctor, slot) => {
    try {
      setLoadingSlot(slot);
      const res = await api.post("/appointments/book", {
        doctorName: doctor.name,
        specialization: doctor.specialization,
        slot,
      });

      if (res.data.success) {
        setMessages((prev) =>
          prev.concat({
            sender: "bot",
            text: `📌 Appointment request sent to ${doctor.name} at ${slot}. Awaiting doctor confirmation.`,
          }),
        );
        setSnackbar({
          open: true,
          message: `Appointment booked with ${doctor.name} at ${slot}`,
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: `❌ Slot ${slot} is already taken.`,
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Booking error", err);
      setSnackbar({
        open: true,
        message: "⚠️ Error booking appointment. Please try again.",
        severity: "error",
      });
    } finally {
      setLoadingSlot(null);
    }
  };

  const handleSend = async (query = input) => {
    if (!query.trim() || isSending) return;
    setIsSending(true);

    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "Bot is typing..." },
    ]);

    try {
      const res = await api.post("/chatbot", { query });
      console.log("Backend response received:", res.data);

      const predictions = res.data.predictions || [];
      const results = res.data.results || [];
      const botReply = res.data.reply || "Sorry, I didn’t understand that.";

      setMessages((prev) => prev.filter((m) => m.text !== "Bot is typing..."));
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);

      if (predictions.length > 0) {
        setMessages((prev) => [...prev, { sender: "prediction", predictions }]);
      }
      if (results.length > 0) {
        setMessages((prev) => [...prev, { sender: "doctorList", results }]);
      }
    } catch (err) {
      console.error("Chatbot error", err);
      setMessages((prev) => [
        ...prev.filter((m) => m.text !== "Bot is typing..."),
        { sender: "bot", text: "Error connecting to chatbot." },
      ]);
    }

    setInput("");
    setIsSending(false);
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
        <Typography variant="h6">Smart Healthcare Chatbot</Typography>
      </Box>

      {/* Chat Window */}
      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          overflowY: "auto",
          bgcolor: "#f9f9f9",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((msg, idx) => {
          if (msg.sender === "doctorList") {
            return (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  👨‍⚕️ Recommended Doctors:
                </Typography>
                {msg.results.map((p, i) => (
                  <Card key={i} sx={{ mb: 2 }}>
                    <CardHeader
                      avatar={<Avatar>{p.doctor_name?.[0] || "?"}</Avatar>}
                      title={p.doctor_name || "General Physician"}
                      subheader={
                        p.recommended_specialist ||
                        "Specialization not available"
                      }
                    />
                    <CardContent
                      sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
                    >
                      {(p.available_slots || []).map((slot, j) => (
                        <Button
                          key={j}
                          variant="outlined"
                          color="success"
                          size="small"
                          disabled={loadingSlot === slot}
                          onClick={() =>
                            handleBookAppointment(
                              {
                                name: p.doctor_name,
                                specialization: p.recommended_specialist,
                              },
                              slot,
                            )
                          }
                        >
                          {loadingSlot === slot ? (
                            <CircularProgress size={18} />
                          ) : (
                            slot
                          )}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            );
          } else if (msg.sender === "prediction") {
            return (
              <Paper
                key={idx}
                sx={{
                  p: 1.5,
                  mb: 1,
                  bgcolor: "grey.200",
                  borderRadius: 2,
                  boxShadow: 1,
                  maxWidth: "80%",
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  🔍 Top predictions:
                </Typography>
                {msg.predictions.map((p, i) => (
                  <Typography key={i} variant="body2">
                    • {p.disease} ({p.confidence}%)
                  </Typography>
                ))}
              </Paper>
            );
          } else {
            return (
              <Paper
                key={idx}
                sx={{
                  p: 1.5,
                  mb: 1,
                  bgcolor: msg.sender === "user" ? "primary.main" : "grey.200",
                  color: msg.sender === "user" ? "white" : "black",
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  borderRadius: 2,
                  boxShadow: 1,
                  maxWidth: "70%",
                }}
              >
                <Typography variant="body1">{msg.text}</Typography>
              </Paper>
            );
          }
        })}
        <div ref={chatEndRef} />
      </Box>

      {/* Quick Replies */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          p: 1,
          borderTop: "1px solid #ddd",
          bgcolor: "white",
        }}
      >
        <Chip
          label="Consult a doctor"
          onClick={() => handleSend("consult a doctor")}
          clickable
          color="primary"
        />
        <Chip
          label="Book appointment"
          onClick={() => handleSend("book appointment")}
          clickable
          color="secondary"
        />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          p: 2,
          borderTop: "1px solid #ddd",
          bgcolor: "white",
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isSending}
        />
        <Button
          variant="contained"
          onClick={() => handleSend()}
          disabled={isSending}
        >
          {isSending ? "..." : "Send"}
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Chatbot;
