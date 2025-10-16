import React, { forwardRef } from 'react';

// Printable patient summary component. Use CSS print media to style.
const PatientSummary = forwardRef(({ patient }, ref) => {
  if (!patient) return null;
  return (
    <div ref={ref} className="bg-white p-6 rounded-lg shadow-sm text-slate-800 print:p-0 print:shadow-none">
      <h2 className="text-xl font-semibold mb-2">Patient Summary</h2>
      <div className="text-sm mb-4">Name: {patient.name}</div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>MRN: {patient.id || patient.patientId || patient.mrn || patient._id}</div>
        <div>DOB: {patient.dob || patient.dateOfBirth || '—'}</div>
        <div>Gender: {patient.gender || '—'}</div>
        <div>Nationality: {patient.nationality || patient.nationality || '—'}</div>
        <div>State: {patient.state || '—'}</div>
        <div>Local Govt: {patient.localGovernment || '—'}</div>
      </div>

      <div className="mb-4">
        <h3 className="font-medium">Allergies</h3>
        <div className="text-sm">{patient.allergies || 'None recorded'}</div>
      </div>

      <div className="text-xs text-slate-500">Generated: {new Date().toLocaleString()}</div>
    </div>
  );
});

export default PatientSummary;
