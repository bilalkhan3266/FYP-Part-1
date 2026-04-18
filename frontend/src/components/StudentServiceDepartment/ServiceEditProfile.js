import React, { useState } from "react";
import { getApiUrl } from "../../config/apiConfig";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { LayoutDashboard, MessageSquare, UserPen, LogOut, Mail, Lock, Save, AlertTriangle, CheckCircle } from "lucide-react";
import axios from "axios";

export default function ServiceEditProfile() {
  const { user, setUser, logout } = useAuthContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    department: user?.department || "",
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

    // Validate required fields
    if (!formData.full_name.trim()) {
      setError("❌ Full name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("❌ Email is required");
      return;
    }

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
      const token = localStorage.getItem("token");
      const apiUrl = getApiUrl();

      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone || undefined,
        department: formData.department || undefined
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
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Profile updated successfully!");
        
        // Update user context
        const updatedUser = {
          ...user,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Reset password fields
        setFormData(prev => ({
          ...prev,
          old_password: "",
          new_password: "",
          confirm_password: ""
        }));

        setTimeout(() => {
          setSuccess("");
          navigate("/service-dashboard");
        }, 1500);
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

  const handleCancel = () => {
    navigate("/service-dashboard");
  };

  const displayName = user?.full_name || "Service Staff";
  const displaySap = user?.sap || "N/A";

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-[280px] bg-gradient-to-b from-[#0a3d2e] via-[#1a5c47] to-[#0d4835] text-white p-6 shadow-lg overflow-y-auto">
        {/* Profile Card */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-white">{displayName}</h3>
          <p className="text-sm text-emerald-200">{displaySap} • Service</p>
          <p className="text-xs text-emerald-200 mt-1">Riphah International University</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          <button
            onClick={() => navigate("/service-dashboard")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-emerald-100 hover:bg-white/10 transition-all"
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            onClick={() => navigate("/service-messages")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-emerald-100 hover:bg-white/10 transition-all"
          >
            <MessageSquare size={18} /> Messages
          </button>
          <button
            onClick={() => navigate("/service-edit-profile")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-emerald-400 to-green-500 text-white transition-all"
          >
            <UserPen size={18} /> Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-emerald-100 hover:bg-red-500/20 transition-all"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <footer className="text-xs text-emerald-300 text-center mt-8">© 2025 Riphah</footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Hero Header */}
        <div className="mb-8 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-200">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl">
              <UserPen size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
              <p className="text-gray-600 mt-1">Update your profile information and security settings</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-2xl">
          <div className="p-8">
            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-600" />
                <span className="text-emerald-700">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Information Section */}
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-emerald-200">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Mail size={22} className="text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">Profile Information</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      disabled={loading}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      disabled={loading}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      disabled={loading}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      placeholder="Your department"
                      disabled={true}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-emerald-200">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Lock size={22} className="text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">Security</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="old_password"
                      value={formData.old_password}
                      onChange={handleChange}
                      placeholder="Enter your current password"
                      disabled={loading}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      disabled={loading}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="Confirm your new password"
                      disabled={loading}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 placeholder-gray-400 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={20} />
                  {loading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}