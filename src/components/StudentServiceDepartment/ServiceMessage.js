import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "../Student/EditProfile.css";
import "../DepartmentMessageTabs.css";

export default function ServiceMessage() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("received");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [adminBroadcasts, setAdminBroadcasts] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  
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

  const handleReply = async (messageId) => {
    if (!replyText.trim()) {
      setError("❌ Reply message cannot be empty");
      return;
    }

    setReplyLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + `/api/messages/reply/${messageId}`,
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
        setReplyingTo(null);
        setReplyText("");
        setTimeout(() => setSuccess(""), 2000);
        fetchReceivedMessages();
      } else {
        setError(response.data.message || "❌ Failed to send reply");
      }
    } catch (err) {
      console.error("❌ Error sending reply:", err);
      const errorMsg = err.response?.data?.message || err.message || "❌ Failed to send reply";
      setError(errorMsg);
    } finally {
      setReplyLoading(false);
    }
  };

  const fetchReceivedMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(
        apiUrl + "/api/my-messages",
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        const studentMessages = response.data.data.filter(msg => msg.sender_role === 'student');
        setReceivedMessages(studentMessages);
        setError("");
      } else {
        setError(response.data.message || "❌ Failed to load messages");
      }
    } catch (err) {
      console.error("❌ Error fetching received messages:", err);
      setError(err.response?.data?.message || "❌ Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchSentMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(
        apiUrl + "/api/staff/sent-messages",
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSentMessages(response.data.data || []);
        setError("");
      } else {
        setError(response.data.message || "❌ Failed to load sent messages");
      }
    } catch (err) {
      console.error("❌ Error fetching sent messages:", err);
      setError(err.response?.data?.message || "❌ Failed to load sent messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminBroadcasts = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(
        apiUrl + "/api/my-messages",
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        const broadcasts = response.data.data.filter(msg => msg.message_type === 'notification');
        setAdminBroadcasts(broadcasts);
        setError("");
      } else {
        setError(response.data.message || "❌ Failed to load broadcasts");
      }
    } catch (err) {
      console.error("❌ Error fetching broadcasts:", err);
      setError(err.response?.data?.message || "❌ Failed to load broadcasts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "received") {
      fetchReceivedMessages();
    } else if (activeTab === "history") {
      fetchSentMessages();
    } else if (activeTab === "broadcasts") {
      fetchAdminBroadcasts();
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

  const displayName = user?.full_name || "Student Service Staff";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "Student Service";

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
            onClick={() => navigate("/student-service-dashboard")}
          >
            📋 Dashboard
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/student-service-approved")}
          >
            ✅ Approved
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/student-service-rejected")}
          >
            ❌ Rejected
          </button>
          <button
            className="sd-nav-btn active"
            onClick={() => navigate("/student-service-messages")}
          >
            💬 Messages
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/student-service-edit-profile")}
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
          <h1>💬 Messages</h1>
          <p>Send notifications and view message history</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "2px solid #e0e0e0", paddingBottom: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveTab("received")}
            style={{
              padding: "10px 20px",
              background: activeTab === "received" ? "#FF9800" : "#f0f0f0",
              color: activeTab === "received" ? "white" : "#333",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px"
            }}
          >
            📥 Received ({receivedMessages.length})
          </button>
          <button
            onClick={() => { setActiveTab("send"); setError(""); }}
            style={{
              padding: "10px 20px",
              background: activeTab === "send" ? "#4CAF50" : "#f0f0f0",
              color: activeTab === "send" ? "white" : "#333",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px"
            }}
          >
            📤 Send Message
          </button>
          <button
            onClick={() => setActiveTab("history")}
            style={{
              padding: "10px 20px",
              background: activeTab === "history" ? "#2196F3" : "#f0f0f0",
              color: activeTab === "history" ? "white" : "#333",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px"
            }}
          >
            📋 Sent ({sentMessages.length})
          </button>
          <button
            onClick={() => setActiveTab("broadcasts")}
            style={{
              padding: "10px 20px",
              background: activeTab === "broadcasts" ? "#9C27B0" : "#f0f0f0",
              color: activeTab === "broadcasts" ? "white" : "#333",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px"
            }}
          >
            📢 Admin Broadcasts ({adminBroadcasts.length})
          </button>
        </div>

        {activeTab === "received" && (
          <div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "18px" }}>⏳ Loading messages...</div>
            ) : receivedMessages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#999", fontSize: "16px" }}>📭 No messages from students yet</div>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {receivedMessages.map((msg) => (
                  <div key={msg._id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "15px", backgroundColor: msg.is_read ? "#f9f9f9" : "#e3f2fd", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>📬 {msg.subject}</h3>
                        <p style={{ margin: "0", color: "#666", fontSize: "14px" }}><strong>From:</strong> {msg.sender_name} ({msg.sender_sapid})</p>
                      </div>
                      <span style={{ background: msg.message_type === "success" ? "#4CAF50" : msg.message_type === "error" ? "#f44336" : msg.message_type === "warning" ? "#ff9800" : "#2196F3", color: "white", padding: "5px 10px", borderRadius: "5px", fontSize: "12px", fontWeight: "600" }}>
                        {msg.message_type === "success" ? "✅ Approved" : msg.message_type === "error" ? "❌ Rejection" : msg.message_type === "warning" ? "⚠️ Warning" : "ℹ️ Question"}
                      </span>
                    </div>
                    <p style={{ margin: "10px 0", color: "#555", lineHeight: "1.6" }}>{msg.message}</p>
                    <p style={{ margin: "10px 0 0 0", color: "#999", fontSize: "13px" }}>📅 {new Date(msg.createdAt).toLocaleString()}</p>
                    <div style={{ marginTop: "10px" }}>
                      <button type="button" onClick={() => setReplyingTo(replyingTo === msg._id ? null : msg._id)} style={{ background: "#2196F3", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.3s" }} onMouseOver={(e) => e.target.style.background = "#1976D2"} onMouseOut={(e) => e.target.style.background = "#2196F3"}>💬 {replyingTo === msg._id ? "Cancel" : "Reply"}</button>
                    </div>
                    {replyingTo === msg._id && (
                      <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "5px", borderLeft: "4px solid #2196F3" }}>
                        <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply here..." style={{ width: "100%", height: "100px", padding: "10px", borderRadius: "5px", border: "1px solid #ddd", fontFamily: "Arial, sans-serif", fontSize: "14px", boxSizing: "border-box" }} />
                        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                          <button type="button" onClick={() => handleReply(msg._id)} disabled={replyLoading} style={{ background: "#4CAF50", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: replyLoading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600", opacity: replyLoading ? 0.6 : 1 }}>{replyLoading ? "Sending..." : "✅ Send Reply"}</button>
                          <button type="button" onClick={() => { setReplyingTo(null); setReplyText(""); }} style={{ background: "#f44336", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>❌ Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "send" && (
          <div style={{ width: "100%", padding: "0" }}>
            <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "40px", borderRadius: "15px 15px 0 0", marginBottom: "0", color: "white", boxShadow: "0 10px 30px rgba(102, 126, 234, 0.25)" }}>
              <h2 style={{ margin: "0 0 12px 0", fontSize: "28px", fontWeight: "700", letterSpacing: "-0.5px" }}>📤 Compose New Message</h2>
              <p style={{ margin: "0", fontSize: "15px", opacity: "0.95", fontWeight: "500" }}>Send important notifications to students with a professional message</p>
            </div>
            <form onSubmit={handleSubmit} style={{ background: "white", padding: "45px", borderRadius: "0 0 15px 15px", boxShadow: "0 10px 30px rgba(102, 126, 234, 0.15)", border: "1px solid #e8e8f0", borderTop: "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
                <div className="form-group">
                  <label style={{ display: "block", fontWeight: "700", marginBottom: "10px", color: "#2c3e50", fontSize: "15px", letterSpacing: "0.3px" }}>👤 Student SAP ID <span style={{ color: "#e74c3c", fontWeight: "800" }}>*</span></label>
                  <input type="text" name="recipient_sapid" value={formData.recipient_sapid} onChange={handleChange} placeholder="e.g., 03-001234" required style={{ width: "100%", padding: "14px 16px", border: "2px solid #e8e8f0", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", transition: "all 0.3s ease", boxSizing: "border-box", outline: "none", backgroundColor: "#f8f9fc", color: "#333" }} onFocus={(e) => { e.target.style.borderColor = "#667eea"; e.target.style.backgroundColor = "white"; e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.15)"; }} onBlur={(e) => { e.target.style.borderColor = "#e8e8f0"; e.target.style.backgroundColor = "#f8f9fc"; e.target.style.boxShadow = "none"; }} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", fontWeight: "700", marginBottom: "10px", color: "#2c3e50", fontSize: "15px", letterSpacing: "0.3px" }}>🏷️ Message Type</label>
                  <select name="message_type" value={formData.message_type} onChange={handleChange} style={{ width: "100%", padding: "14px 16px", border: "2px solid #e8e8f0", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", transition: "all 0.3s ease", boxSizing: "border-box", outline: "none", cursor: "pointer", backgroundColor: "#f8f9fc", color: "#333" }} onFocus={(e) => { e.target.style.borderColor = "#667eea"; e.target.style.backgroundColor = "white"; e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.15)"; }} onBlur={(e) => { e.target.style.borderColor = "#e8e8f0"; e.target.style.backgroundColor = "#f8f9fc"; e.target.style.boxShadow = "none"; }}>
                    <option value="info">ℹ️ Information</option>
                    <option value="success">✅ Approved</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="error">❌ Rejection</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: "30px" }}>
                <label style={{ display: "block", fontWeight: "700", marginBottom: "10px", color: "#2c3e50", fontSize: "15px", letterSpacing: "0.3px" }}>📋 Subject <span style={{ color: "#e74c3c", fontWeight: "800" }}>*</span></label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="e.g., Late Fee Reminder, Document Verification Required" required style={{ width: "100%", padding: "14px 16px", border: "2px solid #e8e8f0", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", transition: "all 0.3s ease", boxSizing: "border-box", outline: "none", backgroundColor: "#f8f9fc", color: "#333" }} onFocus={(e) => { e.target.style.borderColor = "#667eea"; e.target.style.backgroundColor = "white"; e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.15)"; }} onBlur={(e) => { e.target.style.borderColor = "#e8e8f0"; e.target.style.backgroundColor = "#f8f9fc"; e.target.style.boxShadow = "none"; }} />
              </div>
              <div className="form-group" style={{ marginBottom: "35px" }}>
                <label style={{ display: "block", fontWeight: "700", marginBottom: "10px", color: "#2c3e50", fontSize: "15px", letterSpacing: "0.3px" }}>💬 Message Content <span style={{ color: "#e74c3c", fontWeight: "800" }}>*</span></label>
                <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Type your detailed message here..." rows="6" required style={{ width: "100%", padding: "16px", border: "2px solid #e8e8f0", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", transition: "all 0.3s ease", boxSizing: "border-box", outline: "none", resize: "vertical", lineHeight: "1.7", backgroundColor: "#f8f9fc", color: "#333" }} onFocus={(e) => { e.target.style.borderColor = "#667eea"; e.target.style.backgroundColor = "white"; e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.15)"; }} onBlur={(e) => { e.target.style.borderColor = "#e8e8f0"; e.target.style.backgroundColor = "#f8f9fc"; e.target.style.boxShadow = "none"; }} />
              </div>
              <div style={{ display: "flex", gap: "15px", justifyContent: "flex-end", paddingTop: "20px", borderTop: "2px solid #e8e8f0" }}>
                <button type="reset" onClick={() => setFormData({ recipient_sapid: "", subject: "", message: "", message_type: "info" })} style={{ padding: "13px 32px", background: "#f0f0f0", color: "#555", border: "2px solid #e0e0e0", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "all 0.3s ease", letterSpacing: "0.3px" }} onMouseOver={(e) => { e.target.style.background = "#e0e0e0"; e.target.style.borderColor = "#999"; e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }} onMouseOut={(e) => { e.target.style.background = "#f0f0f0"; e.target.style.borderColor = "#e0e0e0"; e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}>🔄 Clear Form</button>
                <button type="submit" style={{ padding: "13px 45px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 6px 20px rgba(102, 126, 234, 0.35)", letterSpacing: "0.3px" }} onMouseOver={(e) => { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 8px 28px rgba(102, 126, 234, 0.45)"; }} onMouseOut={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.35)"; }}>✈️ Send Message</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            {loading ? (<div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "18px" }}>⏳ Loading sent messages...</div>) : sentMessages.length === 0 ? (<div style={{ textAlign: "center", padding: "40px", color: "#999", fontSize: "16px" }}>📭 No sent messages yet</div>) : (<div style={{ display: "grid", gap: "15px" }}>{sentMessages.map((msg) => (<div key={msg._id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "15px", backgroundColor: "#f9f9f9", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}><div><h3 style={{ margin: "0 0 5px 0", color: "#333" }}>📨 {msg.subject}</h3><p style={{ margin: "0", color: "#666", fontSize: "14px" }}><strong>To:</strong> {msg.recipient_sapid || "N/A"}</p></div><span style={{ background: msg.message_type === "success" ? "#4CAF50" : msg.message_type === "error" ? "#f44336" : msg.message_type === "warning" ? "#ff9800" : "#2196F3", color: "white", padding: "5px 10px", borderRadius: "5px", fontSize: "12px", fontWeight: "600" }}>{msg.message_type === "success" ? "✅ Approved" : msg.message_type === "error" ? "❌ Rejection" : msg.message_type === "warning" ? "⚠️ Warning" : "ℹ️ Info"}</span></div><p style={{ margin: "10px 0", color: "#555", lineHeight: "1.6" }}>{msg.message}</p><p style={{ margin: "10px 0 0 0", color: "#999", fontSize: "13px" }}>📅 {new Date(msg.createdAt).toLocaleString()}</p></div>))}</div>)}
          </div>
        )}

        {activeTab === "broadcasts" && (
          <div>
            {loading ? (<div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "18px" }}>⏳ Loading admin broadcasts...</div>) : adminBroadcasts.length === 0 ? (<div style={{ textAlign: "center", padding: "40px", color: "#999", fontSize: "16px" }}>📭 No admin broadcasts received yet</div>) : (<div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>{adminBroadcasts.map((msg) => (<div key={msg._id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "15px", backgroundColor: "#f5f5f5", borderLeft: "5px solid #9C27B0" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><h3 style={{ margin: "0 0 8px 0", color: "#333" }}>🔔 {msg.subject}</h3><span style={{ fontSize: "12px", color: "#999" }}>{new Date(msg.createdAt).toLocaleString()}</span></div><p style={{ margin: "8px 0", color: "#666", fontSize: "13px" }}><strong>From:</strong> {msg.senderName || "System Admin"}</p><p style={{ margin: "10px 0", color: "#555", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{msg.message}</p>{msg.priority && (<span style={{ display: "inline-block", background: msg.priority === "urgent" ? "#f44336" : msg.priority === "high" ? "#ff9800" : msg.priority === "normal" ? "#2196F3" : "#4CAF50", color: "white", padding: "5px 10px", borderRadius: "5px", fontSize: "12px", fontWeight: "600", marginTop: "10px" }}>{msg.priority === "urgent" ? "🔥 Urgent" : msg.priority === "high" ? "⚠️ High" : msg.priority === "normal" ? "📌 Normal" : "📍 Low"}</span>)}<div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #ddd" }}>{!replyingTo || replyingTo !== msg._id ? (<button type="button" onClick={() => setReplyingTo(msg._id)} style={{ background: "#9C27B0", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.3s ease" }} onMouseOver={(e) => { e.target.style.background = "#7b1fa2"; e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 4px 12px rgba(156, 39, 176, 0.3)"; }} onMouseOut={(e) => { e.target.style.background = "#9C27B0"; e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}>💬 Reply</button>) : (<div style={{ backgroundColor: "#e1bee7", padding: "15px", borderRadius: "6px" }}><textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your reply..." rows="4" disabled={replyLoading} style={{ width: "100%", padding: "10px", border: "1px solid #ce93d8", borderRadius: "4px", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", outline: "none" }} /><div style={{ display: "flex", gap: "10px", marginTop: "10px" }}><button type="button" onClick={() => handleReply(msg._id)} disabled={replyLoading} style={{ background: "#4CAF50", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: replyLoading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600", opacity: replyLoading ? 0.6 : 1, transition: "all 0.3s ease" }} onMouseOver={(e) => !replyLoading && (e.target.style.background = "#45a049")} onMouseOut={(e) => (e.target.style.background = "#4CAF50")}>{replyLoading ? "Sending..." : "✉️ Send Reply"}</button><button type="button" onClick={() => { setReplyingTo(null); setReplyText(""); }} disabled={replyLoading} style={{ background: "#f44336", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600", opacity: replyLoading ? 0.6 : 1, transition: "all 0.3s ease" }} onMouseOver={(e) => !replyLoading && (e.target.style.background = "#da190b")} onMouseOut={(e) => (e.target.style.background = "#f44336")}>✕ Cancel</button></div></div>)}</div></div>))}</div>)}
          </div>
        )}
      </main>
    </div>
  );
}
