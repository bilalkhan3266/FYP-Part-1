import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./LibraryDashboard.css";

export default function LibraryDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    navigate("/library-login");
  };

  const handleHome = () => navigate("/");

  // Define dashboard cards with dynamic links
  const cards = [
    { title: "📄 Pending Requests", desc: "Review pending student clearance requests.", path: "/department-requests/Library" },
    { title: "✅ Approved Requests", desc: "View all approved clearance forms.", path: "/department-requests/Library?status=approved" },
    { title: "❌ Rejected Requests", desc: "Manage rejected student clearance forms.", path: "/department-requests/Library?status=rejected" },
    { title: "💬 Messages", desc: "Communicate with students directly.", path: "/library-message" },
    { title: "📝 Edit Profile", desc: "Update your profile information.", path: "/library-edit-profile" },
    { title: "🚪 Logout", desc: "Sign out from your dashboard.", action: handleLogout },
  ];

  return (
    <div className="student-dashboard-page">
      {/* Sidebar */}
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">L</div>
          <div>
            <h3 className="sd-name">Library Dept</h3>
            <p className="sd-small">Riphah International University</p>
            <p className="sd-small">Clearance Management</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button className="sd-nav-btn" onClick={handleHome}>🏠 Home</button>
          <button className="sd-nav-btn" onClick={() => navigate("/department-requests/Library")}>📄 View Requests</button>
          <button className="sd-nav-btn" onClick={() => navigate("/library-message")}>💬 Message Student</button>
          <button className="sd-nav-btn sd-edit-btn" onClick={() => navigate("/library-edit-profile")}>📝 Edit Profile</button>
          <button className="sd-nav-btn" onClick={handleLogout}>🚪 Logout</button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      {/* Main Content */}
      <main className="sd-main">
        <header className="sd-header">
          <h1>Library Clearance Dashboard</h1>
          <p>Manage and approve student clearance requests.</p>
        </header>

        <section className="sd-cards">
          {cards.map((card, idx) => (
            <article
              key={idx}
              className="sd-card"
              onClick={card.action ? card.action : () => navigate(card.path)}
            >
              <div className="sd-card-head">
                <h4>{card.title}</h4>
              </div>
              <p>{card.desc}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
