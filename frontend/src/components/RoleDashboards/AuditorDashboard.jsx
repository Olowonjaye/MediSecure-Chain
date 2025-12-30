import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function AuditorDashboard() {
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await api.get('/audit');
        setLogs(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.warn('Failed to load audit logs', e.message || e);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🕵️ Auditor Dashboard</h1>
        <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
      </div>

      <p className="mb-4">Welcome, {user?.name || 'Auditor'}. Use this dashboard to review system logs and compliance reports.</p>

      <section className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-3">Audit Logs</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-500">No audit entries yet.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto border rounded-md p-2 text-sm">
            {logs.map((l) => (
              <div key={l.id || l.ts} className="border-b py-2">
                <p><strong>{l.type}</strong> — {l.message}</p>
                <p className="text-xs text-gray-400">{new Date(l.ts || l.createdAt || Date.now()).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
