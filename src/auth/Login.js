// src/auth/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import "./Auth.css";

const logo512 = "/logo512.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const result = await login(email.trim().toLowerCase(), password.trim());
      if (result.success) {
        const user = JSON.parse(localStorage.getItem("user"));
        
        // Role-based redirect - match backend role names (lowercase)
        const roleRoutes = {
          student: "/student-dashboard",
          library: "/library-dashboard",
          transport: "/transport-dashboard",
          laboratory: "/lab-dashboard",
          studentservice: "/service-dashboard",
          feedepartment: "/fee-dashboard",
          coordination: "/coordination-dashboard",
          hod: "/hod-dashboard"
        };

        const userRole = user.role ? user.role.toLowerCase() : "student";
        const redirectRoute = roleRoutes[userRole] || "/";
        navigate(redirectRoute, { replace: true });
      } else {
        setError(result.error || result.message || "Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => navigate("/forgot");

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
              <p>Streamlined clearance process for all departments</p>
              <ul className="features-list">
                <li><span className="feature-icon">✓</span> Easy clearance requests</li>
                <li><span className="feature-icon">✓</span> Real-time status tracking</li>
                <li><span className="feature-icon">✓</span> Department coordination</li>
                <li><span className="feature-icon">✓</span> Secure authentication</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <div className="auth-form-container">
          <div className="form-wrapper">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>
            </div>

            {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon"></span>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                
                <label className="form-label">Password</label>
                
                <div className="input-wrapper">
                 
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    
                    placeholder=" Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    tabIndex="-1"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="forgot-password">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit */}
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loader"></span> Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="form-divider">
              <span>Don't have an account?</span>
            </div>

            <Link to="/signup" className="btn-secondary">
              Create Account
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
