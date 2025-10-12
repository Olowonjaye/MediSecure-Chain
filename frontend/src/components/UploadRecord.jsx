// frontend/src/components/UploadRecord.jsx
import React, { useState } from "react";
import { Web3Storage } from 'web3.storage';
import { ethers } from "ethers";
import { registerResource } from "../services/blockchain";
import { useToast } from "./ToastQueue";

// Web3.Storage / Storacha client token (from env)
const web3Token = import.meta.env.VITE_STORACHA_TOKEN;
const web3Client = web3Token ? new Web3Storage({ token: web3Token }) : null;

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
  const [recordType, setRecordType] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();

  const handleFileChange = (e) => setFile(e.target.files[0] || null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !patientName) {
      addToast("Please provide patient name and select a file", "error");
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

  // 3) Upload ciphertext (iv + ct) to Web3.Storage (IPFS)
  if (!web3Client) throw new Error('Missing VITE_STORACHA_TOKEN in env');
  const fileToUpload = new File([combined], file.name + '.enc', { type: 'application/octet-stream' });
  // put returns a CID string
  const cid = await web3Client.put([fileToUpload], { wrapWithDirectory: false });

      // 4) Compute SHA-256 over ciphertext (combined)
      const cipherHash = await sha256Hex(combined.buffer);

      // 5) Use MetaMask signer to compute resourceId and call contract
      if (!window.ethereum) {
        addToast("MetaMask (or compatible wallet) is required to register resource on-chain", "error");
        setUploading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const owner = await signer.getAddress();

      // resourceId = keccak256(toUtf8Bytes(owner + cid))
      const resourceId = ethers.keccak256(ethers.toUtf8Bytes(owner + cid));

      // metadata: include basic metadata and a placeholder encryptedOwnerKey
      // include Storacha DID so consumers can identify the storage space used
      // NOTE: the real flow should encrypt keyRaw with the owner's public key or use the Oracle.
      const ownerEncryptedKeyPlaceholder = ethers.hexlify(ethers.randomBytes(32));
      const STORACHA_DID = import.meta.env.VITE_STORACHA_DID || null;
      const metadata = JSON.stringify({
        patientName,
        recordType,
        recordDate,
        description,
        fileName: file.name,
        ownerEncryptedKey: ownerEncryptedKeyPlaceholder,
        storachaDid: STORACHA_DID,
      });

      addToast("Registering record on-chain (transaction will be requested)...", "info");

      const receipt = await registerResource(resourceId, cid, cipherHash, metadata);

      addToast("✅ Record uploaded successfully", "success");
  // Provide a small result UI (Storacha/IPFS link + resourceId + tx)
  const STORACHA_URL = import.meta.env.VITE_STORACHA_URL || "https://ipfs.io";
  const base = STORACHA_URL.replace(/\/$/, "");
  const ipfsLink = `${base}/ipfs/${cid}`;
  addToast(`CID: ${cid}`, "info");
  addToast(`Storacha IPFS: ${ipfsLink}`, "info");
      addToast(`ResourceId: ${resourceId}`, "info");

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
          <label className="block text-sm font-medium text-slate-600 mb-1">Patient Name</label>
          <input type="text" value={patientName} onChange={(e)=>setPatientName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none" placeholder="Patient full name or ID" required />
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
    </div>
  );
}
// Compare this snippet from frontend/src/components/RecordCard.jsx: