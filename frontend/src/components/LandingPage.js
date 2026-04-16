import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Header Section */}
      <header className="header">
        <div className="header-content">
          {/* University Logo */}
          <img
            src="/logo512.png"
            alt="Riphah University Logo"
            className="landing-logo"
          />

          <h1>Welcome to Riphah Student Clearance Portal</h1>
          <p>
            Streamline your clearance process across all university departments — 
            fast, paperless, and secure.
          </p>

          <div className="header-buttons">
            <button className="student-btn" onClick={() => navigate("/student-login")}>
              🎓 Student Login
            </button>
            <button className="dept-btn" onClick={() => navigate("/login")}>
              🏢 Department Login
            </button>
          </div>
        </div>
      </header>

      {/* Footer */}
      <footer className="footer">
        © 2025 Riphah International University | Student Clearance System
      </footer>
    </div>
  );
}
