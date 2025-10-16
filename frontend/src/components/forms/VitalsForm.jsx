import React, { useState } from 'react';
import hospitalApi from '../../services/hospitalApi';
import { useToast } from '../ToastQueue';

export default function VitalsForm({ patientId }) {
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await hospitalApi.postEHR(patientId || 'unknown', {
        type: 'vitals', bp, hr, temp, notes, timestamp: new Date().toISOString()
      });
      addToast('Vitals saved to hospital EHR', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to save vitals: ' + (err.message || err), 'error');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <input placeholder="Blood Pressure (e.g. 120/80)" value={bp} onChange={e=>setBp(e.target.value)} className="border p-2" />
        <input placeholder="Heart Rate (bpm)" value={hr} onChange={e=>setHr(e.target.value)} className="border p-2" />
        <input placeholder="Temperature (°C)" value={temp} onChange={e=>setTemp(e.target.value)} className="border p-2" />
      </div>
      <textarea placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border p-2" />
      <button className="px-4 py-2 bg-indigo-600 text-white rounded">Save Vitals</button>
    </form>
  );
}
