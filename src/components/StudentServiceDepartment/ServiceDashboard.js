import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Navigate } from "react-router-dom";
import "../Library/LibraryDashboard.css";

export default function ServiceDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("ssd_user") || "null");
  
  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modal, setModal] = useState({ show: false, type: "", requestId: "", remarks: "" });

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `http://localhost:5000/api/studentservice/${activeTab}-requests`,
        axiosConfig
      );
      setRequests(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch requests");
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleApprove = async () => {
    if (!modal.remarks.trim()) {
      setError("Remarks are required for approval");
      return;
    }
    try {
      await axios.put(
        `http://localhost:5000/api/studentservice/requests/${modal.requestId}/approve`,
        { remarks: modal.remarks },
        axiosConfig
      );
      setSuccess("Request approved successfully!");
      setModal({ show: false, type: "", requestId: "", remarks: "" });
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve request");
    }
  };

  const handleReject = async () => {
    if (!modal.remarks.trim()) {
      setError("Remarks are required for rejection");
      return;
    }
    try {
      await axios.put(
        `http://localhost:5000/api/studentservice/requests/${modal.requestId}/reject`,
        { remarks: modal.remarks },
        axiosConfig
      );
      setSuccess("Request rejected successfully!");
      setModal({ show: false, type: "", requestId: "", remarks: "" });
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject request");
    }
  };

  const openModal = (type, requestId) => {
    setError("");
    setSuccess("");
    setModal({ show: true, type, requestId, remarks: "" });
  };

  const handleLogout = () => {
    localStorage.removeItem("ssd_user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="student-dashboard-page">
      {/* Sidebar */}
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">{user.email?.[0]?.toUpperCase() || "S"}</div>
          <div>
            <h3 className="sd-name">{user.email?.split("@")[0]}</h3>
            <p className="sd-small">Student Service Dept</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button
            className={`sd-nav-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            📋 Pending Requests
          </button>
          <button
            className={`sd-nav-btn ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            ✅ Approved Requests
          </button>
          <button
            className={`sd-nav-btn ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            ❌ Rejected Requests
          </button>
        </nav>

        <button className="sd-nav-btn logout" onClick={handleLogout}>
          🚪 Logout
        </button>

        <footer className="sd-footer">© 2025 University Portal</footer>
      </aside>

      {/* Main Content */}
      <div className="sd-main">
        <header className="sd-header">
          <h1>Student Service Dashboard</h1>
          <p>Manage student clearance requests</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div className="loading">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="no-data"><p>No {activeTab} requests</p></div>
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
                    <td><strong>{req.student?.name || "N/A"}</strong></td>
                    <td>{req.student?.rollNumber || "N/A"}</td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${req.status}`}>
                        {req.status}
                      </span>
                    </td>
                    <td><span className="remarks-text">{req.remarks || "—"}</span></td>
                    <td className="actions-cell">
                      {req.status === "pending" && (
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
                      {req.status !== "pending" && <span>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.show && (
        <div className="modal-overlay" onClick={() => setModal({ ...modal, show: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {modal.type === "approve" ? "Approve Request" : "Reject Request"}
            </h2>
            <div className="modal-body">
              <label>
                Remarks <span className="required">*</span>
              </label>
              <textarea
                className="modal-textarea"
                value={modal.remarks}
                onChange={(e) => setModal({ ...modal, remarks: e.target.value })}
                placeholder="Enter remarks..."
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => setModal({ ...modal, show: false })}
              >
                Cancel
              </button>
              <button
                className={`btn ${modal.type === "approve" ? "btn-approve" : "btn-reject"}`}
                onClick={modal.type === "approve" ? handleApprove : handleReject}
              >
                {modal.type === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
