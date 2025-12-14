import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./Messages.css";
import axios from "axios";

export default function Messages() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipientDepartment: "",
    subject: "",
    message: ""
  });

  // ====== FETCH MESSAGES ON MOUNT ======
  useEffect(() => {
    if (user) {
      fetchDepartments();
      fetchMessages();
      const interval = setInterval(fetchMessages, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ✅ FETCH DEPARTMENTS FROM BACKEND
  const fetchDepartments = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(apiUrl + "/api/departments");

      if (response.data.success) {
        console.log('✅ Departments fetched:', response.data.data);
        setDepartments(response.data.data || []);
        // Set first department as default
        if (response.data.data && response.data.data.length > 0) {
          setNewMessage(prev => ({
            ...prev,
            recipientDepartment: response.data.data[0]
          }));
        }
      } else {
        // Fallback to default departments
        const defaultDepts = [
          "Library",
          "Transport",
          "Laboratory",
          "Student Service",
          "Fee Department",
          "Coordination",
          "HOD"
        ];
        setDepartments(defaultDepts);
        setNewMessage(prev => ({ ...prev, recipientDepartment: defaultDepts[0] }));
      }
    } catch (err) {
      console.error("❌ Error fetching departments:", err);
      // Fallback to default departments
      const defaultDepts = [
        "Library",
        "Transport",
        "Laboratory",
        "Student Service",
        "Fee Department",
        "Coordination",
        "HOD"
      ];
      setDepartments(defaultDepts);
      setNewMessage(prev => ({ ...prev, recipientDepartment: defaultDepts[0] }));
    }
  };

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
        // Reset form with first department from departments array
        const defaultDept = departments.length > 0 ? departments[0] : "Library";
        setNewMessage({
          recipientDepartment: defaultDept,
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
          <div>
            <h1>💬 My Messages</h1>
            <p>Chat with departments about your clearance requests</p>
          </div>
          <button
            className="btn-new-message"
            onClick={() => setShowNewMessageForm(true)}
          >
            ✉️ Compose New Message
          </button>
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
            <p>Start a conversation with a department about your clearance</p>
            <button
              className="btn-new-message"
              onClick={() => setShowNewMessageForm(true)}
            >
              ✉️ Send First Message
            </button>
          </div>
        ) : (
          <div className="messages-container">
            <div className="messages-header">
              <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
              <span className="unread-count">
                {messages.filter(m => !m.is_read).length} unread
              </span>
            </div>
            
            <div className="messages-list">
              {messages.map((msg) => {
                const isSent = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg._id}
                    className={`message-card ${isSent ? 'sent' : 'received'} ${msg.is_read ? 'read' : 'unread'}`}
                  >
                    <div className="message-header">
                      <div className="message-sender">
                        <div className="sender-avatar">
                          {(msg.sender_name || msg.senderName)?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4>{msg.subject}</h4>
                          <span className="sender-info">
                            {isSent ? '📤 Sent to ' : '📥 From '} 
                            {msg.recipient_department || 'Department'}
                          </span>
                        </div>
                      </div>
                      <div className="message-meta">
                        <span className="time">
                          {new Date(msg.createdAt).toLocaleDateString([], { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className={`status-badge ${msg.is_read ? 'read' : 'unread'}`}>
                          {msg.is_read ? '✓ Read' : '● Unread'}
                        </span>
                      </div>
                    </div>

                    <div className="message-body">
                      <p>{msg.message}</p>
                    </div>

                    {msg.remarks && (
                      <div className="message-remarks">
                        <strong>💬 Remarks:</strong> {msg.remarks}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showNewMessageForm && (
          <div className="modal-overlay" onClick={() => setShowNewMessageForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>✉️ Compose Message</h2>
                <button 
                  className="modal-close" 
                  onClick={() => setShowNewMessageForm(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSendNewMessage(); }}>
                <div className="form-group">
                  <label htmlFor="dept">📍 Select Department *</label>
                  <select
                    id="dept"
                    value={newMessage.recipientDepartment}
                    onChange={(e) =>
                      setNewMessage({ ...newMessage, recipientDepartment: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Choose a department --</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">📝 Subject *</label>
                  <input
                    id="subject"
                    type="text"
                    value={newMessage.subject}
                    onChange={(e) =>
                      setNewMessage({ ...newMessage, subject: e.target.value })
                    }
                    placeholder="Brief subject of your message"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">💬 Message *</label>
                  <textarea
                    id="message"
                    value={newMessage.message}
                    onChange={(e) =>
                      setNewMessage({ ...newMessage, message: e.target.value })
                    }
                    placeholder="Type your message here..."
                    required
                    rows="6"
                  />
                  <span className="char-count">{newMessage.message.length} characters</span>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowNewMessageForm(false)}
                  >
                    ✕ Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-send"
                    disabled={sending}
                  >
                    {sending ? '⟳ Sending...' : '✉️ Send Message'}
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
