import React, { useState } from 'react';
import { connectWallet } from '../services/blockchain';
import { verifyHumanPassport } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * HumanPassportLogin
 * - Connects to MetaMask to obtain the user's wallet address
 * - Calls backend /api/passport/verify which returns { token, verified, user }
 * - Stores auth token in localStorage and displays status to the user
 */
export default function HumanPassportLogin({ onVerified }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | 'pending' | 'verified' | 'failed'
  const [wallet, setWallet] = useState(null);
  const [identifier, setIdentifier] = useState('');
  const { setUser } = useAuth();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setStatus('pending');
      // Use identifier provided by user. If empty, prompt to use connected wallet.
      let idToVerify = identifier && identifier.trim();
      let resp;

      // If the user provided a humanPassportToken in the identifier field (explicit token), prefer that
      if (idToVerify && idToVerify.startsWith('hp_')) {
        // treat as humanPassportToken
        resp = await verifyHumanPassport({ humanPassportToken: idToVerify });
      } else if (idToVerify) {
        resp = await verifyHumanPassport(idToVerify);
      } else {
        // if nothing provided, attempt wallet connect and pass address as identifier
        const { address } = await connectWallet();
        setWallet(address);
        resp = await verifyHumanPassport(address);
      }

      if (resp && (resp.jwtToken || resp.token) && resp.verified) {
        // store token and minimal user info
        const tokenToStore = resp.jwtToken || resp.token;
        localStorage.setItem('authToken', tokenToStore);
        const u = resp.user || { identifier: idToVerify || wallet, humanVerified: resp.verified };
        localStorage.setItem('medisecure_user', JSON.stringify(u));
        // Update auth context so UI updates immediately
        try { setUser(u); } catch (e) { /* ignore if context unavailable */ }
        setStatus('verified');
        if (onVerified) onVerified(u);
      } else {
        setStatus('failed');
      }
      } catch (err) {
      console.error('Human Passport login error', err);
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Enter identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="px-3 py-2 rounded-md border w-full"
        />
        <button
          onClick={async () => {
            // Option to prefill identifier using wallet without forcing wallet-only flow
            try {
              const { address } = await connectWallet();
              setWallet(address);
              setIdentifier(address);
            } catch (e) {
              console.error('Wallet connect failed', e);
            }
          }}
          type="button"
          className="px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
        >
          Use Wallet
        </button>
      </div>

      <div className="mt-3">
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-white ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {loading ? 'Verifying...' : 'Login with Human Passport'}
        </button>
      </div>

      {status === 'pending' && <div className="text-sm text-gray-600 mt-2">Checking {identifier || wallet}...</div>}
      {status === 'verified' && <div className="text-sm text-emerald-600 mt-2">Verified Human ✅</div>}
      {status === 'failed' && <div className="text-sm text-red-600 mt-2">Verification Failed ❌</div>}
    </div>
  );
}
