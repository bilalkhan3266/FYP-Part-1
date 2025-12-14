import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const axiosConfig = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalPending: 0
  });

  // Mock department data - Replace with real API calls
  useEffect(() => {
    const fetchDepartmentStats = async () => {
      setLoading(true);
      setError("");
      try {
        // Mock data - In production, this would be from actual API
        const mockData = [
          {
            id: 1,
            name: "Library",
            icon: "📚",
            totalRequests: 145,
            approved: 98,
            rejected: 32,
            pending: 15,
            color: "#3b82f6"
          },
          {
            id: 2,
            name: "Transport",
            icon: "🚌",
            totalRequests: 87,
            approved: 62,
            rejected: 18,
            pending: 7,
            color: "#10b981"
          },
          {
            id: 3,
            name: "Laboratory",
            icon: "🔬",
            totalRequests: 56,
            approved: 42,
            rejected: 10,
            pending: 4,
            color: "#f59e0b"
          },
          {
            id: 4,
            name: "Fee Department",
            icon: "💰",
            totalRequests: 203,
            approved: 178,
            rejected: 15,
            pending: 10,
            color: "#ef4444"
          },
          {
            id: 5,
            name: "Coordination",
            icon: "🎯",
            totalRequests: 92,
            approved: 76,
            rejected: 12,
            pending: 4,
            color: "#8b5cf6"
          },
          {
            id: 6,
            name: "Student Services",
            icon: "🎓",
            totalRequests: 134,
            approved: 110,
            rejected: 18,
            pending: 6,
            color: "#ec4899"
          }
        ];

        setDepartments(mockData);

        // Calculate total stats
        const totalRequests = mockData.reduce((sum, d) => sum + d.totalRequests, 0);
        const totalApproved = mockData.reduce((sum, d) => sum + d.approved, 0);
        const totalRejected = mockData.reduce((sum, d) => sum + d.rejected, 0);
        const totalPending = mockData.reduce((sum, d) => sum + d.pending, 0);

        setStats({
          totalRequests,
          totalApproved,
          totalRejected,
          totalPending
        });
      } catch (err) {
        setError("Failed to load department statistics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Admin";
  const displayEmail = user?.email || "admin@riphah.edu.pk";

  const getProgressPercentage = (approved, total) => {
    if (total === 0) return 0;
    return Math.round((approved / total) * 100);
  };

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
            <p className="admin-email">{displayEmail}</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button className="admin-nav-btn active">
            📊 Dashboard
          </button>
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-messages")}
          >
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
            <h1>📊 Administration Dashboard</h1>
            <p>Monitor and manage all departments from one central location</p>
          </div>
          <div className="header-datetime">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </header>

        {/* Overall Statistics */}
        <section className="admin-stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <p className="stat-label">Total Requests</p>
              <h2 className="stat-value">{stats.totalRequests}</h2>
              <p className="stat-trend">Across all departments</p>
            </div>
          </div>

          <div className="stat-card approved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <p className="stat-label">Approved</p>
              <h2 className="stat-value">{stats.totalApproved}</h2>
              <p className="stat-trend">
                {Math.round((stats.totalApproved / stats.totalRequests) * 100)}% success rate
              </p>
            </div>
          </div>

          <div className="stat-card rejected">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <p className="stat-label">Rejected</p>
              <h2 className="stat-value">{stats.totalRejected}</h2>
              <p className="stat-trend">
                {Math.round((stats.totalRejected / stats.totalRequests) * 100)}% rejection rate
              </p>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <p className="stat-label">Pending</p>
              <h2 className="stat-value">{stats.totalPending}</h2>
              <p className="stat-trend">Awaiting action</p>
            </div>
          </div>
        </section>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Department Statistics */}
        <section className="admin-departments">
          <h2>📍 Department Overview</h2>
          <p className="section-subtitle">Real-time progress tracking for all departments</p>

          {loading ? (
            <div className="loading">Loading department data...</div>
          ) : (
            <div className="departments-grid">
              {departments.map((dept) => {
                const progress = getProgressPercentage(dept.approved, dept.totalRequests);
                return (
                  <div 
                    key={dept.id} 
                    className="department-card"
                    style={{ borderLeftColor: dept.color }}
                  >
                    <div className="dept-header">
                      <span className="dept-icon">{dept.icon}</span>
                      <h3>{dept.name}</h3>
                    </div>

                    <div className="dept-stats">
                      <div className="stat-row">
                        <span className="stat-name">Total Requests:</span>
                        <span className="stat-num total">{dept.totalRequests}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-name">✅ Approved:</span>
                        <span className="stat-num approved">{dept.approved}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-name">❌ Rejected:</span>
                        <span className="stat-num rejected">{dept.rejected}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-name">⏳ Pending:</span>
                        <span className="stat-num pending">{dept.pending}</span>
                      </div>
                    </div>

                    <div className="progress-section">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: dept.color
                          }}
                        ></div>
                      </div>
                      <p className="progress-text">{progress}% Completed</p>
                    </div>

                    <button 
                      className="send-reminder-btn"
                      style={{ borderColor: dept.color, color: dept.color }}
                      onClick={() => navigate("/admin-messages?dept=" + dept.name)}
                    >
                      📨 Send Reminder
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="admin-actions">
          <h2>⚡ Quick Actions</h2>
          <div className="actions-grid">
            <button 
              className="action-btn"
              onClick={() => navigate("/admin-messages")}
            >
              <span className="action-icon">💬</span>
              <span>Send Message to Department</span>
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate("/admin-messages?type=student")}
            >
              <span className="action-icon">📨</span>
              <span>Send Message to Student</span>
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate("/admin-edit-profile")}
            >
              <span className="action-icon">📝</span>
              <span>Edit My Profile</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
