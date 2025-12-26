import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "./AdminDashboard.css";

export default function AdminMessages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuthContext();
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const axiosConfig = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

  const messageType = searchParams.get("type") || "department";
  const deptParam = searchParams.get("dept");

  const [formData, setFormData] = useState({
    messageType: messageType,
    targetType: deptParam ? "specific" : "all", // all, specific, or student
    department: deptParam || "",
    studentSapId: "",
    roleTarget: "", // For broadcasting to specific role (library, coordination, etc.)
    subject: "",
    message: "",
    priority: "normal"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMessageLog, setShowMessageLog] = useState(false);
  const [messageLog, setMessageLog] = useState([]);
  const [messageFilter, setMessageFilter] = useState("all"); // all, sent, received
  const [selectedMessage, setSelectedMessage] = useState(null); // For detailed view
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const departments = [
    "Library",
    "Transport",
    "Laboratory",
    "Fee Department",
    "Coordination",
    "Student Services"
  ];

  const departmentRoles = [
    { label: "📚 Library", value: "library" },
    { label: "🚌 Transport", value: "transport" },
    { label: "🔬 Laboratory", value: "laboratory" },
    { label: "💰 Fee Department", value: "feedepartment" },
    { label: "📋 Coordination", value: "coordination" },
    { label: "👥 Student Services", value: "studentservice" }
  ];

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

    // Validation
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError("Subject and message are required");
      return;
    }

    if (formData.messageType === "student" && !formData.studentSapId.trim()) {
      setError("Student SAP ID is required");
      return;
    }

    if (formData.messageType === "department" && !formData.department && formData.targetType === "specific") {
      setError("Please select a department");
      return;
    }

    if (formData.messageType === "role" && !formData.roleTarget) {
      setError("Please select a role to broadcast to");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        messageType: formData.messageType,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        priority: formData.priority
      };

      if (formData.messageType === "department") {
        payload.targetType = formData.targetType;
        if (formData.targetType === "specific") {
          payload.department = formData.department;
        }
      } else if (formData.messageType === "student") {
        payload.studentSapId = formData.studentSapId.trim();
      } else if (formData.messageType === "role") {
        payload.roleTarget = formData.roleTarget;
      }

      const response = await axios.post(
        `${apiUrl}/api/admin/send-message`,
        payload,
        axiosConfig
      );

      if (response.data.success) {
        setSuccess(response.data.message || "✅ Message sent successfully!");
        setFormData({
          messageType: formData.messageType,
          targetType: deptParam ? "specific" : "all",
          department: deptParam || "",
          studentSapId: "",
          roleTarget: "",
          subject: "",
          message: "",
          priority: "normal"
        });
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  // Fetch message log
  const fetchMessageLog = async () => {
    try {
      const response = await axios.get(apiUrl + "/api/admin/message-log", axiosConfig);
      console.log('📋 Message log response:', response.data);
      if (response.data.success) {
        setMessageLog(response.data.data || []);
        setShowMessageLog(true);
        setError("");
      } else {
        const errorMsg = response.data.message || "Failed to load message log";
        console.error('❌ Server response error:', errorMsg);
        setError("❌ " + errorMsg);
      }
    } catch (err) {
      console.error("❌ Error fetching message log:", err);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error data:', err.response?.data);
      
      if (err.response?.status === 404) {
        setError("❌ Message log endpoint not found. Make sure the backend is updated.");
      } else if (err.response?.status === 401) {
        setError("❌ Authentication failed. Please login again.");
      } else if (err.response?.data?.message) {
        setError("❌ " + err.response.data.message);
      } else {
        setError("❌ Failed to load message log. Please try again.");
      }
    }
  };

  // Handle Reply to Message
  const handleReply = async () => {
    if (!replyText.trim()) {
      setError("❌ Reply message cannot be empty");
      return;
    }

    setReplyLoading(true);
    try {
      const response = await axios.post(
        apiUrl + `/api/messages/reply/${selectedMessage._id}`,
        { message: replyText.trim() },
        axiosConfig
      );

      if (response.data.success) {
        setSuccess("✅ Reply sent successfully!");
        setReplyText("");
        setTimeout(() => {
          setSuccess("");
          setSelectedMessage(null);
          fetchMessageLog();
        }, 2000);
      } else {
        setError("❌ Failed to send reply");
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      setError(err.response?.data?.message || "❌ Failed to send reply");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Admin";

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="logo-icon">👨‍💼</div>
          <h1>Admin Panel</h1>
        </div>

        <div className="admin-profile">
          <div className="admin-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="admin-name">{displayName}</h3>
            <p className="admin-role">System Administrator</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-dashboard")}
          >
            📊 Dashboard
          </button>
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-users")}
          >
            👥 User Management
          </button>
          <button className="admin-nav-btn active">
            💬 Messages
          </button>
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-edit-profile")}
          >
            📝 Edit Profile
          </button>
        </nav>

        <button className="admin-nav-btn logout" onClick={handleLogout}>
          🚪 Logout
        </button>

        <footer className="admin-footer">© 2025 Riphah University</footer>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-content">
            <h1>📨 Send Messages</h1>
            <p>Communicate with departments and students from the admin panel</p>
          </div>
          <button 
            className="btn-view-messages"
            onClick={fetchMessageLog}
          >
            📬 View Messages
          </button>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="admin-message-form" onSubmit={handleSubmit}>
          {/* Message Type Selection */}
          <section className="form-section">
            <h3>📧 Message Type</h3>
            <div className="message-type-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="messageType"
                  value="department"
                  checked={formData.messageType === "department"}
                  onChange={handleChange}
                />
                <span>📌 Send to Department (Reminder)</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="messageType"
                  value="role"
                  checked={formData.messageType === "role"}
                  onChange={handleChange}
                />
                <span>📢 Broadcast to Staff Role</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="messageType"
                  value="student"
                  checked={formData.messageType === "student"}
                  onChange={handleChange}
                />
                <span>👨‍🎓 Send to Student by SAP ID</span>
              </label>
            </div>
          </section>

          {/* Department Selection */}
          {formData.messageType === "department" && (
            <section className="form-section">
              <h3>🏢 Department Target</h3>
              <div className="target-type-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="targetType"
                    value="all"
                    checked={formData.targetType === "all"}
                    onChange={handleChange}
                  />
                  <span>📢 All Departments</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="targetType"
                    value="specific"
                    checked={formData.targetType === "specific"}
                    onChange={handleChange}
                  />
                  <span>🎯 Specific Department</span>
                </label>
              </div>

              {formData.targetType === "specific" && (
                <div className="form-group">
                  <label>Select Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}
            </section>
          )}

          {/* Role-based Broadcast */}
          {formData.messageType === "role" && (
            <section className="form-section">
              <h3>🎯 Select Staff Role to Broadcast</h3>
              <div className="form-group">
                <label>Staff Role *</label>
                <select
                  name="roleTarget"
                  value={formData.roleTarget}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Role --</option>
                  {departmentRoles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <p className="form-hint">💡 This will send the message to all staff members with the selected role. No SAP ID needed.</p>
            </section>
          )}

          {/* Student SAP ID */}
          {formData.messageType === "student" && (
            <section className="form-section">
              <h3>🎓 Student Information</h3>
              <div className="form-group">
                <label>Student SAP ID *</label>
                <input
                  type="text"
                  name="studentSapId"
                  value={formData.studentSapId}
                  onChange={handleChange}
                  placeholder="e.g., BCS-123456"
                  required
                />
              </div>
            </section>
          )}

          {/* Message Content */}
          <section className="form-section">
            <h3>✍️ Message Content</h3>
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
              <label>Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={
                  formData.messageType === "department"
                    ? "Provide progress update reminder or instructions..."
                    : "Send message or notification to student..."
                }
                rows="10"
                required
              />
            </div>

            <div className="form-group">
              <label>Priority</label>
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
          </section>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "⏳ Sending..." : "📤 Send Message"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/admin-dashboard")}
            >
              ↩️ Back to Dashboard
            </button>
          </div>
        </form>

        {showMessageLog && (
          <div className="message-log-modal-overlay" onClick={() => setShowMessageLog(false)}>
            <div className="message-log-modal" onClick={(e) => e.stopPropagation()}>
              <div className="log-header">
                <h2>📬 Message Log</h2>
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${messageFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setMessageFilter('all')}
                  >
                    📬 All
                  </button>
                  <button 
                    className={`filter-btn ${messageFilter === 'sent' ? 'active' : ''}`}
                    onClick={() => setMessageFilter('sent')}
                  >
                    📤 Sent
                  </button>
                  <button 
                    className={`filter-btn ${messageFilter === 'received' ? 'active' : ''}`}
                    onClick={() => setMessageFilter('received')}
                  >
                    📥 Received
                  </button>
                </div>
                <button 
                  className="btn-close-log"
                  onClick={() => setShowMessageLog(false)}
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="alert alert-error" style={{ margin: '16px 0' }}>
                  {error}
                </div>
              )}

              {messageLog && messageLog.filter(msg => {
                if (messageFilter === 'all') return true;
                if (messageFilter === 'sent') return msg.sender_type === 'admin';
                if (messageFilter === 'received') return msg.sender_type !== 'admin';
                return true;
              }).length === 0 ? (
                <div className="empty-log">
                  <p>{error ? '⚠️ Unable to load messages' : '📭 No messages in this filter'}</p>
                  {error && <p style={{ fontSize: '12px', marginTop: '8px', color: '#6b7280' }}>Check the browser console for more details</p>}

                </div>
              ) : (
                <div className="log-messages">
                  {messageLog.filter(msg => {
                    if (messageFilter === 'all') return true;
                    if (messageFilter === 'sent') return msg.sender_type === 'admin';
                    if (messageFilter === 'received') return msg.sender_type !== 'admin';
                    return true;
                  }).map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`log-message ${msg.sender_type === 'admin' ? 'sent' : 'received'}`}
                      onClick={() => setSelectedMessage(msg)}
                      style={{ cursor: 'pointer' }}
                    >
                    <div className="log-msg-header">
                      <strong>{msg.subject}</strong>
                      <span className="log-date">{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="log-msg-body">{msg.message}</p>
                    <span className="log-recipient">
                      {msg.sender_type === 'admin' ? '→' : '←'} {msg.sender_type === 'admin' ? (msg.recipient_department || 'System') : (msg.sender_name || 'System')}
                    </span>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        )}

        {/* DETAILED MESSAGE VIEW - SEPARATE PAGE */}
        {selectedMessage && (
          <div className="message-detail-overlay">
            <div className="message-detail-container">
              <div className="detail-header">
                <h2>{selectedMessage.subject}</h2>
                <button 
                  className="btn-close-detail"
                  onClick={() => {
                    setSelectedMessage(null);
                    setReplyText("");
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="detail-info">
                <div className="info-row">
                  <span className="info-label">From:</span>
                  <span className="info-value">{selectedMessage.sender_name || 'System'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Sent:</span>
                  <span className="info-value">{new Date(selectedMessage.created_at).toLocaleString()}</span>
                </div>
                {selectedMessage.recipient_department && (
                  <div className="info-row">
                    <span className="info-label">Department:</span>
                    <span className="info-value">{selectedMessage.recipient_department}</span>
                  </div>
                )}
              </div>

              <div className="detail-body">
                <p>{selectedMessage.message}</p>
              </div>

              {/* REPLY SECTION - Only for received messages from departments */}
              {selectedMessage.sender_type !== 'admin' && (
                <div className="reply-section">
                  <h3>💬 Reply to This Message</h3>
                  {error && (
                    <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                      {success}
                    </div>
                  )}
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply message here..."
                    rows="5"
                    disabled={replyLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      marginBottom: '16px',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleReply}
                      disabled={replyLoading}
                      style={{
                        padding: '10px 20px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: replyLoading ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        opacity: replyLoading ? 0.6 : 1
                      }}
                    >
                      {replyLoading ? '⏳ Sending...' : '✉️ Send Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMessage(null);
                        setReplyText("");
                      }}
                      disabled={replyLoading}
                      style={{
                        padding: '10px 20px',
                        background: '#e5e7eb',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>
              )}

              {selectedMessage.sender_type === 'admin' && (
                <div className="detail-footer" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                  <p>This is a message you sent. No reply option available.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* DETAILED MESSAGE VIEW STYLES */
const detailStyles = `
  .message-detail-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  .message-detail-container {
    background: white;
    border-radius: 12px;
    max-width: 700px;
    width: 90%;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px 12px 0 0;
  }

  .detail-header h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
  }

  .btn-close-detail {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 20px;
    transition: all 0.2s ease;
  }

  .btn-close-detail:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
  }

  .detail-info {
    padding: 20px 24px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    font-size: 14px;
  }

  .info-label {
    font-weight: 600;
    color: #374151;
  }

  .info-value {
    color: #6b7280;
  }

  .detail-body {
    padding: 24px;
    color: #374151;
    line-height: 1.8;
    font-size: 15px;
  }

  .detail-body p {
    margin: 0;
  }

  .reply-section {
    padding: 24px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
    border-radius: 0 0 12px 12px;
  }

  .reply-section h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .alert {
    padding: 14px 16px;
    border-radius: 8px;
    border-left: 4px solid;
    font-size: 14px;
    font-weight: 500;
  }

  .alert-error {
    background: #fef2f2;
    color: #991b1b;
    border-left-color: #ef4444;
  }

  .alert-success {
    background: #dcfce7;
    color: #166534;
    border-left-color: #16a34a;
  }
`;

/* Add form styles */
const styles = `
  .admin-message-form {
    background: white;
    padding: 32px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    max-width: 700px;
  }

  .form-section {
    margin-bottom: 28px;
  }

  .form-section h3 {
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .message-type-options,
  .target-type-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .radio-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .radio-option:hover {
    background: #eff6ff;
    border-color: #667eea;
  }

  .radio-option input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #667eea;
  }

  .radio-option span {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.3s ease;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .form-group textarea {
    resize: vertical;
    min-height: 120px;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 32px;
  }

  .btn-submit,
  .btn-cancel {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .btn-submit {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    flex: 1;
  }

  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  }

  .btn-cancel {
    background: #e2e8f0;
    color: #64748b;
  }

  .btn-cancel:hover {
    background: #cbd5e1;
  }

  .alert-success {
    background: #dcfce7;
    color: #166534;
    border-left: 4px solid #22c55e;
  }

  .form-hint {
    margin-top: 8px;
    padding: 8px 12px;
    background: #f0f9ff;
    border-left: 3px solid #0ea5e9;
    color: #0369a1;
    font-size: 13px;
    border-radius: 4px;
  }

  .btn-view-messages {
    padding: 12px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .btn-view-messages:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  }

  .message-log-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1500;
    animation: fadeIn 0.2s ease;
  }

  .message-log-modal {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 900px;
    max-height: 85vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease;
  }

  .message-log-section {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    margin-top: 32px;
  }

  .message-log-modal .log-header {
    padding: 20px 24px;
    border-bottom: 2px solid #f3f4f6;
    background: linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 15px;
  }

  .log-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
  }

  .filter-buttons {
    display: flex;
    gap: 8px;
  }

  .filter-btn {
    padding: 8px 14px;
    background: #f3f4f6;
    border: 2px solid transparent;
    color: #6b7280;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .filter-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .filter-btn.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }

  .btn-close-log {
    padding: 8px 12px;
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
    transition: all 0.3s ease;
  }

  .btn-close-log:hover {
    background: #e5e7eb;
  }

  .log-messages {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
    max-height: calc(85vh - 150px);
    overflow-y: auto;
  }

  .message-log-modal .log-messages {
    max-height: calc(85vh - 150px);
  }

  .log-message {
    padding: 16px;
    background: #f9fafb;
    border-left: 4px solid #e5e7eb;
    border-radius: 8px;
  }

  .log-message.sent {
    border-left-color: #10b981;
    background: #ecfdf5;
  }

  .log-message.received {
    border-left-color: #0ea5e9;
    background: #f0f9ff;
  }

  .log-msg-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .log-msg-header strong {
    color: #1e293b;
    font-size: 14px;
  }

  .log-date {
    font-size: 12px;
    color: #64748b;
  }

  .log-msg-body {
    margin: 8px 0;
    font-size: 13px;
    color: #475569;
    line-height: 1.4;
  }

  .log-recipient {
    font-size: 12px;
    color: #64748b;
  }

  .empty-log {
    text-align: center;
    padding: 40px;
    color: #64748b;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = detailStyles + "\n" + styles;
  document.head.appendChild(styleSheet);
}
