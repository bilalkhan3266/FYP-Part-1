// src/services/api.js
import axios from "axios";

// Determine API base URL based on environment
const getBaseURL = () => {
  // Always use Railway backend in production
  if (typeof window !== 'undefined') {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5000";
    } else {
      return "https://fyp-part-1-production.up.railway.app";
    }
  }
  return "https://fyp-part-1-production.up.railway.app"; // Default for SSR
};

// Create Axios instance
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to set token manually if needed
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
  }
};

// Axios request interceptor to automatically attach token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
