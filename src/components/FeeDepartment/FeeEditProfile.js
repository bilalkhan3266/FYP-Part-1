import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import "./FeeEditProfile.css";

export default function FeeEditProfile() {
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
          navigate("/fee-dashboard");
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
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "F"}
          </div>
          <div>
            <h3 className="sd-name">{user?.full_name || "Fee Department"}</h3>
            <p className="sd-small">
              {user?.sap || "N/A"} • {user?.department || "Fee Department"}
            </p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button className="sd-nav-btn" onClick={() => navigate("/fee-dashboard")}>
            🏠 Dashboard
          </button>
          <button className="sd-nav-btn active">📝 Edit Profile</button>
          <button className="sd-nav-btn" onClick={() => navigate("/fee-messages")}>
            💬 Messages
          </button>
          <button className="sd-nav-btn" onClick={() => navigate("/fee-dashboard")}>
            🚪 Back
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

      {/* MAIN CONTENT */}
      <main className="edit-form-main">
        <form className="edit-form" onSubmit={handleSubmit}>
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
              onClick={() => navigate("/fee-dashboard")}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
