// ========================================
// NurseDashboard.jsx
// ========================================

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
// Using simple markup to avoid missing ui components
import { ClipboardCopy } from "lucide-react";
import { toast } from "react-toastify";
import contractABI from "../../abis/MedisecureRegistry.json";
import VitalsForm from "../forms/VitalsForm";

const NurseDashboard = () => {
  const [account, setAccount] = useState("");
  const [patients, setPatients] = useState([]);
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
  // Fetch Patients Records (for nurses)
  // ============================
  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const fetchedPatients = await contract.getAllPatients();
      const formatted = fetchedPatients.map((p, i) => ({
        id: i + 1,
        name: p.name,
        age: Number(p.age),
        gender: p.gender,
        diagnosis: p.diagnosis,
        date: new Date(Number(p.timestamp) * 1000).toLocaleString(),
      }));

      setPatients(formatted);
    } catch (error) {
      console.error("Error fetching patient data:", error);
      toast.error("Failed to fetch patient records.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================
  // Copy Wallet Address
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
    <div className="p-6 min-h-screen bg-white">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-pink-700">🩺 Nurse Dashboard</h1>

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
        <Button onClick={fetchPatients} disabled={isLoading}>
          {isLoading ? "Loading..." : "View Patient Records"}
        </Button>
      </div>

      {/* Patient Records Display */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800">{p.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Age:</strong> {p.age}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Gender:</strong> {p.gender}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Diagnosis:</strong> {p.diagnosis}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Date:</strong> {p.date}</p>
          </div>
        ))}
      </div>

      {/* Vitals form section */}
      <div className="mt-6 p-4 bg-white rounded-xl shadow border border-slate-100">
        <h2 className="text-lg font-semibold mb-2">Enter Vitals</h2>
        <VitalsForm />
      </div>

      {/* Empty State */}
      {!patients.length && !isLoading && (
        <p className="text-center text-gray-500 mt-10">
          No patient data available yet.
        </p>
      )}
    </div>
  );
};

export default NurseDashboard;
