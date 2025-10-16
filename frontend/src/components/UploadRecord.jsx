// frontend/src/components/UploadRecord.jsx
import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { registerResource } from "../services/blockchain";
import { useToast } from "./ToastQueue";
import hospitalApi from "../services/hospitalApi";
import PatientSummary from "./PatientSummary";

// Storacha settings (REST)
const STORACHA_URL = import.meta.env.VITE_STORACHA_URL || "https://console.storacha.network";
const STORACHA_TOKEN = import.meta.env.VITE_STORACHA_TOKEN || "";

// Helper: read file as ArrayBuffer
async function readFileAsArrayBuffer(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });
}

// Helper: AES-GCM encrypt; returns { combined: Uint8Array, keyRaw: Uint8Array }
async function encryptAesGcm(plainBuf) {
  const key = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ct = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plainBuf);
  const ctU8 = new Uint8Array(ct);
  const combined = new Uint8Array(iv.length + ctU8.length);
  combined.set(iv, 0);
  combined.set(ctU8, iv.length);
  const keyRaw = new Uint8Array(await window.crypto.subtle.exportKey("raw", key));
  return { combined, keyRaw };
}

// Helper: SHA-256 digest -> hex (ethers hexlify)
async function sha256Hex(buffer) {
  const hashBuf = await window.crypto.subtle.digest("SHA-256", buffer);
  return ethers.hexlify(new Uint8Array(hashBuf));
}

