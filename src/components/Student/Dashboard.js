import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./Dashboard.css";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const [departments, setDepartments] = useState([
    { key: "fee", label: "Fee & Dues", status: "Pending", remarks: "" },
    { key: "library", label: "Library", status: "Cleared", remarks: "" },
    { key: "studentServices", label: "Student Services", status: "Cleared", remarks: "" },
    { key: "laboratory", label: "Laboratory (if required)", status: "Pending", remarks: "" },
    { key: "coordination", label: "Coordination Office", status: "Cleared", remarks: "" },
    { key: "transport", label: "Transport", status: "Not Applicable", remarks: "" },
    { key: "hostel", label: "Hostel Mess", status: "Cleared", remarks: "" }
  ]);

  // ====== STUDENT INFO ======
  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "N/A";

  // ====== UNREAD MESSAGES LOGIC (added) ======
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const studentId = displaySap;
      if (!studentId || studentId === "N/A") return;

      const res = await fetch(
        `http://localhost:5000/api/messages/unread-count?studentId=${encodeURIComponent(studentId)}`
      );

      if (!res.ok) return;

      const data = await res.json();
      setUnreadCount(data.unread || 0);
    } catch (err) {
      console.error("Unread fetch error:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount(); // Load once

    pollRef.current = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [displaySap]);

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

        {/* OVERVIEW */}
        <section className="sd-overview">
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

        {/* DEPARTMENT CARDS */}
        <section className="sd-cards">
          {departments.map((d) => (
            <article key={d.key} className="sd-card">
              <div className="sd-card-head">
                <h4>{d.label}</h4>
                <span className={statusClass(d.status)}>{d.status}</span>
              </div>

              <p className="sd-card-remarks">
                {d.remarks || (d.status === "Cleared"
                  ? "No outstanding issues"
                  : "Please resolve pending items")}
              </p>

              <div className="sd-card-actions">
                <button className="btn-message" onClick={() => handleMessageDept(d.key)}>
                  💬 Message Dept
                </button>
              </div>
            </article>
          ))}
        </section>

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
