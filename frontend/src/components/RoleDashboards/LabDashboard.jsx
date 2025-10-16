// ========================================
// LabDashboard.jsx
// ========================================

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
// simplified local UI instead of missing components
import { ClipboardCopy } from "lucide-react";
import { toast } from "react-toastify";
import contractABI from "../../abis/MedisecureRegistry.json";
import LabResultForm from "../forms/LabResultForm";

const LabDashboard = () => {
  const [account, setAccount] = useState("");
  const [labReports, setLabReports] = useState([]);
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
  // Fetch Laboratory Reports
  // ============================
  const fetchLabReports = async () => {
    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const fetchedReports = await contract.getAllLabReports();
      const formatted = fetchedReports.map((r, i) => ({
        id: i + 1,
        patient: r.patient,
        testType: r.testType,
        result: r.result,
        date: new Date(Number(r.timestamp) * 1000).toLocaleString(),
      }));

      setLabReports(formatted);
    } catch (error) {
      console.error("Error fetching lab reports:", error);
      toast.error("Failed to fetch lab reports.");
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
        <h1 className="text-3xl font-bold text-green-700">
          🧪 Laboratory Dashboard
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
        <Button onClick={fetchLabReports} disabled={isLoading}>
          {isLoading ? "Loading Reports..." : "View Lab Reports"}
        </Button>
      </div>

      {/* Reports Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labReports.map((report) => (
          <div key={report.id} className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Patient: {report.patient.slice(0, 6)}...{report.patient.slice(-4)}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Test Type:</strong> {report.testType}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Result:</strong> {report.result}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Date:</strong> {report.date}</p>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!labReports.length && !isLoading && (
        <p className="text-center text-gray-500 mt-10">
          No lab reports available yet.
        </p>
      )}

      <div className="mt-6 p-4 bg-white rounded-xl shadow border border-slate-100">
        <h2 className="text-lg font-semibold mb-2">Record Lab Result</h2>
        <LabResultForm />
      </div>
    </div>
  );
};

export default LabDashboard;
