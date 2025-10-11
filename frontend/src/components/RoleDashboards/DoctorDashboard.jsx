// ========================================
// DoctorDashboard.jsx
// ========================================

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
// simplified local UI instead of missing UI primitives
import { ClipboardCopy } from "lucide-react";
import { toast } from "react-toastify";
import contractABI from "../../abis/MedisecureRegistry.json";

const DoctorDashboard = () => {
  const [account, setAccount] = useState("");
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

  // ============================
  // Connect Wallet
  // ============================
  const connectWallet = async () => {
    if (!window.ethereum) return toast.error("Please install MetaMask.");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
    toast.success("Wallet connected successfully!");
  };

  // ============================
  // Fetch Patient Records
  // ============================
  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const fetchedRecords = await contract.getAllRecords();
      const formatted = fetchedRecords.map((r, i) => ({
        id: i + 1,
        patient: r.patient,
        diagnosis: r.diagnosis,
        prescription: r.prescription,
        date: new Date(Number(r.timestamp) * 1000).toLocaleString(),
      }));

      setRecords(formatted);
    } catch (error) {
      console.error("Error fetching records:", error);
      toast.error("Failed to fetch patient records.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================
  // Copy Address to Clipboard
  // ============================
  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    toast.success("Wallet address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">
          👨‍⚕️ Doctor Dashboard
        </h1>

        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 truncate max-w-[180px]">
            {account ? account : "Not Connected"}
          </span>
          <Button onClick={copyAddress} variant="outline" size="icon">
            <ClipboardCopy size={16} />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button onClick={fetchRecords} disabled={isLoading}>
          {isLoading ? "Loading Records..." : "View Patient Records"}
        </Button>
      </div>

      {/* Records Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record) => (
          <div key={record.id} className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Patient: {record.patient.slice(0, 6)}...{record.patient.slice(-4)}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Diagnosis:</strong> {record.diagnosis}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Prescription:</strong> {record.prescription}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Date:</strong> {record.date}
            </p>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!records.length && !isLoading && (
        <p className="text-center text-gray-500 mt-10">
          No medical records available yet.
        </p>
      )}
    </div>
  );
};

export default DoctorDashboard;
