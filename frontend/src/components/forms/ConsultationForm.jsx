import React, { useState } from 'react';
import hospitalApi from '../../services/hospitalApi';
import { useToast } from '../ToastQueue';

export default function ConsultationForm({ patientId }){
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();

  const submit = async e => {
    e.preventDefault();
    try{
      await hospitalApi.postEHR(patientId || 'unknown', { type: 'consultation', reason, notes, timestamp: new Date().toISOString() });
      addToast('Consultation note saved', 'success');
    }catch(err){
      console.error(err);
      addToast('Failed to save consultation note', 'error');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input placeholder="Reason for consultation" value={reason} onChange={e=>setReason(e.target.value)} className="border p-2 w-full" />
      <textarea placeholder="Consultation notes" value={notes} onChange={e=>setNotes(e.target.value)} className="border p-2 w-full" />
      <button className="px-4 py-2 bg-indigo-600 text-white rounded">Save Note</button>
    </form>
  )
}
