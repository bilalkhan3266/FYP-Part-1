import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { UserPen, ClipboardList, CheckCircle2, MessageSquare, LogOut } from "lucide-react";
import axios from "axios";
import "./FeeDashboard.css";

export default function FeeDepartmentDashboard() {
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
          registration_no: r.registrationNo,
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
      setError("❌ Please enter rejection remarks");
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

  return (
    <div className="student-dashboard-page">
      {/* ---- SIDEBAR ---- */}
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "F"}
          </div>
          <div>
            <h3 className="sd-name">{user?.full_name || "Fee Department"}</h3>
            <p className="sd-small">{user?.sap || "N/A"} • {user?.department || "Fee Department"}</p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button className="sd-nav-btn" onClick={() => navigate("/fee-edit-profile")}>
            <UserPen size={18} /> Edit Profile
          </button>

          <button
            className="sd-nav-btn"
            onClick={() => setActiveTab("pending")}
          >
            <ClipboardList size={18} /> View Student Requests
          </button>

          <button
            className="sd-nav-btn"
            onClick={() => setActiveTab("approved")}
          >
            <CheckCircle2 size={18} /> Approved Requests
          </button>

          <button
            className="sd-nav-btn"
            onClick={() => navigate("/fee-messages")}
          >
            <MessageSquare size={18} /> Messages
          </button>

          <button className="sd-nav-btn" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      {/* ---- MAIN CONTENT ---- */}
      <main className="sd-main">
        <header className="sd-header">
          <div>
            <h1>Fee Department Dashboard</h1>
            <p>Manage student fee clearance efficiently.</p>
          </div>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            ⏳ Pending Requests
          </button>
          <button
            className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            ✅ Approved
          </button>
          <button
            className={`tab-btn ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            ❌ Rejected
          </button>
        </div>

        {/* Requests Table */}
        <section className="requests-section">
          {loading ? (
            <p className="loading">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="no-data">No {activeTab} requests found</p>
          ) : (
            <div className="requests-table">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>SAP ID</th>
                    <th>Registration No</th>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id}>
                      <td>{request.student_name}</td>
                      <td>{request.sapid}</td>
                      <td>{request.registration_no}</td>
                      <td>{request.program}</td>
                      <td>
                        <span className={`status ${request.status.toLowerCase()}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>
                        {activeTab === "pending" && (
                          <>
                            <button
                              className="btn-approve"
                              onClick={() => handleOpenRemarksModal(request._id, "approve")}
                            >
                              ✅ Approve
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleOpenRemarksModal(request._id, "reject")}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                        {activeTab !== "pending" && (
                          <span className="text-muted">{request.remarks || "No remarks"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Remarks Modal */}
        {showRemarksModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{modalAction === "approve" ? "Approve Request" : "Reject Request"}</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowRemarksModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <label>Remarks:</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks..."
                  rows="5"
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setShowRemarksModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`btn-${modalAction}`}
                  onClick={modalAction === "approve" ? handleApprove : handleReject}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Processing..."
                    : modalAction === "approve"
                    ? "Approve"
                    : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
