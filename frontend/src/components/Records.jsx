import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import RecordCard from "./RecordCard";
import contractABI from "../abis/MedisecureRegistry.json";
import { toast } from "react-toastify";

export default function Records() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // ------------------- Load Records from Blockchain -------------------
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);

        // Ensure MetaMask is available
        if (!window.ethereum) {
          toast.error("Please connect to MetaMask to view records.");
          setLoading(false);
          return;
        }

        // Connect to Ethereum provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Fetch contract instance using .env contract address
        const contract = new ethers.Contract(
          import.meta.env.VITE_CONTRACT_ADDRESS,
          contractABI,
          signer
        );

        // ------------------- Read Records -------------------
        // Assuming the contract has `getAllRecords()` returning an array of structs
        const data = await contract.getAllRecords();

        // Format the results
        const formatted = data.map((record, idx) => ({
          id: idx,
          title: record.title || `Record #${idx + 1}`,
          cid: record.cid,
          resourceId: record.resourceId,
        }));

        setRecords(formatted);
        toast.success(`Fetched ${formatted.length} records successfully.`);
      } catch (err) {
        console.error("Error fetching records:", err);
        toast.error(`Error fetching records: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  // ------------------- Render -------------------
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-semibold mb-4 text-slate-700">
        Patient Records
      </h2>

      {loading ? (
        <div className="text-center text-slate-500 py-10 animate-pulse">
          Loading records from blockchain…
        </div>
      ) : records.length === 0 ? (
        <div className="text-center text-slate-500 py-10">
          No records found on MediSecure chain.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => (
            <RecordCard
              key={record.id}
              title={record.title}
              cid={record.cid}
              resourceId={record.resourceId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
