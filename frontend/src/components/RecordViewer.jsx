import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function RecordViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/api/records/${id}`);
        if (!mounted) return;
        if (res.access === false) {
          setAccessDenied(true);
        } else {
          setRecord(res.record);
        }
      } catch (err) {
        if (err && err.message && err.message.includes('Access Denied')) {
          setAccessDenied(true);
        } else if (err && err.response && err.response.status === 403) {
          setAccessDenied(true);
        } else if (err && err.response && err.response.status === 404) {
          setError('Record not found');
        } else {
          setError(err.message || 'Failed to load record');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, navigate]);

  if (loading) return <div className="p-6 text-center">Loading record…</div>;
  if (accessDenied) return <div className="p-6 text-center text-red-600">Access Denied</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  // Display the record (assumes data is JSON string or object)
  let dataObj = null;
  try {
    dataObj = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
  } catch (e) {
    dataObj = record.data;
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Record {record.id}</h1>
      <div className="mb-4">
        <strong>Patient ID:</strong> {record.patientid || record.patientId}
      </div>

      <div className="bg-gray-50 p-4 rounded">
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(dataObj, null, 2)}</pre>
      </div>

      <div className="mt-4 text-sm text-gray-500">Created: {new Date(Number(record.createdat || record.createdAt)).toLocaleString()}</div>
    </div>
  );
}
