// src/components/ApprovedRequests.js
import React, { useEffect, useState } from "react";
import "./styles/dashboard.css";

export default function ApprovedRequests() {
  const [approved, setApproved] = useState([]);

  useEffect(() => {
    setApproved(JSON.parse(localStorage.getItem("ssd_approved") || "[]"));
  }, []);

  return (
    <div>
      <h2>Approved Requests</h2>
      {approved.length === 0 && <p>No approved requests yet.</p>}
      <div className="requests-list">
        {approved.map((a) => (
          <div key={a.id} className="request-card approved">
            <div>
              <strong>{a.serviceType}</strong> — {a.name} ({a.studentId})
              <p className="muted">Approved at: {new Date(a.approvedAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
