import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiry & authentication failure
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = typeof error.response?.data?.message === "string" ? error.response.data.message.toLowerCase() : "";
    const isJwtError =
      message.includes("jwt") ||
      message.includes("invalid signature") ||
      message.includes("invalid token") ||
      message.includes("session expired") ||
      message.includes("token missing") ||
      message.includes("unauthorized");
    const isUnauthorized = error.response?.status === 401 || error.response?.status === 403;

    if ((isUnauthorized || isJwtError) && window.location.pathname !== "/login") {
      // Clear storage and redirect to login if unauthorized or token expired
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
