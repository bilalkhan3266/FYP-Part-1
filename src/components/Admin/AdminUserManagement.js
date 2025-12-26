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
    confirmPassword: "",
    role: "library",
    department: "Library",
    sap: ""
  });

  const [formStep, setFormStep] = useState(1); // Step 1: Personal Info, Step 2: Password, Step 3: Role & Department
  const [emailExists, setEmailExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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

  // ====== MIGRATE TIMESTAMPS FOR EXISTING USERS ======
  const migrateTimestamps = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(apiUrl + "/api/admin/migrate-timestamps", {}, {
        headers: { Authorization: "Bearer " + token }
      });

      if (response.data.success) {
        console.log("✅ Migration successful:", response.data.message);
        console.log(`📊 Migrated ${response.data.migratedCount} users`);
        // Refresh users after migration
        setTimeout(() => {
          fetchUsers();
        }, 500);
      }
    } catch (err) {
      console.error("Migration Error:", err);
      console.error("Migration response:", err.response?.data);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Run migration once on component mount
    migrateTimestamps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== CHECK IF EMAIL EXISTS ======
  const checkEmailExists = async (email) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        apiUrl + "/api/admin/check-email",
        { email: email.trim().toLowerCase() },
        { headers: { Authorization: "Bearer " + token } }
      );
      return response.data.exists || false;
    } catch (err) {
      console.error("Email check error:", err);
      return false;
    }
  };

  // ====== VALIDATE STEP 1 (Personal Information) ======
  const validateStep1 = async () => {
    const errors = {};

    if (!newUser.full_name.trim()) {
      errors.full_name = "Full name is required";
    } else {
      const alphabeticCount = (newUser.full_name.match(/[a-zA-Z]/g) || []).length;
      if (alphabeticCount < 6) {
        errors.full_name = "Full name must contain at least 6 alphabetic characters";
      }
    }

    if (!newUser.email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email.trim())) {
        errors.email = "Please enter a valid email address";
      } else {
        // Check if email already exists
        const exists = await checkEmailExists(newUser.email);
        if (exists) {
          errors.email = "This email is already registered";
          setEmailExists(true);
          setFormErrors(errors);
          return false;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ====== VALIDATE STEP 2 (Password) ======
  const validateStep2 = () => {
    const errors = {};

    if (!newUser.password.trim()) {
      errors.password = "Password is required";
    } else {
      const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newUser.password);
      const hasNumeric = /[0-9]/.test(newUser.password);
      const hasAlphabetic = /[a-zA-Z]/.test(newUser.password);
      const passwordLength = newUser.password.length >= 8;

      if (!passwordLength) {
        errors.password = "Password must be at least 8 characters long";
      } else if (!hasAlphabetic) {
        errors.password = "Password must contain at least one letter (a-z, A-Z)";
      } else if (!hasNumeric) {
        errors.password = "Password must contain at least one number (0-9)";
      } else if (!hasSpecialChar) {
        errors.password = "Password must contain at least one special character (!@#$%^&*...)";
      }
    }

    if (!newUser.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password";
    } else if (newUser.password !== newUser.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ====== HANDLE STEP PROGRESSION ======
  const handleNextStep = async () => {
    if (formStep === 1) {
      const isValid = await validateStep1();
      // CRITICAL: Block progression if email already exists
      if (isValid && !emailExists) {
        setFormStep(2);
        setError("");
      } else if (emailExists) {
        setError("❌ Email already registered! Please use a different email address.");
        return; // Prevent Step 2 progression
      }
    } else if (formStep === 2) {
      const isValid = validateStep2();
      if (isValid) {
        setFormStep(3);
        setError("");
      }
    }
  };

  const handlePreviousStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1);
      setFormErrors({});
    }
  };

  // ====== CREATE NEW USER (FINAL SUBMISSION) ======
  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
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
        const timestamp = new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        setSuccess(`✅ User created successfully! [${timestamp}]`);
        setNewUser({
          full_name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "library",
          department: "Library",
          sap: ""
        });
        setFormStep(1);
        setFormErrors({});
        setEmailExists(false);
        setShowPassword(false);
        setShowConfirmPassword(false);
        setShowCreateForm(false);
        setError("");
        fetchUsers();
        setTimeout(() => setSuccess(""), 5000);
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
            <div className="modal-content pro-form-modal" onClick={(e) => e.stopPropagation()}>
              {/* Logo Section */}
              <div className="modal-logo-section">
                <img src="/logo192.png" alt="Riphah University Logo" className="modal-form-logo" />
              </div>

              <div className="modal-header pro-form-header">
                <div className="header-content">
                  <h2>Create New User Account</h2>
                  <p>Add a new staff member to the system</p>
                </div>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateForm(false)}
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="pro-form">
                {/* STEP PROGRESS INDICATOR */}
                <div className="form-progress-indicator">
                  <div className={`progress-step ${formStep >= 1 ? 'active' : ''}`}>
                    <span className="progress-circle">1</span>
                    <span className="progress-label">Personal</span>
                  </div>
                  <div className={`progress-connector ${formStep >= 2 ? 'active' : ''}`}></div>
                  <div className={`progress-step ${formStep >= 2 ? 'active' : ''}`}>
                    <span className="progress-circle">2</span>
                    <span className="progress-label">Security</span>
                  </div>
                  <div className={`progress-connector ${formStep >= 3 ? 'active' : ''}`}></div>
                  <div className={`progress-step ${formStep >= 3 ? 'active' : ''}`}>
                    <span className="progress-circle">3</span>
                    <span className="progress-label">Department</span>
                  </div>
                </div>

                {/* STEP 1: PERSONAL INFORMATION */}
                {formStep === 1 && (
                  <div className="form-section">
                    <div className="step-indicator">
                      <span className="step-number">1</span>
                      <h3 className="section-title">Personal Information</h3>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>
                          <span className="label-icon">👤</span>
                          Full Name
                          <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          value={newUser.full_name}
                          onChange={(e) => {
                            setNewUser({ ...newUser, full_name: e.target.value });
                            if (formErrors.full_name) setFormErrors({ ...formErrors, full_name: "" });
                          }}
                          placeholder="Bilal Khan"
                          className={formErrors.full_name ? 'input-error' : ''}
                        />
                        {formErrors.full_name && (
                          <span className="form-error">❌ {formErrors.full_name}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>
                          <span className="label-icon">📧</span>
                          Email Address
                          <span className="required">*</span>
                        </label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => {
                            setNewUser({ ...newUser, email: e.target.value });
                            if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                            setEmailExists(false);
                          }}
                          onBlur={() => checkEmailExists(newUser.email)}
                          placeholder="bilalkhna123@gmail.com"
                          className={formErrors.email ? 'input-error' : emailExists ? 'email-restricted' : ''}
                        />
                        {formErrors.email && (
                          <span className="form-error">❌ {formErrors.email}</span>
                        )}
                        {emailExists && !formErrors.email && (
                          <span className="form-error">⚠️ This email is already registered in the system</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: SECURITY */}
                {formStep === 2 && (
                  <div className="form-section">
                    <div className="step-indicator">
                      <span className="step-number">2</span>
                      <h3 className="section-title">Security & Password</h3>
                    </div>
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label>
                          <span className="label-icon">🔑</span>
                          Password
                          <span className="required">*</span>
                        </label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newUser.password}
                            onChange={(e) => {
                              setNewUser({ ...newUser, password: e.target.value });
                              if (formErrors.password) setFormErrors({ ...formErrors, password: "" });
                            }}
                            placeholder="Enter strong password (min 8 chars)"
                            className={formErrors.password ? 'input-error' : ''}
                          />
                          <button
                            type="button"
                            className="toggle-password-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Hide" : "Show"}
                          >
                            {showPassword ? "👁️" : "👁️‍🗨️"}
                          </button>
                        </div>
                        {formErrors.password && (
                          <span className="form-error">❌ {formErrors.password}</span>
                        )}
                        <PasswordStrengthIndicator password={newUser.password} />
                      </div>

                      <div className="form-group full-width">
                        <label>
                          <span className="label-icon">✓</span>
                          Confirm Password
                          <span className="required">*</span>
                        </label>
                        <div className="password-input-wrapper">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={newUser.confirmPassword}
                            onChange={(e) => {
                              setNewUser({ ...newUser, confirmPassword: e.target.value });
                              if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: "" });
                            }}
                            placeholder="Confirm your password"
                            className={formErrors.confirmPassword ? 'input-error' : ''}
                          />
                          <button
                            type="button"
                            className="toggle-password-btn"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            title={showConfirmPassword ? "Hide" : "Show"}
                          >
                            {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                          </button>
                        </div>
                        {formErrors.confirmPassword && (
                          <span className="form-error">❌ {formErrors.confirmPassword}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: DEPARTMENT & ROLE */}
                {formStep === 3 && (
                  <div className="form-section">
                    <div className="step-indicator">
                      <span className="step-number">3</span>
                      <h3 className="section-title">Department & Role</h3>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>
                          <span className="label-icon">👔</span>
                          Role
                          <span className="required">*</span>
                        </label>
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
                          <option value="">Select a role...</option>
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
                        <label>
                          <span className="label-icon">🏛️</span>
                          Department
                          <span className="required">*</span>
                        </label>
                        <select
                          value={newUser.department}
                          onChange={(e) =>
                            setNewUser({ ...newUser, department: e.target.value })
                          }
                          required
                        >
                          <option value="">Select a department...</option>
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>
                          <span className="label-icon">🆔</span>
                          SAP ID*
                          <span className="optional">Required</span>
                        </label>
                        <input
                          type="text"
                          value={newUser.sap}
                          onChange={(e) =>
                            setNewUser({ ...newUser, sap: e.target.value })
                          }
                          placeholder="Enter SAP ID (e.g., SAP123456)"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* FORM ACTIONS */}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormStep(1);
                      setFormErrors({});
                    }}
                  >
                    ✕ Cancel
                  </button>

                  {formStep > 1 && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handlePreviousStep}
                    >
                      ← Back
                    </button>
                  )}

                  {formStep < 3 && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleNextStep}
                    >
                      Next →
                    </button>
                  )}

                  {formStep === 3 && (
                    <button type="submit" className="btn-submit" disabled={loading || emailExists}>
                      {loading ? "⟳ Creating..." : "✅ Create User"}
                    </button>
                  )}
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
                        <td>
                          <div className="created-date">
                            {(() => {
                              const dateStr = u.createdAt || u.updatedAt;
                              if (!dateStr) return '—';
                              try {
                                const date = new Date(dateStr);
                                if (isNaN(date.getTime())) return '—';
                                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              } catch (e) {
                                return '—';
                              }
                            })()}
                          </div>
                        </td>
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

