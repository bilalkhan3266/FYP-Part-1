// src/components/Dashboard.js
import React from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import Home from "./ServiceHome";
import ViewRequests from "./ServiceViewRequests";
import ApprovedRequests from "./ApprovedRequests";
import RejectedRequests from "./RejectedRequests";
import Messages from "./Messages";
import "./styles/dashboard.css";
import "./styles/navbar.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("ssd_user") || "null");
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("ssd_user");
    navigate("/");
  };

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <div className="student-info">
          <h2>{user.email.split("@")[0]}</h2>
          <p>Student Service Dept</p>
        </div>

        <nav>
          <Link to="home"><button className="nav-btn">🏠 Home</button></Link>
          <Link to="view"><button className="nav-btn">📄 View Requests</button></Link>
          <Link to="approved"><button className="nav-btn">✅ Approved Requests</button></Link>
          <Link to="rejected"><button className="nav-btn">❌ Rejected Requests</button></Link>
          <Link to="messages"><button className="nav-btn">💬 Messages</button></Link>
        </nav>

        <footer>
          <button className="nav-btn logout" onClick={handleLogout}>🚪 Logout</button>
        </footer>
      </aside>

      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Student Service Dashboard</h1>
          <p>Welcome, {user.email}</p>
        </div>

        <div className="program-details">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="view" element={<ViewRequests />} />
            <Route path="approved" element={<ApprovedRequests />} />
            <Route path="rejected" element={<RejectedRequests />} />
            <Route path="messages" element={<Messages />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
