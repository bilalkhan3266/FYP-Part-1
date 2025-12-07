import React from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import "./CoordinationTable.css";

const approvedRequests = [
  { id: 1, name: "Sana Riaz", sapid: "FA20-BBA-032", status: "Approved", date: "2025-01-08", reviewedBy: "Coordinator" },
  { id: 2, name: "Hamza Ali", sapid: "FA21-BSSE-120", status: "Approved", date: "2025-01-07", reviewedBy: "Coordinator" },
  { id: 3, name: "Bilal Ahmed", sapid: "FA20-BCE-077", status: "Approved", date: "2025-01-06", reviewedBy: "Coordinator" },
];

function CoordinationApproved() {
  const { user } = useAuthContext();

  return (
    <div className="table-container">
      <h2>✅ Approved Clearance Requests</h2>
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>Reviewed by: <strong>{user?.full_name || "Coordinator"}</strong></p>
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>SAPID</th>
            <th>Status</th>
            <th>Approved Date</th>\n            <th>Reviewed By</th>
          </tr>
        </thead>
        <tbody>
          {approvedRequests.map((req) => (
            <tr key={req.id}>
              <td><strong>{req.name}</strong></td>
              <td>{req.sapid}</td>
              <td>
                <span style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))",
                  color: "#065f46",
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
              <td>{req.reviewedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CoordinationApproved;
