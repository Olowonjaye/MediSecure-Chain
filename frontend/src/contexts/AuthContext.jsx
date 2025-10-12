import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastQueue";
import { signupUser, loginUser } from "../services/api";

const AuthContext = createContext();

// Custom hook for easy context access
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("medisecure_user");
    if (storedUser) return JSON.parse(storedUser);

    // In development, seed a demo user so components are visible while developing
    // This avoids having to sign up/log in repeatedly during UI work.
    try {
      if (import.meta.env && import.meta.env.DEV) {
        const demo = { name: "Dev Doctor", email: "dev@example.local", role: "doctor" };
        localStorage.setItem("medisecure_user", JSON.stringify(demo));
        return demo;
      }
    } catch (e) {
      // import.meta may not be available in some tools; ignore silently
    }

    return null;
  });

  const [loading, setLoading] = useState(false);
  
  // Helper: map roles to dashboard routes centrally
  const rolePath = (r) => {
    const key = (r || "").toLowerCase();
    switch (key) {
      case "admin":
        return "/admin-dashboard";
      case "doctor":
        return "/doctor-dashboard";
      case "nurse":
        return "/nurse-dashboard";
      case "pharmacist":
        return "/pharmacist-dashboard";
      case "lab scientist":
      case "laboratory scientist":
      case "lab":
        return "/lab-dashboard";
      case "consultant":
        return "/consultant-dashboard";
      default:
        return "/";
    }
  };

  // Function: Sign Up
  const signup = async (name, email, password, role) => {
    try {
      setLoading(true);

      // Try server signup first
      try {
        const res = await signupUser({ name, email, password, role });
        const { token, user } = res;
        localStorage.setItem('authToken', token);
        localStorage.setItem('medisecure_user', JSON.stringify(user));
        setUser(user);
        addToast('Signup successful! Redirecting...', 'success');
          // Map roles to dashboard routes
          const rolePath = (r) => {
            const key = (r || "").toLowerCase();
            switch (key) {
              case "admin":
                return "/admin-dashboard";
              case "doctor":
                return "/doctor-dashboard";
              case "nurse":
                return "/nurse-dashboard";
              case "pharmacist":
                return "/pharmacist-dashboard";
              case "lab scientist":
              case "laboratory scientist":
              case "lab":
                return "/lab-dashboard";
              case "consultant":
                return "/consultant-dashboard";
              default:
                return "/";
            }
          };
          navigate(rolePath(role));
        return true;
      } catch (err) {
        // Fallback to client-side demo behaviour when server unreachable
        console.warn('Server signup failed, falling back to local demo signup', err);
        const normalizedEmail = (email || '').toLowerCase();
        const newUser = { name, email: normalizedEmail, role, password };
        localStorage.setItem('medisecure_user', JSON.stringify(newUser));
        setUser(newUser);
        addToast('Signup successful (demo). Redirecting...', 'success');
        navigate(rolePath(role));
        return true;
      }
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
      // Try server login first
      try {
        const res = await loginUser({ email, password });
        const { token, user } = res;
        localStorage.setItem('authToken', token);
        localStorage.setItem('medisecure_user', JSON.stringify(user));
        setUser(user);
        addToast(`Welcome back, ${user.name}!`, 'success');
          navigate(rolePath(user.role));
        return true;
      } catch (err) {
        console.warn('Server login failed, falling back to local demo login', err);

        // Fallback to demo localStorage user
        const storedUser = JSON.parse(localStorage.getItem('medisecure_user'));
        const normalizedEmail = (email || '').toLowerCase();
        if (!storedUser || (storedUser.email || '').toLowerCase() !== normalizedEmail || storedUser.password !== password) {
          addToast('Invalid credentials', 'error');
          return false;
        }
        setUser(storedUser);
        addToast(`Welcome back, ${storedUser.name}!`, 'success');
  navigate(rolePath(storedUser.role));
        return true;
      }
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
