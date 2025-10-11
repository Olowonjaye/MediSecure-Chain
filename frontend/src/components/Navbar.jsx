import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import WalletButton from "./WalletButton";
import { Menu, X } from "lucide-react";

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
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("medisecure_user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const role = user?.role || "guest";

  const handleLogout = () => {
    localStorage.removeItem("medisecure_user");
    navigate("/login");
  };

  // Define links for each role
  const roleLinks = {
    admin: [
      { name: "Dashboard", path: "/admin/dashboard" },
      { name: "Manage Users", path: "/admin/users" },
      { name: "Audit Logs", path: "/admin/audit" },
    ],
    doctor: [
      { name: "Dashboard", path: "/doctor/dashboard" },
      { name: "Patients", path: "/doctor/patients" },
      { name: "Reports", path: "/doctor/reports" },
    ],
    nurse: [
      { name: "Dashboard", path: "/nurse/dashboard" },
      { name: "Ward Records", path: "/nurse/wards" },
      { name: "Vitals", path: "/nurse/vitals" },
    ],
    pharmacist: [
      { name: "Dashboard", path: "/pharmacist/dashboard" },
      { name: "Prescriptions", path: "/pharmacist/prescriptions" },
      { name: "Inventory", path: "/pharmacist/inventory" },
    ],
    lab: [
      { name: "Dashboard", path: "/lab/dashboard" },
      { name: "Test Requests", path: "/lab/requests" },
      { name: "Results", path: "/lab/results" },
    ],
    consultant: [
      { name: "Dashboard", path: "/consultant/dashboard" },
      { name: "Consultations", path: "/consultant/consultations" },
      { name: "Reports", path: "/consultant/reports" },
    ],
    guest: [
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
      { name: "Support", path: "/support" },
    ],
  };

  const links = roleLinks[role] || [];

  return (
    <header className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-md z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
            MS
          </div>
          <h1 className="text-white text-lg font-semibold tracking-wide">
            MediSecure Chain
          </h1>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-white/90 font-medium">
          {links.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "underline text-white font-semibold"
                  : "hover:text-white transition-colors"
              }
            >
              {item.name}
            </NavLink>
          ))}
          {user && (
            <button
              onClick={handleLogout}
              className="hover:text-red-300 transition-colors font-semibold"
            >
              Logout
            </button>
          )}
          <WalletButton />
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 border-t border-white/20">
          <div className="px-6 py-4 space-y-3">
            {links.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? "block text-white font-semibold"
                    : "block text-white/90 hover:text-white transition"
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
                className="block text-left w-full text-red-300 font-semibold hover:text-red-100 transition"
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
