import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "../Student/EditProfile.css";

export default function HODMessages() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    recipient_sapid: "",
    subject: "",
    message: "",
    message_type: "info",
    priority: "normal"
  });

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

    if (!formData.recipient_sapid.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError("❌ All fields are required");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + "/api/send-message",
        {
          recipient_sapid: formData.recipient_sapid.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          message_type: formData.message_type,
          priority: formData.priority
        },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Message sent successfully!");
        setFormData({
          recipient_sapid: "",
          subject: "",
          message: "",
          message_type: "info",
          priority: "normal"
        });
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "❌ Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "HOD";
  const displayEmail = user?.email || "hod@riphah.edu.pk";

  return (
    <div className="student-dashboard-page">
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">{displayEmail}</p>
            <p className="sd-small" style={{ color: "#667eea", fontWeight: "600" }}>Head of Department</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/hod-dashboard")}
          >
            📋 Dashboard
          </button>
          <button
            className="sd-nav-btn active"
            onClick={() => navigate("/hod-messages")}
          >
            💬 Messages
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/hod-edit-profile")}
          >
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
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ fontSize: "48px" }}>📨</div>
            <div>
              <h1>Send Message to Student</h1>
              <p>Send notifications, approvals, and important updates to students</p>
            </div>
          </div>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="edit-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>📤 Message Details</legend>

            <div className="form-group">
              <label>Student SAP ID *</label>
              <input
                type="text"
                name="recipient_sapid"
                value={formData.recipient_sapid}
                onChange={handleChange}
                placeholder="Enter student's SAP ID (e.g., BCS-123456)"
                required
              />
            </div>

            <div className="form-group">
              <label>Subject *</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Message subject line"
                required
              />
            </div>

            <div style={{ display: "flex", gap: "20px" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Message Type</label>
                <select
                  name="message_type"
                  value={formData.message_type}
                  onChange={handleChange}
                >
                  <option value="info">ℹ️ Information</option>
                  <option value="success">✅ Approved</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="error">❌ Rejection</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Priority (HOD Enhancement)</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">📍 Low</option>
                  <option value="normal">📌 Normal</option>
                  <option value="high">🔴 High</option>
                  <option value="urgent">🔥 Urgent</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>✍️ Message Content</legend>
            <div className="form-group">
              <label>Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Type your message to the student. Include important details and any required actions."
                rows="10"
                required
              />
            </div>
          </fieldset>

          <div style={{ display: "flex", gap: "12px", marginTop: "30px" }}>
            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
              style={{
                opacity: loading ? 0.7 : 1,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              }}
            >
              {loading ? "⏳ Sending..." : "📤 Send Message"}
            </button>
            <button
              type="button"
              className="submit-btn"
              style={{ background: "#6b7280" }}
              onClick={() => navigate("/hod-dashboard")}
            >
              ↩️ Back
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
