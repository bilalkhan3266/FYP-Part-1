import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuthContext } from "../../contexts/AuthContext";
import "./ClearanceApprovalPanel.css";

export default function ClearanceApprovalPanel() {
  const { user } = useAuthContext();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [approving, setApproving] = useState(false);
  const [modal, setModal] = useState({ show: false, requestId: "", remarks: "" });

  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("📋 Fetching pending HOD approvals...");

      const response = await axios.get(`${apiUrl}/api/hod/pending-approvals`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        console.log(`✅ Found ${response.data.count} pending approvals`);
        setPendingApprovals(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching approvals:", err);
      setError(
        err.response?.data?.message || "Failed to fetch pending approvals"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (requestId) => {
    setModal({ show: true, requestId, remarks: "" });
    setError("");
    setSuccess("");
  };

  const handleApprove = async () => {
    if (!modal.remarks.trim()) {
      setError("⚠️ Please add remarks before approving");
      return;
    }

    try {
      setApproving(true);
      console.log(`🔐 HOD approving request: ${modal.requestId}`);

      const response = await axios.post(
        `${apiUrl}/api/hod/approve-clearance/${modal.requestId}`,
        { remarks: modal.remarks },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSuccess(`✅ Clearance approved! QR Code: ${response.data.qrCode}`);
        console.log("📊 QR Code generated:", response.data.qrCode);
        setModal({ show: false, requestId: "", remarks: "" });
        
        // Refresh the list
        setTimeout(() => {
          fetchPendingApprovals();
          setSuccess("");
        }, 2000);
      }
    } catch (err) {
      console.error("Approval error:", err);
      setError(err.response?.data?.message || "Failed to approve clearance");
    } finally {
      setApproving(false);
    }
  };

  const displayName = user?.full_name || user?.email || "HOD";

  if (loading) {
    return (
      <div className="clearance-approval-page">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>⏳ Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clearance-approval-page">
      <main className="cap-main">
        <header className="cap-header">
          <h1>🎓 Student Clearance Final Approval</h1>
          <p>Review and approve clearance requests ready from all departments</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="cap-stats">
          <div className="stat-card">
            <div className="stat-number">{pendingApprovals.length}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {pendingApprovals.filter((r) =>
                r.departmentStatus?.every((d) => d.status === "Approved")
              ).length}
            </div>
            <div className="stat-label">Ready to Process</div>
          </div>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="no-data-container">
            <div className="no-data">
              <p>📭 No pending clearance requests</p>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>
                All student clearances are up to date
              </p>
            </div>
          </div>
        ) : (
          <div className="approvals-grid">
            {pendingApprovals.map((clearance) => (
              <div key={clearance._id} className="approval-card">
                <div className="card-header">
                  <div className="student-info">
                    <h3>{clearance.student_name}</h3>
                    <p className="sap-id">SAP ID: {clearance.sapid}</p>
                  </div>
                  <span className="badge badge-pending">⏳ Ready for HOD</span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Registration No:</span>
                    <span className="value">{clearance.registration_no}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Program:</span>
                    <span className="value">{clearance.program}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Semester:</span>
                    <span className="value">{clearance.semester}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Degree Status:</span>
                    <span className="value">{clearance.degree_status}</span>
                  </div>

                  <div className="departments-status">
                    <h4>Department Approvals:</h4>
                    <div className="dept-list">
                      {clearance.departmentStatus?.map((dept, idx) => (
                        <div key={idx} className="dept-item">
                          <span className="dept-name">{dept.department_name}</span>
                          {dept.status === "Approved" ? (
                            <span className="status approved">✅ Approved</span>
                          ) : (
                            <span className="status pending">⏳ Pending</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    onClick={() => handleApproveClick(clearance._id)}
                    className="btn-approve"
                    disabled={approving}
                  >
                    🎓 Approve & Generate Certificate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🔐 Approve Clearance</h2>
              <button
                className="modal-close"
                onClick={() => setModal({ show: false, requestId: "", remarks: "" })}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-text">
                Please review and add any remarks before approving this student's
                clearance.
              </p>

              <textarea
                className="remarks-textarea"
                placeholder="Add remarks (optional)..."
                value={modal.remarks}
                onChange={(e) =>
                  setModal({ ...modal, remarks: e.target.value })
                }
                rows="4"
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setModal({ show: false, requestId: "", remarks: "" })}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? "⟳ Approving..." : "✅ Approve & Generate QR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
