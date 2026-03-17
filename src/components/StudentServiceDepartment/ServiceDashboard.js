import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { ClipboardList, CheckCircle2, XCircle, MessageSquare, UserPen, LogOut } from "lucide-react";
import "../Student/EditProfile.css";

export default function ServiceDashboard() {
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
      setError(err.response?.data?.message || "❌ Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleApprove = async () => {
    if (!remarks.trim()) {
      setError("❌ Remarks are required for approval");
      return;
    }
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.put(
        `${apiUrl}/api/clearance/${modalRequestId}/approve`,
        { remarks },
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
        setModalRequestId(null);
        setTimeout(() => setSuccess(""), 3000);
        fetchRequests();
      } else {
        setError(response.data.message || "❌ Failed to approve request");
      }
    } catch (err) {
      setError(err.response?.data?.message || "❌ Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) {
      setError("❌ Remarks are required for rejection");
      return;
    }
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.put(
        `${apiUrl}/api/clearance/${modalRequestId}/reject`,
        { remarks },
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
        setModalRequestId(null);
        setTimeout(() => setSuccess(""), 3000);
        fetchRequests();
      } else {
        setError(response.data.message || "❌ Failed to reject request");
      }
    } catch (err) {
      setError(err.response?.data?.message || "❌ Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (action, requestId) => {
    setError("");
    setSuccess("");
    setModalAction(action);
    setModalRequestId(requestId);
    setRemarks("");
    setShowRemarksModal(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const displayName = user?.full_name || "Service Staff";
  const displaySap = user?.sap || "N/A";

  return (
    <div className="student-dashboard-page">
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">{displaySap} • Student Service</p>
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
            onClick={() => navigate("/service-messages")}
          >
            <MessageSquare size={18} /> Messages
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/service-edit-profile")}
          >
            <UserPen size={18} /> Edit Profile
          </button>
          <button className="sd-nav-btn logout" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      <main className="sd-main">
        <header className="sd-header">
          <h1>👥 Student Service Clearance Management</h1>
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
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id}>
                    <td><strong>{req.student_id?.full_name || "N/A"}</strong></td>
                    <td>{req.student_id?.sap || "N/A"}</td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${req.status}`}>
                        {req.status}
                      </span>
                    </td>
                    <td><span className="remarks-text">{req.remarks || "—"}</span></td>
                    <td className="actions-cell">
                      {req.status === "Pending" && (
                        <>
                          <button
                            className="btn btn-approve"
                            onClick={() => openModal("approve", req._id)}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="btn btn-reject"
                            onClick={() => openModal("reject", req._id)}
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      {req.status !== "Pending" && <span>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {showRemarksModal && (
        <div className="modal-overlay" onClick={() => setShowRemarksModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {modalAction === "approve" ? "Approve Request" : "Reject Request"}
            </h2>
            <div className="modal-body">
              <label>
                Remarks <span className="required">*</span>
              </label>
              <textarea
                className="modal-textarea"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks..."
                disabled={actionLoading}
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
                className={`btn ${modalAction === "approve" ? "btn-approve" : "btn-reject"}`}
                onClick={modalAction === "approve" ? handleApprove : handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : (modalAction === "approve" ? "Approve" : "Reject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
