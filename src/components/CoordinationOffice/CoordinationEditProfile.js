import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "./CoordinationEditProfile.css";

export default function CoordinationEditProfile() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    sap: user?.sap || "",
    department: user?.department || "Coordination"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError("❌ Full name and email are required");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.put(
        apiUrl + "/api/update-profile",
        {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          department: formData.department
        },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Profile updated successfully!");
        setTimeout(() => {
          setSuccess("");
        }, 2000);
      } else {
        setError(response.data.message || "❌ Failed to update profile");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "❌ Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBackToDashboard = () => {
    navigate("/coordination-dashboard");
  };

  const displayName = user?.full_name || "Coordination Staff";
  const displaySap = user?.sap || "N/A";

  return (
    <div className="student-dashboard-page">
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">{displaySap} • Coordination</p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button className="sd-nav-btn" onClick={handleBackToDashboard}>
            📋 Dashboard
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/coordination-messages")}
          >
            💬 Messages
          </button>
          <button className="sd-nav-btn active">
            📝 Edit Profile
          </button>
          <button className="sd-nav-btn logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      <main className="sd-main">
        <header className="sd-header">
          <h1>📝 Edit Profile</h1>
          <p>Update your profile information</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-logo">
            <img src="/logo192.png" alt="Riphah Monogram" />
          </div>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label>SAP ID</label>
            <input
              type="text"
              name="sap"
              value={formData.sap}
              disabled
              placeholder="SAP ID"
            />
          </div>

          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              disabled
              placeholder="Department"
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Updating..." : "✅ Update Profile"}
          </button>
        </form>
      </main>
    </div>
  );
}
