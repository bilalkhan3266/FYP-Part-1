import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./EditProfile.css";
import axios from "axios";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    sap: user?.sap || "",
    department: user?.department || "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!form.full_name || !form.email) {
      setMessage("❌ Full name and email are required");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (form.password && form.password !== form.confirmPassword) {
      setMessage("❌ Passwords do not match");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      
      const response = await axios.put(
        apiUrl + "/api/update-profile",
        {
          full_name: form.full_name,
          email: form.email,
          sap: form.sap,
          department: form.department,
          password: form.password || undefined
        },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setMessage("✅ Profile updated successfully!");
        setMessageType("success");
        
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        setTimeout(() => navigate("/student-dashboard"), 1500);
      } else {
        setMessage(response.data.message || "❌ Update failed");
        setMessageType("error");
      }
    } catch (err) {
      console.error("Update error:", err);
      setMessage(
        err.response?.data?.message || 
        "❌ Failed to update profile. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "N/A";

  return (
    <div className="student-dashboard-page">
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">{displaySap} • {displayDept}</p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button onClick={() => navigate("/student-dashboard")} className="sd-nav-btn">🏠 Dashboard</button>
          <button onClick={() => navigate("/student-clearance-request")} className="sd-nav-btn">📋 Submit Request</button>
          <button onClick={() => navigate("/student-clearance-status")} className="sd-nav-btn">✅ Clearance Status</button>
          <button onClick={() => navigate("/student-messages")} className="sd-nav-btn">💬 Messages</button>
          <button onClick={() => navigate("/student-edit-profile")} className="sd-nav-btn active">📝 Edit Profile</button>
          <button onClick={handleLogout} className="sd-nav-btn logout">🚪 Logout</button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      <main className="sd-main">
        <header className="sd-header">
          <h1>Edit Your Profile</h1>
          <p>Update your personal information</p>
        </header>

        {message && (
          <div className={"alert alert-" + messageType}>
            {message}
          </div>
        )}

        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>SAP ID</label>
            <input
              type="text"
              name="sap"
              value={form.sap}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>New Password (leave blank to keep current)</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </main>
    </div>
  );
}
