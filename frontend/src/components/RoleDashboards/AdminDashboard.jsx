import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api"; // default axios instance
import AdminUsers from "../forms/AdminUsers";
import { FaUserMd, FaUserNurse, FaFlask, FaPills, FaUserTie, FaUsers } from "react-icons/fa";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, auditRes] = await Promise.all([
          api.get("/users"),
          api.get("/audit").catch(() => ({ data: [] }))
        ]);
        setUsers(userRes.data);
        setAudit(auditRes.data || []);
      } catch (err) {
        console.error("AdminDashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-3">
        <h1 className="text-2xl font-bold text-blue-800">MediSecure Admin Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Welcome Card */}
      <div className="bg-white shadow-md rounded-lg p-5 mb-6">
        <h2 className="text-xl font-semibold text-gray-700">Welcome, {user?.name || "Admin"}</h2>
        <p className="text-gray-500">You are logged in as <strong>{user?.role}</strong>.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <DashboardCard icon={<FaUserMd />} label="Doctors" count={roleCounts.doctor || 0} />
        <DashboardCard icon={<FaUserNurse />} label="Nurses" count={roleCounts.nurse || 0} />
        <DashboardCard icon={<FaPills />} label="Pharmacists" count={roleCounts.pharmacist || 0} />
        <DashboardCard icon={<FaFlask />} label="Lab Scientists" count={roleCounts.lab || 0} />
        <DashboardCard icon={<FaUserTie />} label="Consultants" count={roleCounts.consultant || 0} />
        <DashboardCard icon={<FaUsers />} label="Total Users" count={users.length} />
      </div>

      {/* User Management */}
      <section className="bg-white shadow-md rounded-lg p-5 mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Registered Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700 border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-3 border">Name</th>
                <th className="py-2 px-3 border">Email</th>
                <th className="py-2 px-3 border">Role</th>
                <th className="py-2 px-3 border">Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-2 px-3 border">{u.name}</td>
                  <td className="py-2 px-3 border">{u.email}</td>
                  <td className="py-2 px-3 border capitalize">{u.role}</td>
                  <td className="py-2 px-3 border">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <AdminUsers />
        </div>
      </section>

      {/* Audit Logs */}
      <section className="bg-white shadow-md rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">System Audit Logs</h3>
        {audit.length === 0 ? (
          <p className="text-gray-500">No audit logs yet.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto border rounded-md p-3 text-sm">
            {audit.map((entry) => (
              <div key={entry.id} className="border-b py-2">
                <p>
                  <span className="font-semibold">{entry.type}</span>: {entry.message}
                </p>
                <p className="text-gray-400 text-xs">
                  {new Date(entry.ts).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

/** Small card component for summary section */
const DashboardCard = ({ icon, label, count }) => (
  <div className="flex items-center bg-white rounded-xl shadow p-4 space-x-4">
    <div className="text-blue-600 text-3xl">{icon}</div>
    <div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-xl font-bold text-gray-800">{count}</p>
    </div>
  </div>
);

export default AdminDashboard;
