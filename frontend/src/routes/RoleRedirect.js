// src/routes/RoleRedirect.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import "./Loader.css"; // import the CSS for spinner

// Loader Component
function Loader() {
  return (
    <div className="loader-wrapper">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

function RoleRedirect() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuthContext();

  const roleRoutes = {
    Student: "/student-dashboard",
    Library: "/library-dashboard",
    Transport: "/transport-dashboard",
    Laboratory: "/lab-dashboard",
    StudentService: "/service-dashboard",
    FeeDepartment: "/fee-dashboard",
    Coordination: "/coordination-dashboard",
    Hod: "/hod-dashboard",
  };

  useEffect(() => {
    if (isLoading) return; // wait until auth loads

    // Not authenticated → redirect to login
    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
      return;
    }

    // Role-based routing
    const targetRoute = roleRoutes[user.role];
    if (targetRoute) {
      navigate(targetRoute, { replace: true });
    } else {
      // Unknown role → redirect to a fallback page
      navigate("/unknown-role", { replace: true });
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  if (isLoading) return <Loader />;

  return null;
}

export default RoleRedirect;
