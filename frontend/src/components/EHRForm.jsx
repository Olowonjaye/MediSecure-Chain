import React, { useState } from 'react';
import { create } from 'ipfs-http-client';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../services/blockchain';

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

      setStatus('Uploading to IPFS');
      const added = await client.add(combined);
      const cid = added.path;

      const hashBuf = await crypto.subtle.digest('SHA-256', combined);
      const hashHex = ethers.hexlify(new Uint8Array(hashBuf));

      if(!window.ethereum){ setStatus('MetaMask required'); return; }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const owner = await signer.getAddress();
      const resourceId = ethers.keccak256(ethers.toUtf8Bytes(owner + cid));
      const tx = await contract.registerResource(resourceId, cid, hashHex, JSON.stringify({ patientName, dob }));
      await tx.wait();
      setStatus('Registered '+resourceId);
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
