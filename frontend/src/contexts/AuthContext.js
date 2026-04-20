import React, { createContext, useContext, useState, useEffect } from "react";
import api, { setAuthToken } from "../services/api";
import { getApiUrl } from "../config/apiConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        // Update api instance with stored token
        setAuthToken(storedToken);
      } catch (err) {
        console.error("Error parsing stored user:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const signup = async (userData) => {
    try {
      const response = await api.post("/api/signup", userData);

      if (response.data.success) {
        // ✅ After signup, DO NOT log in user - let them go to login page
        return { success: true, message: response.data.message };
      }
    } catch (err) {
      console.error("Signup Error:", err);
      return {
        success: false,
        message: err.response?.data?.message || "Signup failed"
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post("/api/login", {
        email,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        setToken(token);
        setUser(user);
        // Save to localStorage so they persist
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        // Update api instance with new token
        setAuthToken(token);
        return { success: true, message: response.data.message };
      } else {
        return {
          success: false,
          message: response.data.message || "Login failed"
        };
      }
    } catch (err) {
      console.error("Login Error:", err);
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Login failed",
        error: err.response?.data?.message || err.message || "Login failed"
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    signup,
    login,
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};
