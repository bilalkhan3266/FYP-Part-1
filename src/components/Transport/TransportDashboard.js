import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./TransportDashboard.css";

export default function TransportDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const [requests] = useState([
    { id: 1, studentName: "Ahmed Ali", status: "Pending", date: "2025-11-20" },
    { id: 2, studentName: "Fatima Khan", status: "Approved", date: "2025-11-19" },
    { id: 3, studentName: "Hassan Raza", status: "Pending", date: "2025-11-18" },
    { id: 4, studentName: "Ayesha Malik", status: "Rejected", date: "2025-11-17" },
    { id: 5, studentName: "Omar Shah", status: "Approved", date: "2025-11-16" },
  ]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "Pending").length,
      approved: requests.filter((r) => r.status === "Approved").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
    };
  }, [requests]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const statusClass = (status) => {
    if (status === "Approved") return "status approved";
    if (status === "Pending") return "status pending";
    if (status === "Rejected") return "status rejected";
    return "status";
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="transport-dashboard-page">
      {/* ---------- SIDEBAR ---------- */}
      <aside className="td-sidebar">
        <div className="td-profile">
          <div className="td-avatar">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <h3 className="td-name">{user?.full_name || "Officer"}</h3>
            <p className="td-small">Transport Department</p>
            <p className="td-small">Riphah International University</p>
          </div>
        </div>

        <nav className="td-nav">
          <button className="td-nav-btn active" onClick={() => navigate("/transport-dashboard")}>
            🏠 Dashboard
          </button>
          <button className="td-nav-btn" onClick={() => navigate("/transport-view-requests")}>
            📋 View Requests
          </button>
          <button className="td-nav-btn" onClick={() => navigate("/transport-message")}>
            💬 Messages
          </button>
          <button className="td-nav-btn" onClick={() => navigate("/transport-settings")}>
            ⚙️ Settings
          </button>
          <button className="td-nav-btn logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </nav>

        <footer className="td-footer">© 2025 Riphah</footer>
      </aside>

      {/* ---------- MAIN CONTENT ---------- */}
      <main className="td-main">
        <header className="td-header">
          <div>
            <h1>🚚 Transport Department</h1>
            <p>Manage student transport clearance requests</p>
          </div>

          <button className="refresh-btn" onClick={() => window.location.reload()}>
            🔄 Refresh
          </button>
        </header>

        {/* ---------- STATS SECTION ---------- */}
        <section className="td-stats">
          <div className="stat-card total">
            <div className="stat-icon">🚍</div>
            <div className="stat-content">
              <h3>Total Requests</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>Pending</h3>
              <p className="stat-number">{stats.pending}</p>
            </div>
          </div>

          <div className="stat-card approved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Approved</h3>
              <p className="stat-number">{stats.approved}</p>
            </div>
          </div>

          <div className="stat-card rejected">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>Rejected</h3>
              <p className="stat-number">{stats.rejected}</p>
            </div>
          </div>
        </section>

        {/* ---------- REQUESTS TABLE ---------- */}
        <section className="td-card">
          <h2>📋 Recent Requests</h2>

          <div className="td-table-wrapper">
            <table className="td-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Student Name</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>#{req.id}</td>
                    <td>{req.studentName}</td>
                    <td>
                      <span className={statusClass(req.status)}>{req.status}</span>
                    </td>
                    <td>{req.date}</td>
                    <td>
                      {req.status === "Pending" && (
                        <div className="action-buttons">
                          <button className="btn-approve">✅ Approve</button>
                          <button className="btn-reject">❌ Reject</button>
                        </div>
                      )}
                      {req.status !== "Pending" && (
                        <button className="btn-view">👁️ View</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------- QUICK ACTIONS ---------- */}
        <section className="td-quick-actions">
          <button className="action-btn" onClick={() => navigate("/transport-message")}>
            💬 Send Message
          </button>
          <button className="action-btn" onClick={() => navigate("/transport-view-requests")}>
            📊 View Full Report
          </button>
          <button className="action-btn" onClick={() => window.print()}>
            🖨️ Print Report
          </button>
        </section>
      </main>
    </div>
  );
}