// ====== PASSWORD STRENGTH INDICATOR COMPONENT ======
function PasswordStrengthIndicator({ password }) {
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const hasNumeric = /[0-9]/.test(password);
  const hasAlphabetic = /[a-zA-Z]/.test(password);
  const passwordLength = password.length >= 8;

  const requirements = [
    { met: passwordLength, label: "At least 8 characters" },
    { met: hasAlphabetic, label: "One alphabetic character (a-z, A-Z)" },
    { met: hasNumeric, label: "One numeric digit (0-9)" },
    { met: hasSpecialChar, label: "One special character (!@#$%^&*...)  " }
  ];

  const metCount = requirements.filter(req => req.met).length;

  return (
    <div className="password-strength">
      <div className="strength-bar">
        <div
          className="strength-fill"
          style={{
            width: `${(metCount / requirements.length) * 100}%`,
            backgroundColor: 
              metCount === 0 ? '#e0e0e0' :
              metCount <= 1 ? '#ff4444' :
              metCount <= 2 ? '#ffaa00' :
              metCount < 4 ? '#ffdd00' :
              '#44aa44'
          }}
        ></div>
      </div>
      <ul className="requirements-list">
        {requirements.map((req, idx) => (
          <li key={idx} className={req.met ? 'met' : 'unmet'}>
            <span className="requirement-icon">{req.met ? '✓' : '○'}</span>
            <span className="requirement-text">{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
