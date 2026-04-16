import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  FiGrid, FiUsers, FiMessageSquare, FiEdit, FiLogOut,
  FiClipboard, FiCheckCircle, FiXCircle, FiClock,
  FiSend, FiCalendar, FiShield
} from "react-icons/fi";
import {
  FaBook, FaBus, FaMoneyBillWave, FaBuilding, FaUserGraduate, FaMapMarkerAlt
} from "react-icons/fa";
import "./AdminDashboard.css";

// Helper: department icon (react-icons)
const getDepartmentIcon = (departmentName) => {
  const icons = {
    Library: <FaBook />,
    Transport: <FaBus />,
    "Fee Department": <FaMoneyBillWave />,
    Coordination: <FaBuilding />,
    "Student Service": <FaUserGraduate />
  };
  return icons[departmentName] || <FaMapMarkerAlt />;
};

// Helper: department color
const getDepartmentColor = (departmentName) => {
  const colors = {
    Library: "#3b82f6",
    Transport: "#10b981",
    "Fee Department": "#ef4444",
    Coordination: "#8b5cf6",
    "Student Service": "#ec4899"
  };
  return colors[departmentName] || "#6b7280";
};

// Filter out Laboratory and HOD departments
const EXCLUDED_DEPARTMENTS = ["Laboratory", "HOD"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalPending: 0
  });

  // Fetch real department statistics
  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    const fetchDepartmentStats = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `${apiUrl}/api/admin/department-stats`,
          config
        );

        if (response.data.success) {
          const { departments } = response.data.data;

          // Transform departments data, exclude Laboratory and HOD
          const formattedDepts = departments
            .filter(dept => !EXCLUDED_DEPARTMENTS.includes(dept.departmentName))
            .map(dept => ({
              id: dept.id,
              name: dept.departmentName,
              icon: getDepartmentIcon(dept.departmentName),
              totalRequests: dept.totalRequests,
              approved: dept.approved,
              rejected: dept.rejected,
              pending: dept.pending,
              color: getDepartmentColor(dept.departmentName)
            }));

          // Calculate overall stats ONLY from visible departments (not excluded ones)
          const totalRequests = formattedDepts.reduce((s, d) => s + d.totalRequests, 0);
          const totalApproved = formattedDepts.reduce((s, d) => s + d.approved, 0);
          const totalRejected = formattedDepts.reduce((s, d) => s + d.rejected, 0);
          const totalPending = formattedDepts.reduce((s, d) => s + d.pending, 0);

          setDepartments(formattedDepts);
          setStats({
            totalRequests: totalRequests,
            totalApproved: totalApproved,
            totalRejected: totalRejected,
            totalPending: totalPending
          });
        }
      } catch (err) {
        console.error("Error fetching department stats:", err);
        setError("Failed to load department statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentStats();
    
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchDepartmentStats, 30000);
    
    return () => clearInterval(interval);
  }, [apiUrl]);

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
          <div className="logo-icon"><FiShield size={32} /></div>
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
            <FiGrid style={{ marginRight: 10 }} /> Dashboard
          </button>
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-users")}
          >
            <FiUsers style={{ marginRight: 10 }} /> User Management
          </button>
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-messages")}
          >
            <FiMessageSquare style={{ marginRight: 10 }} /> Messages
          </button>
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-edit-profile")}
          >
            <FiEdit style={{ marginRight: 10 }} /> Edit Profile
          </button>
        </nav>

        <button className="admin-nav-btn logout" onClick={handleLogout}>
          <FiLogOut style={{ marginRight: 10 }} /> Logout
        </button>

        <footer className="admin-footer">© 2025 Riphah University</footer>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-content">
            <h1><FiGrid style={{ marginRight: 12, verticalAlign: 'middle' }} />Administration Dashboard</h1>
            <p>Monitor and manage all departments from one central location</p>
          </div>
          <div className="header-datetime">
            <FiCalendar style={{ marginRight: 8, verticalAlign: 'middle' }} />
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
            <div className="stat-icon"><FiClipboard size={36} /></div>
            <div className="stat-content">
              <p className="stat-label">Total Requests</p>
              <h2 className="stat-value">{stats.totalRequests}</h2>
              <p className="stat-trend">Across all departments</p>
            </div>
          </div>

          <div className="stat-card approved">
            <div className="stat-icon"><FiCheckCircle size={36} /></div>
            <div className="stat-content">
              <p className="stat-label">Approved</p>
              <h2 className="stat-value">{stats.totalApproved}</h2>
              <p className="stat-trend">
                {stats.totalRequests > 0 ? Math.round((stats.totalApproved / stats.totalRequests) * 100) : 0}% success rate
              </p>
            </div>
          </div>

          <div className="stat-card rejected">
            <div className="stat-icon"><FiXCircle size={36} /></div>
            <div className="stat-content">
              <p className="stat-label">Rejected</p>
              <h2 className="stat-value">{stats.totalRejected}</h2>
              <p className="stat-trend">
                {stats.totalRequests > 0 ? Math.round((stats.totalRejected / stats.totalRequests) * 100) : 0}% rejection rate
              </p>
            </div>
          </div>
        </section>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Department Statistics */}
        <section className="admin-departments">
          <h2><FaMapMarkerAlt style={{ marginRight: 10, verticalAlign: 'middle' }} /> Department Overview</h2>
          <p className="section-subtitle">Real-time progress tracking for all departments</p>

          {loading ? (
            <div className="loading">Loading department data...</div>
          ) : departments.length === 0 ? (
            <div className="alert alert-error">
              ⚠️ No departments found. Make sure you are logged in as an admin and try refreshing the page.
            </div>
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
                        <span className="stat-name"><FiCheckCircle style={{ marginRight: 6, color: '#10b981' }} /> Approved:</span>
                        <span className="stat-num approved">{dept.approved}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-name"><FiXCircle style={{ marginRight: 6, color: '#ef4444' }} /> Rejected:</span>
                        <span className="stat-num rejected">{dept.rejected}</span>
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
                      onClick={() => navigate("/admin-messages?type=department&dept=" + dept.name)}
                    >
                      <FiSend style={{ marginRight: 8 }} /> Send Reminder
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>


      </main>
    </div>
  );
}
