import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./Messages.css";
import axios from "axios";

export default function Messages() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [newMessage, setNewMessage] = useState({
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

  // ====== FETCH MESSAGES ON MOUNT ======
  useEffect(() => {
    if (user) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ✅ FETCH MESSAGES FROM BACKEND
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      if (!token) {
        setError("❌ No authentication token. Please login again.");
        return;
      }

      const response = await axios.get(apiUrl + "/api/my-messages", {
        headers: { 
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        setMessages(response.data.data || []);
        setError("");
      } else {
        setError(response.data.message || "Failed to load messages");
      }
    } catch (err) {
      console.error("Fetch Messages Error:", err);
      
      if (err.response?.status === 401) {
        setError("❌ Session expired. Please login again.");
      } else if (err.response?.data?.message) {
        setError("❌ " + err.response.data.message);
      } else {
        setError("❌ Failed to load messages");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewMessage = async () => {
    // Validation
    if (!newMessage.recipientDepartment) {
      setError("❌ Please select a department");
      return;
    }
    if (!newMessage.subject.trim()) {
      setError("❌ Please enter a subject");
      return;
    }
    if (!newMessage.message.trim()) {
      setError("❌ Please enter your message");
      return;
    }

    const messageData = {
      recipientDepartment: newMessage.recipientDepartment.trim(),
      subject: newMessage.subject.trim(),
      message: newMessage.message.trim()
    };

    console.log('📤 Sending message:', messageData);
    console.log('📤 Full payload:', JSON.stringify(messageData));

    setSending(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      console.log('🔗 API URL:', apiUrl);
      console.log('🔐 Token present:', !!token);

      if (!token) {
        setError("❌ No authentication token found. Please login again.");
        setSending(false);
        return;
      }

      console.log('📨 Posting to:', apiUrl + "/api/send");

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

      console.log('✅ Response received:', response.data);

      if (response.data.success) {
        // Reset form
        setNewMessage({
          recipientDepartment: "Library",
          subject: "",
          message: ""
        });
        setShowNewMessageForm(false);
        setError("");
        setSuccess("✅ Message sent successfully!");
        await fetchMessages();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMsg = response.data.message || "❌ Failed to send message";
        console.log('❌ Server error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error("❌ Send Message Error:", err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      
      if (err.response?.data?.message) {
        setError("❌ " + err.response.data.message);
      } else if (err.message) {
        setError("❌ " + err.message);
      } else {
        setError("❌ Failed to send message. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "N/A";

  return (
    <div className="student-dashboard-page">
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">{displaySap} • Riphah</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button onClick={() => navigate("/student-dashboard")} className="sd-nav-btn">
            🏠 Dashboard
          </button>
          <button onClick={() => navigate("/student-clearance-request")} className="sd-nav-btn">
            📋 Submit Request
          </button>
          <button onClick={() => navigate("/student-messages")} className="sd-nav-btn active">
            💬 Messages
          </button>
          <button onClick={handleLogout} className="sd-nav-btn logout">
            🚪 Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      <main className="sd-main">
        <header className="sd-header">
          <h1>💬 My Messages</h1>
          <p>Communication with departments</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button
          className="sd-nav-btn"
          onClick={() => setShowNewMessageForm(true)}
          style={{ marginBottom: "20px", backgroundColor: "#4CAF50", color: "white" }}
        >
          ✉️ Send New Message
        </button>

        {loading ? (
          <div className="loading">⏳ Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-data" style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            📭 No messages yet
          </div>
        ) : (
          <div className="messages-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((msg) => (
              <div
                key={msg._id}
                className="message-card"
                style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: msg.is_read ? "#f9f9f9" : "#e3f2fd"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <h3 style={{ margin: "0 0 8px 0" }}>{msg.subject}</h3>
                  <span style={{ fontSize: "12px", color: "#999" }}>
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
                  <strong>From:</strong> {msg.sender_name || msg.senderName} ({msg.sender_role || msg.senderRole})
                </div>

                <div style={{ fontSize: "14px", marginBottom: "8px" }}>{msg.message}</div>

                <div style={{ fontSize: "12px", color: msg.is_read ? "#999" : "#2196F3" }}>
                  {msg.is_read ? "✓ Read" : "● Unread"}
                </div>
              </div>
            ))}
          </div>
        )}

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
                width: "90%"
              }}
            >
              <h2 style={{ marginTop: 0 }}>✉️ Send Message</h2>

              <form onSubmit={(e) => { e.preventDefault(); handleSendNewMessage(); }} className="edit-form">
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    value={newMessage.recipientDepartment}
                    onChange={(e) =>
                      setNewMessage({ ...newMessage, recipientDepartment: e.target.value })
                    }
                    required
                  >
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
                    value={newMessage.subject}
                    onChange={(e) =>
                      setNewMessage({ ...newMessage, subject: e.target.value })
                    }
                    placeholder="Enter subject"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    value={newMessage.message}
                    onChange={(e) =>
                      setNewMessage({ ...newMessage, message: e.target.value })
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
                    {sending ? "Sending..." : "✉️ Send"}
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
