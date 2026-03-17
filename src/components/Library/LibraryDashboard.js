import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { ClipboardList, CheckCircle2, XCircle, MessageSquare, UserPen, LogOut } from "lucide-react";
import axios from "axios";
import "./LibraryDashboard.css"; // ✅ CORRECT IMPORT

export default function LibraryDashboard() {
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

      const response = await axios.get(apiUrl + "/api/clearance/department", {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        const data = response.data[activeTab] || [];
        setRequests(data.map(r => ({
          _id: r._id,
          student_name: r.studentName,
          sapid: r.sapid,
          program: r.program,
          semester: r.semester,
          status: r.phaseStatus,
          remarks: r.phaseRemarks,
          createdAt: r.submittedAt,
          overallStatus: r.overallStatus,
        })));
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
        apiUrl + `/api/clearance/${modalRequestId}/approve`,
        { remarks: remarks.trim() },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Request approved and student notified!");
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
    if (!remarks.trim()) {
      setError("❌ Rejection reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.put(
        apiUrl + `/api/clearance/${modalRequestId}/reject`,
        { remarks: remarks.trim() },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Request rejected and student notified!");
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
  const displaySap = user?.sap || "N/A";

  return (
    <div className="student-dashboard-page">
      {/* SIDEBAR */}
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">{displaySap} • Library</p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button
            className={`sd-nav-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            <ClipboardList size={18} /> Pending
          </button>
          <button
            className={`sd-nav-btn ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            <CheckCircle2 size={18} /> Approved
          </button>
          <button
            className={`sd-nav-btn ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            <XCircle size={18} /> Rejected
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/library-messages")}
          >
            <MessageSquare size={18} /> Messages
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/library-edit-profile")}
          >
            <UserPen size={18} /> Edit Profile
          </button>
          <button className="sd-nav-btn logout" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      {/* MAIN CONTENT */}
      <main className="sd-main">
        <header className="sd-header">
          <h1>Library Clearance Management</h1>
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
                    <td>
                      <strong>{req.student_name || "N/A"}</strong>
                    </td>
                    <td>{req.sapid || "N/A"}</td>
                    <td>{req.program || "N/A"}</td>
                    <td>{req.semester || "N/A"}</td>
                    <td>
                      <span
                        className={`status-badge status-${(req.status || "pending").toLowerCase()}`}
                      >
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
                        {new Date(
                          req.created_at || req.createdAt
                        ).toLocaleDateString()}
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

        {/* REMARKS MODAL */}
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
