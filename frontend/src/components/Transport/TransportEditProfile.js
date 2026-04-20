import React, { useState, useEffect } from "react";
import { getApiUrl } from "../../config/apiConfig";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { LayoutDashboard, MessageSquare, UserPen, LogOut, Save, Menu, AlertTriangle, CheckCircle, Mail, Phone, MapPin, Building2, User } from "lucide-react";
import api from "../../services/api";

export default function TransportEditProfile() {
  const { user, setUser, logout } = useAuthContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    department: "",
    designation: ""
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  // ✅ LOAD USER DATA
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        department: user.department || "",
        designation: user.designation || ""
      });
    }
  }, [user]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ UPDATE PROFILE
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError("❌ Full name and email are required");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = getApiUrl();

      console.log("📝 Updating profile with data:", formData);
      console.log("📡 API URL:", apiUrl);
      console.log("🔐 Token exists:", !!token);

      const response = await api.put(
        "/api/users/update-profile",
        formData
      );

      console.log("✅ Success response:", response.data);

      if (response.data.success) {
        setSuccess("✅ Profile updated successfully!");
        if (response.data.data) {
          setUser(response.data.data);
        }
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "❌ Failed to update profile");
      }
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      console.error("   Status:", err.response?.status);
      console.error("   Message:", err.response?.data?.message);
      console.error("   Full Error:", err.response?.data);
      setError(err.response?.data?.message || err.message || "❌ Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // ✅ CHANGE PASSWORD
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setError("");
    setSuccess("");

    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      setPasswordError("❌ All password fields are required");
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("❌ New passwords do not match");
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError("❌ Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = getApiUrl();

      const response = await api.post(
        "/api/users/change-password",
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        }
      );

      if (response.data.success) {
        setSuccess("✅ Password changed successfully!");
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: ""
        });
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setPasswordError(response.data.message || "❌ Failed to change password");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setPasswordError(err.response?.data?.message || "❌ Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Transport Staff";
  const displaySap = user?.sap || "N/A";

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Mobile Hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors">
        <Menu size={24} className="text-gray-800" />
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30" />}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative w-[280px] h-screen lg:h-auto bg-gradient-to-b from-[#0d3d35] via-[#1a6959] to-[#0f4a3f] text-white p-6 shadow-lg overflow-y-auto transition-transform duration-300 z-40 lg:z-auto`}>
        {/* Profile Card */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-white">{displayName}</h3>
          <p className="text-sm text-teal-200">{displaySap} • Transport</p>
          <p className="text-xs text-teal-200 mt-1">Riphah International University</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          <button
            onClick={() => navigate("/transport-dashboard")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-teal-100 hover:bg-white/10 transition-all"
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            onClick={() => navigate("/transport-messages")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-teal-100 hover:bg-white/10 transition-all"
          >
            <MessageSquare size={18} /> Messages
          </button>
          <button
            onClick={() => navigate("/transport-edit-profile")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-teal-400 to-cyan-500 text-white transition-all"
          >
            <UserPen size={18} /> Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-teal-100 hover:bg-red-500/20 transition-all"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <footer className="text-xs text-teal-300 text-center mt-8">© 2025 Riphah</footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Hero Header */}
        <div className="mb-8 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-8 border border-teal-200">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-2xl">
              <UserPen size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
              <p className="text-gray-600 mt-1">Update your personal and account information</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-teal-600" />
            <span className="text-teal-700">{success}</span>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User size={24} className="text-teal-600" />
              Profile Information
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleFormChange}
                  placeholder="Enter your full name"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder-gray-400 disabled:bg-gray-50"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail size={16} className="text-teal-600" /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="Enter your email"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder-gray-400 disabled:bg-gray-50"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone size={16} className="text-teal-600" /> Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="Enter your phone number"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder-gray-400 disabled:bg-gray-50"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-teal-600" /> Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Enter your address"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder-gray-400 disabled:bg-gray-50"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-teal-600" /> City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleFormChange}
                  placeholder="Enter your city"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder-gray-400 disabled:bg-gray-50"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 size={16} className="text-teal-600" /> Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  placeholder="Enter your department"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder-gray-400 disabled:bg-gray-50"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleFormChange}
                  placeholder="Enter your designation"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder-gray-400 disabled:bg-gray-50"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
              >
                <Save size={20} />
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <LogOut size={24} className="text-teal-600" />
              Change Password
            </h2>

            {passwordError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-600" />
                <span className="text-red-700 text-sm">{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder-gray-400 disabled:bg-gray-50"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder-gray-400 disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-600 mt-1">Minimum 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder-gray-400 disabled:bg-gray-50"
                />
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm font-semibold text-teal-900 mb-2">Password Requirements:</p>
                <ul className="text-xs text-teal-800 space-y-1">
                  <li>✓ Minimum 6 characters</li>
                  <li>✓ Must not be the same as current password</li>
                  <li>✓ Both passwords must match</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
              >
                <Save size={20} />
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Account Info Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">SAP ID</p>
              <p className="text-lg font-semibold text-gray-900">{displaySap}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Role</p>
              <p className="text-lg font-semibold text-gray-900">Transport Staff</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Institution</p>
              <p className="text-lg font-semibold text-gray-900">Riphah International University</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Account Status</p>
              <p className="text-lg font-semibold text-teal-600">✓ Active</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}