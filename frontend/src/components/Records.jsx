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
        const contract = new ethers.Contract(
          import.meta.env.VITE_CONTRACT_ADDRESS,
          contractABI,
          provider
        );

        // Try to fetch ResourceRegistered events and build record list from events
        let events = [];
        if (contract.filters && typeof contract.filters.ResourceRegistered === "function") {
          const filter = contract.filters.ResourceRegistered();
          events = await contract.queryFilter(filter, 0, "latest");
        } else {
          // Fallback: query any events for the contract address via provider
          try {
            events = await contract.queryFilter({}, 0, "latest");
          } catch (e) {
            console.warn('No event filters available', e);
            events = [];
          }
        }

        const fetchedRecords = [];
        for (let i = 0; i < events.length; i++) {
          const ev = events[i];
          const args = ev.args || [];
          // ResourceRegistered signature: (bytes32 resourceId, address owner, string cid, bytes32 cipherHash, string metadata)
          const resourceId = args.resourceId || args[0];
          const owner = args.owner || args[1];
          const cid = args.cid || args[2] || "";
          const metadata = args.metadata || args[4] || "";

          // Resolve block timestamp if possible
          let timestamp = new Date().toLocaleString();
          try {
            if (ev.blockNumber && provider.getBlock) {
              const blk = await provider.getBlock(ev.blockNumber);
              timestamp = new Date(Number(blk.timestamp) * 1000).toLocaleString();
            }
          } catch (e) {
            // ignore
          }

          fetchedRecords.push({
            id: i + 1,
            title: metadata || `Record #${i + 1}`,
            cid,
            resourceId: resourceId ? String(resourceId) : "",
            owner: owner || "",
            timestamp,
          });
        }

        setRecords(fetchedRecords.reverse());
      } catch (err) {
        console.error("Error fetching records:", err);
        toast.error("Failed to load encrypted records.");
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
