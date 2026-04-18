// Centralized API URL configuration
// This file determines the correct backend API URL based on the current environment

const API_URLS = {
  production: "https://fyp-part-1-production.up.railway.app",
  development: "http://localhost:5000"
};

export function getApiUrl() {
  try {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return API_URLS.development;
    }
  } catch (e) {
    // window not available (SSR)
  }
  return API_URLS.production;
}

export default getApiUrl;
