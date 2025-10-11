// =============================================
// MediSecure Chain - Access Control Component
// =============================================
// This component allows authorized medical professionals
// (Doctor, Nurse, Pharmacist, Consultant, etc.) to grant
// or revoke access to encrypted EHR records on the blockchain.
//
// Functions imported from services/blockchain.js handle
// contract interaction (grantAccess, revokeAccess).
// =============================================

import React, { useState } from "react";
import { ethers } from "ethers";
import { getWriteContract } from "../services/blockchain";
import { toast } from "react-hot-toast";

const AccessControl = () => {
  const [resourceId, setResourceId] = useState("");
  const [grantee, setGrantee] = useState("");
  const [encryptedKey, setEncryptedKey] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------
  // Grant access to a professional
  // ---------------------------------------------
  const handleGrant = async () => {
    if (!resourceId || !grantee || !encryptedKey) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      const contract = await getWriteContract();
      const tx = await contract.grantAccess(
        ethers.encodeBytes32String(resourceId),
        grantee,
        ethers.getBytes(encryptedKey)
      );
      await tx.wait();
      toast.success("Access granted successfully!");
      setResourceId("");
      setGrantee("");
      setEncryptedKey("");
    } catch (err) {
      console.error("Grant error:", err);
      toast.error("Failed to grant access.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------
  // Revoke access from a professional
  // ---------------------------------------------
  const handleRevoke = async () => {
    if (!resourceId || !grantee) {
      toast.error("Please provide Resource ID and Grantee Address.");
      return;
    }

    try {
      setLoading(true);
      const contract = await getWriteContract();
      const tx = await contract.revokeAccess(
        ethers.encodeBytes32String(resourceId),
        grantee
      );
      await tx.wait();
      toast.success("Access revoked successfully!");
      setResourceId("");
      setGrantee("");
    } catch (err) {
      console.error("Revoke error:", err);
      toast.error("Failed to revoke access.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------
  // UI
  // ---------------------------------------------
  return (
    <div className="p-6 bg-white shadow-md rounded-lg max-w-2xl mx-auto mt-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Access Control Panel
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Grant or revoke blockchain-based access to patient records securely.
      </p>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Resource ID
          </label>
          <input
            type="text"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            placeholder="Enter resource ID"
            className="w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Grantee Address
          </label>
          <input
            type="text"
            value={grantee}
            onChange={(e) => setGrantee(e.target.value)}
            placeholder="0x..."
            className="w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Encrypted Key (Hex)
          </label>
          <input
            type="text"
            value={encryptedKey}
            onChange={(e) => setEncryptedKey(e.target.value)}
            placeholder="0x..."
            className="w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleGrant}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Granting..." : "Grant Access"}
          </button>
          <button
            onClick={handleRevoke}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Revoking..." : "Revoke Access"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessControl;
