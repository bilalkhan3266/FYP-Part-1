import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "./TransportDashboard.css";

export default function TransportDashboard() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [modalAction, setModalAction] = useState("");
  const [modalRequestId, setModalRequestId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      let endpoint = "";
      if (activeTab === "pending") {
        endpoint = "/api/transport/pending-requests";
      } else if (activeTab === "approved") {
        endpoint = "/api/transport/approved-requests";
      } else if (activeTab === "rejected") {
        endpoint = "/api/transport/rejected-requests";
      }

      const response = await axios.get(apiUrl + endpoint, {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        setRequests(response.data.data || []);
      } else {
        setError(response.data.message || "❌ Failed to fetch requests");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "❌ Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleOpenRemarksModal = (requestId, action) => {
    setModalRequestId(requestId);
    setModalAction(action);
    setRemarks("");
    setShowRemarksModal(true);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.put(
        apiUrl + `/api/transport/requests/${modalRequestId}/approve`,
        { remarks: remarks.trim() },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Request approved successfully!");
        setShowRemarksModal(false);
        setRemarks("");
        setTimeout(() => {
          fetchRequests();
          setSuccess("");
        }, 1500);
      } else {
        setError(response.data.message || "❌ Failed to approve request");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "❌ Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) {
      setError("❌ Rejection reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.put(
        apiUrl + `/api/transport/requests/${modalRequestId}/reject`,
        { remarks: remarks.trim() },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Request rejected successfully!");
        setShowRemarksModal(false);
        setRemarks("");
        setTimeout(() => {
          fetchRequests();
          setSuccess("");
        }, 1500);
      } else {
        setError(response.data.message || "❌ Failed to reject request");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "❌ Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Transport Staff";
  const displaySap = user?.sap || "N/A";

  return (
    <div className="student-dashboard-page">
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">{displaySap} • Transport</p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button
            className={`sd-nav-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            📋 Pending
          </button>
          <button
            className={`sd-nav-btn ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            ✅ Approved
          </button>
          <button
            className={`sd-nav-btn ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            ❌ Rejected
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/transport-messages")}
          >
            💬 Messages
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/transport-edit-profile")}
          >
            📝 Edit Profile
          </button>
          <button className="sd-nav-btn logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      <main className="sd-main">
        <header className="sd-header">
          <h1>🚌 Transport Clearance Management</h1>
          <p>Review and manage student clearance requests</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div className="loading">⏳ Loading {activeTab} requests...</div>
        ) : requests.length === 0 ? (
          <div className="no-data">
            <p>📭 No {activeTab} requests found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>SAP ID</th>
                  <th>Program</th>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Submitted</th>
                  {activeTab === "pending" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((req, index) => (
                  <tr key={req._id || req.id} className="table-row">
                    <td>{index + 1}</td>
                    <td><strong>{req.student_name || "N/A"}</strong></td>
                    <td>{req.sapid || "N/A"}</td>
                    <td>{req.program || "N/A"}</td>
                    <td>{req.semester || "N/A"}</td>
                    <td>
                      <span className={`status-badge status-${(req.status || "pending").toLowerCase()}`}>
                        {req.status || "Pending"}
                      </span>
                    </td>
                    <td>
                      <small className="remarks-text">
                        {req.remarks || req.message || "-"}
                      </small>
                    </td>
                    <td>
                      <small>
                        {new Date(req.created_at || req.createdAt).toLocaleDateString()}
                      </small>
                    </td>
                    {activeTab === "pending" && (
                      <td className="actions-cell">
                        <button
                          className="btn btn-approve"
                          onClick={() => handleOpenRemarksModal(req._id || req.id, "approve")}
                          disabled={actionLoading}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="btn btn-reject"
                          onClick={() => handleOpenRemarksModal(req._id || req.id, "reject")}
                          disabled={actionLoading}
                        >
                          ❌ Reject
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showRemarksModal && (
          <div className="modal-overlay" onClick={() => setShowRemarksModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">
                {modalAction === "approve"
                  ? "✅ Approve Request"
                  : "❌ Reject Request"}
              </h2>

              <div className="modal-body">
                <label>
                  {modalAction === "approve"
                    ? "Approval Comments"
                    : "Rejection Reason"}
                  {modalAction === "reject" && (
                    <span className="required">*</span>
                  )}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    modalAction === "approve"
                      ? "Enter any additional comments (optional)..."
                      : "Please explain why this request is being rejected..."
                  }
                  className="modal-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-cancel"
                  onClick={() => setShowRemarksModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className={`btn ${
                    modalAction === "approve" ? "btn-approve" : "btn-reject"
                  }`}
                  onClick={modalAction === "approve" ? handleApprove : handleReject}
                  disabled={
                    actionLoading ||
                    (modalAction === "reject" && !remarks.trim())
                  }
                >
                  {actionLoading
                    ? "Processing..."
                    : modalAction === "approve"
                    ? "✅ Approve"
                    : "❌ Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
