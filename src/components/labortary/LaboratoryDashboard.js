import React from "react";
import "./LaboratoryDashboard.css"; // Separate CSS for this page only

export default function LaboratoryDashboard() {
  const options = [
    { title: "Manage Tests" },
    { title: "Test Results" },
    { title: "Patient Records" },
    { title: "Staff Management" },
    { title: "Logout", type: "logout" },
  ];

  return (
    <div className="lab-dashboard-page">
      {/* Sidebar */}
      <aside className="lab-sidebar">
        <div className="lab-profile">
          <h2>Laboratory System</h2>
          <p>Admin Panel</p>
        </div>

        <nav>
          {options.map((item, index) => (
            <button
              key={index}
              className={`lab-menu-item ${item.type === "logout" ? "logout" : ""}`}
            >
              {item.title}
            </button>
          ))}
        </nav>

        <footer className="lab-footer">© 2025 Lab Management</footer>
      </aside>

      {/* Main Content */}
      <main className="lab-content">
        <header className="lab-header">
          <h1>Laboratory Dashboard</h1>
          <p>Select an option from the sidebar to get started.</p>
        </header>

        <section className="lab-overview">
          <h2>Overview</h2>
          <div className="lab-grid">
            <div className="lab-card">
              <strong>Total Tests</strong>
              <p>120</p>
            </div>
            <div className="lab-card">
              <strong>Pending Reports</strong>
              <p>45</p>
            </div>
            <div className="lab-card">
              <strong>Registered Patients</strong>
              <p>300+</p>
            </div>
            <div className="lab-card">
              <strong>Lab Staff</strong>
              <p>15</p>
            </div>
          </div>

          <div className="lab-buttons">
            <button className="lab-btn primary">Add Test</button>
            <button className="lab-btn secondary">Generate Report</button>
          </div>
        </section>
      </main>
    </div>
  );
}
