import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastQueue";

const AuthContext = createContext();

// Custom hook for easy context access
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("medisecure_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  // Function: Sign Up
  const signup = async (name, email, password, role) => {
    try {
      setLoading(true);

      // Simulated API delay
      await new Promise((res) => setTimeout(res, 800));

      const newUser = { name, email, role, password };
      localStorage.setItem("medisecure_user", JSON.stringify(newUser));
      setUser(newUser);

      addToast("Signup successful! Redirecting...", "success");
      navigate(`/dashboard/${role.toLowerCase()}`);
    } catch (error) {
      addToast("Signup failed. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Function: Login
  const login = async (email, password) => {
    try {
      setLoading(true);

      // Simulate verification
      await new Promise((res) => setTimeout(res, 800));
      const storedUser = JSON.parse(localStorage.getItem("medisecure_user"));

      if (!storedUser || storedUser.email !== email || storedUser.password !== password) {
        addToast("Invalid credentials", "error");
        return false;
      }

      setUser(storedUser);
      addToast(`Welcome back, ${storedUser.name}!`, "success");
      navigate(`/dashboard/${storedUser.role.toLowerCase()}`);
      return true;
    } catch (error) {
      addToast("Login error. Try again.", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function: Logout
  const logout = () => {
    localStorage.removeItem("medisecure_user");
    setUser(null);
    addToast("You have logged out.", "info");
    navigate("/");
  };

  // Keep user session active
  useEffect(() => {
    const storedUser = localStorage.getItem("medisecure_user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
