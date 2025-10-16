import React, { useEffect, useState } from 'react';
import { useToast } from '../ToastQueue';

// Minimal admin user management UI (mocked)
export default function AdminUsers(){
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(()=>{
    // For now, read users from localStorage demo list if present
    const stored = localStorage.getItem('medisecure_users');
    if (stored) setUsers(JSON.parse(stored));
  },[]);

  const addDemoUser = () => {
    const u = { id: Date.now(), name: 'New User', email: 'new@example.local', role: 'doctor' };
    const updated = [...users, u];
    setUsers(updated);
    localStorage.setItem('medisecure_users', JSON.stringify(updated));
    addToast('Demo user added', 'success');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">User Management</h3>
        <button onClick={addDemoUser} className="px-3 py-1 bg-indigo-600 text-white rounded">Add Demo User</button>
      </div>
      <div className="space-y-2">
        {users.map(u=> (
          <div key={u.id} className="p-3 bg-white rounded border">{u.name} — <span className="text-sm text-slate-500">{u.email}</span> <span className="ml-2 text-xs text-slate-400">{u.role}</span></div>
        ))}
        {!users.length && <p className="text-sm text-slate-500">No users found (demo).</p>}
      </div>
    </div>
  )
}
