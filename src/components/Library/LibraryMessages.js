import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "../Student/EditProfile.css";

export default function LibraryMessages() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    recipient_sapid: "",
    subject: "",
    message: "",
    message_type: "info"
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

    if (!formData.recipient_sapid.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError("❌ All fields are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + "/api/send-message",
        {
          recipient_sapid: formData.recipient_sapid.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          message_type: formData.message_type
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
          message_type: "info"
        });
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "❌ Failed to send message");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Library Staff";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "Library";

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
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/library-dashboard")}
          >
            📋 Dashboard
          </button>
          <button
            className="sd-nav-btn active"
            onClick={() => navigate("/library-messages")}
          >
            💬 Messages
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/library-edit-profile")}
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
          <h1>Send Message to Student</h1>
          <p>Send notifications and clearance updates to students</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Student SAP ID *</label>
            <input
              type="text"
              name="recipient_sapid"
              value={formData.recipient_sapid}
              onChange={handleChange}
              placeholder="Enter student's SAP ID"
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
              placeholder="Message subject"
              required
            />
          </div>

          <div className="form-group">
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

          <div className="form-group">
            <label>Message *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Type your message..."
              rows="8"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            📤 Send Message
          </button>
        </form>
      </main>
    </div>
  );
}