export default function UploadRecord() {
  const [file, setFile] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [recordType, setRecordType] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const printRef = useRef();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0] || null);

  // Copy helper with fallback for older browsers
  const copyToClipboard = async (text) => {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(String(text));
        addToast('Copied to clipboard', 'success');
        return true;
      }
    } catch (err) {
      // ignore and fallback
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = String(text);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      addToast('Copied to clipboard', 'success');
      return true;
    } catch (err) {
      console.warn('copy fallback failed', err);
      addToast('Copy failed', 'error');
      return false;
    }
  };

  const openPrintPreview = () => {
    const content = document.createElement('div');
    content.innerHTML = `<div style="font-family: sans-serif; padding:20px; max-width:800px;">${document.querySelector('.patient-summary-print') ? document.querySelector('.patient-summary-print').innerHTML : '<h2>Patient Summary</h2>'}</div>`;
    const w = window.open('', '_blank');
    if (!w) { addToast('Unable to open print preview (popup blocked)', 'error'); return; }
    w.document.write('<html><head><title>Patient Summary</title></head><body>');
    w.document.write(content.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    // if html2pdf available on the new window, expose a button or auto-download
    setTimeout(()=>{
      try { w.focus(); w.print(); } catch(e){ console.warn('Print preview error', e); }
    }, 300);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await hospitalApi.listPatients();
        if (mounted && Array.isArray(list)) setPatients(list);
      } catch (err) {
        // ignore; backend may not be available during local dev
        console.warn('Could not fetch patients', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Debounced search (paged)
  useEffect(()=>{
    if (!patientName || patientName.length < 2) { setSearchResults([]); setHasMoreResults(false); setSearchPage(1); return; }
    let mounted = true;
    const id = setTimeout(async ()=>{
      try {
        setSearching(true);
        const res = await hospitalApi.searchPatients(patientName, 1, 10);
        if (!mounted) return;
        const items = Array.isArray(res) ? res : (res.items || res.results || []);
        setSearchResults(items);
        const total = res.total || res.totalCount || res.count || null;
        setHasMoreResults(Boolean(total && items.length < total));
        setSearchPage(1);
      } catch (err) {
        console.warn('Search error', err);
        if (mounted) setSearchResults([]);
      } finally { if (mounted) setSearching(false); }
    }, 300);
    return ()=>{ mounted=false; clearTimeout(id); };
  }, [patientName]);

  const loadMoreSearch = async () => {
    try {
      const next = searchPage + 1;
      setSearching(true);
      const res = await hospitalApi.searchPatients(patientName, next, 10);
      const items = Array.isArray(res) ? res : (res.items || res.results || []);
      setSearchResults(prev => [...prev, ...items]);
      const total = res.total || res.totalCount || res.count || null;
      setHasMoreResults(Boolean(total && (searchResults.length + items.length) < total));
      setSearchPage(next);
    } catch (err) {
      console.warn('Load more search failed', err);
    } finally { setSearching(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !(patientId || patientName)) {
      addToast("Please select an existing patient or enter a new patient name", "error");
      return;
    }

    if (!window.crypto || !window.crypto.subtle) {
      addToast("Web Crypto API not available in this browser", "error");
      return;
    }

    try {
      setUploading(true);
      addToast("Encrypting file and uploading to IPFS...", "info");

      // 1) Read file
      const fileBuf = await readFileAsArrayBuffer(file);

      // 2) Encrypt with AES-GCM
      const { combined, keyRaw } = await encryptAesGcm(fileBuf);

      // 3) Ensure we have a patientId (MRN). If not selected, create a new patient
      let targetPatientId = patientId;
      if (!targetPatientId) {
        // create patient on backend and receive unique id
        const created = await hospitalApi.createPatient({ name: patientName });
        targetPatientId = created.id || created.patientId || created.mrn || created._id || null;
        if (!targetPatientId) throw new Error('Failed to create patient or receive patient id from backend');
        addToast(`Created patient ${patientName} (${targetPatientId})`, 'success');
        // refresh patient list
        try { setPatients(await hospitalApi.listPatients()); } catch (e) { /* ignore */ }
      }

  // Upload encrypted file to hospital backend
      let backendProof = null;
      try {
        const blob = new Blob([combined], { type: 'application/octet-stream' });
        const formData = new FormData();
        formData.append('file', blob, file.name + '.enc');
        formData.append('recordType', recordType);
        formData.append('recordDate', recordDate);
        formData.append('description', description);
        const uploadRes = await hospitalApi.postRecordFile(targetPatientId, formData);
        addToast('File uploaded to hospital backend', 'success');
        backendProof = uploadRes.proof || uploadRes.cid || uploadRes.uploadId || null;
        // store confirmation info for UI
        setConfirmation(prev => ({ ...prev, backendProof, patientId: targetPatientId }));
      } catch (backendErr) {
        console.warn('Hospital upload failed, will attempt Storacha upload', backendErr);
      }

  // Optional: also upload to Storacha/Web3.Storage and register a proof on-chain
      // Optional: upload to Storacha REST API and register on-chain proof
      if (STORACHA_TOKEN) {
        try {
          // Prepare direct Storacha upload (assumes Storacha accepts /upload endpoint similar to web3.storage API)
          // If Storacha REST differs, adjust accordingly.
          const uploadUrl = `${STORACHA_URL.replace(/\/$/, '')}/api/upload`; // conservative default
          const storachaForm = new FormData();
          storachaForm.append('file', new Blob([combined], { type: 'application/octet-stream' }), file.name + '.enc');
          const storachaRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${STORACHA_TOKEN}` },
            body: storachaForm,
          });
          if (!storachaRes.ok) throw new Error(`Storacha upload failed: ${storachaRes.statusText}`);
          const storachaJson = await storachaRes.json();
          const cid = storachaJson.cid || storachaJson.cidStr || storachaJson.id || null;
          const cipherHash = await sha256Hex(combined.buffer);
          if (cid && window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const owner = await signer.getAddress();
            const resourceId = ethers.keccak256(ethers.toUtf8Bytes(owner + cid));
            const ownerEncryptedKeyPlaceholder = ethers.hexlify(ethers.randomBytes(32));
            const STORACHA_DID = import.meta.env.VITE_STORACHA_DID || null;
            const metadata = JSON.stringify({ patientId: targetPatientId, patientName, recordType, recordDate, description, fileName: file.name, backendProof, ownerEncryptedKey: ownerEncryptedKeyPlaceholder, storachaDid: STORACHA_DID });
            addToast("Registering record on-chain (transaction will be requested)...", "info");
            const receipt = await registerResource(resourceId, cid, cipherHash, metadata);
            const txHash = receipt && (receipt.transactionHash || (receipt.transaction && receipt.transaction.hash)) || null;
            addToast("✅ Record uploaded and proof registered", "success");
            // attach on-chain proof/tx to confirmation
            setConfirmation(prev => ({ ...(prev||{}), backendProof, cid, onchain: { resourceId, txHash } }));
            const base = STORACHA_URL.replace(/\/$/, "");
            const ipfsLink = `${base}/ipfs/${cid}`;
            addToast(`CID: ${cid}`, "info");
            addToast(`Storacha IPFS: ${ipfsLink}`, "info");
          } else if (cid) {
            addToast('Uploaded to Storacha but wallet not available for proof', 'info');
            addToast(`Storacha CID: ${cid}`, 'info');
          }
        } catch (sErr) {
          console.warn('Storacha upload failed', sErr);
          addToast('Storacha upload failed; record remains on backend', 'error');
        }
      } else {
        addToast('Storacha token not configured; record uploaded to hospital backend', 'info');
      }

      // reset form
      setFile(null);
      setPatientName("");
      setRecordType("");
      setRecordDate("");
      setDescription("");
    } catch (err) {
      console.error(err);
      addToast(`Upload failed: ${err.message || err}`, "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <h3 className="text-slate-800 font-semibold mb-3 text-base">Secure Record Upload</h3>
      <p className="text-slate-500 text-sm mb-4">This will encrypt the file locally, store the ciphertext on IPFS, and register a proof on-chain.</p>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Search Patient (type name or MRN)</label>
          <input type="text" value={patientName} onChange={(e)=>{
            setPatientName(e.target.value);
            // clear selection when typing
            setPatientId('');
          }} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Start typing to search..." />
          <div className="border rounded mt-1 max-h-40 overflow-auto bg-white">
            {searching && <div className="p-2 text-sm text-slate-500">Searching...</div>}
            {searchResults.slice(0,10).map(p=>{
              const id = p.id||p.patientId||p.mrn||p._id;
              return (
                <div key={id} className="p-2 hover:bg-slate-50 cursor-pointer" onClick={()=>{ setPatientId(String(id)); setPatientName(p.name||''); setSearchResults([]); }}>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-slate-400">MRN: {String(id)}</div>
                </div>
              );
            })}
              {hasMoreResults && (
                <div className="p-2 text-center">
                  <button type="button" onClick={loadMoreSearch} className="text-sm text-indigo-600">Load more</button>
                </div>
              )}
            {!searching && searchResults.length===0 && patientName && (
              <div className="p-2 text-xs text-slate-500">No match — create a new patient <button type="button" onClick={()=>setShowCreateModal(true)} className="text-indigo-600 underline ml-1">Create</button></div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Record Type</label>
          <input type="text" value={recordType} onChange={(e)=>setRecordType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Blood test, Prescription" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Record Date</label>
          <input type="date" value={recordDate} onChange={(e)=>setRecordDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Short Description</label>
          <input type="text" value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Optional note" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Select File</label>
          <input type="file" onChange={handleFileChange} className="w-full text-slate-700 text-sm" accept=".pdf,.jpg,.png,.docx" required />
        </div>

        <button type="submit" disabled={uploading} className={`w-full py-2 rounded-lg text-white font-medium transition-all duration-200 ${uploading ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-sm"}`}>
          {uploading ? "Uploading..." : "Upload Record"}
        </button>
      </form>

      <div className="mt-3 text-xs text-slate-400 italic">🔒 Files are encrypted locally (AES-GCM) before upload. The smart contract stores an immutable proof (CID + SHA-256) on-chain.</div>
    {/* Confirmation panel */}
    {confirmation && (
      <div className="mt-4 p-4 border border-slate-100 bg-white rounded-lg">
        <h4 className="font-semibold">Upload Confirmation</h4>
        <div className="text-sm mt-2">Patient ID: {confirmation.patientId}</div>
        {confirmation.backendProof && <div className="text-sm mt-1">Backend proof: <code className="text-xs bg-slate-100 px-2 py-1 rounded">{String(confirmation.backendProof)}</code></div>}
        {confirmation.onchain && <div className="text-sm mt-1">On-chain resource: <code className="text-xs bg-slate-100 px-2 py-1 rounded">{String(confirmation.onchain.resourceId)}</code></div>}
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={()=>openPrintPreview()} className="px-3 py-1 bg-indigo-600 text-white rounded">Print Summary</button>
          <button type="button" onClick={()=>setShowSuccessModal(true)} className="px-3 py-1 bg-green-600 text-white rounded">View Details</button>
        </div>
        <div className="mt-4">
          <PatientSummary patient={{ id: confirmation.patientId, name: patientName }} ref={printRef} />
        </div>
      </div>
    )}

    {/* Success Modal */}
    {showSuccessModal && confirmation && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="bg-white rounded p-4 w-full max-w-lg">
          <h3 className="font-semibold">Upload Details</h3>
          <div className="mt-2">
            <div className="text-sm">Patient ID: {confirmation.patientId}</div>
            {confirmation.backendProof && (
              <div className="mt-2">Backend proof: <code className="bg-slate-100 px-2 py-1 rounded">{confirmation.backendProof}</code>
                <button onClick={()=>copyToClipboard(confirmation.backendProof)} className="ml-2 text-xs px-2 py-1 border rounded">Copy</button>
              </div>
            )}
            {confirmation.onchain && (
              <div className="mt-2">On-chain resource: <code className="bg-slate-100 px-2 py-1 rounded">{confirmation.onchain.resourceId}</code>
                <button onClick={()=>copyToClipboard(confirmation.onchain.resourceId)} className="ml-2 text-xs px-2 py-1 border rounded">Copy</button>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>{ setShowSuccessModal(false); }} className="px-3 py-1 border rounded">Close</button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Create Patient Modal */}
    {showCreateModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-3">Create Patient</h3>
          <form onSubmit={async (ev)=>{
            ev.preventDefault();
            setCreating(true);
            try {
              const form = new FormData(ev.target);
              const payload = {
                name: form.get('name'),
                mrn: form.get('mrn'),
                dob: form.get('dob'),
                gender: form.get('gender'),
                nationality: form.get('nationality'),
                state: form.get('state'),
                localGovernment: form.get('localGovernment'),
                allergies: form.get('allergies'),
              };
              const created = await hospitalApi.createPatient(payload);
              const newId = created.id || created.patientId || created.mrn || created._id || null;
              if (!newId) throw new Error('No id returned');
              setPatients(await hospitalApi.listPatients());
              setPatientId(String(newId));
              setPatientName(payload.name || '');
              setShowCreateModal(false);
              addToast('Patient created', 'success');
            } catch (err) {
              console.error(err);
              addToast('Failed to create patient', 'error');
            } finally { setCreating(false); }
          }} className="space-y-3">
            <div>
              <label className="block text-sm">Full name</label>
              <input name="name" className="w-full border px-2 py-1 rounded" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm">MRN (optional)</label>
                <input name="mrn" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm">DOB</label>
                <input name="dob" type="date" className="w-full border px-2 py-1 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm">Gender</label>
                <select name="gender" className="w-full border px-2 py-1 rounded"><option>Male</option><option>Female</option><option>Other</option></select>
              </div>
              <div>
                <label className="block text-sm">Nationality</label>
                <input name="nationality" className="w-full border px-2 py-1 rounded" />
              </div>
              <div>
                <label className="block text-sm">State</label>
                <input name="state" className="w-full border px-2 py-1 rounded" />
              </div>
            </div>
            <div>
              <label className="block text-sm">Local Government</label>
              <input name="localGovernment" className="w-full border px-2 py-1 rounded" />
            </div>
            <div>
              <label className="block text-sm">Allergies / Notes</label>
              <input name="allergies" className="w-full border px-2 py-1 rounded" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>setShowCreateModal(false)} className="px-3 py-1 border rounded">Cancel</button>
              <button type="submit" disabled={creating} className="px-3 py-1 bg-indigo-600 text-white rounded">{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </form>
        </div>
      </div>
    )}

    </div>
  );
}
// Compare this snippet from frontend/src/components/RecordCard.jsx: