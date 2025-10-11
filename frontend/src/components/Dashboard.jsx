import React, { lazy, Suspense, useEffect, useState } from "react";
import UploadRecord from "./UploadRecord";
import AccessControl from "./AccessControl";
import RecordCard from "./RecordCard";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import abi from "../abis/MedisecureRegistry.json";

const Audit = lazy(() => import("./Audit"));

export default function Dashboard({ active = "dashboard" }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

  // ✅ Fetch records from blockchain
  useEffect(() => {
    const fetchRecords = async () => {
      if (active !== "records") return;

      try {
        if (!window.ethereum) {
          toast.error("MetaMask not detected!");
          return;
        }

        setLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, abi, provider);

        const totalRecords = await contract.getRecordCount();
        const fetchedRecords = [];

        for (let i = 0; i < totalRecords; i++) {
          const record = await contract.getRecordByIndex(i);
          fetchedRecords.push({
            id: i + 1,
            title: record.title || `Record #${i + 1}`,
            cid: record.cid,
            resourceId: record.resourceId,
          });
        }

        setRecords(fetchedRecords.reverse());
      } catch (error) {
        console.error("Error fetching records:", error);
        toast.error("Failed to load encrypted records.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [active, contractAddress]);

  // ✅ Records Page
  if (active === "records") {
    return (
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Encrypted Medical Records
        </h2>

        {loading ? (
          <div className="text-gray-500 text-center mt-6">Loading records…</div>
        ) : records.length === 0 ? (
          <div className="text-gray-500 text-center mt-6">
            No encrypted records found on the blockchain.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((rec) => (
              <RecordCard
                key={rec.id}
                title={rec.title}
                cid={rec.cid}
                resourceId={rec.resourceId}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ✅ Access Control Page
  if (active === "access") {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-slate-700">
          Manage Access Permissions
        </h2>
        <AccessControl />
      </div>
    );
  }

  // ✅ Audit Page
  if (active === "audit") {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-slate-700">
          Blockchain Audit Trail
        </h2>
        <Suspense fallback={<div className="text-slate-500">Loading Audit…</div>}>
          <Audit />
        </Suspense>
      </div>
    );
  }

  // ✅ Default Dashboard (Home View)
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Records */}
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-700">
            Upload New Patient Record
          </h2>
          <UploadRecord />
        </div>

        {/* Access Control + Audit Combined */}
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-700">
            Access & Audit Overview
          </h2>
          <AccessControl />
          <div className="mt-4">
            <Suspense fallback={<div className="text-slate-500">Loading Audit…</div>}>
              <Audit />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
