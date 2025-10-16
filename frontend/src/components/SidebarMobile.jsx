import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

/**
 * ------------------------------------------------------------
 * SidebarMobile Component
 * ------------------------------------------------------------
 * - Responsive sidebar for Medisecure EHR/EMR system
 * - Displays based on user role (6 dashboards)
 * - Supports toggle (open/close) on small screens
 * - Integrated logout clears user session
 * ------------------------------------------------------------
 */

const SidebarMobile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Get user data from localStorage
  const storedUser = localStorage.getItem("medisecure_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role || "guest";

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("medisecure_user");
    navigate("/login");
  };

  // Define menu links per role
  const menuItems = {
    admin: [
      { name: "Dashboard", path: "/admin/dashboard" },
      { name: "Manage Users", path: "/admin/users" },
      { name: "Audit Logs", path: "/admin/audit" },
      { name: "Settings", path: "/admin/settings" },
    ],
    doctor: [
      { name: "Dashboard", path: "/doctor/dashboard" },
      { name: "Patients", path: "/doctor/patients" },
      { name: "Appointments", path: "/doctor/appointments" },
      { name: "Reports", path: "/doctor/reports" },
    ],
    nurse: [
      { name: "Dashboard", path: "/nurse/dashboard" },
      { name: "Ward Records", path: "/nurse/wards" },
      { name: "Vitals Entry", path: "/nurse/vitals" },
      { name: "Patient List", path: "/nurse/patients" },
    ],
    pharmacist: [
      { name: "Dashboard", path: "/pharmacist/dashboard" },
      { name: "Prescriptions", path: "/pharmacist/prescriptions" },
      { name: "Inventory", path: "/pharmacist/inventory" },
    ],
    lab: [
      { name: "Dashboard", path: "/lab/dashboard" },
      { name: "Test Requests", path: "/lab/requests" },
      { name: "Results Upload", path: "/lab/results" },
    ],
    consultant: [
      { name: "Dashboard", path: "/consultant/dashboard" },
      { name: "Consultations", path: "/consultant/consultations" },
      { name: "Reports", path: "/consultant/reports" },
    ],
    patient: [
      { name: "Dashboard", path: "/patient-dashboard" },
      { name: "My Records", path: "/records" },
      { name: "My EHR", path: "/ehr" },
    ],
  };

  const links = menuItems[role] || [];

  return (
  <div className="md:hidden fixed top-0 left-0 w-full z-50 bg-white shadow-md border-b border-primary">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold tracking-wide">MediSecure</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="focus:outline-none hover:opacity-90 transition"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Collapsible Menu */}
      {isOpen && (
        <div className="flex flex-col bg-white text-gray-800 rounded-b-lg shadow-md">
          {links.length > 0 ? (
            links.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 border-b border-gray-100 hover:bg-indigo-100 hover:text-indigo-600 transition"
              >
                {item.name}
              </Link>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-gray-500">
              No menu available for this role
            </p>
          )}

          <button
            onClick={handleLogout}
            className="px-4 py-3 text-left text-red-500 font-semibold hover:bg-red-50 border-t border-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarMobile;
