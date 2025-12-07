import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EditProfile.css"; // Reuse the same CSS

export default function LibraryEditProfile() {
  const navigate = useNavigate();

  const savedUser = JSON.parse(localStorage.getItem("user")) || {};

  const [form, setForm] = useState({
    name: "",
    sap: "",
    department: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setForm({
      name: savedUser.name || "",
      sap: savedUser.sap || "",
      department: savedUser.department || "",
      email: savedUser.email || "",
      password: "",
      confirmPassword: "",
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: form.name,
          sap: form.sap,
          department: form.department,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Update failed");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...savedUser,
          name: form.name,
          sap: form.sap,
          department: form.department,
          email: form.email,
        })
      );

      alert("Profile updated successfully!");
      navigate(-1);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Server error");
    }
  };

  const handleLogout = () => navigate("/library-login");
  const handleHome = () => navigate("/");

  return (
    <div className="student-dashboard-page">
      {/* ---- SIDEBAR ---- */}
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
          <button className="sd-nav-btn" onClick={() => navigate("/library-home")}>
            🏠 Home
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/library-requests")}
          >
            📄 View Requests
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/library-approved")}
          >
            ✅ Approved Requests
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/library-rejected")}
          >
            ❌ Rejected Requests
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/library-message")}
          >
            💬 Message Student
          </button>
          <button
            className="sd-nav-btn"
            onClick={() => navigate("/library-edit-profile")}
          >
            📝 Edit Profile
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
          <h1>Edit Library Profile</h1>
          {/* <p>Update your information and password below.</p> */}
        </header>

        <form className="edit-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            SAP ID
            <input
              type="text"
              name="sap"
              value={form.sap}
              onChange={handleChange}
            />
          </label>

          <label>
            Department
            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <hr className="divider" />

          <label>
            New Password (optional)
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </label>

          <div className="form-buttons">
            <button type="submit" className="save-btn">
              Save Changes
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
