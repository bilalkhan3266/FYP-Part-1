import React, { useState, useEffect } from "react";
import { getApiUrl } from "../../config/apiConfig";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  FiGrid, FiUsers, FiMessageSquare, FiEdit, FiLogOut, FiShield, FiClipboard
} from "react-icons/fi";
import "./AdminDashboard.css";

export default function AdminClearance() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const apiUrl = getApiUrl();

  const [clearanceRequests, setClearanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  const departments = [
    "Library",
    "Transport",
    "Laboratory",
    "Student Service",
    "Fee Department",
    "Coordination",
    "HOD"
  ];

  // Fetch clearance requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(apiUrl + "/api/admin/clearance-requests", {
          headers: { Authorization: "Bearer " + token }
        });

        if (response.data.success) {
          setClearanceRequests(response.data.data || []);
          setError("");
        } else {
          setError("Failed to load clearance requests");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.response?.data?.message || "Failed to load clearance requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [apiUrl]);

  // Filter requests
  const filteredRequests = clearanceRequests.filter(req => {
    const statusMatch = filterStatus === "all" || req.status === filterStatus;
    const deptMatch = filterDepartment === "all" || req.department === filterDepartment;
    return statusMatch && deptMatch;
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#f59e0b";
      case "Approved":
        return "#10b981";
      case "Rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="logo-icon"><FiShield size={32} /></div>
          <h1>Admin Panel</h1>
        </div>

        <div className="admin-profile">
          <div className="admin-avatar">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="admin-name">{user?.full_name || "Admin"}</h3>
            <p className="admin-role">System Administrator</p>
            <p className="admin-email">{user?.email}</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-dashboard")}
          >
            <FiGrid style={{ marginRight: 10 }} /> Dashboard
          </button>
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-users")}
          >
            <FiUsers style={{ marginRight: 10 }} /> User Management
          </button>
          <button className="admin-nav-btn active">
            <FiMessageSquare style={{ marginRight: 10 }} /> Messages
          </button>
          <button 
            className="admin-nav-btn"
            onClick={() => navigate("/admin-edit-profile")}
          >
            <FiEdit style={{ marginRight: 10 }} /> Edit Profile
          </button>
        </nav>

        <button className="admin-nav-btn logout" onClick={handleLogout}>
          <FiLogOut style={{ marginRight: 10 }} /> Logout
        </button>

        <footer className="admin-footer">© 2025 Riphah University</footer>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-content">
            <h1><FiClipboard style={{ marginRight: 12, verticalAlign: 'middle' }} />Clearance Requests</h1>
            <p>View and manage all student clearance requests</p>
          </div>
          <div className="header-datetime">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Filters */}
        <section className="filter-section">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="Pending">⏳ Pending</option>
              <option value="Approved">✅ Approved</option>
              <option value="Rejected">❌ Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Department:</label>
            <select 
              value={filterDepartment} 
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="filter-info">
            Showing {filteredRequests.length} of {clearanceRequests.length} requests
          </div>
        </section>

        {/* Clearance Requests Table */}
        <section className="clearance-section">
          {loading ? (
            <div className="loading">⏳ Loading clearance requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="alert alert-info">
              ℹ️ No clearance requests found
            </div>
          ) : (
            <div className="clearance-table-wrapper">
              <table className="clearance-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>SAP ID</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req._id} className={`status-${req.status?.toLowerCase()}`}>
                      <td className="student-name">{req.student_name}</td>
                      <td>{req.sap_id}</td>
                      <td>{req.department}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(req.status) }}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td>{new Date(req.submitted_at).toLocaleDateString()}</td>
                      <td>{new Date(req.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}