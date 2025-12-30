import React from "react";
import { useNavigate } from "react-router-dom";

const sidebarItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-6H3v6z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "records",
    label: "Records",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none">
        <path
          d="M8 7h8M8 11h8M8 15h5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "access",
    label: "Access Control",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "audit",
    label: "Audit Trail",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 8v4l3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "support",
    label: "Support",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 8a3 3 0 0 1 3 3c0 2-3 2-3 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="17" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "patient",
    label: "Patient Dashboard",
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 20v-1a4 4 0 014-4h8a4 4 0 014 4v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Sidebar({ active, setActive }) {
  const navigate = useNavigate();
  return (
    <aside
      className="w-64 hidden md:block border-r border-slate-200 bg-indigo-50 backdrop-blur-lg"
      aria-label="Main navigation"
    >
      <nav className="sticky top-6 space-y-2 px-2 py-6" role="navigation">
        {sidebarItems.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setActive(item.key);
                // Navigate based on key
                if (item.key === 'dashboard') navigate('/');
                if (item.key === 'records') navigate('/records');
                if (item.key === 'access') navigate('/access');
                if (item.key === 'audit') navigate('/audit');
                if (item.key === 'patient') navigate('/patient-dashboard');
                if (item.key === 'support') navigate('/support');
              }}
              aria-pressed={isActive}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 
              ${
                isActive
                  ? "bg-indigo-100 border-l-4 border-indigo-500 shadow-sm"
                  : "hover:bg-indigo-100 hover:translate-x-1"
              }`}
            >
              <div
                className={`p-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-slate-500"
                }`}
              >
                {item.icon({ className: "w-5 h-5" })}
              </div>
              <div
                className={`text-sm font-medium ${
                  isActive ? "text-slate-900" : "text-slate-700"
                }`}
              >
                {item.label}
              </div>
            </button>
          );
        })}

        {/* Sidebar Footer Note */}
        <div className="mt-8 px-4 text-xs text-slate-400 italic">
          💡 Connect your wallet (top-right) to use on-chain EHR features.
        </div>
      </nav>
    </aside>
  );
}
