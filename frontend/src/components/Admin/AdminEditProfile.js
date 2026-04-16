import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import {
  FiGrid, FiUsers, FiMessageSquare, FiEdit, FiLogOut, FiShield,
  FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiSave, FiArrowLeft,
  FiBriefcase, FiAlertCircle, FiCheckCircle, FiLoader, FiFileText
} from "react-icons/fi";

export default function AdminEditProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const axiosConfig = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    office_location: user?.office_location || "",
    bio: user?.bio || "",
    old_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords if changing password
    if (formData.new_password || formData.old_password || formData.confirm_password) {
      if (!formData.old_password) {
        setError("❌ Current password is required to change password");
        return;
      }
      if (formData.new_password.length < 6) {
        setError("❌ New password must be at least 6 characters");
        return;
      }
      if (formData.new_password !== formData.confirm_password) {
        setError("❌ Passwords do not match");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        office_location: formData.office_location,
        bio: formData.bio
      };

      if (formData.old_password) {
        payload.old_password = formData.old_password;
        payload.new_password = formData.new_password;
      }

      const response = await axios.put(
        apiUrl + "/api/update-profile",
        payload,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Profile updated successfully!");
        setFormData(prev => ({
          ...prev,
          old_password: "",
          new_password: "",
          confirm_password: ""
        }));
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "❌ Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Admin";
  const displayEmail = user?.email || "admin@riphah.edu.pk";

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-[270px] flex flex-col bg-gradient-to-b from-[#0a0f24] via-[#1b2a56] to-[#182848] text-white py-6 px-4 shadow-xl overflow-y-auto shrink-0">
        <div className="flex items-center gap-3 mb-8 pb-5 border-b border-white/10">
          <FiShield size={30} className="text-indigo-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Admin Panel</h1>
        </div>

        <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-indigo-500/30">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{displayName}</h3>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">System Administrator</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <button onClick={() => navigate("/admin-dashboard")} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200">
            <FiGrid size={18} /> Dashboard
          </button>
          <button onClick={() => navigate("/admin-users")} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200">
            <FiUsers size={18} /> User Management
          </button>
          <button onClick={() => navigate("/admin-messages")} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200">
            <FiMessageSquare size={18} /> Messages
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <FiEdit size={18} /> Edit Profile
          </button>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200 mt-4">
          <FiLogOut size={18} /> Logout
        </button>

        <footer className="text-[11px] text-gray-500 text-center pt-4 mt-4 border-t border-white/10">© 2025 Riphah University</footer>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <FiUser className="text-indigo-500" /> Edit Profile
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Update your personal information and account settings</p>
          </div>
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
          >
            <FiArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-[fadeIn_0.3s_ease]">
            <FiAlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm animate-[fadeIn_0.3s_ease]">
            <FiCheckCircle size={18} className="shrink-0" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">

          {/* ── Profile Card ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-500/25 shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-indigo-500 text-sm font-medium">System Administrator</p>
              <p className="text-gray-400 text-sm mt-0.5">{displayEmail}</p>
            </div>
          </div>

          {/* ── Personal Information ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                <FiUser size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
                <p className="text-xs text-gray-500">Your basic personal details</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><FiUser size={14} className="text-gray-400" /> Full Name <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><FiMail size={14} className="text-gray-400" /> Email Address <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@riphah.edu.pk"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><FiPhone size={14} className="text-gray-400" /> Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+92-XXX-XXXXXXX"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* ── Administrative Information ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500">
                <FiBriefcase size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Administrative Information</h3>
                <p className="text-xs text-gray-500">Office details and biography</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Office Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><FiMapPin size={14} className="text-gray-400" /> Office Location</span>
                </label>
                <input
                  type="text"
                  name="office_location"
                  value={formData.office_location}
                  onChange={handleChange}
                  placeholder="e.g., Main Campus, Building A, Room 101"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><FiFileText size={14} className="text-gray-400" /> Bio / About</span>
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Brief biography or role description"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 resize-y"
                />
              </div>
            </div>
          </div>

          {/* ── Change Password ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                <FiLock size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
                <p className="text-xs text-gray-500">Leave empty if you don't want to change your password</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                <input
                  type="password"
                  name="old_password"
                  value={formData.old_password}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <><FiLoader size={16} className="animate-spin" /> Updating...</> : <><FiSave size={16} /> Save Changes</>}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin-dashboard")}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
            >
              <FiArrowLeft size={16} /> Cancel
            </button>
          </div>
        </form>
      </main>

      {/* Keyframe for alert animation */}
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
