import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import WalletButton from "./WalletButton";
import { Menu, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../assets/medsecure-logo.png";

/**
 * ------------------------------------------------------------
 * MediSecure Navbar Component
 * ------------------------------------------------------------
 * - Consistent with SidebarMobile styling
 * - Shows dynamic links based on logged-in role
 * - Integrated logout and wallet connection
 * - Smooth responsive menu for mobile
 * ------------------------------------------------------------
 */

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || "guest";

  const handleLogout = () => {
    localStorage.removeItem("medisecure_user");
    navigate("/login");
  };

  // Define links for each role
  const roleLinks = {
    admin: [
      { name: "Dashboard", path: "/admin-dashboard" },
      { name: "Manage Users", path: "/admin-dashboard" }, // assuming admin dashboard handles users
      { name: "Audit Logs", path: "/audit" },
    ],
    doctor: [
      { name: "Dashboard", path: "/doctor-dashboard" },
      { name: "Patients", path: "/doctor-dashboard" },
      { name: "Reports", path: "/doctor-dashboard" },
    ],
    nurse: [
      { name: "Dashboard", path: "/nurse-dashboard" },
      { name: "Ward Records", path: "/nurse-dashboard" },
      { name: "Vitals", path: "/nurse-dashboard" },
    ],
    pharmacist: [
      { name: "Dashboard", path: "/pharmacist-dashboard" },
      { name: "Prescriptions", path: "/pharmacist-dashboard" },
      { name: "Inventory", path: "/pharmacist-dashboard" },
    ],
    lab: [
      { name: "Dashboard", path: "/lab-dashboard" },
      { name: "Test Requests", path: "/lab-dashboard" },
      { name: "Results", path: "/lab-dashboard" },
    ],
    consultant: [
      { name: "Dashboard", path: "/consultant-dashboard" },
      { name: "Consultations", path: "/consultant-dashboard" },
      { name: "Reports", path: "/consultant-dashboard" },
    ],
    patient: [
      { name: "Dashboard", path: "/patient-dashboard" },
      { name: "My Records", path: "/records" },
      { name: "My EHR", path: "/ehr" },
    ],
    auditor: [
      { name: "Dashboard", path: "/auditor-dashboard" },
      { name: "Audit Logs", path: "/audit" },
    ],
    researcher: [
      { name: "Dashboard", path: "/researcher-dashboard" },
    ],
    guest: [
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
      { name: "Support", path: "/support" },
    ],
  };

  const links = roleLinks[role] || [];

  return (
  <header className="w-full bg-green-600 shadow-md z-50 border-b">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src={Logo}
            alt="MediSecure Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain"
          />
          <h1 className="text-white text-lg md:text-xl font-semibold tracking-wide">
            MediSecure Chain
          </h1>
        </div>

        {/* Desktop Menu */}
  <div className="hidden md:flex items-center gap-6 text-white font-medium">
          {links.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "underline text-white font-semibold"
                  : "hover:text-gray-200 transition-colors"
              }
            >
              {item.name}
            </NavLink>
          ))}
          {user && (
            <button
              onClick={handleLogout}
              className="text-white hover:text-gray-200 font-semibold"
            >
              Logout
            </button>
          )}
          <WalletButton />
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-slate-800 text-2xl"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
  <div className="md:hidden bg-green-600 border-t border-green-700">
          <div className="px-6 py-4 space-y-3">
            {links.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? "block text-white font-semibold"
                    : "block text-white hover:text-gray-200 transition"
                }
              >
                {item.name}
              </NavLink>
            ))}

            {user && (
              <button
                onClick={() => {
                  handleLogout();
                  setOpen(false);
                }}
                className="block text-left w-full text-white font-semibold hover:text-gray-200 transition"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
