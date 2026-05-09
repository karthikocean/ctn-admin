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

// Add a response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isJwtExpired = error.response?.data?.message === "jwt expired";
    const isUnauthorized = error.response?.status === 401;

    if ((isUnauthorized || isJwtExpired) && window.location.pathname !== "/login") {
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
