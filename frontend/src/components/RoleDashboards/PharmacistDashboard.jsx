// ========================================
// PharmacistDashboard.jsx
// ========================================

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
// Using simple markup instead of missing UI primitives
import { ClipboardCopy } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "react-toastify";
import contractABI from "../../abis/MedisecureRegistry.json";
import PrescriptionForm from "../forms/PrescriptionForm";
import api from "../../services/api";

const PharmacistDashboard = () => {
  const [account, setAccount] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);
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
  // Fetch Prescriptions (for Pharmacists)
  // ============================
  const fetchPrescriptions = async () => {
    try {
      setIsLoading(true);
      if (!CONTRACT_ADDRESS) {
        toast.error('Contract address not configured (VITE_CONTRACT_ADDRESS)');
        return;
      }

      if (!window.ethereum) {
        toast.error('No Ethereum provider found. Please connect your wallet.');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const fetched = await contract.getAllPrescriptions();
      const formatted = fetched.map((p, i) => ({
        id: i + 1,
        patient: p.patient,
        doctor: p.doctor,
        medication: p.medication,
        dosage: p.dosage,
        date: new Date(Number(p.timestamp) * 1000).toLocaleString(),
      }));

      setPrescriptions(formatted);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast.error("Failed to load prescription records.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrescriptionsBackend = async () => {
    try {
      const res = await api.get('/api/prescriptions').catch(() => ({ data: [] }));
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.warn('Failed to fetch backend prescriptions', e.message || e);
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
    // Do not auto-connect wallet on mount. Require explicit user action to connect.
  }, []);

  useEffect(() => {
    fetchPrescriptionsBackend();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-white">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-emerald-700">💊 Pharmacist Dashboard</h1>

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
        <Button onClick={fetchPrescriptions} disabled={isLoading}>
          {isLoading ? "Loading..." : "View Prescriptions"}
        </Button>
        <Button onClick={fetchPrescriptionsBackend} variant="outline">Refresh (Backend)</Button>
      </div>

      {/* Prescriptions Display */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prescriptions.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800">Patient: {p.patient}</h2>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Prescribed by:</strong> {p.doctor}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Medication:</strong> {p.medication}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Dosage:</strong> {p.dosage}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Date:</strong> {p.date}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-white rounded-xl shadow border border-slate-100">
        <h2 className="text-lg font-semibold mb-2">Create Prescription</h2>
        <PrescriptionForm />
      </div>

      {/* Empty State */}
      {!prescriptions.length && !isLoading && (
        <p className="text-center text-gray-500 mt-10">
          No prescription data available yet.
        </p>
      )}
    </div>
  );
};

export default PharmacistDashboard;
