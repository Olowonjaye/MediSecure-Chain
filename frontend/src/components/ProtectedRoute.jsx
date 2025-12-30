import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { verifyToken as apiVerifyToken } from "../services/api";

/**
 * ProtectedRoute
 * - Verifies JWT with backend when needed
 * - Hydrates AuthContext via setUser when verify succeeds
 * - Redirects unauthorized roles to their role-specific dashboard
 */
const ProtectedRoute = ({ allowedRoles, children } = {}) => {
  const { user, isAuthenticated, setUser } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(false);

  // Map role -> dashboard path (kept in sync with AuthContext)
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
      case "researcher":
        return "/researcher-dashboard";
      case "consultant":
        return "/consultant-dashboard";
      case "patient":
        return "/patient-dashboard";
      case "auditor":
        return "/auditor-dashboard";
      default:
        return "/";
    }
  };

  useEffect(() => {
    let mounted = true;
    async function checkToken() {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      // If we already have a user in context, no need to verify
      if (isAuthenticated && user) return;

      setChecking(true);
      try {
        const verified = await apiVerifyToken();
        if (verified && mounted) {
          // apiVerifyToken returns user object
          setUser(verified);
        } else if (!verified) {
          // invalid token -> clear and force login
          localStorage.removeItem('authToken');
          localStorage.removeItem('medisecure_user');
        }
      } catch (e) {
        console.warn('Token verify failed', e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('medisecure_user');
      } finally {
        if (mounted) setChecking(false);
      }
    }

    checkToken();
    return () => { mounted = false; };
  }, [isAuthenticated, setUser, user]);

  // While verifying token, show nothing (or a small loader)
  if (checking) return <div className="p-6 text-center">Checking authentication...</div>;

  // Not logged in -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles provided, check user's role; if not allowed, redirect to user's dashboard
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = (user && user.role) || "";
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
    if (!normalizedAllowed.includes(userRole.toLowerCase())) {
      // redirect to user's role dashboard
      return <Navigate to={rolePath(userRole)} replace />;
    }
  }

  // Authorized -> render nested routes or children
  if (children) return children;
  return <Outlet />;
};

export default ProtectedRoute;
