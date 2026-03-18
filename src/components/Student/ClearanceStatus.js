import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { LayoutDashboard, ClipboardList, CheckCircle2, MessageSquare, UserPen, LogOut, GraduationCap, ShieldCheck } from "lucide-react";
import "./ClearanceStatus.css";
import "./Dashboard.css";
import axios from "axios";

/* Shared Sidebar Component */
function StudentSidebar({ displayName, displaySap, displayDept, onLogout, className }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { path: "/student-dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student-clearance-request", icon: ClipboardList, label: "Submit Request" },
    { path: "/student-auto-clearance", icon: ShieldCheck, label: "Auto Clearance" },
    { path: "/student-clearance-status", icon: CheckCircle2, label: "Clearance Status" },
    { path: "/student-messages", icon: MessageSquare, label: "Messages" },
    { path: "/student-edit-profile", icon: UserPen, label: "Edit Profile" },
  ];
  return (
    <aside className={`sd-sidebar${className ? " " + className : ""}`}>
      <div className="sd-sidebar-top">
        <div className="sd-brand"><div className="sd-brand-icon"><GraduationCap size={22} /></div><span className="sd-brand-text">Riphah Clearance</span></div>
        <div className="sd-profile"><div className="sd-avatar">{displayName ? displayName.charAt(0).toUpperCase() : "?"}</div><div className="sd-profile-info"><h3 className="sd-name">{displayName}</h3><p className="sd-meta">{displaySap}</p><p className="sd-meta">{displayDept}</p></div></div>
        <nav className="sd-nav">
          {navItems.map((item) => { const Icon = item.icon; const isActive = location.pathname === item.path; return (
            <button key={item.path} className={`sd-nav-btn${isActive ? " active" : ""}`} onClick={() => navigate(item.path)}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} /><span>{item.label}</span>{isActive && <span className="sd-active-indicator" />}
            </button>
          ); })}
        </nav>
      </div>
      <div className="sd-sidebar-bottom">
        <button className="sd-nav-btn sd-logout-btn" onClick={onLogout}><LogOut size={18} /><span>Logout</span></button>
        <footer className="sd-footer">© 2025 Riphah International University</footer>
      </div>
    </aside>
  );
}

