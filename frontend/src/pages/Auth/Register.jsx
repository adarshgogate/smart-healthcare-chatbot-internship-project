import React, { useState } from "react";
import api from "../../api/axios";
import { globalCSS } from "../Dashboard/theme";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) { setError("Please fill in all required fields."); return; }
    setError("");
    setLoading(true);

    try {
      const payload = { username, email, password, role };
      if (role === "doctor") {
        if (!specialization) { setError("Please enter specialization."); setLoading(false); return; }
        payload.specialization = specialization;
        payload.experience = Number(experience) || 0;
      }
      if (role === "patient") {
        if (!age || !gender) { setError("Please enter age and gender."); setLoading(false); return; }
        payload.age = Number(age) || 0;
        payload.gender = gender;
      }

      await api.post("/auth/register", payload);
      window.location.href = "/login";
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "patient", icon: "💙", label: "Patient", desc: "Book appointments & track health" },
    { id: "doctor", icon: "🩺", label: "Doctor", desc: "Manage appointments & patients" },
  ];

  const genders = ["Male", "Female", "Other"];
  const specs = ["Cardiology", "Dermatology", "Gastroenterologist" , "General Medicine", "Neurology", "Orthopedics", "Pediatrics", "Psychiatry", "Radiology", "Surgery", "Other"];

  return (
    <>
      <style>{globalCSS}{`
        .auth-bg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: linear-gradient(160deg, #f0faf7 0%, #e0f2fe 50%, #ede9fe 100%);
          position: relative;
          overflow: hidden;
        }
        .auth-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 600px 400px at 10% 10%, rgba(13,148,136,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 500px 400px at 90% 80%, rgba(99,102,241,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .auth-card {
          width: 100%;
          max-width: 500px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.8);
          border-radius: 28px;
          padding: 40px 36px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.8) inset;
          position: relative;
          z-index: 1;
        }
        .auth-logo {
          width: 60px; height: 60px; border-radius: 18px;
          background: linear-gradient(135deg, #0d9488, #0891b2);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 20px;
          box-shadow: 0 8px 24px rgba(13,148,136,0.35);
        }
        .role-selector {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .role-option {
          padding: 14px 16px;
          border-radius: 14px;
          border: 2px solid;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          background: white;
          font-family: 'DM Sans', sans-serif;
        }
        .role-option.active {
          border-color: #0d9488;
          background: linear-gradient(135deg, #f0fdf9, #e0f2fe);
          box-shadow: 0 4px 14px rgba(13,148,136,0.18);
        }
        .role-option:not(.active) {
          border-color: rgba(13,148,136,0.2);
        }
        .role-option:not(.active):hover {
          border-color: rgba(13,148,136,0.45);
          background: #f8fefd;
        }
        .pass-wrap { position: relative; }
        .pass-toggle {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; font-size: 16px; opacity: 0.6;
          transition: opacity 0.2s; line-height: 1; padding: 0;
        }
        .pass-toggle:hover { opacity: 1; }
        .error-box {
          background: #fef2f2; border: 1px solid rgba(220,38,38,0.25);
          border-radius: 12px; padding: 10px 14px;
          color: #dc2626; font-size: 13.5px;
          display: flex; align-items: center; gap: 8px;
        }
        .extra-fields {
          display: flex; flex-direction: column; gap: 14px;
          padding: 18px;
          background: rgba(13,148,136,0.04);
          border: 1px solid rgba(13,148,136,0.12);
          border-radius: 14px;
        }
      `}</style>

      <div className="auth-bg">
        <div className="auth-card anim-fade-up">
          <div className="auth-logo">🏥</div>

          <h1 style={{
            textAlign: "center", fontSize: 24,
            fontWeight: 700, color: "#134e4a",
            marginBottom: 4, fontFamily: "'DM Serif Display', serif",
          }}>
            Create Account
          </h1>
          <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, marginBottom: 28 }}>
            Join our smart healthcare platform
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Role Selector */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 10 }}>
                I am a…
              </label>
              <div className="role-selector">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    className={`role-option${role === r.id ? " active" : ""}`}
                    onClick={() => setRole(r.id)}
                    type="button"
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{r.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#134e4a" }}>{r.label}</div>
                    <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Base Fields */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>Username *</label>
              <input className="field" type="text" placeholder="Your full name" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>Email Address *</label>
              <input className="field" type="email" placeholder="you@gmail.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>Password *</label>
              <div className="pass-wrap">
                <input
                  className="field"
                  type={showPass ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  style={{ paddingRight: 44 }}
                />
                <button className="pass-toggle" onClick={() => setShowPass(!showPass)} type="button">
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Doctor Fields */}
            {role === "doctor" && (
              <div className="extra-fields anim-fade-up">
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                  🩺 Doctor Details
                </p>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>Specialization *</label>
                  <div style={{ position: "relative" }}>
                    <select className="field" value={specialization} onChange={(e) => setSpecialization(e.target.value)} style={{ paddingRight: 36 }}>
                      <option value="">— Select specialization —</option>
                      {specs.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#0d9488" }}>▾</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>Years of Experience</label>
                  <input className="field" type="number" min="0" max="60" placeholder="e.g. 5" value={experience} onChange={(e) => setExperience(e.target.value)} />
                </div>
              </div>
            )}

            {/* Patient Fields */}
            {role === "patient" && (
              <div className="extra-fields anim-fade-up">
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                  💙 Patient Details
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>Age *</label>
                    <input className="field" type="number" min="1" max="120" placeholder="e.g. 28" value={age} onChange={(e) => setAge(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>Gender *</label>
                    <div style={{ position: "relative" }}>
                      <select className="field" value={gender} onChange={(e) => setGender(e.target.value)} style={{ paddingRight: 36 }}>
                        <option value="">— Select —</option>
                        {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#0d9488" }}>▾</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && <div className="error-box">⚠️ {error}</div>}

            {/* Submit */}
            <button
              className="btn-primary"
              onClick={handleRegister}
              disabled={loading}
              style={{ width: "100%", padding: "14px", fontSize: 16, borderRadius: 14 }}
            >
              {loading ? "⏳ Creating account…" : "Create Account →"}
            </button>

            <p style={{ textAlign: "center", color: "#64748b", fontSize: 14 }}>
              Already have an account?{" "}
              <a
                href="/login"
                style={{ color: "#0d9488", fontWeight: 700, textDecoration: "none" }}
                onMouseOver={(e) => e.target.style.textDecoration = "underline"}
                onMouseOut={(e) => e.target.style.textDecoration = "none"}
              >
                Sign in →
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Register;