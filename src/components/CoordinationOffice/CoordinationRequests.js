import React, { useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import "./CoordinationTable.css";

const dummyRequests = [
  { id: 1, name: "Ali Khan", sapid: "FA21-BCS-001", status: "Pending", date: "2025-01-12", program: "BSSE", semester: "7" },
  { id: 2, name: "Ayesha Malik", sapid: "FA21-BCS-045", status: "Pending", date: "2025-01-11", program: "BSSE", semester: "6" },
  { id: 3, name: "Bilal Ahmed", sapid: "FA20-BCE-077", status: "Pending", date: "2025-01-10", program: "BCE", semester: "8" },
];

function CoordinationRequests() {
  const { user } = useAuthContext();
  const [requests] = useState(dummyRequests);

  const handleApprove = (id) => {
    console.log(Approved request $+"{id}");
    // API call to approve would go here
  };

  const handleReject = (id) => {
    console.log(Rejected request $+"{id}");
    // API call to reject would go here
  };

  return (
    <div className="table-container">
      <h2> Pending Student Requests</h2>
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>Coordinator: <strong>{user?.full_name || "System"}</strong></p>
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>SAPID</th>
            <th>Program</th>
            <th>Semester</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td><strong>{req.name}</strong></td>
              <td>{req.sapid}</td>
              <td>{req.program}</td>
              <td>{req.semester}</td>
              <td>
                <span style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1))",
                  color: "#92400e",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  {req.status}
                </span>
              </td>
              <td>{req.date}</td>
              <td>
                <button onClick={() => handleApprove(req.id)} style={{ marginRight: "8px", color: "#10b981" }}> Approve</button>
                <button onClick={() => handleReject(req.id)} style={{ color: "#ef4444" }}> Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CoordinationRequests;
