// =============================================
// MediSecure Chain - API Service Layer
// =============================================
// This module centralizes all REST API requests made from the frontend.
// It automatically handles JSON headers, authentication tokens,
// and integrates with the blockchain backend or Express API if configured.
//
// Environment variables (defined in .env):
// VITE_API_BASE_URL  -> Base backend URL
// =============================================

import axios from "axios";

// ---------------------------------------------
// Base configuration
// ---------------------------------------------
const api = axios.create({
  // Backend server default is PORT 4000 (see backend/server.js)
  // Prefer VITE_API_URL (used in .env), fall back to VITE_API_BASE_URL for compatibility
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------
// Add token to every request if logged in
// ---------------------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------
// AUTHENTICATION
// ---------------------------------------------
export const signupUser = async (data) => {
  try {
    const res = await api.post("/auth/signup", data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const loginUser = async (data) => {
  try {
    const res = await api.post("/auth/login", data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const forgotPassword = async (data) => {
  try {
    const res = await api.post('/auth/forgot-password', data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const resetPassword = async (data) => {
  try {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const verifyToken = async () => {
  try {
    const res = await api.get("/auth/verify");
    return res.data;
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
};

// ---------------------------------------------
// MEDICAL RECORDS (EHR/EMR)
// ---------------------------------------------
export const getAllRecords = async () => {
  try {
    const res = await api.get("/records");
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const createRecord = async (recordData) => {
  try {
    const res = await api.post("/records", recordData);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const getRecordById = async (id) => {
  try {
    const res = await api.get(`/records/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// ---------------------------------------------
// USER MANAGEMENT (Admin / Role Assignment)
// ---------------------------------------------
export const getAllUsers = async () => {
  try {
    const res = await api.get("/users");
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const res = await api.patch(`/users/${userId}/role`, { role });
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// ---------------------------------------------
// SUPPORT / CONTACT MESSAGES
// ---------------------------------------------
export const sendSupportMessage = async (data) => {
  try {
    const res = await api.post("/support", data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// ---------------------------------------------
// GOOGLE MAP / LOCATION SERVICE
// (Frontend can use this to send geo data to backend)
// ---------------------------------------------
export const updateLocation = async (coords) => {
  try {
    const res = await api.post("/location", coords);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

// ---------------------------------------------
// EXPORT DEFAULT API INSTANCE
// ---------------------------------------------
export default api;
