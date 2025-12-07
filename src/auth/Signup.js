// src/auth/Signup.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import "./Auth.css";

const logo512 = "/logo512.png";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuthContext();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Student",
    sap: "",
    department: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.full_name || !formData.email || !formData.password || !formData.role) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.full_name.trim().length < 3) {
      setError("Full name must be at least 3 characters");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await signup({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
        role: formData.role.toLowerCase(),
        sap: formData.sap.trim() || null,
        department: formData.department.trim() || null
      });

      if (result.success) {
        const user = JSON.parse(localStorage.getItem("user"));
        
        // Role-based redirect
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
        setError(result.message || "Signup failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

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
              <p>Create your account to get started</p>
              <ul className="features-list">
                <li><span className="feature-icon">✓</span> Fast registration</li>
                <li><span className="feature-icon">✓</span> Multiple roles</li>
                <li><span className="feature-icon">✓</span> Secure signup</li>
                <li><span className="feature-icon">✓</span> Instant access</li>
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

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-wrapper">
                  {/* <span className="input-icon">👤</span> */}
                  <input
                    type="text"
                    name="full_name"
                    className="form-input"
                    placeholder="Your full name"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div className="input-wrapper">
                  {/* <span className="input-icon">✉️</span> */}
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Role */}
              <div className="form-group">
                <label className="form-label">Select Role *</label>
                <div className="input-wrapper">
                  <span className="input-icon">🎓</span>
                  <select
                    name="role"
                    className="form-input"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  >
                    <option value="Student">Student</option>
                    <option value="Library">Library Staff</option>
                    <option value="Transport">Transport Staff</option>
                    <option value="Laboratory">Laboratory Staff</option>
                    <option value="StudentService">Student Service</option>
                    <option value="FeeDepartment">Fee Department</option>
                    <option value="Coordination">Coordination Office</option>
                    <option value="Hod">HOD</option>
                  </select>
                </div>
              </div>

              {/* Student-only fields */}
              {formData.role === "Student" && (
                <>
                  <div className="form-group">
                    <label className="form-label">SAP ID</label>
                    <div className="input-wrapper">
                      {/* <span className="input-icon">🔢</span> */}
                      <input
                        type="text"
                        name="sap"
                        className="form-input"
                        placeholder="e.g., 12345"
                        value={formData.sap}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <div className="input-wrapper">
                      {/* <span className="input-icon">📚</span> */}
                      <input
                        type="text"
                        name="department"
                        className="form-input"
                        placeholder="Your department"
                        value={formData.department}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div className="input-wrapper">
                  {/* <span className="input-icon">🔒</span> */}
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="form-input"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
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

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <div className="input-wrapper">
                  {/* <span className="input-icon">🔒</span> */}
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className="form-input"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loader"></span> Creating Account...
                  </>
                ) : (
                  "Sign Up"
                )}
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
