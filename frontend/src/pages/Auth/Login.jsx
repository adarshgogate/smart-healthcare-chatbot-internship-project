import React, { useState } from "react";
import api from "../../api/axios";
import { globalCSS } from "../Dashboard/theme";

const ROLE_HINTS = [
  { role: "patient", icon: "👤", label: "Patient",  color: "#1d4ed8", bg: "rgba(29,78,216,0.08)",  border: "rgba(29,78,216,0.22)" },
  { role: "doctor",  icon: "🩺", label: "Doctor",   color: "#0f766e", bg: "rgba(13,148,136,0.08)", border: "rgba(13,148,136,0.22)" },
  { role: "admin",   icon: "⚙️", label: "Admin",    color: "#7e22ce", bg: "rgba(126,34,206,0.08)", border: "rgba(126,34,206,0.22)" },
];

function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { access_token, user_id, role, role_id } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("role", role);
      localStorage.setItem("role_id", role_id);

      // role-based redirect — covers admin, doctor, patient, and unknown fallback
      const routes = {
        admin:   "/admin",
        doctor:  "/doctor",
        patient: "/patient",
      };
      window.location.href = routes[role?.toLowerCase()] || "/";
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <>
      <style>{globalCSS}{`
        .auth-bg {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 24px 16px;
          background: linear-gradient(160deg, #f0faf7 0%, #e0f2fe 50%, #ede9fe 100%);
          position: relative; overflow: hidden;
        }
        .auth-bg::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 600px 400px at 10% 10%, rgba(13,148,136,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 500px 400px at 90% 80%, rgba(99,102,241,0.10) 0%, transparent 70%);
          pointer-events: none;
        }
        .auth-card {
          width: 100%; max-width: 440px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.8);
          border-radius: 28px; padding: 40px 36px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.8) inset;
          position: relative; z-index: 1;
        }
        .auth-logo {
          width: 62px; height: 62px; border-radius: 18px;
          background: linear-gradient(135deg, #0d9488, #0891b2);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 20px;
          box-shadow: 0 8px 24px rgba(13,148,136,0.35);
          animation: pulse-ring 2.5s infinite;
        }
        .pass-wrap { position: relative; }
        .pass-toggle {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          font-size: 16px; opacity: 0.55; transition: opacity 0.2s;
          line-height: 1; padding: 0;
        }
        .pass-toggle:hover { opacity: 1; }
        .error-box {
          background: #fef2f2; border: 1px solid rgba(220,38,38,0.25);
          border-radius: 12px; padding: 10px 14px;
          color: #dc2626; font-size: 13.5px;
          display: flex; align-items: center; gap: 8px;
        }
        .divider {
          display: flex; align-items: center; gap: 12px;
          color: #94a3b8; font-size: 13px; margin: 4px 0;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(13,148,136,0.15);
        }
        .role-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 20px;
          font-size: 12.5px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          border-width: 1.5px; border-style: solid;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .role-badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>

      <div className="auth-bg">
        <div className="auth-card anim-fade-up">

          {/* Logo */}
          <div className="auth-logo">🏥</div>

          <h1 style={{
            textAlign: "center", fontSize: 24, fontWeight: 700,
            color: "#134e4a", marginBottom: 4,
            fontFamily: "'DM Serif Display', serif",
          }}>
            Welcome Back
          </h1>
          <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, marginBottom: 24 }}>
            Sign in to your healthcare account
          </p>

          {/* Role indicator badges — all three roles clearly shown */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 26, flexWrap: "wrap" }}>
            {ROLE_HINTS.map(({ role, icon, label, color, bg, border }) => (
              <span
                key={role}
                className="role-badge"
                style={{ background: bg, borderColor: border, color }}
              >
                {icon} {label}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Email */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>
                Email Address
              </label>
              <input
                className="field"
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>
                Password
              </label>
              <div className="pass-wrap">
                <input
                  className="field"
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={handleKeyDown}
                  style={{ paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  className="pass-toggle"
                  onClick={() => setShowPass(!showPass)}
                  type="button"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="error-box">⚠️ {error}</div>}

            {/* Submit */}
            <button
              className="btn-primary"
              onClick={handleLogin}
              disabled={loading}
              style={{ width: "100%", padding: "14px", fontSize: 16, borderRadius: 14, marginTop: 4 }}
            >
              {loading ? "⏳ Signing in…" : "Sign In →"}
            </button>

            <div className="divider">or</div>

            <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, margin: 0 }}>
              Don't have an account?{" "}
              <a
                href="/register"
                style={{ color: "#0d9488", fontWeight: 700, textDecoration: "none" }}
                onMouseOver={(e) => e.target.style.textDecoration = "underline"}
                onMouseOut={(e) => e.target.style.textDecoration = "none"}
              >
                Create account →
              </a>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}

export default Login;