import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./AdminUserManagement.css";

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      const token = localStorage.getItem("token");

      const response = await axios.get(apiUrl + "/api/admin/users", {
        headers: { Authorization: "Bearer " + token }
      });

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

  useEffect(() => {
    fetchUsers();
  }, []);

  // ====== CREATE NEW USER ======
  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Validation
    if (!newUser.full_name.trim()) {
      setError("❌ Full name is required");
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

      const response = await axios.post(apiUrl + "/api/admin/create-user", userData, {
        headers: { Authorization: "Bearer " + token }
      });

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
  const handleDeleteUser = async (userId, userRole) => {
    // Prevent deleting students
    if (userRole === "student") {
      setError("❌ Cannot delete student users");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");

      const response = await axios.delete(apiUrl + `/api/admin/users/${userId}`, {
        headers: { Authorization: "Bearer " + token }
      });

      if (response.data.success) {
        setSuccess("✅ User deleted successfully!");
        setError("");
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

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-profile">
          <div className="admin-avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
          <div>
            <h3>{user?.full_name || "Admin"}</h3>
            <p>{user?.email}</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button onClick={() => navigate("/admin-dashboard")} className="admin-nav-btn">
            📊 Dashboard
          </button>
          <button onClick={() => navigate("/admin-users")} className="admin-nav-btn active">
            👥 User Management
          </button>
          <button onClick={() => navigate("/admin-messages")} className="admin-nav-btn">
            💬 Messages
          </button>
          <button onClick={() => navigate("/admin-edit-profile")} className="admin-nav-btn">
            📝 Edit Profile
          </button>
          <button onClick={handleLogout} className="admin-nav-btn logout">
            🚪 Logout
          </button>
        </nav>

        <footer className="admin-footer">© 2025 Riphah Admin</footer>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>👥 User Management</h1>
            <p>Create and manage users for all departments</p>
          </div>
          <button
            className="btn-create"
            onClick={() => setShowCreateForm(true)}
          >
            ➕ Create New User
          </button>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* CREATE USER FORM MODAL */}
        {showCreateForm && (
          <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>➕ Create New User</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateForm(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, full_name: e.target.value })
                      }
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      placeholder="Enter email"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      placeholder="Enter password (min 6 characters)"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>SAP ID (Optional)</label>
                    <input
                      type="text"
                      value={newUser.sap}
                      onChange={(e) =>
                        setNewUser({ ...newUser, sap: e.target.value })
                      }
                      placeholder="Enter SAP ID if applicable"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => {
                        const role = e.target.value;
                        setNewUser({ ...newUser, role });
                        // Auto-set department based on role
                        if (role === "library") setNewUser(prev => ({ ...prev, department: "Library" }));
                        else if (role === "transport") setNewUser(prev => ({ ...prev, department: "Transport" }));
                        else if (role === "laboratory") setNewUser(prev => ({ ...prev, department: "Laboratory" }));
                        else if (role === "studentservice") setNewUser(prev => ({ ...prev, department: "Student Service" }));
                        else if (role === "feedepartment") setNewUser(prev => ({ ...prev, department: "Fee Department" }));
                        else if (role === "coordination") setNewUser(prev => ({ ...prev, department: "Coordination" }));
                        else if (role === "hod") setNewUser(prev => ({ ...prev, department: "HOD" }));
                      }}
                      required
                    >
                      <option value="">-- Select Role --</option>
                      <option value="library">📚 Library Staff</option>
                      <option value="transport">🚌 Transport Staff</option>
                      <option value="laboratory">🔬 Laboratory Staff</option>
                      <option value="studentservice">🎓 Student Service Staff</option>
                      <option value="feedepartment">💰 Fee Department Staff</option>
                      <option value="coordination">🏢 Coordination Staff</option>
                      <option value="hod">👨‍💼 HOD</option>
                      <option value="admin">🔐 Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Department *</label>
                    <select
                      value={newUser.department}
                      onChange={(e) =>
                        setNewUser({ ...newUser, department: e.target.value })
                      }
                      required
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowCreateForm(false)}
                  >
                    ✕ Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? "⟳ Creating..." : "✅ Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>⏳ Loading users...</p>
          </div>
        ) : (
          <div className="users-container">
            {/* SEARCH AND FILTER */}
            <div className="search-filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search by name, email, or SAP ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="filter-dropdown"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>

              <div className="user-count">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* USERS TABLE */}
            {filteredUsers.length === 0 ? (
              <div className="empty-state">
                <p>📭 No users found</p>
              </div>
            ) : (
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>SAP ID</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className={`user-row role-${u.role}`}>
                        <td>
                          <div className="user-name-cell">
                            <div className="user-avatar">{u.full_name?.charAt(0).toUpperCase()}</div>
                            <span>{u.full_name}</span>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`role-badge ${u.role}`}>
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </span>
                        </td>
                        <td>{u.department || "—"}</td>
                        <td>{u.sap || "—"}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            {u.role === "student" ? (
                              <span className="btn-disabled" title="Cannot delete students">
                                🔒 Protected
                              </span>
                            ) : (
                              <button
                                className="btn-delete"
                                onClick={() => handleDeleteUser(u._id, u.role)}
                                disabled={deleting}
                                title="Delete user"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
