import React from "react";
import { toast } from "react-toastify";
import { Clipboard, ExternalLink } from "lucide-react";

/**
 * RecordCard Component
 * Displays a patient's encrypted record stored on IPFS & blockchain.
 * Includes copy-to-clipboard and view-on-IPFS options.
 */
export default function RecordCard({ title, cid, resourceId }) {
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const openIPFS = (cid) => {
    const ipfsUrl = `https://ipfs.io/ipfs/${cid}`;
    window.open(ipfsUrl, "_blank");
  };

  return (
    <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
      <h3 className="text-lg font-semibold text-slate-800 mb-3 truncate">
        {title || "Untitled Record"}
      </h3>

      <div className="space-y-2 text-sm text-slate-600">
        {/* CID Section */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-700">CID:</span>
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[120px]">{cid || "N/A"}</span>
            <button
              onClick={() => handleCopy(cid, "CID")}
              className="text-indigo-500 hover:text-indigo-700"
              title="Copy CID"
            >
              <Clipboard size={16} />
            </button>
            {cid && (
              <button
                onClick={() => openIPFS(cid)}
                className="text-green-500 hover:text-green-700"
                title="View on IPFS"
              >
                <ExternalLink size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Resource ID Section */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-700">Resource ID:</span>
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[120px]">{resourceId || "N/A"}</span>
            <button
              onClick={() => handleCopy(resourceId, "Resource ID")}
              className="text-indigo-500 hover:text-indigo-700"
              title="Copy Resource ID"
            >
              <Clipboard size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-right">
        <button
          onClick={() => toast.info("Decrypt & View Record feature coming soon")}
          className="px-3 py-1.5 text-sm font-medium text-white bg-ms-accent hover:bg-ms-accent-600 rounded-lg shadow"
        >
          View Record
        </button>
      </div>
    </div>
  );
}
