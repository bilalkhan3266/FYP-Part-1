// ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuthContext();

  // Show loading while checking authentication
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

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0) {
    const userRole = user.role ? user.role.toLowerCase() : "";
    const allowedRolesLower = allowedRoles.map(r => r.toLowerCase());
    
    if (!allowedRolesLower.includes(userRole)) {
      console.log("User role not allowed, redirecting to login");
      return <Navigate to="/login" replace />;
    }
  }

  // Authenticated and authorized
  return children;
};

export default ProtectedRoute;
