import React, { useEffect, useState, useContext } from "react";
import { ethers } from "ethers";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { Copy } from "lucide-react";
import abi from "../abis/MedisecureRegistry.json";

const Audit = () => {
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        if (!window.ethereum) {
          toast.error("MetaMask not detected!");
          return;
        }

        // ✅ Connect provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, provider);

        // ✅ Fetch past events (Blockchain logs)
        const events = await contract.queryFilter({}, 0, "latest");

        const parsedLogs = events.map((event) => {
          // event.event contains the event name when available
          const name = event.event || "unknown";

          if (name === "ResourceRegistered") {
            return {
              id: event.transactionHash,
              recordId: event.args.resourceId?.toString() || "-",
              updatedBy: event.args.owner || "-",
              timestamp: new Date(event.blockNumber ? Date.now() : Date.now()).toLocaleString(),
              extra: { cid: event.args.cid, cipherHash: event.args.cipherHash },
              txHash: event.transactionHash,
            };
          }

          if (name === "AccessGranted" || name === "AccessRevoked") {
            return {
              id: event.transactionHash,
              recordId: event.args.resourceId?.toString() || "-",
              updatedBy: event.args.grantee || "-",
              timestamp: new Date().toLocaleString(),
              txHash: event.transactionHash,
            };
          }

          // Generic fallback for unknown event shapes
          return {
            id: event.transactionHash,
            recordId: event.args && event.args[0] ? String(event.args[0]) : "-",
            updatedBy: event.args && event.args[1] ? String(event.args[1]) : "-",
            timestamp: new Date().toLocaleString(),
            txHash: event.transactionHash,
          };
        });

        setLogs(parsedLogs.reverse());
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        toast.error("Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [contractAddress]);

  // ✅ Copy helper
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">🧾 Audit Trail</h2>

      <p className="text-gray-600 mb-6">
        View all activity logs from the blockchain ledger.  
        Every modification to medical records is transparently stored for accountability.
      </p>

      {loading ? (
        <p className="text-gray-500 text-center">Loading audit logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 text-center">No audit records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-blue-100">
                <th className="p-3 text-left text-sm font-semibold border">#</th>
                <th className="p-3 text-left text-sm font-semibold border">Record ID</th>
                <th className="p-3 text-left text-sm font-semibold border">Updated By</th>
                <th className="p-3 text-left text-sm font-semibold border">Timestamp</th>
                <th className="p-3 text-left text-sm font-semibold border">Transaction Hash</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="p-3 border">{index + 1}</td>
                  <td className="p-3 border">{log.recordId}</td>
                  <td className="p-3 border text-gray-700">{log.updatedBy}</td>
                  <td className="p-3 border text-gray-600">{log.timestamp}</td>
                  <td className="p-3 border text-blue-600 flex items-center gap-2">
                    <span className="truncate w-40">{log.txHash}</span>
                    <button
                      onClick={() => handleCopy(log.txHash)}
                      className="p-1 rounded-full hover:bg-blue-200"
                    >
                      <Copy size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {currentUser && (
        <div className="mt-8 border-t pt-4">
          <h3 className="text-gray-700 font-semibold">
            Logged in as: <span className="text-blue-500">{currentUser.role}</span>
          </h3>
        </div>
      )}
    </div>
  );
};

export default Audit;
