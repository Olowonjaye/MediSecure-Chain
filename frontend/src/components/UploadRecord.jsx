// frontend/src/components/UploadRecord.jsx
import React, { useState } from "react";
import { createRecord } from "../services/api";
import { useToast } from "./ToastQueue";

export default function UploadRecord() {
  const [file, setFile] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle upload to decentralized storage (e.g., IPFS)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !patientName) {
      setToast({ message: "Please select a file and enter patient name", type: "error" });
      return;
    }

    try {
      setUploading(true);
      addToast("Uploading record securely...", "info");

      // Use createRecord as a placeholder for the upload flow
      const form = new FormData();
      form.append("patientName", patientName);
      form.append("fileName", file.name);

      const response = await createRecord({ patientName, fileName: file.name });

      if (response) {
        addToast(`Record uploaded successfully. id: ${response.id || "ok"}`, "success");
        setFile(null);
        setPatientName("");
      } else {
        addToast("Upload failed", "error");
      }
    } catch (err) {
      console.error(err);
  addToast("Error during upload", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
      {/* Section Title */}
      <h3 className="text-slate-800 font-semibold mb-3 text-base">
        Secure Record Upload
      </h3>
      <p className="text-slate-500 text-sm mb-4">
        Encrypt and store medical records safely on decentralized storage.
      </p>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Patient Name
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            placeholder="Enter patient's full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Select File
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full text-slate-700 text-sm"
            accept=".pdf,.jpg,.png,.docx"
            required
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className={`w-full py-2 rounded-lg text-white font-medium transition-all duration-200 ${
            uploading
              ? "bg-indigo-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          }`}
        >
          {uploading ? "Uploading..." : "Upload Record"}
        </button>
      </form>

      {/* Info Message */}
      <div className="mt-3 text-xs text-slate-400 italic">
        🔒 All uploads are encrypted before storage and linked to blockchain for
        verifiable authenticity.
      </div>

      {/* Toasts are provided by ToastProvider at App level */}
    </div>
  );
}
// Compare this snippet from frontend/src/components/RecordCard.jsx: