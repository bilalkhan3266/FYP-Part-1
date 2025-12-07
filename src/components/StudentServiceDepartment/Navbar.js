import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles/navbar.css"; // Linking external CSS

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h2>Student Service Dept</h2>
        <p>Riphah International University</p>
      </div>

      <ul className="navbar-links">
        <li onClick={() => navigate("/student-dashboard/home")}>🏠 Home</li>
        <li onClick={() => navigate("/student-dashboard/view-requests")}>📄 View Requests</li>
        <li onClick={() => navigate("/student-dashboard/approved-requests")}>✅ Approved</li>
        <li onClick={() => navigate("/student-dashboard/rejected-requests")}>❌ Rejected</li>
        <li onClick={() => navigate("/student-dashboard/messages")}>💬 Messages</li>
        <li className="logout-btn" onClick={() => navigate("/student-login")}>🚪 Logout</li>
      </ul>
    </nav>
  );
}

export default Navbar;
