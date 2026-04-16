import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";

/* Auth */
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import ForgotPassword from "./auth/ForgotPassword";

/* Protected Route */
import ProtectedRoute from "./routes/ProtectedRoute";

/* Student */
import StudentDashboard from "./components/Student/Dashboard";

/* Library */
import LibraryDashboard from "./components/Library/LibraryDashboard";
import LibraryMessages from "./components/Library/LibraryMessages";
import LibraryEditProfile from "./components/Library/LibraryEditProfile";
import LibraryIssueReturn from "./components/Library/LibraryIssueReturn";

/* Transport */
import TransportDashboard from "./components/Transport/TransportDashboard";
import TransportEditProfile from "./components/Transport/TransportEditProfile";
import TransportMessages from "./components/Transport/TransportMessages";
import TransportIssueReturn from "./components/Transport/TransportIssueReturn";

// /* Laboratory */
// import LaboratoryDashboard from "./components/labortary/LaboratoryDashboard";
// import LaboratoryEditProfile from "./components/labortary/LaboratoryEditProfile";
// import LaboratoryMessages from "./components/labortary/LaboratoryMessages";

/* Student Service */
import ServiceDashboard from "./components/StudentServiceDepartment/ServiceDashboard";
import ServiceEditProfile from "./components/StudentServiceDepartment/ServiceEditProfile";
import ServiceMessage from "./components/StudentServiceDepartment/ServiceMessage";
import ServiceIssueReturn from "./components/StudentServiceDepartment/ServiceIssueReturn";

/* Fee Department */
import FeeDepartmentDashboard from "./components/FeeDepartment/FeeDepartmentDashboard";
import FeeEditProfile from "./components/FeeDepartment/FeeEditProfile";
import FeeMessagePage from "./components/FeeDepartment/MessagePage";
import FeeIssueReturn from "./components/FeeDepartment/FeeIssueReturn";

/* Coordination */
import CoordinationDashboard from "./components/CoordinationOffice/CoordinationDashboard";
import CoordinationMessages from "./components/CoordinationOffice/CoordinationMessages";
import CoordinationEditProfile from "./components/CoordinationOffice/CoordinationEditProfile";
import CoordinationIssueReturn from "./components/CoordinationOffice/CoordinationIssueReturn";

/* Shared Components */
import DepartmentIssueReturn from "./components/shared/DepartmentIssueReturn";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminEditProfile from "./components/Admin/AdminEditProfile";
import AdminMessages from "./components/Admin/AdminMessages";
import AdminUserManagement from "./components/Admin/AdminUserManagement";
import AdminClearance from "./components/Admin/AdminClearance";


/* Student Pages */
import ClearanceRequest from "./components/Student/ClearanceRequest";
import ClearanceStatus from "./components/Student/ClearanceStatus";
import ClearanceCertificate from "./components/Student/ClearanceCertificate";
import Messages from "./components/Student/Messages"; // ✅ Professional messages with full features
import EditProfile from "./components/Student/EditProfile";

import "./App.css";

