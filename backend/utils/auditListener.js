const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');

const ABI_PATH = path.join(__dirname, '..', '..', 'contracts', 'AuditTrail.sol');

function loadAuditAbi() {
  // We don't have a built JSON ABI for the AuditTrail here; instead we'll construct a minimal ABI
  // with only the events we care about. This avoids requiring a full compilation step in this script.
  return [
    "event RecordUploaded(bytes32 indexed resourceId, address indexed actor, string metadata, uint256 ts)",
    "event AccessGranted(bytes32 indexed resourceId, address indexed grantee, address indexed actor, string metadata, uint256 ts)",
    "event AccessRevoked(bytes32 indexed resourceId, address indexed grantee, address indexed actor, string metadata, uint256 ts)",
    "event RecordFetched(bytes32 indexed resourceId, address indexed actor, string metadata, uint256 ts)"
  ];
}

function startAuditListener({ wsUrl, contractAddress, dbAddAudit }) {
  if (!wsUrl || !contractAddress) {
    console.warn('Audit listener disabled: WS URL or contract address not provided');
    return null;
  }

  const provider = new ethers.WebSocketProvider(wsUrl);
  const abi = loadAuditAbi();
  const contract = new ethers.Contract(contractAddress, abi, provider);

  contract.on('RecordUploaded', async (resourceId, actor, metadata, ts, event) => {
    console.log('Audit event RecordUploaded', resourceId, actor, metadata, ts.toNumber?.() || ts);
    try {
      await dbAddAudit({ id: require('nanoid').nanoid(), by: actor, ts: Number(ts), type: 'onchain:recordUploaded', message: `Record ${resourceId} uploaded`, meta: { resourceId: resourceId, metadata } });
    } catch (e) { console.error('Failed to persist audit event', e); }
  });

  contract.on('AccessGranted', async (resourceId, grantee, actor, metadata, ts, event) => {
    console.log('Audit event AccessGranted', resourceId, grantee, actor, metadata, ts.toNumber?.() || ts);
    try {
      await dbAddAudit({ id: require('nanoid').nanoid(), by: actor, ts: Number(ts), type: 'onchain:accessGranted', message: `Access granted to ${grantee} for ${resourceId}`, meta: { resourceId, grantee, metadata } });
    } catch (e) { console.error('Failed to persist audit event', e); }
  });

  contract.on('AccessRevoked', async (resourceId, grantee, actor, metadata, ts, event) => {
    console.log('Audit event AccessRevoked', resourceId, grantee, actor, metadata, ts.toNumber?.() || ts);
    try {
      await dbAddAudit({ id: require('nanoid').nanoid(), by: actor, ts: Number(ts), type: 'onchain:accessRevoked', message: `Access revoked from ${grantee} for ${resourceId}`, meta: { resourceId, grantee, metadata } });
    } catch (e) { console.error('Failed to persist audit event', e); }
  });

  contract.on('RecordFetched', async (resourceId, actor, metadata, ts, event) => {
    console.log('Audit event RecordFetched', resourceId, actor, metadata, ts.toNumber?.() || ts);
    try {
      await dbAddAudit({ id: require('nanoid').nanoid(), by: actor, ts: Number(ts), type: 'onchain:recordFetched', message: `Record ${resourceId} fetched by ${actor}`, meta: { resourceId, metadata } });
    } catch (e) { console.error('Failed to persist audit event', e); }
  });

  provider._websocket.on('close', (code) => {
    console.warn('Audit WebSocket closed', code);
  });

  return provider;
}

module.exports = { startAuditListener };
