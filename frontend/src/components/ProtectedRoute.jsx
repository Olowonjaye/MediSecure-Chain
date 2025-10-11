import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * ProtectedRoute
 * Usage:
 * <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
 *   <Route path="/doctor" element={<DoctorDashboard />} />
 * </Route>
 */
const ProtectedRoute = ({ allowedRoles } = {}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Not logged in -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles provided, check user's role
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = (user && user.role) || "";
    if (!allowedRoles.map((r) => r.toLowerCase()).includes(userRole.toLowerCase())) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Authorized -> render child routes
  return <Outlet />;
};

export default ProtectedRoute;
