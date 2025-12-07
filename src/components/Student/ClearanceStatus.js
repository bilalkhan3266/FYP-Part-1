import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./ClearanceStatus.css";
import axios from "axios";

export default function ClearanceStatus() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchClearanceStatus();
    // Refresh every 5 seconds
    const interval = setInterval(fetchClearanceStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchClearanceStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(apiUrl + "/api/clearance-status", {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setStatuses(response.data.data || []);
        setError("");
      } else {
        setError("❌ Failed to load clearance status");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err.response?.data?.message ||
          "❌ Failed to fetch clearance status"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClearanceStatus();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "N/A";

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "#10b981";
      case "Rejected":
        return "#ef4444";
      case "Pending":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return "✅";
      case "Rejected":
        return "❌";
      case "Pending":
        return "⏳";
      default:
        return "📋";
    }
  };

  const departments = [
    "Library",
    "Transport",
    "Laboratory",
    "Student Service",
    "Fee Department",
    "Coordination",
    "HOD",
  ];

  if (loading) {
    return (
      <div className="student-dashboard-page">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>Loading clearance status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-page">
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">
              {displaySap} • {displayDept}
            </p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button
            onClick={() => navigate("/student-dashboard")}
            className="sd-nav-btn"
          >
            🏠 Dashboard
          </button>
          <button
            onClick={() => navigate("/student-clearance-request")}
            className="sd-nav-btn"
          >
            📋 Submit Request
          </button>
          <button
            onClick={() => navigate("/student-clearance-status")}
            className="sd-nav-btn active"
          >
            ✅ Clearance Status
          </button>
          <button
            onClick={() => navigate("/student-messages")}
            className="sd-nav-btn"
          >
            💬 Messages
          </button>
          <button
            onClick={() => navigate("/student-edit-profile")}
            className="sd-nav-btn"
          >
            📝 Edit Profile
          </button>
          <button onClick={handleLogout} className="sd-nav-btn logout">
            🚪 Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      <main className="sd-main">
        <header className="sd-header">
          <h1>Clearance Status</h1>
          <p>Track your clearance approval across all departments</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="refresh-btn"
        >
          {refreshing ? "🔄 Refreshing..." : "🔄 Refresh Status"}
        </button>

        {statuses.length === 0 ? (
          <div className="no-data">
            <p>📭 No clearance requests submitted yet</p>
            <button
              onClick={() => navigate("/student-clearance-request")}
              className="submit-btn"
            >
              Submit Your First Request
            </button>
          </div>
        ) : (
          <div className="status-grid">
            {departments.map((dept) => {
              const deptStatus = statuses.find(
                (s) => s.department === dept
              );

              return (
                <div key={dept} className="status-card">
                  <div className="status-header">
                    <h3>{dept}</h3>
                    {deptStatus ? (
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(deptStatus.status),
                        }}
                      >
                        {getStatusIcon(deptStatus.status)} {deptStatus.status}
                      </span>
                    ) : (
                      <span className="status-badge" style={{ backgroundColor: "#9ca3af" }}>
                        ⏳ Pending
                      </span>
                    )}
                  </div>

                  {deptStatus ? (
                    <>
                      {deptStatus.remarks && (
                        <div className="status-remarks">
                          <strong>Remarks:</strong> {deptStatus.remarks}
                        </div>
                      )}

                      {deptStatus.approved_at && (
                        <div className="status-date">
                          <small>
                            Approved: {new Date(deptStatus.approved_at).toLocaleDateString()}
                          </small>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="status-pending">
                      <small>Awaiting review...</small>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="status-info">
          <h3>📊 Status Information</h3>
          <ul>
            <li>
              <strong>⏳ Pending:</strong> Waiting for department review
            </li>
            <li>
              <strong>✅ Approved:</strong> Department has approved your request
            </li>
            <li>
              <strong>❌ Rejected:</strong> Department has rejected your request
            </li>
          </ul>
          <p>Status updates automatically every 5 seconds.</p>
        </div>
      </main>
    </div>
  );
}
