// ---------------------------------------------------------
// frontend/src/services/blockchain.js
// MediSecureChain | Unified Blockchain Service
// Keeps full backward compatibility + syncs with latest contract
// ---------------------------------------------------------

import { ethers } from "ethers";
import MedisecureRegistryABI from "../abis/MedisecureRegistry.json";

// ------------------- Contract Constants -------------------
export const CONTRACT_ABI = MedisecureRegistryABI;
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// Role hashes (for UI/role control sync)
export const ROLES = {
  DEFAULT_ADMIN_ROLE: ethers.id("DEFAULT_ADMIN_ROLE"),
  EMERGENCY_ISSUER_ROLE: ethers.id("EMERGENCY_ISSUER_ROLE"),
  AUDITOR_ROLE: ethers.id("AUDITOR_ROLE"),
};

// ------------------- Provider & Signer -------------------
function getProvider() {
  if (!window.ethereum) throw new Error("⚠️ MetaMask not installed");
  return new ethers.BrowserProvider(window.ethereum);
}

async function getSigner() {
  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

// ------------------- Contract Instances -------------------
export function getReadContract() {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export function getContract() {
  // backward compatibility alias
  return getReadContract();
}

export async function getWriteContract() {
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// ------------------- Wallet Actions -------------------
export async function connectWallet() {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const provider = getProvider();

  let ens = null;
  try {
    ens = await provider.lookupAddress(address);
  } catch {
    // ENS not supported on some networks
  }

  const network = await provider.getNetwork();
  return { address, ens, network: network.name };
}

export async function getNetwork() {
  const provider = getProvider();
  const network = await provider.getNetwork();
  return network.name;
}

// ------------------- Write Functions -------------------
export async function registerResource(resourceId, cid, cipherHash, metadata) {
  const contract = await getWriteContract();
  const tx = await contract.registerResource(resourceId, cid, cipherHash, metadata);
  const receipt = await tx.wait();
  return receipt;
}

export async function grantAccess(resourceId, grantee, encryptedKey) {
  const contract = await getWriteContract();
  const tx = await contract.grantAccess(resourceId, grantee, encryptedKey);
  return tx.wait();
}

export async function revokeAccess(resourceId, grantee) {
  const contract = await getWriteContract();
  const tx = await contract.revokeAccess(resourceId, grantee);
  return tx.wait();
}

// ------------------- Read Functions -------------------
export async function getEncryptedKey(resourceId, grantee) {
  const contract = getReadContract();
  return contract.getEncryptedKey(resourceId, grantee);
}

export async function getRegisteredResources() {
  const contract = getReadContract();
  const events = await contract.queryFilter("ResourceRegistered");

  return events.map((e) => ({
    resourceId: e.args.resourceId,
    owner: e.args.owner,
    cid: e.args.cid,
    cipherHash: e.args.cipherHash,
    metadata: e.args.metadata || "",
    blockNumber: e.blockNumber,
  }));
}

export async function getAccessGrantedEvents() {
  const contract = getReadContract();
  const events = await contract.queryFilter("AccessGranted");

  return events.map((e) => ({
    resourceId: e.args.resourceId,
    grantee: e.args.grantee,
    blockNumber: e.blockNumber,
  }));
}

export async function getAccessRevokedEvents() {
  const contract = getReadContract();
  const events = await contract.queryFilter("AccessRevoked");

  return events.map((e) => ({
    resourceId: e.args.resourceId,
    grantee: e.args.grantee,
    blockNumber: e.blockNumber,
  }));
}

// ------------------- Live Listeners -------------------
export function listenResourceRegistered(callback) {
  const contract = getReadContract();
  contract.on("ResourceRegistered", (resourceId, owner, cid, cipherHash) =>
    callback({ resourceId, owner, cid, cipherHash })
  );
  return () => contract.removeAllListeners("ResourceRegistered");
}

export function listenAccessGranted(callback) {
  const contract = getReadContract();
  contract.on("AccessGranted", (resourceId, grantee) =>
    callback({ resourceId, grantee })
  );
  return () => contract.removeAllListeners("AccessGranted");
}

export function listenAccessRevoked(callback) {
  const contract = getReadContract();
  contract.on("AccessRevoked", (resourceId, grantee) =>
    callback({ resourceId, grantee })
  );
  return () => contract.removeAllListeners("AccessRevoked");
}

// ------------------- Utility Helpers -------------------
export async function verifyConnection() {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    return { ok: true, network: network.name };
  } catch (error) {
    console.error("Connection check failed:", error);
    return { ok: false, error: error.message };
  }
}
