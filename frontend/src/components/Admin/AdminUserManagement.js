import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  FiGrid, FiUsers, FiMessageSquare, FiEdit, FiLogOut, FiShield,
  FiPlus, FiSearch, FiTrash2, FiX, FiUser, FiMail, FiLock, FiHash,
  FiCheckCircle, FiAlertCircle, FiLoader, FiSave, FiChevronDown,
  FiBriefcase, FiCalendar, FiFilter, FiUserPlus, FiShieldOff
} from "react-icons/fi";

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const departments = [
    "Library",
    "Transport",
    "Laboratory",
    "Student Service",
    "Fee Department",
    "Coordination",
    "HOD"
  ];

  const roles = [
    "student",
    "library",
    "transport",
    "laboratory",
    "studentservice",
    "feedepartment",
    "coordination",
    "hod",
    "admin"
  ];

  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "library",
    department: "Library",
    sap: ""
  });

  // ====== FETCH USERS ======
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/users");

      if (response.data.success) {
        setUsers(response.data.data || []);
        setError("");
      } else {
        setError(response.data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // ====== MIGRATE TIMESTAMPS FOR EXISTING USERS ======
  const migrateTimestamps = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.post("/api/admin/migrate-timestamps", {});

      if (response.data.success) {
        console.log("✅ Migration successful:", response.data.message);
        // Refresh users after migration
        await fetchUsers();
      }
    } catch (err) {
      console.error("Migration Error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Run migration once on component mount
    migrateTimestamps();
  }, []);

  // ====== CREATE NEW USER ======
  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Validation
    if (!newUser.full_name.trim()) {
      setError("❌ Full name is required");
      return;
    }
    const alphabeticCount = (newUser.full_name.match(/[a-zA-Z]/g) || []).length;
    if (alphabeticCount < 6) {
      setError("❌ Full name must contain at least 6 alphabetic characters");
      return;
    }
    if (!newUser.email.trim()) {
      setError("❌ Email is required");
      return;
    }
    if (!newUser.password.trim()) {
      setError("❌ Password is required");
      return;
    }
    if (newUser.password.length < 6) {
      setError("❌ Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const userData = {
        full_name: newUser.full_name.trim(),
        email: newUser.email.trim().toLowerCase(),
        password: newUser.password,
        role: newUser.role,
        department: newUser.department,
        sap: newUser.sap.trim() || null
      };

      console.log("📝 Creating new user:", userData);

      const response = await api.post("/api/admin/create-user", userData);

      if (response.data.success) {
        setSuccess("✅ User created successfully!");
        setNewUser({
          full_name: "",
          email: "",
          password: "",
          role: "library",
          department: "Library",
          sap: ""
        });
        setShowCreateForm(false);
        setError("");
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("❌ " + (response.data.message || "Failed to create user"));
      }
    } catch (err) {
      console.error("Create User Error:", err);
      setError("❌ " + (err.response?.data?.message || err.message || "Failed to create user"));
    } finally {
      setLoading(false);
    }
  };

  // ====== DELETE USER ======
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const response = await api.delete(`/api/admin/users/${userToDelete._id}`);

      if (response.data.success) {
        setSuccess("✅ User deleted successfully!");
        setError("");
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("❌ " + (response.data.message || "Failed to delete user"));
      }
    } catch (err) {
      console.error("Delete User Error:", err);
      setError("❌ " + (err.response?.data?.message || "Failed to delete user"));
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteConfirm = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  // ====== FILTER AND SEARCH USERS ======
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.sap?.includes(searchTerm);

    const matchesFilter = filterRole === "" || u.role === filterRole;

    return matchesSearch && matchesFilter;
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ====== INLINE VALIDATION STATE ======
  const [formErrors, setFormErrors] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case "full_name":
        if (!value.trim()) return "Full name is required";
        if ((value.match(/[a-zA-Z]/g) || []).length < 3) return "Name must contain at least 3 letters";
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "Name can only contain letters and spaces";
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address";
        return "";
      case "password":
        if (!value.trim()) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
        if (!/[0-9]/.test(value)) return "Password must contain at least one number";
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) return "Password must contain at least one special character (!@#$%^&* etc)";
        return "";
      case "sap":
        if (!value.trim()) return "Employee ID (SAP ID) is required";
        return "";
      case "role":
        if (!value) return "Role is required";
        return "";
      default:
        return "";
    }
  };

  const handleFieldChange = (name, value) => {
    setNewUser(prev => ({ ...prev, [name]: value }));
    const err = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: err }));
  };

  const validateAllFields = () => {
    const errors = {};
    errors.full_name = validateField("full_name", newUser.full_name);
    errors.email = validateField("email", newUser.email);
    errors.password = validateField("password", newUser.password);
    errors.role = validateField("role", newUser.role);
    errors.sap = validateField("sap", newUser.sap);
    setFormErrors(errors);
    return !Object.values(errors).some(e => e);
  };

  // Role display helpers
  const roleColors = {
    admin: "bg-red-100 text-red-700 border-red-200",
    library: "bg-blue-100 text-blue-700 border-blue-200",
    transport: "bg-emerald-100 text-emerald-700 border-emerald-200",
    laboratory: "bg-amber-100 text-amber-700 border-amber-200",
    studentservice: "bg-pink-100 text-pink-700 border-pink-200",
    feedepartment: "bg-orange-100 text-orange-700 border-orange-200",
    coordination: "bg-violet-100 text-violet-700 border-violet-200",
    hod: "bg-indigo-100 text-indigo-700 border-indigo-200",
    student: "bg-gray-100 text-gray-600 border-gray-200"
  };

  const roleLabels = {
    admin: "Admin",
    library: "Library",
    transport: "Transport",
    laboratory: "Laboratory",
    studentservice: "Student Service",
    feedepartment: "Fee Department",
    coordination: "Coordination",
    hod: "HOD",
    student: "Student"
  };

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
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{user?.full_name || "Admin"}</h3>
            <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <button onClick={() => navigate("/admin-dashboard")} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200">
            <FiGrid size={18} /> Dashboard
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <FiUsers size={18} /> User Management
          </button>
          <button onClick={() => navigate("/admin-messages")} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200">
            <FiMessageSquare size={18} /> Messages
          </button>
          <button onClick={() => navigate("/admin-edit-profile")} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <FiUsers className="text-indigo-500" /> User Management
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Create and manage users for all departments</p>
          </div>
          <button
            onClick={() => { setShowCreateForm(true); setFormErrors({}); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl active:scale-[0.98] transition-all duration-200"
          >
            <FiUserPlus size={18} /> Add New User
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-[fadeIn_0.3s_ease]">
            <FiAlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm animate-[fadeIn_0.3s_ease]">
            <FiCheckCircle size={18} className="shrink-0" /> {success}
          </div>
        )}

        {/* ── Delete Confirmation Modal ── */}
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={closeDeleteConfirm}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-[slideUp_0.3s_ease] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header with Red Background */}
              <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <FiTrash2 size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
                    <p className="text-xs text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-3">
                {/* Alert Box */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Are you sure you want to delete this user?</p>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                        Once deleted, this user account and all associated data will be permanently removed from the system. This action cannot be reversed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Details to be Deleted */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {userToDelete.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userToDelete.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{userToDelete.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-semibold text-gray-900 capitalize">{userToDelete.role}</span>
                    </div>
                    {userToDelete.department && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-semibold text-gray-900">{userToDelete.department}</span>
                      </div>
                    )}
                    {userToDelete.sap && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">SAP ID:</span>
                        <span className="font-mono text-gray-900">{userToDelete.sap}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={closeDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={deleting || userToDelete?.role === "student"}
                  title={userToDelete?.role === "student" ? "Cannot delete student users" : "Delete this user"}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold shadow-lg shadow-red-500/20 hover:from-red-600 hover:to-red-700 hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <><FiLoader size={16} className="animate-spin" /> Deleting...</>
                  ) : userToDelete?.role === "student" ? (
                    <><FiShieldOff size={16} /> Cannot Delete Student</>
                  ) : (
                    <><FiTrash2 size={16} /> Delete User</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Create User Modal ── */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={() => setShowCreateForm(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                    <FiUserPlus size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Create New User</h2>
                    <p className="text-xs text-gray-500">Fill all required fields to add a user</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateForm(false)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                  <FiX size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={(e) => { e.preventDefault(); if (validateAllFields()) handleCreateUser(e); }} className="p-6 space-y-5">
                {/* Row 1: Name + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><FiUser size={14} className="text-gray-400" /> Full Name <span className="text-red-400">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) => handleFieldChange("full_name", e.target.value)}
                      placeholder="Enter full name"
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400 ${formErrors.full_name ? "border-red-400 focus:ring-red-400 bg-red-50/50" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"}`}
                    />
                    {formErrors.full_name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><FiAlertCircle size={12} />{formErrors.full_name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><FiMail size={14} className="text-gray-400" /> Email <span className="text-red-400">*</span></span>
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      placeholder="user@riphah.edu.pk"
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400 ${formErrors.email ? "border-red-400 focus:ring-red-400 bg-red-50/50" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"}`}
                    />
                    {formErrors.email && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><FiAlertCircle size={12} />{formErrors.email}</p>}
                  </div>
                </div>

                {/* Row 2: Password + SAP ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><FiLock size={14} className="text-gray-400" /> Password <span className="text-red-400">*</span></span>
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                      placeholder="Min 8 chars: uppercase, number, special char"
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400 ${formErrors.password ? "border-red-400 focus:ring-red-400 bg-red-50/50" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"}`}
                    />
                    {formErrors.password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><FiAlertCircle size={12} />{formErrors.password}</p>}
                  </div>

                  {/* SAP ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><FiHash size={14} className="text-gray-400" /> Employee ID (SAP ID) <span className="text-red-400">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={newUser.sap}
                      onChange={(e) => handleFieldChange("sap", e.target.value)}
                      placeholder="Enter employee SAP ID"
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400 ${formErrors.sap ? "border-red-400 focus:ring-red-400 bg-red-50/50" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"}`}
                    />
                    {formErrors.sap && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><FiAlertCircle size={12} />{formErrors.sap}</p>}
                  </div>
                </div>

                {/* Row 3: Role + Department */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><FiBriefcase size={14} className="text-gray-400" /> Role <span className="text-red-400">*</span></span>
                    </label>
                    <div className="relative">
                      <select
                        value={newUser.role}
                        onChange={(e) => {
                          const role = e.target.value;
                          handleFieldChange("role", role);
                          const autoMap = { library: "Library", transport: "Transport", laboratory: "Laboratory", studentservice: "Student Service", feedepartment: "Fee Department", coordination: "Coordination", hod: "HOD" };
                          if (autoMap[role]) setNewUser(prev => ({ ...prev, role, department: autoMap[role] }));
                        }}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all duration-200 appearance-none bg-white pr-10 ${formErrors.role ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"}`}
                      >
                        <option value="">-- Select Role --</option>
                        <option value="library">Library Staff</option>
                        <option value="transport">Transport Staff</option>
                        <option value="laboratory">Laboratory Staff</option>
                        <option value="studentservice">Student Service Staff</option>
                        <option value="feedepartment">Fee Department Staff</option>
                        <option value="coordination">Coordination Staff</option>
                        <option value="hod">HOD</option>
                        <option value="admin">Admin</option>
                      </select>
                      <FiChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {formErrors.role && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><FiAlertCircle size={12} />{formErrors.role}</p>}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><FiBriefcase size={14} className="text-gray-400" /> Department <span className="text-red-400">*</span></span>
                    </label>
                    <div className="relative">
                      <select
                        value={newUser.department}
                        onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white pr-10"
                      >
                        <option value="">-- Select Department --</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <FiChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? <><FiLoader size={16} className="animate-spin" /> Creating...</> : <><FiSave size={16} /> Create User</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Search & Filter Bar ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or SAP ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
            {/* Role Filter */}
            <div className="relative w-full sm:w-48">
              <FiFilter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{roleLabels[role] || role}</option>
                ))}
              </select>
              <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {/* Count */}
            <div className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-semibold whitespace-nowrap border border-indigo-100">
              <FiUsers size={14} /> {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <FiLoader size={32} className="animate-spin mb-4 text-indigo-400" />
            <p className="text-sm font-medium">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <FiUsers size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-semibold text-gray-500">No users found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">SAP ID</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-indigo-50/40 transition-colors duration-150">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {u.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[160px]">{u.full_name}</span>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-5 py-4 text-gray-600 truncate max-w-[200px]">{u.email}</td>
                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[u.role] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>
                      {/* Department */}
                      <td className="px-5 py-4 text-gray-600">{u.department || "—"}</td>
                      {/* SAP */}
                      <td className="px-5 py-4 text-gray-500 font-mono text-xs">{u.sap || "—"}</td>
                      {/* Created */}
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {u.createdAt || u.updatedAt
                          ? <>
                              <div className="flex items-center gap-1"><FiCalendar size={12} /> {new Date(u.createdAt || u.updatedAt).toLocaleDateString()}</div>
                              <div className="text-gray-400 mt-0.5">{new Date(u.createdAt || u.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </>
                          : "—"
                        }
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => openDeleteConfirm(u)}
                          disabled={deleting}
                          title="Delete user"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiTrash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}