const express = require('express');
const { nanoid } = require('nanoid');

module.exports = function createAccessRouter(deps) {
  const { verifyToken, dbAddAudit, pgPool } = deps;
  const router = express.Router();

  // Roles allowed to manage access
  const ALLOWED = ['doctor', 'admin', 'researcher'];

  // POST /access/grant
  router.post('/grant', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      if (!ALLOWED.includes((user.role || '').toLowerCase())) return res.status(403).json({ message: 'Forbidden' });

      const { resourceId, grantee, encryptedSymKey } = req.body || {};
      if (!resourceId || !grantee) return res.status(400).json({ message: 'Missing resourceId or grantee' });

      // call blockchain util
      const { grantAccessOnChain } = require('../utils/blockchain');
      let txHash = null;
      try {
        const r = await grantAccessOnChain({ resourceId, grantee, encryptedSymKey });
        txHash = r.txHash || (r.receipt && r.receipt.transactionHash) || null;
      } catch (e) {
        console.error('grantAccessOnChain failed', e);
        return res.status(500).json({ message: 'Blockchain error', error: e.message });
      }

      // persist to Postgres if available
      let row = null;
      if (pgPool) {
        const id = nanoid();
        const q = `INSERT INTO medisecure_access (id, resourceId, grantee, grantedBy, txHash, createdAt) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
        const values = [id, resourceId, grantee, user.id, txHash, Date.now()];
        const r = await pgPool.query(q, values);
        row = r.rows[0];
      }

      // audit
      try {
        await dbAddAudit({ id: nanoid(), by: user.id, ts: Date.now(), type: 'access:grant', message: `Granted access to ${grantee} for ${resourceId}`, meta: { resourceId, grantee, txHash } });
      } catch (e) { console.warn('audit write failed', e); }

      return res.json({ ok: true, txHash, record: row });
    } catch (err) {
      console.error('/access/grant error', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // POST /access/revoke
  router.post('/revoke', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      if (!ALLOWED.includes((user.role || '').toLowerCase())) return res.status(403).json({ message: 'Forbidden' });

      const { resourceId, grantee } = req.body || {};
      if (!resourceId || !grantee) return res.status(400).json({ message: 'Missing resourceId or grantee' });

      // blockchain
      const { revokeAccessOnChain } = require('../utils/blockchain');
      let txHash = null;
      try {
        const r = await revokeAccessOnChain({ resourceId, grantee });
        txHash = r.txHash || (r.receipt && r.receipt.transactionHash) || null;
      } catch (e) {
        console.error('revokeAccessOnChain failed', e);
        return res.status(500).json({ message: 'Blockchain error', error: e.message });
      }

      if (pgPool) {
        // optionally mark access as revoked in medisecure_access (insert a revoke record)
        const id = nanoid();
        const q = `INSERT INTO medisecure_access (id, resourceId, grantee, revokedBy, txHash, createdAt) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
        const values = [id, resourceId, grantee, user.id, txHash, Date.now()];
        await pgPool.query(q, values);
      }

      try {
        await dbAddAudit({ id: nanoid(), by: user.id, ts: Date.now(), type: 'access:revoke', message: `Revoked access from ${grantee} for ${resourceId}`, meta: { resourceId, grantee, txHash } });
      } catch (e) { console.warn('audit write failed', e); }

      return res.json({ ok: true, txHash });
    } catch (err) {
      console.error('/access/revoke error', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  return router;
};
