import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { LayoutDashboard, ClipboardList, CheckCircle2, MessageSquare, UserPen, LogOut, GraduationCap } from "lucide-react";
import axios from "axios";
import "./EditProfile.css";
import "./Dashboard.css";

/* Shared Sidebar Component */
function StudentSidebar({ displayName, displaySap, displayDept, onLogout, className }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { path: "/student-dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student-clearance-request", icon: ClipboardList, label: "Submit Request" },
    { path: "/student-clearance-status", icon: CheckCircle2, label: "Clearance Status" },
    { path: "/student-messages", icon: MessageSquare, label: "Messages" },
    { path: "/student-edit-profile", icon: UserPen, label: "Edit Profile" },
  ];
  return (
    <aside className={`sd-sidebar${className ? " " + className : ""}`}>
      <div className="sd-sidebar-top">
        <div className="sd-brand"><div className="sd-brand-icon"><GraduationCap size={22} /></div><span className="sd-brand-text">Riphah Clearance</span></div>
        <div className="sd-profile"><div className="sd-avatar">{displayName ? displayName.charAt(0).toUpperCase() : "?"}</div><div className="sd-profile-info"><h3 className="sd-name">{displayName}</h3><p className="sd-meta">{displaySap}</p><p className="sd-meta">{displayDept}</p></div></div>
        <nav className="sd-nav">
          {navItems.map((item) => { const Icon = item.icon; const isActive = location.pathname === item.path; return (
            <button key={item.path} className={`sd-nav-btn${isActive ? " active" : ""}`} onClick={() => navigate(item.path)}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} /><span>{item.label}</span>{isActive && <span className="sd-active-indicator" />}
            </button>
          ); })}
        </nav>
      </div>
      <div className="sd-sidebar-bottom">
        <button className="sd-nav-btn sd-logout-btn" onClick={onLogout}><LogOut size={18} /><span>Logout</span></button>
        <footer className="sd-footer">© 2025 Riphah International University</footer>
      </div>
    </aside>
  );
}

export default function EditProfile() {
  const { user, setUser } = useAuthContext();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        password: "",
        confirmPassword: ""
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!form.full_name || !form.email) {
      setError("❌ Full name and email are required");
      return;
    }

    if (form.password && form.password.length < 6) {
      setError("❌ Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("❌ Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const updateData = {
        full_name: form.full_name.trim(),
        email: form.email.trim()
      };

      if (form.password) {
        updateData.password = form.password;
      }

      const response = await axios.put(
        apiUrl + "/api/update-profile",
        updateData,
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Profile updated successfully!");
        
        // Update user in context
        const updatedUser = response.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        setTimeout(() => {
          navigate("/student-dashboard");
        }, 1500);
      } else {
        setError(response.data.message || "❌ Failed to update profile");
      }
    } catch (err) {
      console.error("Update Profile Error:", err);
      setError(err.response?.data?.message || "❌ Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-page">
      {/* SIDEBAR */}
      <StudentSidebar displayName={user?.full_name || "Student"} displaySap={user?.sap || "N/A"} displayDept={user?.department || "N/A"} onLogout={() => navigate("/student-dashboard")} />

      {/* MAIN CONTENT */}
      <main className="edit-form-main">
        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="form-logo">
            <img src="/logo192.png" alt="Riphah Monogram" />
          </div>
          <h1>Edit Profile</h1>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <label>Full Name *</label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />

          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />

          <label>New Password (leave blank to keep current)</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter new password"
          />

          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
          />

          <div className="form-buttons">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Saving..." : "💾 Save Changes"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/student-dashboard")}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
