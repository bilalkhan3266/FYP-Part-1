import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./CoordinationDashboard.css";

export default function CoordinationDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  
  const [requests] = useState([
    { id: 1, name: "Ali Khan", sapid: "FA21-BCS-001", status: "Pending", date: "2025-01-10" },
    { id: 2, name: "Ayesha Malik", sapid: "FA21-BCS-045", status: "Pending", date: "2025-01-09" },
    { id: 3, name: "Bilal Ahmed", sapid: "FA20-BCE-077", status: "Approved", date: "2025-01-08" },
    { id: 4, name: "Sana Riaz", sapid: "FA20-BBA-032", status: "Approved", date: "2025-01-07" },
    { id: 5, name: "Hamza Ali", sapid: "FA21-BSSE-120", status: "Rejected", date: "2025-01-06" },
  ]);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "Pending").length,
    approved: requests.filter(r => r.status === "Approved").length,
    rejected: requests.filter(r => r.status === "Rejected").length,
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      {/* Professional Sidebar */}
      <aside className="sidebar">
        <div className="profile-section">
          <div className="avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
          <h3>{user?.full_name || "Coordinator"}</h3>
          <p className="role">Coordination Office</p>
        </div>

        <nav className="nav-menu">
          <button className="nav-item active" onClick={() => navigate("/coordination-dashboard")}>
            <span className="icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/coord-view-requests")}>
            <span className="icon">📋</span>
            <span>View Requests</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/coord-approved")}>
            <span className="icon">✅</span>
            <span>Approved</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/coord-rejected")}>
            <span className="icon">❌</span>
            <span>Rejected</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/coord-messages")}>
            <span className="icon">💬</span>
            <span>Messages</span>
          </button>
        </nav>

        <div className="action-buttons">
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>

        <footer className="sidebar-footer">© 2025 Coordination Office</footer>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Welcome, {user?.full_name?.split(" ")[0] || "Coordinator"}!</h1>
            <p>Manage and review student clearance requests efficiently</p>
          </div>
        </header>

        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>Total Requests</h4>
              <p className="stat-number">{stats.total}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h4>Pending</h4>
              <p className="stat-number pending">{stats.pending}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h4>Approved</h4>
              <p className="stat-number approved">{stats.approved}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h4>Rejected</h4>
              <p className="stat-number rejected">{stats.rejected}</p>
            </div>
          </div>
        </section>

        <section className="requests-section">
          <h2>Recent Clearance Requests</h2>
          <div className="table-wrapper">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>SAPID</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td><strong>{req.name}</strong></td>
                    <td>{req.sapid}</td>
                    <td>
                      <span className={`status-badge status-${req.status.toLowerCase()}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>{req.date}</td>
                    <td>
                      <button className="action-btn view-btn">View</button>
                      <button className="action-btn edit-btn">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons-grid">
            <button className="quick-action-btn" onClick={() => navigate("/coord-view-requests")}>
              📥 Review Requests
            </button>
            <button className="quick-action-btn" onClick={() => navigate("/coord-approved")}>
              ✅ View Approved
            </button>
            <button className="quick-action-btn" onClick={() => navigate("/coord-rejected")}>
              ❌ View Rejected
            </button>
            <button className="quick-action-btn" onClick={() => navigate("/coord-messages")}>
              📧 Send Notification
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
