import React, { useState } from 'react';
import hospitalApi from '../../services/hospitalApi';
import { useToast } from '../ToastQueue';

export default function LabResultForm({ patientId }){
  const [testType, setTestType] = useState('');
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();

  const submit = async e => {
    e.preventDefault();
    try{
      await hospitalApi.postEHR(patientId || 'unknown', { type: 'lab', testType, result, notes, timestamp: new Date().toISOString() });
      addToast('Lab result recorded', 'success');
    }catch(err){
      console.error(err);
      addToast('Failed to record lab result', 'error');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input placeholder="Test type (e.g. CBC)" value={testType} onChange={e=>setTestType(e.target.value)} className="border p-2 w-full" />
      <textarea placeholder="Result summary" value={result} onChange={e=>setResult(e.target.value)} className="border p-2 w-full" />
      <textarea placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} className="border p-2 w-full" />
      <button className="px-4 py-2 bg-indigo-600 text-white rounded">Save Lab Result</button>
    </form>
  )
}
