import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "./MessagePage.css";

export default function FeeMessagePage() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
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
      } else {
        setError(response.data.message || "Failed to load messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      setError("Please enter a message");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + "/api/send",
        {
          recipientDepartment: "Student Service",
          subject: "Reply to Message",
          message: replyText.trim()
        },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Reply sent successfully!");
        setReplyText("");
        await fetchMessages();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "Failed to send reply");
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      setError(err.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Fee Department";
  const displaySap = user?.sap || "N/A";

  return (
    <div className="student-dashboard-page">
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">{displaySap} • Fee Department</p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button onClick={() => navigate("/fee-dashboard")} className="sd-nav-btn">
            🏠 Dashboard
          </button>
          <button onClick={() => navigate("/fee-messages")} className="sd-nav-btn active">
            💬 Messages
          </button>
          <button onClick={() => navigate("/fee-edit-profile")} className="sd-nav-btn">
            📝 Edit Profile
          </button>
          <button onClick={handleLogout} className="sd-nav-btn logout">
            🚪 Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      <main className="sd-main">
        <header className="sd-header">
          <div>
            <h1>💬 Messages</h1>
            <p>Communicate with students about fee clearance</p>
          </div>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>⏳ Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>No messages yet</h2>
            <p>Messages from students will appear here</p>
          </div>
        ) : (
          <div className="messages-container">
            <div className="messages-header">
              <span>{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
              <span className="unread-count">
                {messages.filter(m => !m.is_read).length} unread
              </span>
            </div>

            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`message-card ${msg.is_read ? "read" : "unread"}`}
                >
                  <div className="message-header">
                    <div className="message-sender">
                      <div className="sender-avatar">
                        {(msg.sender_name || "S").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4>{msg.subject}</h4>
                        <span className="sender-info">
                          From {msg.sender_name || "Student"}
                        </span>
                      </div>
                    </div>
                    <div className="message-meta">
                      <span className="time">
                        {new Date(msg.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      <span className={`status-badge ${msg.is_read ? "read" : "unread"}`}>
                        {msg.is_read ? "✓ Read" : "● Unread"}
                      </span>
                    </div>
                  </div>

                  <div className="message-body">
                    <p>{msg.message}</p>
                  </div>

                  {msg.remarks && (
                    <div className="message-remarks">
                      <strong>💬 Your Reply:</strong> {msg.remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="reply-box">
              <h3>✉️ Send Reply to Student</h3>
              <div className="form-group">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message here..."
                  rows="5"
                  disabled={sending}
                />
                <span className="char-count">{replyText.length} characters</span>
              </div>
              <button
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
                className="send-btn"
              >
                {sending ? "⟳ Sending..." : "📤 Send Reply"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
