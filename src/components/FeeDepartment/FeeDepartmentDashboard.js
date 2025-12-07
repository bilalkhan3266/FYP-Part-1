import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FeeDashboard.css";

export default function FeeDepartmentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ full_name: "", sap: "", department: "" });

  useEffect(() => {
    // Fetch user data from API
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token"); // assuming auth token
        const res = await fetch("http://localhost:5000/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch user data");
        const data = await res.json();
        setUser({
          full_name: data.full_name || "Fee Dept",
          sap: data.sap || "N/A",
          department: data.department || "N/A",
        });
      } catch (err) {
        console.error(err);
        setUser({ full_name: "Fee Dept", sap: "N/A", department: "N/A" });
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => navigate("/fee-login");

  return (
    <div className="student-dashboard-page">
      {/* ---- SIDEBAR ---- */}
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : "F"}
          </div>
          <div>
            <h3 className="sd-name">{user.full_name || "Fee Dept"}</h3>
            <p className="sd-small">{user.sap || "N/A"} • {user.department || "N/A"}</p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button className="sd-nav-btn" onClick={() => navigate("/edit-profile")}>
            📝 Edit Profile
          </button>

          <button
            className="sd-nav-btn"
            onClick={() => alert("Viewing pending student requests")}
          >
            📄 View Student Requests
          </button>

          <button
            className="sd-nav-btn"
            onClick={() => alert("Approved Requests")}
          >
            ✅ Approved Requests
          </button>

          <button
            className="sd-nav-btn"
            onClick={() => {
              const remarks = prompt("Enter rejection remarks:");
              if (remarks) alert(`Rejected with remarks: ${remarks}`);
            }}
          >
            ❌ Reject Request
          </button>

          <button
            className="sd-nav-btn"
            onClick={() => navigate("/fee-messages")}
          >
            💬 Messages
          </button>

          <button className="sd-nav-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      {/* ---- MAIN CONTENT ---- */}
      <main className="sd-main">
        <header className="sd-header">
          <div>
            <h1>Fee Department Dashboard</h1>
            <p>Manage student fee clearance efficiently.</p>
          </div>
        </header>

        {/* ---- CARDS ---- */}
        <section className="sd-cards">
          <article
            className="sd-card"
            onClick={() => alert("Viewing student requests")}
          >
            <div className="sd-card-head">
              <h4>📄 View Requests</h4>
            </div>
            <p>See all pending student clearance requests.</p>
          </article>

          <article
            className="sd-card"
            onClick={() => alert("Viewing approved requests")}
          >
            <div className="sd-card-head">
              <h4>✅ Approved Requests</h4>
            </div>
            <p>View all approved fee clearance records.</p>
          </article>

          <article
            className="sd-card"
            onClick={() => {
              const remarks = prompt("Enter rejection remarks:");
              if (remarks) alert(`Rejected with remarks: ${remarks}`);
            }}
          >
            <div className="sd-card-head">
              <h4>❌ Reject Request</h4>
            </div>
            <p>Reject a student clearance with remarks.</p>
          </article>

          <article
            className="sd-card"
            onClick={() => navigate("/fee-messages")}
          >
            <div className="sd-card-head">
              <h4>💬 Messages</h4>
            </div>
            <p>Chat with students or other departments.</p>
          </article>

          <article className="sd-card" onClick={handleLogout}>
            <div className="sd-card-head">
              <h4>🚪 Logout</h4>
            </div>
            <p>Sign out from the dashboard.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
