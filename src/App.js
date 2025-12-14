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

/* Transport */
import TransportDashboard from "./components/Transport/TransportDashboard";

/* Laboratory */
import LaboratoryDashboard from "./components/labortary/LaboratoryDashboard";

/* Student Service */
import ServiceDashboard from "./components/StudentServiceDepartment/ServiceDashboard";

/* Fee Department */
import FeeDepartmentDashboard from "./components/FeeDepartment/FeeDepartmentDashboard";
import FeeEditProfile from "./components/FeeDepartment/FeeEditProfile";
import FeeMessagePage from "./components/FeeDepartment/MessagePage";

/* Coordination */
import CoordinationDashboard from "./components/CoordinationOffice/CoordinationDashboard";
import CoordinationMessages from "./components/CoordinationOffice/CoordinationMessages";
import CoordinationEditProfile from "./components/CoordinationOffice/CoordinationEditProfile";

/* HOD */
import HODDashboard from "./components/Hod/HODDashboard";

/* Student Pages */
import ClearanceRequest from "./components/Student/ClearanceRequest";
import ClearanceStatus from "./components/Student/ClearanceStatus";
import Messages from "./components/Student/Messages"; // ✅ Professional messages with full features
import EditProfile from "./components/Student/EditProfile";

import "./App.css";

/* =====================
   ROLE → DASHBOARD MAP
===================== */
function getDashboardPath() {
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
    case "laboratory":
      return "lab-dashboard";
    case "studentservice":
      return "service-dashboard";
    case "feedepartment":
      return "fee-dashboard";
    case "coordination":
      return "coordination-dashboard";
    case "hod":
      return "hod-dashboard";
    default:
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
      <Route path="/login" element={isAuthenticated ? <Navigate to={`/${getDashboardPath()}`} /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={`/${getDashboardPath()}`} /> : <Signup />} />
      <Route path="/forgot" element={isAuthenticated ? <Navigate to={`/${getDashboardPath()}`} /> : <ForgotPassword />} />

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

      {/* Protected Routes - Laboratory */}
      <Route
        path="/lab-dashboard"
        element={
          <ProtectedRoute allowedRoles={["laboratory"]}>
            <LaboratoryDashboard />
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

      {/* Protected Routes - HOD */}
      <Route
        path="/hod-dashboard"
        element={
          <ProtectedRoute allowedRoles={["hod"]}>
            <HODDashboard />
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
            ? <Navigate to={`/${getDashboardPath()}`} />
            : <Navigate to="/login" />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
