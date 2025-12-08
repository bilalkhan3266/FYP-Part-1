import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "./LibraryDashboard.css";

export default function LibraryDashboard() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [showRemarksModal, setShowRemarksModal] = useState(false);
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
        endpoint = "/api/library/pending-requests";
      } else if (activeTab === "approved") {
        endpoint = "/api/library/approved-requests";
      } else if (activeTab === "rejected") {
        endpoint = "/api/library/rejected-requests";
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
        setError("❌ Failed to fetch requests");
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
    if (modalAction !== "approve") return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.put(
        apiUrl + `/api/library/requests/${modalRequestId}/approve`,
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
        await fetchRequests();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "❌ Failed to approve");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "❌ Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (modalAction !== "reject") return;

    if (!remarks.trim()) {
      setError("❌ Rejection reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.put(
        apiUrl + `/api/library/requests/${modalRequestId}/reject`,
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
        await fetchRequests();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "❌ Failed to reject");
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

  const displayName = user?.full_name || "Library Staff";

  return (
    <div className="library-dashboard-page">
      {/* SIDEBAR */}
      <aside className="ld-sidebar">
        <div className="ld-profile">
          <div className="ld-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="ld-name">{displayName}</h3>
            <p className="ld-small">Library Department</p>
            <p className="ld-small">Riphah International University</p>
          </div>
        </div>

        <nav className="ld-nav">
          <button className="ld-nav-btn active" onClick={() => setActiveTab("pending")}>
            📋 Pending Requests
          </button>
          <button className="ld-nav-btn" onClick={() => setActiveTab("approved")}>
            ✅ Approved Requests
          </button>
          <button className="ld-nav-btn" onClick={() => setActiveTab("rejected")}>
            ❌ Rejected Requests
          </button>
          <button className="ld-nav-btn" onClick={() => navigate("/library-messages")}>
            💬 Messages
          </button>
          <button className="ld-nav-btn" onClick={() => navigate("/library-edit-profile")}>
            📝 Edit Profile
          </button>
          <button className="ld-nav-btn logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </nav>

        <footer className="ld-footer">© 2025 Riphah</footer>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ld-main">
        <header className="ld-header">
          <h1>Library Clearance Management</h1>
          <p>Review and manage student clearance requests</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* TABS */}
        <div className="ld-tabs">
          <button
            className={`ld-tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            📋 Pending ({requests.length})
          </button>
          <button
            className={`ld-tab ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            ✅ Approved ({requests.length})
          </button>
          <button
            className={`ld-tab ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            ❌ Rejected ({requests.length})
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="loading">Loading {activeTab} requests...</div>
        ) : requests.length === 0 ? (
          <div className="no-data">
            <p>📭 No {activeTab} requests found</p>
          </div>
        ) : (
          <div className="ld-table-container">
            <table className="ld-table">
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
                  <tr key={req._id} className="ld-row">
                    <td>{index + 1}</td>
                    <td><strong>{req.studentName}</strong></td>
                    <td>{req.sapid}</td>
                    <td>{req.program}</td>
                    <td>{req.semester}</td>
                    <td>
                      <span className={`ld-status ld-status-${(req.status || 'pending').toLowerCase()}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      <small className="ld-remarks">{req.libraryRemarks || req.reason || "-"}</small>
                    </td>
                    <td>
                      <small>{new Date(req.createdAt).toLocaleDateString()}</small>
                    </td>
                    {activeTab === "pending" && (
                      <td>
                        <button
                          className="ld-btn ld-btn-approve"
                          onClick={() => handleOpenRemarksModal(req._id, "approve")}
                          disabled={actionLoading}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="ld-btn ld-btn-reject"
                          onClick={() => handleOpenRemarksModal(req._id, "reject")}
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

        {/* REMARKS MODAL */}
        {showRemarksModal && (
          <div className="ld-modal-overlay" onClick={() => setShowRemarksModal(false)}>
            <div className="ld-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{modalAction === "approve" ? "✅ Approve Request" : "❌ Reject Request"}</h2>
              
              <div className="ld-modal-body">
                <label>
                  {modalAction === "approve" ? "Approval Comments" : "Rejection Reason"} 
                  {modalAction === "reject" && <span className="required">*</span>}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    modalAction === "approve"
                      ? "Enter any additional comments (optional)..."
                      : "Please explain why this request is being rejected..."
                  }
                  rows="5"
                  className="ld-textarea"
                />
              </div>

              <div className="ld-modal-actions">
                <button
                  className="ld-btn ld-btn-cancel"
                  onClick={() => setShowRemarksModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className={`ld-btn ${modalAction === "approve" ? "ld-btn-approve" : "ld-btn-reject"}`}
                  onClick={modalAction === "approve" ? handleApprove : handleReject}
                  disabled={actionLoading || (modalAction === "reject" && !remarks.trim())}
                >
                  {actionLoading ? "Processing..." : (modalAction === "approve" ? "✅ Approve" : "❌ Reject")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
