// src/components/RejectedRequests.js
import React, { useEffect, useState } from "react";
import "./styles/dashboard.css";

export default function RejectedRequests() {
  const [rejected, setRejected] = useState([]);

  useEffect(() => {
    setRejected(JSON.parse(localStorage.getItem("ssd_rejected") || "[]"));
  }, []);

  return (
    <div>
      <h2>Rejected Requests</h2>
      {rejected.length === 0 && <p>No rejected requests yet.</p>}
      <div className="requests-list">
        {rejected.map((r) => (
          <div key={r.id} className="request-card rejected">
            <div>
              <strong>{r.serviceType}</strong> — {r.name} ({r.studentId})
              <p className="muted">Rejected at: {new Date(r.rejectedAt).toLocaleString()}</p>
              <p><strong>Remarks:</strong> {r.remarks}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
