// frontend/src/components/WalletButton.jsx
import { useState, useEffect } from "react";
import { connectWallet, getNetwork } from "../services/blockchain";

export default function WalletButton() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [ensName, setEnsName] = useState(null);
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(false);

  // ------------------- Handle Wallet Connection -------------------
  const handleConnect = async () => {
    try {
      setLoading(true);
      const walletData = await connectWallet();
      setWalletAddress(walletData.address);
      setEnsName(walletData.ens);
      setNetwork(walletData.network);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert(error.message || "Unable to connect wallet.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Auto-Update Network -------------------
  useEffect(() => {
    async function fetchNetwork() {
      try {
        const net = await getNetwork();
        setNetwork(net);
      } catch (err) {
        console.warn("Could not fetch network:", err);
      }
    }
    fetchNetwork();
  }, []);

  // ------------------- UI -------------------
  return (
    <div className="flex items-center space-x-3">
      {walletAddress ? (
        <div
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium 
                     flex items-center shadow-sm transition-colors duration-200"
        >
          {/* Wallet Address or ENS */}
          {ensName
            ? ensName
            : `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}

          {/* Network Info */}
          {network && (
            <span className="ml-2 text-xs text-emerald-200">
              ({network})
            </span>
          )}
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 shadow-sm 
            ${loading
              ? "bg-indigo-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
            }`}
        >
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}
