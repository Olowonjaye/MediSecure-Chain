import React, { useState } from 'react';
import { create } from 'ipfs-http-client';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, registerResource } from '../services/blockchain';
import hospitalApi from '../services/hospitalApi';

const client = create({ host:'ipfs.infura.io', port:5001, protocol:'https' });

export default function EHRForm(){
  const [patientName, setPatientName] = useState('');
  const [dob, setDob] = useState('');
  const [conditions, setConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [status, setStatus] = useState('Ready');

  async function handleSubmit(){
    try{
      setStatus('Encrypting EHR');
      const ehr = { patientName, dob, conditions, medications, createdAt: new Date().toISOString() };
      const ehrJson = JSON.stringify(ehr);
      // AES-GCM encrypt as in UploadRecord
      const key = await window.crypto.subtle.generateKey({name:'AES-GCM', length:256}, true, ['encrypt','decrypt']);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();
      const ct = await window.crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(ehrJson));
      const combined = new Uint8Array(iv.length + ct.byteLength);
      combined.set(iv,0); combined.set(new Uint8Array(ct), iv.length);

      setStatus('Uploading to hospital EHR');
      // POST encrypted bytes as base64 to hospital backend
      const base64 = btoa(String.fromCharCode(...combined));
      const patientId = patientName || 'unknown';
      await hospitalApi.postEHR(patientId, { payloadBase64: base64, meta: { patientName, dob } });

      // Optionally also store a proof on-chain for immutability if wallet is available
      try {
        setStatus('Uploading to IPFS for proof (optional)');
        const added = await client.add(combined);
        const cid = added.path;
        const hashBuf = await crypto.subtle.digest('SHA-256', combined);
        const hashHex = ethers.hexlify(new Uint8Array(hashBuf));
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const owner = await signer.getAddress();
          const resourceId = ethers.keccak256(ethers.toUtf8Bytes(owner + cid));
          await registerResource(resourceId, cid, hashHex, JSON.stringify({ patientName, dob }));
          setStatus('Registered proof '+resourceId);
        } else {
          setStatus('Hospital EHR stored (no wallet available for proof)');
        }
      } catch (proofErr) {
        console.warn('Proof registration failed', proofErr);
        setStatus('Hospital EHR stored (proof registration skipped)');
      }
    }catch(e){
      console.error(e); setStatus('Error '+(e.message||e));
    }
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Create EHR Entry</h2>
      <input className="border p-2 w-full mb-2" placeholder="Patient name" value={patientName} onChange={e=>setPatientName(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Date of birth" value={dob} onChange={e=>setDob(e.target.value)} />
      <textarea className="border p-2 w-full mb-2" placeholder="Conditions (comma separated)" value={conditions} onChange={e=>setConditions(e.target.value)} />
      <textarea className="border p-2 w-full mb-2" placeholder="Medications (comma separated)" value={medications} onChange={e=>setMedications(e.target.value)} />
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded">Create EHR</button>
        <div className='text-sm text-slate-500 mt-2'>{status}</div>
      </div>
    </div>
  )
}
