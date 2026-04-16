// src/services/api.js
import axios from "axios";

// Create Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000", // Change if your backend URL is different
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
