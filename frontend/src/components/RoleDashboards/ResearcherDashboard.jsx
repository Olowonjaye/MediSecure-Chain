import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function ResearcherDashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="p-6 min-h-screen bg-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🔬 Researcher Dashboard</h1>
        <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
      </div>
      <p>Welcome, {user?.name || 'Researcher'}. This area is for data analysis and research tools.</p>
    </div>
  );
}
