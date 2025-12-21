import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "../Student/EditProfile.css";

export default function HODMessages() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("send"); // "send" or "history"
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);
  
  const [formData, setFormData] = useState({
    recipient_sapid: "",
    subject: "",
    message: "",
    message_type: "info",
    priority: "normal"
  });

  // Role-based access control
  useEffect(() => {
    if (!user) return;
    
    const userRole = user.role ? user.role.toLowerCase() : "";
    const isHOD = userRole.includes("head") || userRole.includes("hod") || userRole.includes("department head");
    
    if (!isHOD) {
      setError("❌ Access denied. Only HOD users can access this page.");
      setTimeout(() => navigate("/student-dashboard"), 1500);
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ FETCH SENT MESSAGES
  const fetchSentMessages = async () => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      console.log("📨 Fetching sent messages from:", apiUrl + "/api/staff/sent-messages");

      const response = await axios.get(
        apiUrl + "/api/staff/sent-messages",
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("✅ Sent messages response:", response.data);

      if (response.data.success) {
        setSentMessages(response.data.data || []);
        setError("");
      } else {
        setError(response.data.message || "❌ Failed to load sent messages");
      }
    } catch (err) {
      console.error("❌ Error fetching sent messages:", err);
      console.error("❌ Error response:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      setError(err.response?.data?.message || "❌ Failed to load sent messages");
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOAD SENT MESSAGES WHEN TAB CHANGES
  useEffect(() => {
    if (activeTab === "history") {
      fetchSentMessages();
    }
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.recipient_sapid.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError("❌ All fields are required");
      return;
    }

    setSending(true);
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
      setSending(false);
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
            <div style={{ fontSize: "48px" }}>�</div>
            <div>
              <h1>Messages</h1>
              <p>Send notifications and view message history</p>
            </div>
          </div>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* ✅ TAB NAVIGATION */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "2px solid #e0e0e0", paddingBottom: "10px" }}>
          <button
            onClick={() => {
              setActiveTab("send");
              setError(""); // Clear errors when switching to send tab
            }}
            style={{
              padding: "10px 20px",
              background: activeTab === "send" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f0f0f0",
              color: activeTab === "send" ? "white" : "#333",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "16px"
            }}
          >
            📤 Send Message
          </button>
          <button
            onClick={() => setActiveTab("history")}
            style={{
              padding: "10px 20px",
              background: activeTab === "history" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f0f0f0",
              color: activeTab === "history" ? "white" : "#333",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "16px"
            }}
          >
            📋 Sent Messages ({sentMessages.length})
          </button>
        </div>

        {/* ✅ SEND MESSAGE TAB */}
        {activeTab === "send" && (
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
                disabled={sending}
                className="submit-btn"
                style={{
                  opacity: sending ? 0.7 : 1,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                }}
              >
                {sending ? "⏳ Sending..." : "📤 Send Message"}
              </button>
            </div>
          </form>
        )}

        {/* ✅ SENT MESSAGES HISTORY TAB */}
        {activeTab === "history" && (
          <div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "18px" }}>
                ⏳ Loading sent messages...
              </div>
            ) : sentMessages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#999", fontSize: "16px" }}>
                📭 No sent messages yet
              </div>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {sentMessages.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      backgroundColor: "#f9f9f9",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>
                          📨 {msg.subject}
                        </h3>
                        <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                          <strong>To:</strong> {msg.recipient_sapid || "N/A"}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span
                          style={{
                            background: msg.message_type === "success" ? "#4CAF50" : msg.message_type === "error" ? "#f44336" : msg.message_type === "warning" ? "#ff9800" : "#2196F3",
                            color: "white",
                            padding: "5px 10px",
                            borderRadius: "5px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                        >
                          {msg.message_type === "success" ? "✅ Approved" : msg.message_type === "error" ? "❌ Rejection" : msg.message_type === "warning" ? "⚠️ Warning" : "ℹ️ Info"}
                        </span>
                        <span
                          style={{
                            background: msg.priority === "urgent" ? "#e91e63" : msg.priority === "high" ? "#ff5722" : msg.priority === "normal" ? "#ff9800" : "#8BC34A",
                            color: "white",
                            padding: "5px 10px",
                            borderRadius: "5px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                        >
                          {msg.priority === "urgent" ? "🔥 Urgent" : msg.priority === "high" ? "🔴 High" : msg.priority === "normal" ? "📌 Normal" : "📍 Low"}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: "10px 0", color: "#555", lineHeight: "1.6" }}>
                      {msg.message}
                    </p>
                    <p style={{ margin: "10px 0 0 0", color: "#999", fontSize: "13px" }}>
                      📅 {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
