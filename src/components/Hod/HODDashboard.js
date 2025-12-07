import React, { useState } from "react";
import "./HODDashboard.css";
import Barcode from "react-barcode";

const studentClearanceData = [
  {
    id: 1,
    name: "Ali Raza",
    rollNo: "FA21-BCS-123",
    departments: {
      fee: "Cleared",
      library: "Cleared",
      sports: "Cleared",
      hostel: "Cleared",
    },
  },
  {
    id: 2,
    name: "Sara Khan",
    rollNo: "FA21-BCS-145",
    departments: {
      fee: "Pending",
      library: "Cleared",
      sports: "Cleared",
      hostel: "Cleared",
    },
  },
];

export default function HODDashboard() {
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleApproval = (student) => {
    setSelectedStudent(student);
  };

  const allClear = (departments) =>
    Object.values(departments).every((status) => status === "Cleared");

  return (
    <div className="hod-dashboard-page">
      {/* Sidebar */}
      <aside className="hod-sidebar">
        <div className="hod-profile">
          <h2>HOD Panel</h2>
          <p>Department of Computer Science</p>
        </div>

        <nav className="hod-menu">
          <button className="menu-active">📜 Clearance Requests</button>
          <button>📩 Messages</button>
          <button className="logout-btn">🚪 Logout</button>
        </nav>

        <footer className="hod-footer">© 2025 University Portal</footer>
      </aside>

      {/* Main Content */}
      <main className="hod-main-content">
        <header className="hod-header">
          <h1>Student Clearance Overview</h1>
          <p>Review student clearance status from all departments.</p>
        </header>

        {/* Student Table */}
        <div className="table-wrapper">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Fee</th>
                <th>Library</th>
                <th>Sports</th>
                <th>Hostel</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {studentClearanceData.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.rollNo}</td>
                  <td>{student.departments.fee}</td>
                  <td>{student.departments.library}</td>
                  <td>{student.departments.sports}</td>
                  <td>{student.departments.hostel}</td>
                  <td>
                    {allClear(student.departments) ? (
                      <button
                        className="approve-btn"
                        onClick={() => handleApproval(student)}
                      >
                        ✅ Generate Barcode
                      </button>
                    ) : (
                      <button className="pending-btn">⏳ Pending</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Barcode Section */}
        {selectedStudent && allClear(selectedStudent.departments) && (
          <div className="barcode-area">
            <h2>✅ Final Clearance Approved</h2>
            <p>
              Student: <strong>{selectedStudent.name}</strong> <br />
              Roll No: <strong>{selectedStudent.rollNo}</strong>
            </p>
            <div className="barcode-box">
              <Barcode value={selectedStudent.rollNo} />
            </div>
            <button className="print-btn" onClick={() => window.print()}>
              🖨 Print Clearance Slip
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
