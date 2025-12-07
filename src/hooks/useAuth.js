import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  // ✅ Initialize auth on app load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        console.log("🔍 Initializing auth...");
        console.log("Token:", storedToken ? "exists" : "none");
        console.log("User:", storedUser);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ✅ Login function
  const login = async (authToken, userData) => {
    try {
      console.log("✅ Logging in user:", userData);
      
      // Store in state
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);

      // Store in localStorage
      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  // ✅ Logout function
  const logout = () => {
    console.log("🚪 Logging out...");
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook to use auth
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};

// ✅ Alias for useAuthContext (backward compatibility)
export const useAuth = useAuthContext;