/* =====================
   ERROR BOUNDARY
===================== */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#ef4444' }}>Something went wrong</h2>
          <p style={{ color: '#6b7280' }}>{this.state.error?.message}</p>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            style={{ marginTop: 16, padding: '10px 24px', background: '#003366', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Go to Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* =====================
   ROLE → DASHBOARD MAP
===================== */
function getDashboardPath() {
  try {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return "login";

    const user = JSON.parse(savedUser);
    const role = user.role?.toLowerCase();

  switch (role) {
    case "student":
      return "student-dashboard";
    case "library":
      return "library-dashboard";
    case "transport":
      return "transport-dashboard";
   
    case "studentservice":
      return "service-dashboard";
    case "feedepartment":
      return "fee-dashboard";
    case "coordination":
      return "coordination-dashboard";
    case "admin":
      return "admin-dashboard";

    default:
      return "login";
  }
  } catch (err) {
    console.error("Error in getDashboardPath:", err);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return "login";
  }
}

// Main App Routes Component
function AppRoutes() {
  const { isAuthenticated, loading } = useAuthContext();

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to={`/${getDashboardPath()}`} replace /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={`/${getDashboardPath()}`} replace /> : <Signup />} />
      <Route path="/forgot" element={isAuthenticated ? <Navigate to={`/${getDashboardPath()}`} replace /> : <ForgotPassword />} />

      {/* Protected Routes - Student */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Library */}
      <Route
        path="/library-dashboard"
        element={
          <ProtectedRoute allowedRoles={["library"]}>
            <LibraryDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library-messages"
        element={
          <ProtectedRoute allowedRoles={["library"]}>
            <LibraryMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library-edit-profile"
        element={
          <ProtectedRoute allowedRoles={["library"]}>
            <LibraryEditProfile />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Transport */}
      <Route
        path="/transport-dashboard"
        element={
          <ProtectedRoute allowedRoles={["transport"]}>
            <TransportDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transport-edit-profile"
        element={
          <ProtectedRoute allowedRoles={["transport"]}>
            <TransportEditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transport-messages"
        element={
          <ProtectedRoute allowedRoles={["transport"]}>
            <TransportMessages />
          </ProtectedRoute>
        }
      />


      {/* Protected Routes - Student Service */}
      <Route
        path="/service-dashboard"
        element={
          <ProtectedRoute allowedRoles={["studentservice"]}>
            <ServiceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-edit-profile"
        element={
          <ProtectedRoute allowedRoles={["studentservice"]}>
            <ServiceEditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-messages"
        element={
          <ProtectedRoute allowedRoles={["studentservice"]}>
            <ServiceMessage />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Fee Department */}
      <Route
        path="/fee-dashboard"
        element={
          <ProtectedRoute allowedRoles={["feedepartment"]}>
            <FeeDepartmentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fee-edit-profile"
        element={
          <ProtectedRoute allowedRoles={["feedepartment"]}>
            <FeeEditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fee-messages"
        element={
          <ProtectedRoute allowedRoles={["feedepartment"]}>
            <FeeMessagePage />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Coordination */}
      <Route
        path="/coordination-dashboard"
        element={
          <ProtectedRoute allowedRoles={["coordination"]}>
            <CoordinationDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordination-messages"
        element={
          <ProtectedRoute allowedRoles={["coordination"]}>
            <CoordinationMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordination-edit-profile"
        element={
          <ProtectedRoute allowedRoles={["coordination"]}>
            <CoordinationEditProfile />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Admin Panel (System Administrator) */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-edit-profile"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminEditProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-clearance"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminClearance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-messages"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminMessages />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUserManagement />
          </ProtectedRoute>
        }
      />

      {/* Issue & Return Management Routes - All Departments */}
      <Route
        path="/library-issue-return"
        element={
          <ProtectedRoute allowedRoles={["library"]}>
            <LibraryIssueReturn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transport-issue-return"
        element={
          <ProtectedRoute allowedRoles={["transport"]}>
            <TransportIssueReturn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fee-issue-return"
        element={
          <ProtectedRoute allowedRoles={["feedepartment"]}>
            <FeeIssueReturn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-issue-return"
        element={
          <ProtectedRoute allowedRoles={["studentservice"]}>
            <ServiceIssueReturn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordination-issue-return"
        element={
          <ProtectedRoute allowedRoles={["coordination"]}>
            <CoordinationIssueReturn />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Student Pages */}
      <Route
        path="/student-clearance-request"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ClearanceRequest />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student-clearance-status"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ClearanceStatus />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student-certificate"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ClearanceCertificate />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student-messages"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Messages />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student-edit-profile"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <EditProfile />
          </ProtectedRoute>
        }
      />

      {/* Default Routes */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to={`/${getDashboardPath()}`} replace />
            : <Navigate to="/login" replace />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
