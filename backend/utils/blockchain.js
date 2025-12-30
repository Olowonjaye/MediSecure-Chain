const path = require('path');
const { ethers } = require('ethers');
const fs = require('fs');

const ABI_PATH = path.join(__dirname, '..', '..', 'frontend', 'src', 'abis', 'MedisecureRegistry.json');

function loadAbi() {
  try {
    const raw = fs.readFileSync(ABI_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not load ABI from', ABI_PATH, e);
    return null;
  }
}

const ABI = loadAbi();

/**
 * Registers a resource on-chain by calling registerResource(resourceId, cid, cipherHash, metadata)
 * Expects env vars: BACKEND_WEB3_URL, BACKEND_PRIVATE_KEY, CONTRACT_ADDRESS
 */
async function registerResourceOnChain({ resourceId, cid = '', cipherHash, metadata = '' }) {
  const url = process.env.BACKEND_WEB3_URL || process.env.WEB3_PROVIDER_URL || process.env.VITE_API_URL;
  const pk = process.env.BACKEND_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;

  if (!url || !pk || !contractAddress) {
    throw new Error('Blockchain config missing (BACKEND_WEB3_URL, BACKEND_PRIVATE_KEY, CONTRACT_ADDRESS)');
  }

  const provider = new ethers.JsonRpcProvider(url);
  const wallet = new ethers.Wallet(pk, provider);
  if (!ABI) throw new Error('Contract ABI not available');
  const contract = new ethers.Contract(contractAddress, ABI, wallet);

  // call registerResource
  const tx = await contract.registerResource(resourceId, cid, cipherHash, metadata);
  const receipt = await tx.wait();
  return { txHash: receipt.transactionHash, receipt };
}

async function grantAccessOnChain({ resourceId, grantee, encryptedSymKey = '0x' }) {
  const url = process.env.BACKEND_WEB3_URL || process.env.WEB3_PROVIDER_URL || process.env.VITE_API_URL;
  const pk = process.env.BACKEND_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;

  if (!url || !pk || !contractAddress) {
    throw new Error('Blockchain config missing (BACKEND_WEB3_URL, BACKEND_PRIVATE_KEY, CONTRACT_ADDRESS)');
  }
  const provider = new ethers.JsonRpcProvider(url);
  const wallet = new ethers.Wallet(pk, provider);
  if (!ABI) throw new Error('Contract ABI not available');
  const contract = new ethers.Contract(contractAddress, ABI, wallet);
  const tx = await contract.grantAccess(resourceId, grantee, encryptedSymKey);
  const receipt = await tx.wait();
  return { txHash: receipt.transactionHash, receipt };
}

async function revokeAccessOnChain({ resourceId, grantee }) {
  const url = process.env.BACKEND_WEB3_URL || process.env.WEB3_PROVIDER_URL || process.env.VITE_API_URL;
  const pk = process.env.BACKEND_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;

  if (!url || !pk || !contractAddress) {
    throw new Error('Blockchain config missing (BACKEND_WEB3_URL, BACKEND_PRIVATE_KEY, CONTRACT_ADDRESS)');
  }
  const provider = new ethers.JsonRpcProvider(url);
  const wallet = new ethers.Wallet(pk, provider);
  if (!ABI) throw new Error('Contract ABI not available');
  const contract = new ethers.Contract(contractAddress, ABI, wallet);
  const tx = await contract.revokeAccess(resourceId, grantee);
  const receipt = await tx.wait();
  return { txHash: receipt.transactionHash, receipt };
}

module.exports = {
  registerResourceOnChain,
  grantAccessOnChain,
  revokeAccessOnChain,
};

