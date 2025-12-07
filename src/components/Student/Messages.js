import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./Messages.css";
import axios from "axios";

export default function Messages() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipient_department: "Library",
    subject: "",
    message: ""
  });

  const departments = [
    "Library",
    "Transport",
    "Laboratory",
    "Student Service",
    "Fee Department",
    "Coordination",
    "HOD"
  ];

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(apiUrl + "/api/conversations", {
        headers: { Authorization: "Bearer " + token }
      });

      if (response.data.success) {
        setConversations(response.data.data || []);
        setError("");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("❌ Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationThread = async (conversationId) => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(
        apiUrl + `/api/conversations/${conversationId}`,
        { headers: { Authorization: "Bearer " + token } }
      );

      if (response.data.success) {
        setThreadMessages(response.data.data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("❌ Failed to load conversation thread");
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(apiUrl + "/api/unread-count", {
        headers: { Authorization: "Bearer " + token }
      });

      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchConversationThread(conversation.conversation_id);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + `/api/messages/${selectedConversation.conversation_id}/reply`,
        { message: replyText.trim() },
        { headers: { Authorization: "Bearer " + token } }
      );

      if (response.data.success) {
        setReplyText("");
        fetchConversationThread(selectedConversation.conversation_id);
        fetchConversations();
        fetchUnreadCount();
      } else {
        setError("❌ Failed to send reply");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("❌ Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessage.subject.trim() || !newMessage.message.trim()) {
      setError("❌ Subject and message are required");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + "/api/send-message",
        newMessage,
        { headers: { Authorization: "Bearer " + token } }
      );

      if (response.data.success) {
        setNewMessage({
          recipient_department: "Library",
          subject: "",
          message: ""
        });
        setShowNewMessageForm(false);
        setError("");
        fetchConversations();
      } else {
        setError(response.data.message || "❌ Failed to send message");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("❌ Failed to send message");
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
  const displayDept = user?.department || "N/A";

  if (loading) {
    return (
      <div className="student-dashboard-page">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

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
          <button onClick={() => navigate("/student-dashboard")} className="sd-nav-btn">
            🏠 Dashboard
          </button>
          <button onClick={() => navigate("/student-clearance-request")} className="sd-nav-btn">
            📋 Submit Request
          </button>
          <button onClick={() => navigate("/student-clearance-status")} className="sd-nav-btn">
            ✅ Clearance Status
          </button>
          <button onClick={() => navigate("/student-messages")} className="sd-nav-btn active">
            💬 Messages {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button onClick={() => navigate("/student-edit-profile")} className="sd-nav-btn">
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
          <h1>Two-Way Messaging</h1>
          <p>Communicate with departments about your clearance</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="conversations-layout">
          {/* Conversations List */}
          <div className="conversations-sidebar">
            <button
              onClick={() => setShowNewMessageForm(true)}
              className="new-conversation-btn"
            >
              ➕ New Message
            </button>

            {conversations.length === 0 ? (
              <div className="no-conversations">
                <p>📭 No conversations yet</p>
              </div>
            ) : (
              <div className="conversations-list">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    className={`conversation-item ${
                      selectedConversation?.conversation_id === conv.conversation_id
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="conv-header">
                      <h4>{conv.recipient_department}</h4>
                      <small>{new Date(conv.createdAt).toLocaleDateString()}</small>
                    </div>
                    <p className="conv-subject">{conv.subject}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conversation Thread */}
          <div className="conversation-thread">
            {showNewMessageForm ? (
              <div className="new-message-form">
                <button
                  className="close-form-btn"
                  onClick={() => setShowNewMessageForm(false)}
                >
                  ✕
                </button>
                <h2>Send New Message to Department</h2>

                <div className="form-group">
                  <label>Department *</label>
                  <select
                    value={newMessage.recipient_department}
                    onChange={(e) =>
                      setNewMessage({ ...newMessage, recipient_department: e.target.value })
                    }
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
                    placeholder="Message subject"
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    value={newMessage.message}
                    onChange={(e) =>
                      setNewMessage({ ...newMessage, message: e.target.value })
                    }
                    placeholder="Type your message..."
                    rows="6"
                  />
                </div>

                <button
                  onClick={handleSendNewMessage}
                  disabled={sending}
                  className="send-message-btn"
                >
                  {sending ? "Sending..." : "📤 Send Message"}
                </button>
              </div>
            ) : selectedConversation ? (
              <>
                <div className="thread-header">
                  <h2>{selectedConversation.subject}</h2>
                  <p>with {selectedConversation.recipient_department}</p>
                </div>

                <div className="thread-messages">
                  {threadMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`thread-message ${
                        msg.sender_role === "student" ? "from-student" : "from-dept"
                      }`}
                    >
                      <div className="msg-sender">
                        <strong>
                          {msg.sender_role === "student"
                            ? "You"
                            : msg.sender_role.toUpperCase()}
                        </strong>
                        <small>
                          {new Date(msg.createdAt).toLocaleString()}
                        </small>
                      </div>
                      <div className="msg-content">{msg.message}</div>
                      {msg.is_read && (
                        <small className="msg-read">✓ Read</small>
                      )}
                    </div>
                  ))}
                </div>

                <div className="reply-area">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows="3"
                    className="reply-input"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                    className="reply-btn"
                  >
                    {sending ? "Sending..." : "📤 Send Reply"}
                  </button>
                </div>
              </>
            ) : (
              <div className="no-conversation-selected">
                <p>📨 Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
