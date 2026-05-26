import React, { useState, useEffect, useRef } from "react";
import { Snackbar, Alert, CircularProgress } from "@mui/material";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const styles = {
  root: {
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(160deg, #f0faf7 0%, #e8f4f8 50%, #f5f0ff 100%)",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    overflow: "hidden",
  },
  header: {
    padding: "16px 20px",
    background: "linear-gradient(135deg, #0d9488 0%, #0891b2 60%, #6366f1 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 4px 20px rgba(13,148,136,0.35)",
    zIndex: 10,
    flexShrink: 0,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
  },
  headerTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: "-0.3px",
  },
  headerSub: {
    margin: 0,
    fontSize: 12,
    opacity: 0.82,
    fontWeight: 400,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 0 2px rgba(74,222,128,0.3)",
    display: "inline-block",
    marginRight: 5,
  },
  chatWindow: {
    flexGrow: 1,
    overflowY: "auto",
    padding: "20px 16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  bubbleWrap: (sender) => ({
    display: "flex",
    justifyContent: sender === "user" ? "flex-end" : "flex-start",
    alignItems: "flex-end",
    gap: 8,
  }),
  botIcon: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0d9488, #0891b2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    flexShrink: 0,
    marginBottom: 2,
  },
  bubble: (sender) => ({
    padding: "11px 16px",
    borderRadius:
      sender === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
    background:
      sender === "user"
        ? "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)"
        : "white",
    color: sender === "user" ? "white" : "#1a2e2e",
    maxWidth: "78%",
    fontSize: 14.5,
    lineHeight: 1.55,
    boxShadow:
      sender === "user"
        ? "0 4px 14px rgba(8,145,178,0.28)"
        : "0 2px 10px rgba(0,0,0,0.08)",
    wordBreak: "break-word",
  }),
  typingBubble: {
    padding: "13px 18px",
    borderRadius: "20px 20px 20px 6px",
    background: "white",
    display: "flex",
    gap: 4,
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  typingDot: (delay) => ({
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#0d9488",
    animation: "bounce 1.2s infinite",
    animationDelay: delay,
  }),
  predictionsCard: {
    background: "linear-gradient(135deg, #f0fdf9, #e0f2fe)",
    border: "1.5px solid #99f6e4",
    borderRadius: 16,
    padding: "14px 16px",
    maxWidth: "85%",
    boxShadow: "0 2px 12px rgba(13,148,136,0.1)",
  },
  predictionsTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f766e",
    margin: "0 0 10px",
    letterSpacing: "0.2px",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  predictionRow: (i, total) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 0",
    borderBottom: i < total - 1 ? "1px solid rgba(13,148,136,0.12)" : "none",
  }),
  predictionName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: 500,
    color: "#134e4a",
  },
  confidencePill: (conf) => ({
    fontSize: 11.5,
    fontWeight: 700,
    padding: "2px 9px",
    borderRadius: 20,
    background:
      conf >= 70 ? "#dcfce7" : conf >= 40 ? "#fef9c3" : "#fee2e2",
    color:
      conf >= 70 ? "#166534" : conf >= 40 ? "#713f12" : "#991b1b",
  }),
  progressBar: () => ({
    height: 4,
    borderRadius: 4,
    background: "#e2e8f0",
    width: 60,
    position: "relative",
    overflow: "hidden",
  }),
  progressFill: (conf) => ({
    height: "100%",
    borderRadius: 4,
    width: `${conf}%`,
    background:
      conf >= 70
        ? "linear-gradient(90deg, #22c55e, #16a34a)"
        : conf >= 40
        ? "linear-gradient(90deg, #eab308, #ca8a04)"
        : "linear-gradient(90deg, #ef4444, #dc2626)",
  }),
  doctorSection: {
    width: "100%",
    maxWidth: 480,
  },
  doctorSectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f766e",
    margin: "0 0 10px 2px",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  doctorCard: {
    background: "white",
    borderRadius: 16,
    padding: "14px 16px",
    marginBottom: 10,
    boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
    border: "1px solid rgba(13,148,136,0.12)",
  },
  doctorCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  doctorAvatar: (name) => {
    const colors = [
      ["#e0f2fe", "#0c4a6e"],
      ["#f0fdf4", "#14532d"],
      ["#fdf4ff", "#581c87"],
      ["#fff7ed", "#7c2d12"],
    ];
    const idx = (name?.charCodeAt(0) || 0) % 4;
    return {
      width: 42,
      height: 42,
      borderRadius: "50%",
      background: colors[idx][0],
      color: colors[idx][1],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      fontWeight: 700,
      flexShrink: 0,
    };
  },
  doctorName: {
    margin: 0,
    fontSize: 14.5,
    fontWeight: 700,
    color: "#134e4a",
  },
  doctorSpec: {
    margin: 0,
    fontSize: 12.5,
    color: "#64748b",
    marginTop: 1,
  },
  slotsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
  },
  slotBtn: (isLoading) => ({
    padding: "6px 12px",
    borderRadius: 10,
    border: "1.5px solid #0d9488",
    background: isLoading ? "#f0fdfa" : "white",
    color: "#0d9488",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: isLoading ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
    transition: "all 0.18s ease",
    outline: "none",
  }),
  quickReplies: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    padding: "10px 16px",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(13,148,136,0.1)",
    flexShrink: 0,
  },
  chip: (active) => ({
    padding: "7px 15px",
    borderRadius: 20,
    border: "1.5px solid",
    borderColor: active ? "#0d9488" : "rgba(13,148,136,0.35)",
    background: active
      ? "linear-gradient(135deg, #0d9488, #0891b2)"
      : "white",
    color: active ? "white" : "#0d9488",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    outline: "none",
    whiteSpace: "nowrap",
  }),
  inputBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(12px)",
    borderTop: "1px solid rgba(13,148,136,0.12)",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
    flexShrink: 0,
  },
  textField: {
    flex: 1,
    border: "1.5px solid rgba(13,148,136,0.25)",
    borderRadius: 24,
    padding: "10px 16px",
    fontSize: 14.5,
    outline: "none",
    background: "#f8fefd",
    color: "#134e4a",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
    resize: "none",
    lineHeight: 1.4,
  },
  sendBtn: (disabled) => ({
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    background: disabled
      ? "#e2e8f0"
      : "linear-gradient(135deg, #0d9488, #0891b2)",
    color: disabled ? "#94a3b8" : "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    flexShrink: 0,
    fontSize: 18,
    boxShadow: disabled ? "none" : "0 4px 14px rgba(8,145,178,0.4)",
  }),
  goBackBtn: {
    marginLeft: "auto",
    padding: "8px 16px",
    background: "rgba(255,255,255,0.18)",
    color: "white",
    border: "1.5px solid rgba(255,255,255,0.45)",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 6,
    backdropFilter: "blur(4px)",
    transition: "all 0.2s",
    flexShrink: 0,
  },
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .chat-msg { animation: fadeUp 0.25s ease both; }
  .slot-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #0d9488, #0891b2) !important;
    color: white !important;
    transform: translateY(-1px);
  }
  .chip-btn:hover { opacity: 0.85; transform: scale(0.98); }
  .send-btn:hover:not(:disabled) { transform: scale(1.08); }
  .go-back-btn:hover { background: rgba(255,255,255,0.28) !important; }
  textarea:focus { border-color: #0d9488 !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.12); }
`;

// ── Sub-components ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={styles.bubbleWrap("bot")}>
      <div style={styles.botIcon}>🩺</div>
      <div style={styles.typingBubble}>
        {["0s", "0.2s", "0.4s"].map((d, i) => (
          <div key={i} style={styles.typingDot(d)} />
        ))}
      </div>
    </div>
  );
}

function PredictionCard({ predictions }) {
  return (
    <div style={styles.predictionsCard} className="chat-msg">
      <p style={styles.predictionsTitle}>🔬 Top Diagnostic Predictions</p>
      {predictions.map((p, i) => {
        const conf = Number(p.confidence) || 0;
        return (
          <div key={i} style={styles.predictionRow(i, predictions.length)}>
            <span style={styles.predictionName}>{p.disease}</span>
            <div style={styles.progressBar(conf)}>
              <div style={styles.progressFill(conf)} />
            </div>
            <span style={styles.confidencePill(conf)}>{conf}%</span>
          </div>
        );
      })}
    </div>
  );
}

function DoctorList({ results, loadingSlot, onBook }) {
  return (
    <div style={styles.doctorSection} className="chat-msg">
      <p style={styles.doctorSectionTitle}>👨‍⚕️ Recommended Doctors</p>
      {results.map((p, i) => (
        <div key={i} style={styles.doctorCard}>
          <div style={styles.doctorCardHeader}>
            <div style={styles.doctorAvatar(p.doctor_name)}>
              {p.doctor_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p style={styles.doctorName}>{p.doctor_name || "General Physician"}</p>
              <p style={styles.doctorSpec}>
                {p.recommended_specialist || "Specialization not available"}
              </p>
            </div>
          </div>
          <div style={styles.slotsGrid}>
            {[...(p.available_slots || []), ...(p.booked_slots || [])].map(
              (slot, j) => {
                const isBooked = (p.booked_slots || []).includes(slot);
                return (
                  <button
                    key={j}
                    className="slot-btn"
                    style={{
                      ...styles.slotBtn(loadingSlot === slot),
                      opacity: isBooked ? 0.5 : 1,
                      cursor: isBooked ? "not-allowed" : "pointer",
                    }}
                    disabled={isBooked || loadingSlot === slot}
                    onClick={() =>
                      onBook(
                        {
                          name: p.doctor_name,
                          specialization: p.recommended_specialist,
                        },
                        slot
                      )
                    }
                  >
                    {loadingSlot === slot ? (
                      <CircularProgress size={12} style={{ color: "#0d9488" }} />
                    ) : (
                      <>🕐 {slot}</>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

function Chatbot() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I'm your Smart Healthcare Assistant. Tell me your symptoms and I'll help you find the right care. 💙",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadingSlot, setLoadingSlot] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleGoBack = () => {
    navigate("/patient");
  };

  const handleBookAppointment = async (doctor, slot) => {
    try {
      setLoadingSlot(slot);
      const token = localStorage.getItem("token");
      if (!token) {
        setSnackbar({
          open: true,
          message: "⚠️ Please log in first.",
          severity: "error",
        });
        return;
      }

      const res = await api.post(
        "/appointments/book",
        { doctorName: doctor.name, specialization: doctor.specialization, slot },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `📌 Appointment confirmed with ${doctor.name} at ${slot}. Awaiting doctor approval.`,
          },
        ]);
        setSnackbar({
          open: true,
          message: `✅ Booked with ${doctor.name} at ${slot}`,
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: `❌ ${res.data.message || "Slot already taken."}`,
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
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: query },
      { sender: "typing" },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/chatbot",
        { query },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const predictions = res.data.predictions || [];
      const results = res.data.results || [];
      const botReply = res.data.reply || "Sorry, I didn't understand that.";

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.sender !== "typing");
        const next = [...filtered, { sender: "bot", text: botReply }];
        if (predictions.length > 0) next.push({ sender: "prediction", predictions });
        if (results.length > 0) next.push({ sender: "doctorList", results });
        return next;
      });
    } catch (err) {
      console.error("Chatbot error", err);
      setMessages((prev) => [
        ...prev.filter((m) => m.sender !== "typing"),
        {
          sender: "bot",
          text: "Error connecting to the server. Please try again.",
        },
      ]);
    }
    setIsSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px";
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.root}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerAvatar}>🤖</div>
          <div>
            <h3 style={styles.headerTitle}>Smart Healthcare Chatbot</h3>
            <p style={styles.headerSub}>
              <span style={styles.onlineDot} /> Online
            </p>
          </div>

          {/* ✅ Go Back Button */}
          <button
            className="go-back-btn"
            style={styles.goBackBtn}
            onClick={handleGoBack}
          >
            ← Go Back
          </button>
        </div>

        {/* Chat Window */}
        <div style={styles.chatWindow}>
          {messages.map((msg, idx) => {
            if (msg.sender === "typing") return <TypingIndicator key={idx} />;
            if (msg.sender === "doctorList")
              return (
                <DoctorList
                  key={idx}
                  results={msg.results}
                  loadingSlot={loadingSlot}
                  onBook={handleBookAppointment}
                />
              );
            if (msg.sender === "prediction")
              return (
                <PredictionCard key={idx} predictions={msg.predictions} />
              );
            return (
              <div
                key={idx}
                style={styles.bubbleWrap(msg.sender)}
                className="chat-msg"
              >
                {msg.sender === "bot" && (
                  <div style={styles.botIcon}>🩺</div>
                )}
                <div style={styles.bubble(msg.sender)}>{msg.text}</div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Replies */}
        <div style={styles.quickReplies}>
          {[
            { label: "🩺 Consult a Doctor", query: "consult a doctor" },
            { label: "📅 Book Appointment", query: "book appointment" },
            { label: "💊 Medication Help", query: "medication help" },
          ].map((c) => (
            <button
              key={c.query}
              className="chip-btn"
              style={styles.chip(false)}
              onClick={() => handleSend(c.query)}
              disabled={isSending}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={styles.inputBar}>
          <textarea
            ref={textareaRef}
            rows={1}
            style={styles.textField}
            placeholder="Describe your symptoms…"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          <button
            className="send-btn"
            style={styles.sendBtn(isSending || !input.trim())}
            onClick={() => handleSend()}
            disabled={isSending || !input.trim()}
            aria-label="Send message"
          >
            {isSending ? "⏳" : "➤"}
          </button>
        </div>

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
            sx={{
              width: "100%",
              borderRadius: "14px",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
}

export default Chatbot;