import React, { useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import "./CoordinationTable.css";

const rejectedData = [
  { id: 1, name: "Zain Ali", sapid: "FA21-BCS-090", remarks: "Fee not cleared", date: "2025-01-05" },
  { id: 2, name: "Ahmed Khan", sapid: "FA21-BCS-050", remarks: "Outstanding dues", date: "2025-01-04" },
];

function CoordinationRejected() {
  const { user } = useAuthContext();
  const [remarksData, setRemarksData] = useState(
    rejectedData.map((req) => req.remarks)
  );

  const handleRemarksChange = (index, value) => {
    const updatedRemarks = [...remarksData];
    updatedRemarks[index] = value;
    setRemarksData(updatedRemarks);
  };

  return (
    <div className="table-container">
      <h2>❌ Rejected Clearance Requests</h2>
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>Reviewed by: <strong>{user?.full_name || "Coordinator"}</strong></p>
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>SAPID</th>
            <th>Rejection Reason</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {rejectedData.map((req, index) => (
            <tr key={req.id}>
              <td><strong>{req.name}</strong></td>
              <td>{req.sapid}</td>
              <td>
                <input
                  type="text"
                  value={remarksData[index]}
                  onChange={(e) => handleRemarksChange(index, e.target.value)}
                  placeholder="Enter rejection reason"
                />
              </td>
              <td>{req.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CoordinationRejected;

const rejectedData = [\n  { id: 1, name: \"Zain Ali\", sapid: \"FA21-BCS-090\", remarks: \"Fee not cleared\", date: \"2025-01-05\" },\n  { id: 2, name: \"Ahmed Khan\", sapid: \"FA21-BCS-050\", remarks: \"Outstanding dues\", date: \"2025-01-04\" },\n];\n\nfunction CoordinationRejected() {\n  const { user } = useAuthContext();\n  const [remarksData, setRemarksData] = useState(\n    rejectedData.map((req) => req.remarks)\n  );\n\n  const handleRemarksChange = (index, value) => {\n    const updatedRemarks = [...remarksData];\n    updatedRemarks[index] = value;\n    setRemarksData(updatedRemarks);\n  };\n\n  return (\n    <div className=\"table-container\">\n      <h2>❌ Rejected Clearance Requests</h2>\n      <p style={{ color: \"#6b7280\", marginBottom: \"20px\" }}>Reviewed by: <strong>{user?.full_name || \"Coordinator\"}</strong></p>\n      <table>\n        <thead>\n          <tr>\n            <th>Student Name</th>\n            <th>SAPID</th>\n            <th>Rejection Reason</th>\n            <th>Date</th>\n          </tr>\n        </thead>\n        <tbody>\n          {rejectedData.map((req, index) => (\n            <tr key={req.id}>\n              <td><strong>{req.name}</strong></td>\n              <td>{req.sapid}</td>\n              <td>\n                <input\n                  type=\"text\"\n                  value={remarksData[index]}\n                  onChange={(e) => handleRemarksChange(index, e.target.value)}\n                  placeholder=\"Enter rejection reason\"\n                />\n              </td>\n              <td>{req.date}</td>\n            </tr>\n          ))}\n        </tbody>\n      </table>\n    </div>\n  );\n}\n\nexport default CoordinationRejected;"
