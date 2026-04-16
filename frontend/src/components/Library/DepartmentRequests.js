import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import "./DepartmentRequests.css";

export default function DepartmentRequests() {
  const { department } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const tabs = [
    { key: "pending", label: "Pending Requests" },
    { key: "approved", label: "Approved Requests" },
    { key: "rejected", label: "Rejected Requests" },
  ];

  const fetchRequests = useCallback(async () => {
    if (!department) {
      setError("Department not specified in URL");
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/department/${department}/requests/${activeTab}`);
      // Defensive check for response data
      if (!response.data || !Array.isArray(response.data.requests)) {
        setRequests([]);
        setError("No requests found for this department");
      } else {
        setRequests(response.data.requests);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [department, activeTab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id) => {
    try {
      await api.post(`/department/${department}/requests/${id}/approve`);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to approve request.");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/department/${department}/requests/${id}/reject`);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to reject request.");
    }
  };

  const statusClass = (status) => {
    if (!status) return "status";
    switch (status.toLowerCase()) {
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

  if (!department) return <p style={{ padding: "2rem" }}>Department not specified in URL</p>;

  return (
    <div className="student-dashboard-page">
      <main className="sd-main">
        <h1>{department} Department Requests</h1>

        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading {activeTab} requests...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : requests.length === 0 ? (
          <p>No requests found.</p>
        ) : (
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
                <tr key={req.id || index}>
                  <td>{index + 1}</td>
                  <td>{req.student_name || "-"}</td>
                  <td>{req.sap || "-"}</td>
                  <td>{req.program || "-"}</td>
                  <td>{req.semester || "-"}</td>
                  <td className={statusClass(req.status)}>{req.status || "-"}</td>
                  {activeTab === "pending" && (
                    <td>
                      <button className="btn-approve" onClick={() => handleApprove(req.id)}>
                        ✅ Approve
                      </button>
                      <button className="btn-reject" onClick={() => handleReject(req.id)}>
                        ❌ Reject
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
