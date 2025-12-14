import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "./Dashboard.css";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // ====== STUDENT INFO ======
  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "N/A";

  // ====== FETCH CLEARANCE STATUS ======
  const fetchClearanceStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      console.log('🔄 Fetching clearance status...');
      const response = await axios.get(apiUrl + "/api/clearance-status", {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        const statuses = response.data.data;
        console.log('✅ Clearance status received:', statuses.length, 'departments');
        console.log('📊 Summary:', response.data.summary);
        
        // Convert API response to department cards format
        const deptMap = {
          "Library": { key: "library", label: "Library" },
          "Fee Department": { key: "fee", label: "Fee & Dues" },
          "Transport": { key: "transport", label: "Transport" },
          "Laboratory": { key: "laboratory", label: "Laboratory (if required)" },
          "Student Service": { key: "studentServices", label: "Student Services" },
          "Coordination": { key: "coordination", label: "Coordination Office" },
          "HOD": { key: "hod", label: "HOD Office" },
          "Hostel": { key: "hostel", label: "Hostel Mess" }
        };

        const deptList = statuses.map(status => {
          const normalizedStatus = status.status === 'Approved' ? 'Cleared' : status.status;
          return {
            key: deptMap[status.department_name]?.key || status.department_name.toLowerCase(),
            label: deptMap[status.department_name]?.label || status.department_name,
            status: normalizedStatus || "Pending",
            remarks: status.remarks || "",
            approved_by: status.approved_by,
            approved_at: status.approved_at
          };
        });

        console.log('📋 Departments:', deptList.map(d => `${d.label}: ${d.status}`).join(', '));
        setDepartments(deptList);
        setError("");
      } else {
        console.warn("No clearance status data received");
        setError("");
      }
    } catch (err) {
      console.error("❌ Fetch Clearance Status Error:", err);
      setError(err.response?.data?.message || "Failed to load clearance status");
    } finally {
      setLoading(false);
    }
  };

  // ====== FETCH UNREAD COUNT ======
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      if (!token) return;

      const response = await axios.get(apiUrl + "/api/unread-count", {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Unread count fetch error:", err);
    }
  };

  // ====== AUTO-REFRESH ON MOUNT ======
  useEffect(() => {
    fetchClearanceStatus();
    fetchUnreadCount();
    
    // Refresh clearance status every 3 seconds (faster updates when departments approve)
    const statusInterval = setInterval(() => {
      console.log("🔄 Auto-refreshing clearance status...");
      fetchClearanceStatus();
    }, 3000);

    // Refresh unread count every 5 seconds
    const unreadInterval = setInterval(() => {
      console.log("🔄 Auto-refreshing unread count...");
      fetchUnreadCount();
    }, 5000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(unreadInterval);
    };
  }, []);

  // ====== PROGRESS CALC ======
  const progress = useMemo(() => {
    const total = departments.length;
    const done = departments.filter(
      (d) => d.status === "Cleared" || d.status === "Not Applicable"
    ).length;
    return Math.round((done / total) * 100);
  }, [departments]);

  const allCleared = progress === 100;

  const statusClass = (s) => {
    if (s === "Cleared") return "status cleared";
    if (s === "Pending") return "status pending";
    if (s === "Rejected") return "status rejected";
    return "status na";
  };

  const handleMessageDept = (deptKey) => {
    navigate("/student-messages", { state: { dept: deptKey } });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRefresh = () => alert("Refreshing clearance status (demo)");

  // Progress Circle Color
  const getProgressColor = (percentage) => {
    if (percentage <= 25) return "#ef4444";
    if (percentage <= 50) return "#f59e0b";
    if (percentage <= 75) return "#facc15";
    return "#16a34a";
  };

  return (
    <div className="student-dashboard-page">

      {/* SIDEBAR */}
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">
            {displayName ? displayName.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">{displaySap} • {displayDept}</p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button className="sd-nav-btn active" onClick={() => navigate("/student-dashboard")}>
            🏠 Dashboard
          </button>

          <button className="sd-nav-btn" onClick={() => navigate("/student-clearance-request")}>
            📋 Submit Request
          </button>

          <button className="sd-nav-btn" onClick={() => navigate("/student-clearance-status")}>
            ✅ Clearance Status
          </button>

          <button className="sd-nav-btn" onClick={() => navigate("/student-messages")}>
            💬 Messages {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          <button className="sd-nav-btn" onClick={() => navigate("/student-edit-profile")}>
            📝 Edit Profile
          </button>

          <button className="sd-nav-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      {/* MAIN CONTENT */}
      <main className="sd-main">
        <header className="sd-header">
          <div>
            <h1>Welcome back, {displayName}</h1>
            <p>Track department approvals below — your clearance progress is updated in real time.</p>
          </div>

          <div className="sd-header-actions">
            <button className="btn-refresh" onClick={handleRefresh}>🔄 Refresh</button>
            <button className="btn-submit" onClick={() => navigate("/student-clearance-request")}>
              Submit New Request
            </button>
          </div>
        </header>

        {loading && (
          <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            ⏳ Loading clearance status...
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
            border: "1px solid #fecaca"
          }}>
            {error}
          </div>
        )}

        {!loading && departments.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            <p>📋 No clearance data available. Please submit a clearance request.</p>
          </div>
        )}

        {!loading && departments.length > 0 && (
        <section className="sd-overview">
          {/* CLEARANCE STATUS CARD */}
          <div className="sd-status-card">
            <div className="status-header">
              <h3>📊 Overall Clearance Status</h3>
              <span className={`status-badge ${allCleared ? 'cleared' : 'pending'}`}>
                {allCleared ? '✅ CLEARED' : '⏳ IN PROGRESS'}
              </span>
            </div>
            
            <div className="status-content">
              <div className="status-info">
                <p><strong>Progress:</strong> {departments.filter(d => d.status === "Cleared" || d.status === "Not Applicable").length} of {departments.length} departments cleared</p>
                <p><strong>Status:</strong> {allCleared ? 'All departments have cleared your clearance request' : 'Some departments are still reviewing your request'}</p>
              </div>

              {/* LINEAR PROGRESS BAR */}
              <div className="progress-bar-container">
                <div className="progress-bar-label">
                  <span>Clearance Progress</span>
                  <span className="progress-percentage">{progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: getProgressColor(progress)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sd-progress-card">
            <div className="sd-progress-circle">
              <svg viewBox="0 0 120 120">
                <circle className="bg" cx="60" cy="60" r="54" />
                <circle
                  className="progress"
                  cx="60"
                  cy="60"
                  r="54"
                  stroke={getProgressColor(progress)}
                  style={{ strokeDashoffset: 339.292 - (339.292 * progress) / 100 }}
                />
                <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="percent-text">
                  {progress}%
                </text>
              </svg>
            </div>

            <div className="sd-progress-meta">
              <strong>{progress}%</strong> complete
            </div>

            <p className="sd-note">
              {allCleared
                ? "All departments cleared — you can print your clearance."
                : "Pending approvals from some departments."}
            </p>
          </div>

          <div className="sd-actions-card">
            <h3>Quick Actions</h3>
            <div className="sd-quick-grid">
              <button onClick={() => navigate("/student-clearance-status")}>View Full Status</button>
              <button style={{ backgroundColor: "#3b82f6", color: "white" }}
                      onClick={() => navigate("/student-messages")}>
                Open Messages
              </button>
              <button onClick={() => window.print()}>Print Page</button>
            </div>
          </div>
        </section>
        )}

        {/* DEPARTMENT CARDS */}
        {departments.length > 0 && (
        <section className="sd-cards">
          <h3 style={{ marginBottom: "20px", color: "#333" }}>📋 Department Clearance Status</h3>
          <div className="sd-cards-grid">
            {departments.map((d) => (
              <article key={d.key} className={`sd-card ${d.status.toLowerCase()}`}>
                <div className="sd-card-head">
                  <h4>{d.label}</h4>
                  <span className={statusClass(d.status)}>{d.status}</span>
                </div>

                <div className="sd-card-status-indicator">
                  {d.status === "Cleared" && <div className="indicator cleared">✓ Cleared</div>}
                  {d.status === "Pending" && <div className="indicator pending">⏳ Pending</div>}
                  {d.status === "Rejected" && <div className="indicator rejected">✗ Rejected</div>}
                  {d.status === "Not Applicable" && <div className="indicator na">— N/A</div>}
                </div>

                <p className="sd-card-remarks">
                  {d.remarks || (d.status === "Cleared"
                    ? "No outstanding issues"
                    : d.status === "Pending"
                    ? "Your request is being reviewed"
                    : "Please contact the department")}
                </p>

                <div className="sd-card-actions">
                  <button className="btn-message" onClick={() => handleMessageDept(d.key)}>
                    💬 Message Dept
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        )}

        {/* CERTIFICATE */}
        {allCleared && (
          <section className="sd-certificate">
            <div className="cert-card">
              <h3>Digital Clearance Certificate</h3>
              <p>Student: <strong>{displayName}</strong> — SAP ID: <strong>{displaySap}</strong></p>

              <div className="barcode-visual" aria-hidden>
                {Array.from({ length: 42 }).map((_, i) => (
                  <span key={i} className={`bar ${
                    i % 3 === 0 ? "bar-large" :
                    i % 2 === 0 ? "bar-medium" : "bar-small"
                  }`} />
                ))}
              </div>

              <div className="cert-actions">
                <button onClick={() => window.print()} className="sd-primary">
                  🖨 Print & Download
                </button>
                <button onClick={() => alert("Certificate sent to student email (demo)")}>
                  ✉️ Send to Email
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
