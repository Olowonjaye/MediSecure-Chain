import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ToastQueue";
import EHRForm from "../EHRForm";
import Records from "../Records";
import hospitalApi from "../../services/hospitalApi";

// Simple helper to generate a temporary access token (not secure, for demonstration only)
function generateTempToken() {
  return 'tmp_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// Patient Dashboard
export default function PatientDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [complaint, setComplaint] = useState("");
  const [contact, setContact] = useState({ name: "", phone: "", email: "", address: "" });
  const [location, setLocation] = useState(null);
  const [sendingEmergency, setSendingEmergency] = useState(false);
  const [simulatedNotification, setSimulatedNotification] = useState(null);

  useEffect(() => {
    // In a full implementation, fetch patient profile from backend/hospital DB.
    // For now, show the authenticated user's info if present.
    if (user) {
      setProfile({
        name: user.name || "Patient",
        email: user.email || "",
        id: user.id || user.address || "N/A",
        dob: user.dob || "",
        gender: user.gender || "",
        allergies: user.allergies || [],
        medications: user.medications || [],
      });
    }
  }, [user]);

  useEffect(()=>{
    // Optionally fetch appointments from backend if API available
    (async ()=>{
      try {
        if (profile && profile.id) {
          // Placeholder: if backend has appointments path, fetch them here.
          // const appts = await hospitalApi.getAppointments(profile.id);
          // setAppointments(appts || []);
        }
      } catch (err) { console.warn(err); }
    })();
  }, [profile]);

  const detectLocation = () => {
    if (!navigator.geolocation) return addToast('Geolocation not supported in this browser', 'error');
    navigator.geolocation.getCurrentPosition((pos)=>{
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(coords);
      addToast('Location captured', 'success');
    }, (err)=>{ console.warn(err); addToast('Unable to get location', 'error'); });
  };

  const sendEmergency = async () => {
    if (!contact || (!contact.phone && !contact.email)) return addToast('Please provide at least a phone or email for emergency contact', 'error');
    setSendingEmergency(true);
    const tempToken = generateTempToken();
    const payload = {
      patientId: profile?.id || 'unknown',
      contact,
      location,
      tempAccessToken: tempToken,
    };
    try {
      // Attempt server-side notify
      await hospitalApi.sendEmergencyNotification(payload);
      setSimulatedNotification({ sent: true, payload });
      addToast('Emergency notification sent', 'success');
    } catch (err) {
      // fallback to client-side simulation: show the message the system would send
      console.warn('Emergency notify failed, simulating', err);
      setSimulatedNotification({ sent: false, payload });
      addToast('Emergency notification simulated (no backend)', 'info');
    } finally { setSendingEmergency(false); }
  };

  const bookAppointment = async (role, date, notes) => {
    if (!profile || !profile.id) return addToast('No patient selected', 'error');
    try {
      const res = await hospitalApi.createAppointment(profile.id, { role, date, notes });
      addToast('Appointment requested', 'success');
      // optionally refresh list
      setAppointments(prev=>[...(prev||[]), res]);
    } catch (err) {
      console.warn(err);
      addToast('Appointment request failed', 'error');
    }
  };

  const submitComplaint = async () => {
    if (!complaint) return addToast('Please enter a complaint', 'error');
    try {
      const res = await hospitalApi.lodgeComplaint(profile?.id || 'unknown', { message: complaint });
      addToast('Complaint lodged', 'success');
      setComplaint('');
    } catch (err) {
      console.warn(err);
      addToast('Failed to lodge complaint', 'error');
    }
  };

  return (
    <div className="p-6 min-h-screen bg-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-800">👤 Patient Dashboard</h1>
        <div className="text-sm text-slate-600">{profile?.email}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile & quick info */}
        <div className="col-span-1">
          <div className="p-4 bg-white rounded-xl shadow border border-slate-100">
            <h2 className="text-lg font-semibold mb-2">Profile</h2>
            <p className="text-sm text-slate-700"><strong>Name:</strong> {profile?.name}</p>
            <p className="text-sm text-slate-700"><strong>ID:</strong> {profile?.id}</p>
            <p className="text-sm text-slate-700"><strong>DOB:</strong> {profile?.dob || '—'}</p>
            <p className="text-sm text-slate-700"><strong>Gender:</strong> {profile?.gender || '—'}</p>
            <hr className="my-3" />
            <h3 className="text-sm font-medium mb-1">Allergies</h3>
            {profile?.allergies?.length ? (
              <ul className="list-disc ml-5 text-sm text-slate-600">
                {profile.allergies.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No allergies recorded.</p>
            )}

            <h3 className="text-sm font-medium mt-3 mb-1">Medications</h3>
            {profile?.medications?.length ? (
              <ul className="list-disc ml-5 text-sm text-slate-600">
                {profile.medications.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No medications recorded.</p>
            )}
          </div>

          <div className="mt-4 p-4 bg-white rounded-xl shadow border border-slate-100">
            <h2 className="text-lg font-semibold mb-2">Upcoming Appointments</h2>
            <p className="text-sm text-slate-500">No upcoming appointments. Use the hospital scheduling system to book a visit.</p>
          </div>
        </div>

        {/* Middle column: EHR form (view / add entries) */}
        <div className="lg:col-span-2">
          <div className="p-4 bg-white rounded-xl shadow border border-slate-100 mb-6">
            <h2 className="text-lg font-semibold mb-3">Health Summary & EHR</h2>
            <p className="text-sm text-slate-500 mb-4">Create or view structured EHR entries. Entries are encrypted and can be registered on-chain or stored in the hospital EHR backend depending on configuration.</p>
            {/* Reuse existing EHR form component for creating entries */}
            <EHRForm />
          </div>
          <div className="p-4 bg-white rounded-xl shadow border border-slate-100 mb-6">
            <h2 className="text-lg font-semibold mb-3">Appointments</h2>
            <p className="text-sm text-slate-500 mb-3">Book an appointment with a hospital role.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <select id="apptRole" className="border px-2 py-1 rounded">
                <option value="doctor">Doctor</option>
                <option value="consultant">Consultant</option>
                <option value="lab">Lab Scientist</option>
                <option value="nurse">Nurse</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="admin">Hospital Admin</option>
              </select>
              <input id="apptDate" type="datetime-local" className="border px-2 py-1 rounded" />
              <input id="apptNote" placeholder="Reason / notes" className="border px-2 py-1 rounded" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                const role = document.getElementById('apptRole').value;
                const date = document.getElementById('apptDate').value;
                const notes = document.getElementById('apptNote').value;
                bookAppointment(role, date, notes);
              }} className="px-3 py-1 bg-indigo-600 text-white rounded">Request Appointment</button>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl shadow border border-slate-100 mb-6">
            <h2 className="text-lg font-semibold mb-3">Patient Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Emergency Contact & Location</h3>
                <p className="text-xs text-slate-500 mb-2">Provide an emergency contact. Use "Send Emergency" to notify them with a temporary access token.</p>
                <input placeholder="Contact name" value={contact.name} onChange={(e)=>setContact({...contact, name: e.target.value})} className="w-full border px-2 py-1 rounded mb-2" />
                <input placeholder="Phone" value={contact.phone} onChange={(e)=>setContact({...contact, phone: e.target.value})} className="w-full border px-2 py-1 rounded mb-2" />
                <input placeholder="Email" value={contact.email} onChange={(e)=>setContact({...contact, email: e.target.value})} className="w-full border px-2 py-1 rounded mb-2" />
                <input placeholder="Address" value={contact.address} onChange={(e)=>setContact({...contact, address: e.target.value})} className="w-full border px-2 py-1 rounded mb-2" />
                <div className="flex gap-2">
                  <button onClick={detectLocation} className="px-3 py-1 bg-slate-700 text-white rounded">Detect Location</button>
                  <button onClick={sendEmergency} disabled={sendingEmergency} className="px-3 py-1 bg-red-600 text-white rounded">{sendingEmergency ? 'Sending...' : 'Send Emergency'}</button>
                </div>
                {location && <div className="mt-2 text-xs text-slate-500">Location: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</div>}
                {simulatedNotification && (
                  <div className="mt-3 p-2 bg-slate-50 border rounded text-sm">
                    <div><strong>Simulated Notification</strong></div>
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(simulatedNotification.payload, null, 2)}</pre>
                    <div className="text-xs text-slate-500 mt-1">{simulatedNotification.sent ? 'Sent via backend' : 'Displayed (no backend)'}</div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium">Lodge a Complaint</h3>
                <textarea value={complaint} onChange={(e)=>setComplaint(e.target.value)} rows={5} className="w-full border px-2 py-1 rounded mb-2" placeholder="Describe your issue..." />
                <div className="flex gap-2">
                  <button onClick={submitComplaint} className="px-3 py-1 bg-amber-600 text-white rounded">Submit Complaint</button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl shadow border border-slate-100">
            <h2 className="text-lg font-semibold mb-3">Medical Records</h2>
            <p className="text-sm text-slate-500 mb-3">Secure records (documents, lab reports, prescriptions) associated with this patient.</p>
            <Records />
          </div>
        </div>
      </div>
    </div>
  );
}
