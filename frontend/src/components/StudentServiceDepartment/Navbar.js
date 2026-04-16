import React from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, CheckCircle2, XCircle, MessageSquare, LogOut } from "lucide-react";
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
        <li onClick={() => navigate("/student-dashboard/home")}><LayoutDashboard size={18} /> Home</li>
        <li onClick={() => navigate("/student-dashboard/view-requests")}><ClipboardList size={18} /> View Requests</li>
        <li onClick={() => navigate("/student-dashboard/approved-requests")}><CheckCircle2 size={18} /> Approved</li>
        <li onClick={() => navigate("/student-dashboard/rejected-requests")}><XCircle size={18} /> Rejected</li>
        <li onClick={() => navigate("/student-dashboard/messages")}><MessageSquare size={18} /> Messages</li>
        <li className="logout-btn" onClick={() => navigate("/student-login")}><LogOut size={18} /> Logout</li>
      </ul>
    </nav>
  );
}

export default Navbar;
