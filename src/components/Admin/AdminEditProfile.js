import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "./AdminDashboard.css";

export default function AdminEditProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const axiosConfig = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    office_location: user?.office_location || "",
    bio: user?.bio || "",
    old_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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

    // Validate passwords if changing password
    if (formData.new_password || formData.old_password || formData.confirm_password) {
      if (!formData.old_password) {
        setError("❌ Current password is required to change password");
        return;
      }
      if (formData.new_password.length < 6) {
        setError("❌ New password must be at least 6 characters");
        return;
      }
      if (formData.new_password !== formData.confirm_password) {
        setError("❌ Passwords do not match");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        office_location: formData.office_location,
        bio: formData.bio
      };

      if (formData.old_password) {
        payload.old_password = formData.old_password;
        payload.new_password = formData.new_password;
      }

      const response = await axios.put(
        apiUrl + "/api/update-profile",
        payload,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Profile updated successfully!");
        setFormData(prev => ({
          ...prev,
          old_password: "",
          new_password: "",
          confirm_password: ""
        }));
        setTimeout(() => setSuccess(""), 3000);
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

  const displayName = user?.full_name || "Admin";
  const displayEmail = user?.email || "admin@riphah.edu.pk";

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="logo-icon">👨‍💼</div>
          <h1>Admin Panel</h1>
        </div>

        <div className="admin-profile">
          <div className="admin-avatar" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="admin-name">{displayName}</h3>
            <p className="admin-role">System Administrator</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-dashboard")}
          >
            📊 Dashboard
          </button>
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-messages")}
          >
            💬 Messages
          </button>
          <button className="admin-nav-btn active">
            📝 Edit Profile
          </button>
        </nav>

        <button className="admin-nav-btn logout" onClick={handleLogout}>
          🚪 Logout
        </button>

        <footer className="admin-footer">© 2025 Riphah University</footer>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-content">
            <h1>👤 Edit Admin Profile</h1>
            <p>Update your administrative profile and account settings</p>
          </div>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="admin-edit-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>📋 Personal Information</legend>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@riphah.edu.pk"
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
                placeholder="+92-XXX-XXXXXXX"
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>🏢 Administrative Information</legend>

            <div className="form-group">
              <label>Office Location</label>
              <input
                type="text"
                name="office_location"
                value={formData.office_location}
                onChange={handleChange}
                placeholder="e.g., Main Campus, Building A, Room 101"
              />
            </div>

            <div className="form-group">
              <label>Bio / About</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Brief biography or role description"
                rows="4"
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>🔐 Change Password (Optional)</legend>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 15px" }}>
              Leave empty if you don't want to change your password
            </p>

            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
            </div>
          </fieldset>

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
              style={{ opacity: loading ? 0.7 : 1, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
            >
              {loading ? "⏳ Updating..." : "💾 Save Changes"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/admin-dashboard")}
            >
              ↩️ Back to Dashboard
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

/* Add form styles */
const styles = `
  .admin-edit-form {
    background: white;
    padding: 32px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    max-width: 600px;
  }

  fieldset {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;
  }

  legend {
    padding: 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.3s ease;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .form-group textarea {
    resize: vertical;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 32px;
  }

  .btn-submit,
  .btn-cancel {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .btn-submit {
    color: white;
    flex: 1;
  }

  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  }

  .btn-cancel {
    background: #e2e8f0;
    color: #64748b;
  }

  .btn-cancel:hover {
    background: #cbd5e1;
  }

  .alert-success {
    background: #dcfce7;
    color: #166534;
    border-left: 4px solid #22c55e;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
