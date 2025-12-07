import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FeeEditProfile.css";                         

export default function FeeEditProfile() {
  const navigate = useNavigate(); 

  // Load fee user data from localStorage
  const storedFeeUser = JSON.parse(localStorage.getItem("feeUser")) || {};

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
      name: storedFeeUser.name || "",
      sap: storedFeeUser.sap || "",
      department: storedFeeUser.department || "",
      email: storedFeeUser.email || "",
      password: "",
      confirmPassword: "",
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      // Save to localStorage (or API call)
      localStorage.setItem(
        "feeUser",
        JSON.stringify({
          ...storedFeeUser,
          name: form.name,
          sap: form.sap,
          department: form.department,
          email: form.email,
        })
      );

      alert("Fee Profile updated successfully!");
      navigate("/fee-dashboard");
    } catch (error) {
      console.error("Error updating Fee Profile:", error);
      alert("Failed to update Fee Profile.");
    }
  };

  const handleCopyData = () => {
    const data = `Name: ${form.name}\nSAP: ${form.sap}\nDepartment: ${form.department}\nEmail: ${form.email}`;
    navigator.clipboard.writeText(data);
    alert("Profile data copied to clipboard!");
  };

  return (
    <div className="edit-profile-page">
      {/* SIDEBAR */}
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">{storedFeeUser.name ? storedFeeUser.name.charAt(0).toUpperCase() : "F"}</div>
          <div>
            <h3 className="sd-name">{storedFeeUser.name || "Fee Dept"}</h3>
            <p className="sd-small">{storedFeeUser.sap || "N/A"} • {storedFeeUser.department || "N/A"}</p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button className="sd-nav-btn" onClick={() => navigate("/fee-dashboard")}>🏠 Dashboard</button>
          <button className="sd-nav-btn active">📝 Edit Profile</button>
          <button className="sd-nav-btn" onClick={() => navigate("/fee-requests")}>📄 Requests</button>
          <button className="sd-nav-btn" onClick={() => navigate("/fee-approved")}>✅ Approved Requests</button>
          <button className="sd-nav-btn" onClick={() => navigate("/fee-rejected")}>❌ Rejected Requests</button>
          <button className="sd-nav-btn" onClick={() => navigate("/login")}>🚪 Logout</button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      {/* MAIN CONTENT */}
      <main className="edit-form-main">
        <form className="edit-form" onSubmit={handleSubmit}>
          <img src="/mnt/data/27ea833f-8d9a-41e7-9536-fe6207c75f8b.png" alt="Riphah Monogram" className="riphah-logo" />
          <h1>Edit Fee Profile</h1>

          <label>Full Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required />

          <label>SAP ID</label>
          <input type="text" name="sap" value={form.sap} onChange={handleChange} required />

          <label>Department</label>
          <input type="text" name="department" value={form.department} onChange={handleChange} required />

          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />

          <label>New Password</label>
          <input type="password" name="password" placeholder="Leave blank to keep same password" value={form.password} onChange={handleChange} />

          <label>Confirm Password</label>
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />

          <div className="form-buttons">
            <button type="submit" className="save-btn">Save Changes</button>
            <button type="button" className="cancel-btn" onClick={() => navigate("/fee-dashboard")}>Cancel</button>
            <button type="button" className="copy-btn" onClick={handleCopyData}>Copy Data</button>
          </div>
        </form>
      </main>
    </div>
  );
}
