// src/auth/Signup.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getApiUrl } from "../config/apiConfig";
import "./Auth.css";

const logo512 = "/logo512.png";

const DEPARTMENTS = [
  "Computer Science",
  "Media Studies",
  "Medical Sciences",
  "Business Administration",
  "Engineering",
  "Law",
  "Arts & Humanities",
  "Islamic Studies",
  "Other"
];

// Validation helpers
const validateFullName = (name) => /^[A-Za-z ]{3,}$/.test(name.trim());
const validateEmail = (email) => /^[0-9]+@students\.riphah\.edu\.pk$/.test(email.trim().toLowerCase());
const validateSapId = (sap) => /^[0-9]+$/.test(sap.trim());
const validatePassword = (pw) => /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
const sapMatchesEmail = (sap, email) => {
  const prefix = email.trim().toLowerCase().split("@")[0];
  return prefix === sap.trim();
};

export default function Signup() {
  const navigate = useNavigate();
  const apiUrl = getApiUrl();

  // ---- State ----
  const [step, setStep] = useState("signup"); // "signup" | "otp" | "success"
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    sap: "",
    department: ""
  });
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // ===================== STEP 1: SIGNUP =====================
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!formData.full_name.trim()) return setError("Full name is required");
    if (!validateFullName(formData.full_name)) return setError("Name must be at least 3 letters and contain only alphabets");
    if (!formData.email.trim()) return setError("Email is required");
    if (!validateEmail(formData.email)) return setError("Only university email allowed (e.g. 48397@students.riphah.edu.pk)");
    if (!formData.sap.trim()) return setError("SAP ID is required");
    if (!validateSapId(formData.sap)) return setError("SAP ID must contain only numbers");
    if (!sapMatchesEmail(formData.sap, formData.email)) return setError("SAP ID must match your university email");
    if (!formData.department) return setError("Please select a department");
    if (!formData.password) return setError("Password is required");
    if (!validatePassword(formData.password)) return setError("Password must be at least 8 characters with uppercase, number, and special character");
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/api/signup`, {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: "Student",
        sap: formData.sap.trim(),
        department: formData.department
      });

      if (res.data.success) {
        setPendingEmail(res.data.email || formData.email.trim().toLowerCase());
        setStep("otp");
        setSuccess("Verification code sent to your email!");
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // ===================== STEP 2: VERIFY OTP =====================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim() || !/^[0-9]{6}$/.test(otp.trim())) {
      return setError("Enter valid 6-digit code");
    }

    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/api/auth/verify-otp`, {
        email: pendingEmail,
        otp: otp.trim()
      });

      if (res.data.success) {
        setStep("success");
        setSuccess("Signup successful. Please login.");
        setTimeout(() => navigate("/login", { replace: true }), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // ===================== RESEND OTP =====================
  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/api/auth/resend-otp`, {
        email: pendingEmail
      });
      if (res.data.success) {
        setSuccess("New verification code sent!");
        setOtp("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  // ===================== RENDER: OTP VERIFICATION =====================
  if (step === "otp" || step === "success") {
    return (
      <div className="auth-container">
        <div className="auth-background">
          <div className="gradient-blob blob-1"></div>
          <div className="gradient-blob blob-2"></div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", width: "100%", padding: "20px" }}>
          <div style={{
            background: "#fff",
            borderRadius: "1rem",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
            padding: "2.5rem 2rem",
            maxWidth: "440px",
            width: "100%",
            textAlign: "center"
          }}>
            {/* Logo */}
            <img src={logo512} alt="Riphah Logo" style={{ width: 56, height: 56, borderRadius: "50%", marginBottom: 12 }} />
            <h2 style={{ margin: "0 0 6px", fontSize: "1.5rem", color: "#003366", fontWeight: 700 }}>
              {step === "success" ? "✅ Account Verified!" : "Email Verification"}
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: 24 }}>
              {step === "success"
                ? "Redirecting to login..."
                : <>We sent a 6-digit code to <strong>{pendingEmail}</strong></>}
            </p>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: "0.875rem" }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#16a34a", fontSize: "0.875rem" }}>
                ✅ {success}
              </div>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp}>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                  placeholder="Enter 6-digit code"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    fontSize: "1.5rem",
                    letterSpacing: "0.5rem",
                    textAlign: "center",
                    border: "2px solid #e5e7eb",
                    borderRadius: 12,
                    outline: "none",
                    fontWeight: 700,
                    fontFamily: "'Courier New', monospace",
                    color: "#003366",
                    marginBottom: 20,
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: loading ? "#93c5fd" : "linear-gradient(135deg, #3b82f6, #6366f1)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                    marginBottom: 12,
                  }}
                  onMouseEnter={(e) => { if (!loading) e.target.style.transform = "scale(1.03)"; }}
                  onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; }}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "transparent",
                    color: "#3b82f6",
                    border: "2px solid #3b82f6",
                    borderRadius: 12,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { e.target.style.background = "#eff6ff"; }}
                  onMouseLeave={(e) => { e.target.style.background = "transparent"; }}
                >
                  Resend OTP
                </button>
              </form>
            )}

            <div style={{ marginTop: 20, fontSize: "0.8rem", color: "#9ca3af" }}>
              © 2025 Riphah International University
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== RENDER: SIGNUP FORM =====================
  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
      </div>

      <div className="auth-wrapper">
        {/* LEFT SIDE - BRANDING */}
        <div className="auth-branding">
          <div className="branding-content">
            <div className="logo-section">
              <img src={logo512} alt="Riphah Logo" className="main-logo" />
              <h1>Riphah International University</h1>
              <p className="university-tagline">Excellence in Education</p>
            </div>
            <div className="branding-info">
              <h2>Student Clearance Management System</h2>
              <p>Create your student account to get started</p>
              <ul className="features-list">
                <li><span className="feature-icon">✓</span> University email verification</li>
                <li><span className="feature-icon">✓</span> OTP secured signup</li>
                <li><span className="feature-icon">✓</span> Students only</li>
                <li><span className="feature-icon">✓</span> Instant access after verification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - SIGNUP FORM */}
        <div className="auth-form-container">
          <div className="form-wrapper">
            <div className="form-header">
              <h2>Create Account</h2>
              <p>Join Riphah Clearance Portal</p>
            </div>

            {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-alert">
                <span className="success-icon">✅</span>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="auth-form">
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="full_name"
                    className="form-input"
                    placeholder="Your full name (letters only)"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    style={{
                      borderColor: formData.full_name && !validateFullName(formData.full_name) ? "#ef4444" : undefined
                    }}
                  />
                  {formData.full_name && !validateFullName(formData.full_name) && (
                    <small style={{ color: "#ef4444", marginTop: 6, display: "block", fontSize: "0.8rem", fontWeight: "500" }}>
                      ⚠️ Name must be at least 3 letters and contain only alphabets
                    </small>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">University Email *</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="e.g. 48397@students.riphah.edu.pk"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    style={{
                      borderColor: formData.email && !validateEmail(formData.email) ? "#ef4444" : undefined
                    }}
                  />
                  {formData.email && !validateEmail(formData.email) && (
                    <small style={{ color: "#ef4444", marginTop: 6, display: "block", fontSize: "0.8rem", fontWeight: "500" }}>
                      ⚠️ Only university email allowed (e.g. 48397@students.riphah.edu.pk)
                    </small>
                  )}
                </div>
              </div>

              {/* SAP ID */}
              <div className="form-group">
                <label className="form-label">SAP ID * (must match email prefix)</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="sap"
                    className="form-input"
                    placeholder="e.g. 48397"
                    value={formData.sap}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    style={{
                      borderColor: (formData.sap && !validateSapId(formData.sap)) || (formData.sap && formData.email && validateSapId(formData.sap) && validateEmail(formData.email) && !sapMatchesEmail(formData.sap, formData.email)) ? "#ef4444" : undefined
                    }}
                  />
                  {formData.sap && !validateSapId(formData.sap) && (
                    <small style={{ color: "#ef4444", marginTop: 6, display: "block", fontSize: "0.8rem", fontWeight: "500" }}>
                      ⚠️ SAP ID must contain only numbers
                    </small>
                  )}
                  {formData.sap && formData.email && validateSapId(formData.sap) && validateEmail(formData.email) && !sapMatchesEmail(formData.sap, formData.email) && (
                    <small style={{ color: "#ef4444", marginTop: 6, display: "block", fontSize: "0.8rem", fontWeight: "500" }}>
                      ⚠️ SAP ID must match your university email prefix
                    </small>
                  )}
                </div>
              </div>

              {/* Department */}
              <div className="form-group">
                <label className="form-label">Department *</label>
                <div className="input-wrapper">
                  <select
                    name="department"
                    className="form-input"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    style={{
                      borderColor: formData.department === "" ? "#ef4444" : undefined
                    }}
                  >
                    <option value="">-- Select Your Department --</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="form-input"
                    placeholder="Min 8 chars, uppercase, number, special char"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    style={{
                      borderColor: formData.password && !validatePassword(formData.password) ? "#ef4444" : undefined
                    }}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} disabled={loading} tabIndex="-1">
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {formData.password && (
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    <div style={{ color: formData.password.length >= 8 ? "#10b981" : "#ef4444", fontWeight: "500" }}>
                      {formData.password.length >= 8 ? "✓" : "✗"} At least 8 characters
                    </div>
                    <div style={{ color: /[A-Z]/.test(formData.password) ? "#10b981" : "#ef4444", fontWeight: "500" }}>
                      {/[A-Z]/.test(formData.password) ? "✓" : "✗"} Uppercase letter
                    </div>
                    <div style={{ color: /[0-9]/.test(formData.password) ? "#10b981" : "#ef4444", fontWeight: "500" }}>
                      {/[0-9]/.test(formData.password) ? "✓" : "✗"} Number
                    </div>
                    <div style={{ color: /[^A-Za-z0-9]/.test(formData.password) ? "#10b981" : "#ef4444", fontWeight: "500" }}>
                      {/[^A-Za-z0-9]/.test(formData.password) ? "✓" : "✗"} Special character
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <div className="input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className="form-input"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    style={{
                      borderColor: formData.confirmPassword && formData.password !== formData.confirmPassword ? "#ef4444" : undefined
                    }}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading} tabIndex="-1">
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <small style={{ color: "#ef4444", marginTop: 6, display: "block", fontSize: "0.8rem", fontWeight: "500" }}>
                    ⚠️ Passwords do not match
                  </small>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <small style={{ color: "#10b981", marginTop: 6, display: "block", fontSize: "0.8rem", fontWeight: "500" }}>
                    ✓ Passwords match
                  </small>
                )}
              </div>

              {/* Submit */}
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (<><span className="loader"></span> Sending OTP...</>) : "Sign Up"}
              </button>
            </form>

            <div className="form-divider">
              <span>Already have an account?</span>
            </div>

            <Link to="/login" className="btn-secondary">
              Sign In
            </Link>

            <div className="auth-footer">
              <p>© 2025 Riphah International University. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
