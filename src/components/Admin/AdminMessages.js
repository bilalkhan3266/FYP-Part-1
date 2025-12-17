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
      </main>
    </div>
  );
}

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
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
