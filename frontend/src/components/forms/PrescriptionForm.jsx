import React, { useState } from 'react';
import hospitalApi from '../../services/hospitalApi';
import { useToast } from '../ToastQueue';

export default function PrescriptionForm({ patientId }){
  const [medication, setMedication] = useState('');
  const [dose, setDose] = useState('');
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();

  const submit = async e => {
    e.preventDefault();
    try{
      await hospitalApi.postEHR(patientId || 'unknown', { type: 'prescription', medication, dose, notes, timestamp: new Date().toISOString() });
      addToast('Prescription saved', 'success');
    }catch(err){
      console.error(err);
      addToast('Failed to save prescription', 'error');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input placeholder="Medication name" value={medication} onChange={e=>setMedication(e.target.value)} className="border p-2 w-full" />
      <input placeholder="Dose / instructions" value={dose} onChange={e=>setDose(e.target.value)} className="border p-2 w-full" />
      <textarea placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} className="border p-2 w-full" />
      <button className="px-4 py-2 bg-indigo-600 text-white rounded">Save Prescription</button>
    </form>
  )
}