export default function ClearanceStatus() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [resubmitting, setResubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const PHASE_ORDER = ["Coordination", "Library", "Transport", "Fee Department", "Student Service"];

  useEffect(() => {
    fetchWorkflowStatus();
    const interval = setInterval(fetchWorkflowStatus, 3000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchWorkflowStatus();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchWorkflowStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(apiUrl + "/api/clearance/student", {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        timeout: 8000,
      });

      if (response.data.success) {
        setWorkflow(response.data.data);
        setLastUpdated(new Date());
        setError("");
      } else {
        setError("Failed to load clearance status");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to fetch clearance status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWorkflowStatus();
  };

  const handleResubmit = async () => {
    if (!workflow) return;
    try {
      setResubmitting(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + "/api/clearance/" + workflow._id + "/resubmit",
        {},
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSuccess("✅ " + response.data.message);
        setWorkflow(response.data.workflow);
        setTimeout(() => fetchWorkflowStatus(), 1000);
      } else {
        setError("❌ " + (response.data.message || "Failed to resubmit"));
      }
    } catch (err) {
      console.error("Resubmit Error:", err);
      setError(err.response?.data?.message || "Failed to resubmit clearance request");
    } finally {
      setResubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 4000);
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
      case "Approved": return "#10b981";
      case "Rejected": return "#ef4444";
      case "Pending": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved": return "✅";
      case "Rejected": return "❌";
      case "Pending": return "⏳";
      default: return "📋";
    }
  };

  const isRejected = workflow?.overallStatus === "Rejected";

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
      <StudentSidebar displayName={displayName} displaySap={displaySap} displayDept={displayDept} onLogout={handleLogout} />

      <main className="sd-main">
        <header className="sd-header">
          <h1>Clearance Status</h1>
          <p>Track your sequential clearance progress across all departments</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="header-controls">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          >
            {refreshing ? "⟳ Updating..." : "🔄 Refresh"}
          </button>
          {isRejected && (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={resubmitting}
              className={`resubmit-btn ${resubmitting ? 'resubmitting' : ''}`}
            >
              {resubmitting ? "🔄 Resubmitting..." : "🔁 Resubmit Rejected Request"}
            </button>
          )}
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {!workflow ? (
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
          <>
            {/* Overall Status Banner */}
            <div className="status-banner" style={{
              background: workflow.overallStatus === "Completed" ? "#dcfce7" : 
                          workflow.overallStatus === "Rejected" ? "#fee2e2" : "#fef9c3",
              border: `1px solid ${workflow.overallStatus === "Completed" ? "#16a34a" : 
                                   workflow.overallStatus === "Rejected" ? "#dc2626" : "#ca8a04"}`,
              borderRadius: "12px", padding: "16px 24px", marginBottom: "20px",
              display: "flex", alignItems: "center", gap: "12px"
            }}>
              <span style={{ fontSize: "24px" }}>
                {workflow.overallStatus === "Completed" ? "🎉" : 
                 workflow.overallStatus === "Rejected" ? "❌" : "⏳"}
              </span>
              <div>
                <strong style={{ fontSize: "16px" }}>
                  Status: {workflow.overallStatus}
                </strong>
                <p style={{ margin: 0, fontSize: "14px", opacity: 0.8 }}>
                  {workflow.overallStatus === "Completed" 
                    ? "All departments have approved your clearance! Download your certificate."
                    : workflow.overallStatus === "Rejected"
                    ? `Rejected at ${workflow.phases.find(p => p.status === "Rejected")?.name || "a department"}. You can resubmit.`
                    : `Currently at Phase ${workflow.currentPhase + 1}: ${PHASE_ORDER[workflow.currentPhase]}`}
                </p>
              </div>
              {workflow.overallStatus === "Completed" && (
                <button 
                  onClick={() => navigate("/student-certificate")}
                  style={{ marginLeft: "auto", background: "#16a34a", color: "#fff", border: "none", 
                           padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                >
                  View Certificate
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div style={{ 
              background: "#fff", borderRadius: "12px", padding: "20px", marginBottom: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: 600 }}>Progress</span>
                <span style={{ fontWeight: 600, color: "#6366f1" }}>
                  {workflow.phases.filter(p => p.status === "Approved").length} / {workflow.phases.length} phases complete
                </span>
              </div>
              <div style={{ height: "10px", background: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
                <div style={{ 
                  height: "100%", 
                  width: `${Math.round((workflow.phases.filter(p => p.status === "Approved").length / workflow.phases.length) * 100)}%`,
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)", 
                  borderRadius: "5px", transition: "width 0.5s ease"
                }} />
              </div>
            </div>

            {/* Sequential Phase Cards */}
            <div className="status-grid" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {workflow.phases.map((phase, idx) => {
                const isCurrent = idx === workflow.currentPhase && workflow.overallStatus === "In Progress";
                const isApproved = phase.status === "Approved";
                const isRej = phase.status === "Rejected";
                
                return (
                  <div key={idx} className="status-card" style={{
                    borderLeft: `4px solid ${getStatusColor(phase.status)}`,
                    opacity: idx > workflow.currentPhase && workflow.overallStatus === "In Progress" ? 0.5 : 1,
                    position: "relative"
                  }}>
                    <div className="status-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ 
                          width: "32px", height: "32px", borderRadius: "50%", display: "flex",
                          alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700,
                          background: isApproved ? "#dcfce7" : isRej ? "#fee2e2" : isCurrent ? "#e0e7ff" : "#f1f5f9",
                          color: isApproved ? "#16a34a" : isRej ? "#dc2626" : isCurrent ? "#6366f1" : "#64748b"
                        }}>
                          {idx + 1}
                        </span>
                        <h3 style={{ margin: 0 }}>
                          {phase.name}
                          {isCurrent && <span style={{ 
                            marginLeft: "8px", fontSize: "11px", background: "#e0e7ff", 
                            color: "#6366f1", padding: "2px 8px", borderRadius: "12px", fontWeight: 600
                          }}>CURRENT</span>}
                        </h3>
                      </div>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(phase.status) }}
                      >
                        {getStatusIcon(phase.status)} {phase.status}
                      </span>
                    </div>

                    {phase.remarks && (
                      <div className="status-remarks">
                        <strong>Remarks:</strong> {phase.remarks}
                      </div>
                    )}

                    {phase.approvedAt && (
                      <div className="status-date">
                        <small>
                          {isApproved ? "Approved" : "Reviewed"}: {new Date(phase.approvedAt).toLocaleDateString()}
                          {phase.approverName && ` by ${phase.approverName}`}
                        </small>
                      </div>
                    )}

                    {idx > workflow.currentPhase && workflow.overallStatus === "In Progress" && (
                      <div className="status-pending">
                        <small>Waiting for previous phase to complete...</small>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="status-info">
          <div className="status-info-header">
            <h3>📊 Sequential Clearance Process</h3>
            <p className="status-info-subtitle">How the multi-phase clearance works</p>
          </div>
          
          <div className="status-info-grid">
            <div className="info-card pending-card">
              <div className="info-icon">1️⃣</div>
              <div className="info-content">
                <h4>Sequential Phases</h4>
                <p>Your request moves through {PHASE_ORDER.length} departments one by one: {PHASE_ORDER.join(" → ")}.</p>
              </div>
            </div>

            <div className="info-card approved-card">
              <div className="info-icon">✅</div>
              <div className="info-content">
                <h4>Approval</h4>
                <p>Each department must approve before the request moves to the next. Final approval generates your certificate.</p>
              </div>
            </div>

            <div className="info-card rejected-card">
              <div className="info-icon">🔄</div>
              <div className="info-content">
                <h4>Rejection & Resubmit</h4>
                <p>If rejected, you can resubmit. The request returns to the rejecting department for re-review.</p>
              </div>
            </div>
          </div>

          <div className="status-info-footer">
            <div className="update-badge">
              <span className="badge-dot"></span>
              <span>Status updates automatically every 3 seconds</span>
            </div>
            <div className="update-badge">
              <span className="badge-dot"></span>
              <span>Updates immediately when you switch to this tab</span>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Resubmission</h2>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="confirm-icon">⚡</div>
              <p className="confirm-text">
                Are you sure you want to resubmit your clearance request?
              </p>
              <p className="confirm-subtext">
                It will be re-reviewed starting from <strong>{workflow?.phases.find(p => p.status === "Rejected")?.name || "the rejected department"}</strong>.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowConfirmModal(false)} disabled={resubmitting}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleResubmit} disabled={resubmitting}>
                {resubmitting ? "⏳ Submitting..." : "✓ Confirm & Resubmit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification.show && (
        <div className={`toast-notification toast-${notification.type}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {notification.type === "success" ? "✓" : "✕"}
            </span>
            <span className="toast-message">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
