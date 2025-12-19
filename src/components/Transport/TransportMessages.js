import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "../Student/EditProfile.css";

export default function TransportMessages() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("received"); // "received", "send", "history", or "broadcasts"
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [adminBroadcasts, setAdminBroadcasts] = useState([]);
  
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

  // ✅ FETCH RECEIVED MESSAGES FROM STUDENTS
  const fetchReceivedMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      console.log("📨 Fetching received messages from:", apiUrl + "/api/my-messages");

      const response = await axios.get(
        apiUrl + "/api/my-messages",
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("✅ Received messages response:", response.data);

      if (response.data.success) {
        // Filter to only show messages FROM students (not sent by staff)
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
      setError(err.response?.data?.message || "❌ Failed to load sent messages");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH ADMIN BROADCASTS
  const fetchAdminBroadcasts = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      console.log("📢 Fetching admin broadcasts from:", apiUrl + "/api/admin/messages");

      const response = await axios.get(
        apiUrl + "/api/admin/messages",
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("✅ Admin broadcasts response:", response.data);

      if (response.data.success) {
        // Filter to only show broadcast messages
        const broadcasts = response.data.data.filter(msg => msg.message_type === 'broadcast' || msg.recipient_department === 'all');
        setAdminBroadcasts(broadcasts || []);
        setError("");
      } else {
        setError(response.data.message || "❌ Failed to load broadcasts");
      }
    } catch (err) {
      console.error("❌ Error fetching admin broadcasts:", err);
      // Don't show error if endpoint doesn't exist, just set empty broadcasts
      setAdminBroadcasts([]);
      setError("");
    } finally {
      setLoading(false);
    }
  };

  // ✅ USE EFFECT TO LOAD DATA WHEN TAB CHANGES
  useEffect(() => {
    if (activeTab === "received") {
      fetchReceivedMessages();
    } else if (activeTab === "history") {
      fetchSentMessages();
    } else if (activeTab === "broadcasts") {
      fetchAdminBroadcasts();
    }
  }, [activeTab]);

  // ✅ SUBMIT SEND MESSAGE
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
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(response.data.message || "❌ Failed to send message");
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

  const displayName = user?.full_name || "Transport Staff";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "Transport";

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
            onClick={() => navigate("/transport-dashboard")}
          >
            📋 Dashboard
          </button>
          <button
            className="sd-nav-btn active"
            onClick={() => navigate("/transport-messages")}
          >
            💬 Messages
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/transport-edit-profile")}
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

        {/* ✅ TAB NAVIGATION */}
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
            onClick={() => {
              setActiveTab("send");
              setError("");
            }}
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

        {/* ✅ RECEIVED MESSAGES TAB */}
        {activeTab === "received" && (
          <div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "18px" }}>
                ⏳ Loading messages...
              </div>
            ) : receivedMessages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#999", fontSize: "16px" }}>
                📭 No messages from students yet
              </div>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {receivedMessages.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      backgroundColor: msg.is_read ? "#f9f9f9" : "#e3f2fd",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>
                          📬 {msg.subject}
                        </h3>
                        <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                          <strong>From:</strong> {msg.sender_name} ({msg.sender_sapid})
                        </p>
                      </div>
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
                        {msg.message_type === "success" ? "✅ Approved" : msg.message_type === "error" ? "❌ Rejection" : msg.message_type === "warning" ? "⚠️ Warning" : "ℹ️ Question"}
                      </span>
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

        {/* ✅ SEND MESSAGE TAB */}
        {activeTab === "send" && (
          <div style={{ maxWidth: "600px", marginBottom: "40px" }}>
            <div style={{ 
              background: "white", 
              borderRadius: "10px", 
              padding: "30px", 
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "1px solid #e0e0e0"
            }}>
              <h2 style={{ marginTop: "0", marginBottom: "20px", color: "#333", fontSize: "20px", fontWeight: "600" }}>
                ✉️ Compose New Message
              </h2>
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
                Send a message to a student in your department
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label style={{ fontWeight: "600", color: "#333", marginBottom: "8px", display: "block" }}>
                    Student SAP ID *
                  </label>
                  <input
                    type="text"
                    name="recipient_sapid"
                    value={formData.recipient_sapid}
                    onChange={handleChange}
                    placeholder="Enter student's SAP ID (e.g., RIU12345)"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      transition: "border-color 0.3s, box-shadow 0.3s"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4CAF50";
                      e.target.style.boxShadow = "0 0 0 3px rgba(76, 175, 80, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d0d0d0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: "600", color: "#333", marginBottom: "8px", display: "block" }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Message subject line"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      transition: "border-color 0.3s, box-shadow 0.3s"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4CAF50";
                      e.target.style.boxShadow = "0 0 0 3px rgba(76, 175, 80, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d0d0d0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                  <div className="form-group">
                    <label style={{ fontWeight: "600", color: "#333", marginBottom: "8px", display: "block" }}>
                      Message Type
                    </label>
                    <select
                      name="message_type"
                      value={formData.message_type}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "12px 15px",
                        border: "1px solid #d0d0d0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        background: "white",
                        cursor: "pointer",
                        transition: "border-color 0.3s, box-shadow 0.3s"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#4CAF50";
                        e.target.style.boxShadow = "0 0 0 3px rgba(76, 175, 80, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d0d0d0";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <option value="info">ℹ️ Information</option>
                      <option value="success">✅ Approved</option>
                      <option value="warning">⚠️ Warning</option>
                      <option value="error">❌ Rejection</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: "600", color: "#333", marginBottom: "8px", display: "block" }}>
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here... (Be clear and professional)"
                    rows="7"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      resize: "vertical",
                      transition: "border-color 0.3s, box-shadow 0.3s"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4CAF50";
                      e.target.style.boxShadow = "0 0 0 3px rgba(76, 175, 80, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d0d0d0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "14px 20px",
                      background: loading ? "#ccc" : "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "background 0.3s, transform 0.1s",
                      opacity: loading ? "0.7" : "1"
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.background = "#45a049")}
                    onMouseLeave={(e) => !loading && (e.target.style.background = "#4CAF50")}
                  >
                    {loading ? "⏳ Sending..." : "📤 Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </div>
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
                          📤 {msg.subject}
                        </h3>
                        <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                          <strong>To:</strong> {msg.recipient_name} ({msg.recipient_sapid})
                        </p>
                      </div>
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
                        {msg.message_type === "success" ? "✅ Success" : msg.message_type === "error" ? "❌ Error" : msg.message_type === "warning" ? "⚠️ Warning" : "ℹ️ Info"}
                      </span>
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

        {/* ✅ ADMIN BROADCASTS TAB */}
        {activeTab === "broadcasts" && (
          <div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "18px" }}>
                ⏳ Loading broadcasts...
              </div>
            ) : adminBroadcasts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#999", fontSize: "16px" }}>
                📭 No admin broadcasts yet
              </div>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {adminBroadcasts.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      backgroundColor: "#f3e5f5",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>
                          📢 {msg.subject}
                        </h3>
                        <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                          <strong>From Admin:</strong> System Broadcast
                        </p>
                      </div>
                      <span
                        style={{
                          background: "#9C27B0",
                          color: "white",
                          padding: "5px 10px",
                          borderRadius: "5px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        📢 Broadcast
                      </span>
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
