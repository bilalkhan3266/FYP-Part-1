import React, { useState, useEffect } from "react";
import { getApiUrl } from "../../config/apiConfig";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { 
  LayoutDashboard, UserPen, MessageSquare, LogOut,
  BookOpen, AlertCircle, CheckCircle, Lock, Mail, Save, Camera
} from "lucide-react";
import axios from "axios";

export default function LibraryEditProfile() {
  const { user, setUser, logout } = useAuthContext();
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
      const apiUrl = getApiUrl();

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
          navigate("/library-dashboard");
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-[280px] flex flex-col bg-gradient-to-b from-[#0a0f24] via-[#1b2a56] to-[#182848] text-white py-6 px-4 shadow-xl overflow-y-auto shrink-0">
        {/* Logo & Title */}
        <div className="flex items-center gap-3 mb-8 pb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-lg">
            <BookOpen size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">Library</h1>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-blue-500/30">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "L"}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{user?.full_name || "Library"}</h3>
            <p className="text-[11px] text-gray-300 truncate">{user?.sap || "N/A"} • {user?.department || "Library"}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          <button
            onClick={() => navigate("/library-dashboard")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
          >
            <UserPen size={18} /> Edit Profile
          </button>
          <button
            onClick={() => navigate("/library-messages")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <MessageSquare size={18} /> Messages
          </button>
        </nav>

        {/* Logout Button */}
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200 mt-4">
          <LogOut size={18} /> Logout
        </button>

        {/* Footer */}
        <footer className="text-[11px] text-gray-500 text-center pt-4 mt-4 border-t border-white/10">© 2025 Riphah</footer>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Hero Header Card */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <UserPen size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Profile</h1>
              <p className="text-gray-600 mt-1">Update your profile information and password</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Alerts */}
            <div className="px-6 pt-6">
              {error && (
                <div className="flex items-start gap-3 mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-[fadeIn_0.3s_ease]">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-3 mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm animate-[fadeIn_0.3s_ease]">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}
            </div>

            {/* Form Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Profile Information Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserPen size={20} className="text-blue-600" /> Profile Information
                </h3>

                {/* Full Name */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                {/* Email */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" /> Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Security Section */}
              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock size={20} className="text-blue-600" /> Security
                </h3>

                {/* Password */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password <span className="text-gray-400 text-xs font-normal">(leave blank to keep current)</span></label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                {/* Confirm Password */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 px-6 py-5 bg-gray-50 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>⏳ Saving...</>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/library-dashboard")}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}