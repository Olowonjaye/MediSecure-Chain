// Simple hospital backend API client wrapper
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function postEHR(patientId, payload) {
  const res = await fetch(`${API_BASE}/api/hospital/patients/${patientId}/ehr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`EHR upload failed: ${res.statusText}`);
  return res.json();
}

export async function postRecordFile(patientId, formData) {
  const res = await fetch(`${API_BASE}/api/hospital/patients/${patientId}/records`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });
  if (!res.ok) throw new Error(`File upload failed: ${res.statusText}`);
  return res.json();
}

export async function listPatients() {
  const res = await fetch(`${API_BASE}/api/hospital/patients`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to list patients: ${res.statusText}`);
  return res.json();
}

export async function createPatient(payload) {
  // payload: { name, dob, gender, meta }
  const res = await fetch(`${API_BASE}/api/hospital/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create patient: ${res.statusText}`);
  return res.json();
}

export async function searchPatients(q, page = 1, limit = 10) {
  const url = new URL(`${API_BASE}/api/hospital/patients`);
  url.searchParams.set('q', q);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  const res = await fetch(String(url), { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
  if (!res.ok) throw new Error(`Patient search failed: ${res.statusText}`);
  return res.json();
}

export async function fetchPatientProfile(patientId) {
  const res = await fetch(`${API_BASE}/api/hospital/patients/${patientId}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch patient: ${res.statusText}`);
  return res.json();
}

export async function createAppointment(patientId, payload) {
  const res = await fetch(`${API_BASE}/api/hospital/patients/${patientId}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create appointment: ${res.statusText}`);
  return res.json();
}

export async function lodgeComplaint(patientId, payload) {
  const res = await fetch(`${API_BASE}/api/hospital/patients/${patientId}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to lodge complaint: ${res.statusText}`);
  return res.json();
}

export async function sendEmergencyNotification(payload) {
  // Payload: { patientId, contact: {name, phone, email, address}, location, tempAccessToken }
  const res = await fetch(`${API_BASE}/api/hospital/emergency/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to send emergency notification: ${res.statusText}`);
  return res.json();
}

export default { postEHR, postRecordFile, fetchPatientProfile, listPatients, createPatient, searchPatients, createAppointment, lodgeComplaint, sendEmergencyNotification };
