// frontend/src/App.jsx
import React, { lazy, Suspense, useState, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { ToastProvider } from "./components/ToastQueue";
import { useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Core Pages
import Signup from "./pages/Signup";
import Login from "./pages/Login";

// Lazy-Loaded Components
const Dashboard = lazy(() => import("./components/Dashboard"));
const Records = lazy(() => import("./components/Records"));
const Audit = lazy(() => import("./components/Audit"));
const AccessControl = lazy(() => import("./components/AccessControl"));
const EHRForm = lazy(() => import("./components/EHRForm"));
const DebugCSS = lazy(() => import("./components/DebugCSS"));

// Role Dashboards
const AdminDashboard = lazy(() =>
  import("./components/RoleDashboards/AdminDashboard")
);
const DoctorDashboard = lazy(() =>
  import("./components/RoleDashboards/DoctorDashboard")
);
const NurseDashboard = lazy(() =>
  import("./components/RoleDashboards/NurseDashboard")
);
const PharmacistDashboard = lazy(() =>
  import("./components/RoleDashboards/PharmacistDashboard")
);
const LabDashboard = lazy(() =>
  import("./components/RoleDashboards/LabDashboard")
);
const ConsultantDashboard = lazy(() =>
  import("./components/RoleDashboards/ConsultantDashboard")
);

export default function App() {
  const [active, setActive] = useState("dashboard");
  const { user } = useAuth();

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 text-slate-800">

      {/* Navbar */}
      <Navbar />

      {/* Main Layout */}
      <div className="flex-1 container mx-auto px-6 py-8 grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        {user && <Sidebar active={active} setActive={setActive} />}

        {/* Main Content */}
        <main className={`md:col-span-3 ${!user ? "col-span-4" : ""}`}>
          <Suspense
            fallback={
              <div className="p-6 bg-white rounded-2xl shadow-sm text-slate-500 text-center">
                Loading…
              </div>
            }
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Default Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard active={active} />
                  </ProtectedRoute>
                }
              />

              {/* Blockchain-Linked Components */}
              <Route
                path="/records"
                element={
                  <ProtectedRoute>
                    <Records />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute>
                    <Audit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/access"
                element={
                  <ProtectedRoute>
                    <AccessControl />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ehr"
                element={
                  <ProtectedRoute>
                    <EHRForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debug-css"
                element={
                  <ProtectedRoute>
                    <DebugCSS />
                  </ProtectedRoute>
                }
              />

              {/* Role-Based Dashboards */}
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["doctor"]}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nurse-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["nurse"]}>
                    <NurseDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacist-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["pharmacist"]}>
                    <PharmacistDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["laboratory scientist", "lab"]}>
                    <LabDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultant-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["consultant"]}>
                    <ConsultantDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Redirects */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      </div>
    </ToastProvider>
  );
}
