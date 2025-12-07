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

/* Transport */
import TransportDashboard from "./components/Transport/TransportDashboard";

/* Laboratory */
import LaboratoryDashboard from "./components/labortary/LaboratoryDashboard";

/* Student Service */
import ServiceDashboard from "./components/StudentServiceDepartment/ServiceDashboard";

/* Fee Department */
import FeeDepartmentDashboard from "./components/FeeDepartment/FeeDepartmentDashboard";

/* Coordination */
import CoordinationDashboard from "./components/CoordinationOffice/CoordinationDashboard";

/* HOD */
import HODDashboard from "./components/Hod/HODDashboard";

/* Student Pages */
import ClearanceRequest from "./components/Student/ClearanceRequest";
import ClearanceStatus from "./components/Student/ClearanceStatus";
import Messages from "./components/Student/Messages";
import EditProfile from "./components/Student/EditProfile";

import "./App.css";

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
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <Signup />} />
      <Route path="/forgot" element={isAuthenticated ? <Navigate to="/" /> : <ForgotPassword />} />

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

      {/* Protected Routes - Coordination */}
      <Route
        path="/coordination-dashboard"
        element={
          <ProtectedRoute allowedRoles={["coordination"]}>
            <CoordinationDashboard />
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
      <Route path="/" element={isAuthenticated ? <Navigate to="/student-dashboard" /> : <Navigate to="/login" />} />
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
