import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./LibraryRequests.css";

export default function LibraryRequestsTabs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const tabs = [
    { key: "pending", label: "Pending Requests", icon: "📄" },
    { key: "approved", label: "Approved Requests", icon: "✅" },
    { key: "rejected", label: "Rejected Requests", icon: "❌" },
  ];

  // Fetch data from MySQL table `clearancerequests`
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/library/requests/${activeTab}`);
        console.log("Fetched Requests:", response.data);

        // Ensure backend returns: { requests: [ ... ] }
        setRequests(response.data.requests || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load requests from database.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [activeTab]);

  // ---- Approve ----
  const handleApprove = async (id) => {
    if (actionLoading) return;
    if (!window.confirm("Approve this request?")) return;

    setActionLoading(true);

    try {
      await api.post(`/library/requests/${id}/approve`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to approve request.");
    } finally {
      setActionLoading(false);
    }
  };

  // ---- Reject ----
  const handleReject = async (id) => {
    if (actionLoading) return;
    if (!window.confirm("Reject this request?")) return;

    setActionLoading(true);

    try {
      await api.post(`/library/requests/${id}/reject`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to reject request.");
    } finally {
      setActionLoading(false);
    }
  };

  // Status CSS class
  const statusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "status approved";
      case "pending":
        return "status pending";
      case "rejected":
        return "status rejected";
      default:
        return "status";
    }
  };

  return (
    <div className="student-dashboard-page">
      {/* Sidebar */}
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">L</div>
          <div>
            <h3 className="sd-name">Library Dept</h3>
            <p className="sd-small">Riphah International University</p>
            <p className="sd-small">Clearance Management</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button className="sd-nav-btn" onClick={() => navigate("/library-dashboard")}>
            🏠 Dashboard
          </button>

          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`sd-nav-btn ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span style={{ marginRight: "8px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}

          <button className="sd-nav-btn" onClick={() => navigate("/library-message")}>
            💬 Message Student
          </button>

          <button className="sd-nav-btn" onClick={() => navigate("/library-edit-profile")}>
            📝 Edit Profile
          </button>

          <button className="sd-nav-btn" onClick={() => navigate("/library-login")}>
            🚪 Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      {/* Main Content */}
      <main className="sd-main">
        <h1>{tabs.find((t) => t.key === activeTab)?.label}</h1>

        {loading ? (
          <p>Loading {activeTab} requests...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : requests.length === 0 ? (
          <p>No requests found.</p>
        ) : (
          <div className="table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>SAP ID</th>
                  <th>Program</th>
                  <th>Semester</th>
                  <th>Status</th>
                  {activeTab === "pending" && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {requests.map((req, index) => (
                  <tr key={req.id}>
                    <td>{index + 1}</td>
                    <td>{req.student_name}</td>
                    <td>{req.sapid}</td>
                    <td>{req.program}</td>
                    <td>{req.semester}</td>
                    <td className={statusClass(req.status)}>{req.status}</td>

                    {activeTab === "pending" && (
                      <td>
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading}
                        >
                          ✅ Approve
                        </button>

                        <button
                          className="btn-reject"
                          onClick={() => handleReject(req.id)}
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
      </main>
    </div>
  );
}
