import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "./MessagePage.css";

export default function FeeMessagePage() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      // Get all messages for department
      const response = await axios.get(apiUrl + "/api/conversations", {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        const convos = response.data.data || [];
        // Filter for Fee Department conversations
        const feeConvos = convos.filter(c => c.recipient_department === "Fee Department");
        setConversations(feeConvos);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  // Fetch conversation thread
  const fetchConversationThread = async (conversationId) => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(
        apiUrl + `/api/conversations/${conversationId}`,
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // Handle select conversation
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchConversationThread(conversation.conversation_id);
  };

  // Handle send reply
  const handleSendReply = async () => {
    if (!replyText.trim()) {
      setError("❌ Please enter a message");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + `/api/messages/${selectedConversation.conversation_id}/reply`,
        { message: replyText.trim() },
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
        fetchConversationThread(selectedConversation.conversation_id);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Send reply error:", err);
      setError("❌ Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchConversations();
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="fee-message-page">
      {/* ---------- Sidebar ---------- */}
      <aside className="sidebar">
        <h2>💰 Fee Department</h2>
        <nav>
          <button onClick={() => navigate("/fee-dashboard")}>🏠 Dashboard</button>
          <button className="active">💬 Messages</button>
          <button onClick={() => navigate("/edit-profile")}>📝 Edit Profile</button>
          <button onClick={handleLogout}>🚪 Logout</button>
        </nav>
      </aside>

      {/* ---------- Main Content ---------- */}
      <main className="message-container">
        <div className="conversations-panel">
          <h3>Conversations</h3>
          {loading ? (
            <p>Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="no-conversations">No conversations yet</p>
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
                  <h4>{conv.sender_name}</h4>
                  <p className="conv-subject">{conv.subject}</p>
                  <small>{new Date(conv.createdAt).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages Panel */}
        <div className="messages-panel">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {selectedConversation ? (
            <>
              <div className="message-header">
                <h2>{selectedConversation.subject}</h2>
                <p>From: {selectedConversation.sender_name}</p>
              </div>

              <div className="messages-list">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`message ${
                      msg.sender_role === "feedepartment" ? "sent" : "received"
                    }`}
                  >
                    <div className="message-header-small">
                      <strong>{msg.sender_name}</strong>
                      <span className="time">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p>{msg.message}</p>
                  </div>
                ))}
              </div>

              <div className="reply-box">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows="3"
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="send-btn"
                >
                  {sending ? "Sending..." : "📤 Send Reply"}
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation">
              <p>Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
        </nav>
        <footer>© 2025 Fee Portal</footer>
      </aside>

      {/* ---------- Main Content ---------- */}
      <main className="main-content">
        <div className="msg-card">
          <h1>💬 Message Student</h1>
          <p>Send fee clearance updates or notices to students</p>

          {/* Chat Input */}
          <div className="msg-form">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button onClick={sendMessage}>Send Message</button>
          </div>

          {/* Message History */}
          <div className="history-box">
            <h3>Message History</h3>
            {messages.length === 0 ? (
              <p className="no-history">No previous messages.</p>
            ) : (
              messages.map((msg, i) => (
                <div className="history-item" key={i}>
                  <div className="h-top">
                    <span><strong>From:</strong> {msg.sender}</span>
                    <small>{msg.date}</small>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
