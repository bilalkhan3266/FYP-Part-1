// src/auth/ForgotPassword.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./ForgotPassword.css";

const logo512 = "/logo512.png";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  // Step 1: Request Reset Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const response = await axios.post(apiUrl + "/api/forgot-password-request", {
        email: formData.email.trim().toLowerCase()
      });

      if (response.data.success) {
        setStep(2);
      } else {
        setError(response.data.message || "Failed to send reset code");
      }
    } catch (err) {
      console.error("Request Code Error:", err);
      setError(err.response?.data?.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.code) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const response = await axios.post(apiUrl + "/api/verify-reset-code", {
        email: formData.email,
        code: formData.code
      });

      if (response.data.success) {
        setStep(3);
      } else {
        setError(response.data.message || "Invalid verification code");
      }
    } catch (err) {
      console.error("Verify Code Error:", err);
      setError(err.response?.data?.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Please enter both passwords");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const response = await axios.post(apiUrl + "/api/reset-password", {
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        alert("✅ Password reset successfully!");
        navigate("/login", { replace: true });
      } else {
        setError(response.data.message || "Failed to reset password");
      }
    } catch (err) {
      console.error("Reset Password Error:", err);
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-wrapper">
        {/* LEFT SIDE - BRANDING */}
        <div className="forgot-password-branding">
          <div className="forgot-password-branding-content">
            <div className="forgot-password-logo-section">
              <img src={logo512} alt="Riphah Logo" />
              <h1>Riphah International University</h1>
              <p>Excellence in Education</p>
            </div>
            <div className="forgot-password-info">
              <h2>Student Clearance Management System</h2>
              <p>Securely recover your account access with our verification process</p>
              <ul className="forgot-password-features-list">
                <li><span className="forgot-password-feature-icon">✓</span> Secure email verification</li>
                <li><span className="forgot-password-feature-icon">✓</span> Time-limited recovery codes</li>
                <li><span className="forgot-password-feature-icon">✓</span> Instant password reset</li>
                <li><span className="forgot-password-feature-icon">✓</span> Protected account access</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="forgot-password-form-container">
          <div className="forgot-password-form-wrapper">
            {/* Step 1: Email */}
            {step === 1 && (
              <>
                <div className="forgot-password-form-header">
                  <h2>Reset Password</h2>
                  <p>Enter your email address to get started</p>
                </div>

                {error && (
                  <div className="forgot-password-error-alert">
                    <span className="forgot-password-error-icon">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRequestCode} className="forgot-password-form">
                  <div className="forgot-password-form-group">
                    <label className="forgot-password-form-label">Email Address</label>
                    <div className="forgot-password-input-wrapper">
                      <span className="forgot-password-input-icon">✉️</span>
                      <input
                        type="email"
                        name="email"
                        className="forgot-password-form-input"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="forgot-password-btn-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="forgot-password-loader"></span> Sending Code...
                      </>
                    ) : (
                      "Send Reset Code"
                    )}
                  </button>
                </form>

                <div className="forgot-password-form-divider">
                  <span>Remember your password?</span>
                </div>

                <Link to="/login" className="forgot-password-btn-secondary">
                  Back to Sign In
                </Link>
              </>
            )}

            {/* Step 2: Verification Code */}
            {step === 2 && (
              <>
                <div className="forgot-password-form-header">
                  <h2>Verify Code</h2>
                  <p>Check your email for the 6-digit verification code</p>
                </div>

                {error && (
                  <div className="forgot-password-error-alert">
                    <span className="forgot-password-error-icon">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyCode} className="forgot-password-form">
                  <div className="forgot-password-form-group">
                    <label className="forgot-password-form-label">Verification Code</label>
                    <div className="forgot-password-input-wrapper">
                      <span className="forgot-password-input-icon">🔐</span>
                      <input
                        type="text"
                        name="code"
                        className="forgot-password-form-input"
                        placeholder="Enter 6-digit code"
                        value={formData.code}
                        onChange={handleChange}
                        disabled={loading}
                        maxLength="6"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="forgot-password-btn-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="forgot-password-loader"></span> Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </button>
                </form>

                <div className="forgot-password-form-divider">
                  <span>Try a different email?</span>
                </div>

                <button
                  type="button"
                  className="forgot-password-btn-secondary"
                  onClick={() => {
                    setStep(1);
                    setFormData({ ...formData, code: "" });
                    setError("");
                  }}
                  disabled={loading}
                >
                  Back to Email
                </button>
              </>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <>
                <div className="forgot-password-form-header">
                  <h2>Create New Password</h2>
                  <p>Set a strong password for your account</p>
                </div>

                {error && (
                  <div className="forgot-password-error-alert">
                    <span className="forgot-password-error-icon">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="forgot-password-form">
                  <div className="forgot-password-form-group">
                    <label className="forgot-password-form-label">New Password</label>
                    <div className="forgot-password-input-wrapper">
                      <span className="forgot-password-input-icon">🔒</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        className="forgot-password-form-input"
                        placeholder="Min 6 characters"
                        value={formData.newPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        className="forgot-password-toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        tabIndex="-1"
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <div className="forgot-password-form-group">
                    <label className="forgot-password-form-label">Confirm Password</label>
                    <div className="forgot-password-input-wrapper">
                      <span className="forgot-password-input-icon">🔒</span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        className="forgot-password-form-input"
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        className="forgot-password-toggle-password"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                        tabIndex="-1"
                      >
                        {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="forgot-password-btn-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="forgot-password-loader"></span> Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>

                <div className="forgot-password-form-divider">
                  <span>Ready to sign in?</span>
                </div>

                <Link to="/login" className="forgot-password-btn-secondary">
                  Go to Sign In
                </Link>
              </>
            )}

            <div className="forgot-password-form-footer">
              <p>© 2025 Riphah International University. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
