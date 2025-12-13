import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "../Student/EditProfile.css"; // ✅ USE CONSISTENT STYLING

export default function StudentMessages() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [formData, setFormData] = useState({
    recipientDepartment: "Library",
    subject: "",
    message: ""
  });

  const departments = [
    "Library",
    "Transport",
    "Laboratory",
    "StudentService",
    "FeeDepartment",
    "Coordination",
    "HOD"
  ];

  // ✅ FETCH MESSAGES ON MOUNT
  useEffect(() => {
    if (user) {
      fetchMessages();
      // Refresh every 20 seconds
      const interval = setInterval(fetchMessages, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(apiUrl + "/api/my-messages", {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        setMessages(response.data.data || []);
        setError("");
      }
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
      setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.recipientDepartment.trim()) {
      setError("❌ Please select a department");
      return;
    }
    if (!formData.subject.trim()) {
      setError("❌ Please enter a subject");
      return;
    }
    if (!formData.message.trim()) {
      setError("❌ Please enter a message");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const messageData = {
        recipientDepartment: formData.recipientDepartment.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim()
      };

      console.log("📤 Sending message:", messageData);

      const response = await axios.post(
        apiUrl + "/api/send",
        messageData,
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Message sent successfully!");
        setFormData({ recipientDepartment: "Library", subject: "", message: "" });
        setShowNewMessageForm(false);
        setError("");
        await fetchMessages();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      await axios.put(
        apiUrl + `/api/mark-read/${messageId}`,
        {},
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      await fetchMessages();
    } catch (err) {
      console.error("❌ Error marking as read:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const displayName = user?.full_name || "Student";

  return (
    <div className="student-dashboard-page">
      {/* ✅ SIDEBAR */}
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">{user?.sap || user?.sap_id} • Riphah</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button onClick={() => handleNavigate("/student-dashboard")} className="sd-nav-btn">
            🏠 Dashboard
          </button>
          <button className="sd-nav-btn active">💬 Messages</button>
          <button onClick={() => handleNavigate("/student-clearance-request")} className="sd-nav-btn">
            📋 Clearance
          </button>
          <button onClick={handleLogout} className="sd-nav-btn logout">
            🚪 Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      {/* ✅ MAIN CONTENT */}
      <main className="sd-main">
        <header className="sd-header">
          <h1>💬 My Messages</h1>
          <p>Communication with departments</p>
        </header>

        {/* ✅ ALERTS */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* ✅ NEW MESSAGE BUTTON */}
        <button
          className="sd-nav-btn"
          onClick={() => setShowNewMessageForm(true)}
          style={{ marginBottom: "20px", backgroundColor: "#4CAF50", color: "white" }}
        >
          ✉️ Send New Message
        </button>

        {/* ✅ LOADING STATE */}
        {loading ? (
          <div className="loading">⏳ Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-data" style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            📭 No messages yet
          </div>
        ) : (
          /* ✅ MESSAGES LIST */
          <div className="messages-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((msg) => (
              <div
                key={msg._id}
                className="message-card"
                onClick={() => !msg.is_read && handleMarkAsRead(msg._id)}
                style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: msg.is_read ? "#f9f9f9" : "#e3f2fd",
                  cursor: "pointer",
                  transition: "all 0.3s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>{msg.subject}</h3>
                  <span style={{ fontSize: "12px", color: "#999" }}>
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
                  <strong>From:</strong> {msg.senderName} ({msg.senderRole})
                </div>

                <div style={{ fontSize: "14px", lineHeight: "1.5", marginBottom: "8px" }}>
                  {msg.message}
                </div>

                {msg.reply && (
                  <div style={{
                    fontSize: "13px",
                    color: "#666",
                    backgroundColor: "#f0f0f0",
                    padding: "8px",
                    borderRadius: "4px",
                    marginTop: "8px"
                  }}>
                    <strong>Reply:</strong> {msg.reply}
                  </div>
                )}

                <div style={{ fontSize: "12px", color: msg.is_read ? "#999" : "#2196F3" }}>
                  {msg.is_read ? "✓ Read" : "● Unread"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ NEW MESSAGE MODAL */}
        {showNewMessageForm && (
          <div
            className="modal-overlay"
            onClick={() => setShowNewMessageForm(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "12px",
                maxWidth: "500px",
                width: "90%",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
              }}
            >
              <h2 style={{ marginTop: 0 }}>✉️ Send Message to Department</h2>

              <form onSubmit={handleSendMessage} className="edit-form">
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    value={formData.recipientDepartment}
                    onChange={(e) =>
                      setFormData({ ...formData, recipientDepartment: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="Enter subject"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Enter your message"
                    required
                    rows="6"
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="sd-nav-btn"
                    onClick={() => setShowNewMessageForm(false)}
                    style={{ backgroundColor: "#f44336" }}
                  >
                    ✕ Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={sending}
                  >
                    {sending ? "Sending..." : "✉️ Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
