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
  const [success, setSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [resubmitting, setResubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDeptForResubmit, setSelectedDeptForResubmit] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    fetchClearanceStatus();
    // Refresh every 3 seconds (faster real-time updates)
    const interval = setInterval(fetchClearanceStatus, 3000);
    
    // Detect when tab comes into focus - refresh immediately
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("📲 Tab focused - refreshing clearance status...");
        fetchClearanceStatus();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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
        timeout: 8000,
      });

      if (response.data.success) {
        console.log('✅ Clearance status received:', response.data.data.length, 'departments');
        console.log('📋 Statuses:', response.data.data.map(s => `${s.department_name}: ${s.status}`).join(', '));
        setStatuses(response.data.data || []);
        setLastUpdated(new Date());
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

  const handleResubmit = async () => {
    try {
      setResubmitting(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      console.log('🔄 Resubmitting clearance request...');
      const response = await axios.post(
        apiUrl + "/api/clearance-requests/resubmit",
        {},
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSuccess(`✅ ${response.data.message}`);
        console.log('✅ Resubmit successful:', response.data.details);
        
        // Refresh the status after 1 second
        setTimeout(() => {
          fetchClearanceStatus();
        }, 1000);
      } else {
        setError("❌ " + (response.data.message || "Failed to resubmit"));
      }
    } catch (err) {
      console.error("Resubmit Error:", err);
      setError(
        err.response?.data?.message ||
          "❌ Failed to resubmit clearance request"
      );
    } finally {
      setResubmitting(false);
    }
  };

  const openConfirmModal = (departmentName) => {
    setSelectedDeptForResubmit(departmentName);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setSelectedDeptForResubmit(null);
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 4000);
  };

  const handleResubmitToDepartment = async (departmentName) => {
    try {
      setResubmitting(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      console.log('🔄 Resubmitting to', departmentName);
      console.log('📤 Request:', { 
        url: apiUrl + "/api/clearance-requests/resubmit-department",
        data: { department_name: departmentName },
        token: token ? '✓ Present' : '✗ Missing'
      });

      const response = await axios.post(
        apiUrl + "/api/clearance-requests/resubmit-department",
        { department_name: departmentName },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );

      console.log('✅ Response received:', response.data);

      if (response.data.success) {
        showNotification(`✅ Successfully resubmitted to ${departmentName}!`, "success");
        closeConfirmModal();
        setTimeout(() => {
          fetchClearanceStatus();
        }, 800);
      } else {
        console.warn('⚠️ Success false:', response.data.message);
        showNotification(response.data.message || "Failed to resubmit", "error");
      }
    } catch (err) {
      console.error("❌ Full Error Object:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config
      });
      
      const errorMsg = err.response?.data?.message || err.message || "Failed to resubmit request";
      console.error("🔴 Final Error Message:", errorMsg);
      showNotification(errorMsg, "error");
    } finally {
      setResubmitting(false);
    }
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

  const departments = Object.keys(deptMap);

  // Check if any requests are rejected
  const hasRejected = statuses.some(s => s.status === 'Rejected');

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
        {success && <div className="alert alert-success">{success}</div>}

        <div className="header-controls">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          >
            {refreshing ? "⟳ Updating..." : "🔄 Refresh"}
          </button>
          {hasRejected && (
            <button
              onClick={handleResubmit}
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
                (s) => s.department_name === dept
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

                      {deptStatus.status === 'Rejected' && (
                        <button
                          onClick={() => openConfirmModal(dept)}
                          disabled={resubmitting}
                          className="dept-resubmit-btn"
                        >
                          <span className="btn-icon">↻</span>
                          <span className="btn-text">Resubmit to This Department</span>
                        </button>
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
          <div className="status-info-header">
            <h3>📊 Status Information</h3>
            <p className="status-info-subtitle">How clearance requests are processed</p>
          </div>
          
          <div className="status-info-grid">
            <div className="info-card pending-card">
              <div className="info-icon">⏳</div>
              <div className="info-content">
                <h4>Pending</h4>
                <p>Your request is being reviewed by the department. This typically takes 1-3 business days.</p>
              </div>
            </div>

            <div className="info-card approved-card">
              <div className="info-icon">✅</div>
              <div className="info-content">
                <h4>Approved</h4>
                <p>Department has approved your clearance. You can now proceed to the next stage.</p>
              </div>
            </div>

            <div className="info-card rejected-card">
              <div className="info-icon">❌</div>
              <div className="info-content">
                <h4>Rejected</h4>
                <p>Department has rejected your request. You can resubmit your request using the 'Resubmit Rejected Request' button above.</p>
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
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Resubmission</h2>
              <button className="modal-close" onClick={closeConfirmModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-icon">⚡</div>
              <p className="confirm-text">
                Are you sure you want to resubmit your clearance request to <strong>{selectedDeptForResubmit}</strong>?
              </p>
              <p className="confirm-subtext">
                Your request will be reviewed again by the department.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={closeConfirmModal}
                disabled={resubmitting}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={() => handleResubmitToDepartment(selectedDeptForResubmit)}
                disabled={resubmitting}
              >
                {resubmitting ? "⏳ Submitting..." : "✓ Confirm & Submit"}
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
