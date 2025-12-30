const express = require('express');
const { nanoid } = require('nanoid');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const crypto = require('crypto');

module.exports = function createRecordsRouter(deps) {
  const { verifyToken, dbFindUserById, dbCreateUser, dbAddAudit, dbCreateRecordPostgres, pgPool } = deps;
  const router = express.Router();

  // Roles allowed to create records
  const ALLOWED = ['doctor', 'nurse', 'admin', 'researcher', 'pharmacist'];

  // Lowdb fallback
  const dbFile = path.join(__dirname, '..', 'db', 'db.json');
  const adapter = new JSONFile(dbFile);
  const lowdb = new Low(adapter, { records: [] });

  async function ensureLowDb() {
    await lowdb.read();
    lowdb.data ||= {};
    lowdb.data.records ||= [];
  }

  // POST /api/records
  router.post('/', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      if (!ALLOWED.includes((user.role || '').toLowerCase())) return res.status(403).json({ message: 'Forbidden' });

      const { patientId, data, metadata = {} } = req.body || {};
      if (!patientId || !data) return res.status(400).json({ message: 'Missing patientId or data' });

      // compute a cipher/hash reference for the data
      const payloadStr = typeof data === 'string' ? data : JSON.stringify(data);
      const cipherHash = '0x' + crypto.createHash('sha256').update(payloadStr).digest('hex');

      // resource id: keccak256(patientId + ts + random)
      const ts = Date.now();
      const resourceId = require('ethers').keccak256(require('ethers').toUtf8Bytes(`${patientId}:${ts}:${nanoid()}`));

      // Persist record in Postgres if available, else lowdb
      let recordRow = null;
      if (pgPool) {
        const q = `INSERT INTO medisecure_records (id, patientId, authorId, data, metadata, cipherHash, txHash, createdAt) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
        const id = nanoid();
        const values = [id, patientId, user.id, payloadStr, JSON.stringify(metadata), cipherHash, null, ts];
        const r = await pgPool.query(q, values);
        recordRow = r.rows[0];
      } else {
        await ensureLowDb();
        const rec = { id: nanoid(), patientId, authorId: user.id, data: payloadStr, metadata, cipherHash, txHash: null, createdAt: ts };
        lowdb.data.records.push(rec);
        await lowdb.write();
        recordRow = rec;
      }

      // Push to blockchain (registerResource)
      const { registerResourceOnChain } = require('../utils/blockchain');
      let txHash = null;
      try {
        const metaStr = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
        const chainRes = await registerResourceOnChain({ resourceId, cid: '', cipherHash, metadata: metaStr });
        txHash = chainRes.txHash || (chainRes.receipt && chainRes.receipt.transactionHash) || null;
      } catch (e) {
        console.error('Blockchain register failed', e);
        // proceed but warn the client
      }

      // update record with txHash
      if (pgPool && txHash) {
        const up = await pgPool.query('UPDATE medisecure_records SET txHash = $2 WHERE id = $1 RETURNING *', [recordRow.id, txHash]);
        recordRow = up.rows[0];
      } else if (!pgPool && txHash) {
        await ensureLowDb();
        const idx = lowdb.data.records.findIndex(r => r.id === recordRow.id);
        if (idx !== -1) {
          lowdb.data.records[idx].txHash = txHash;
          await lowdb.write();
          recordRow = lowdb.data.records[idx];
        }
      }

      // Add audit entry
      try {
        const auditEntry = { id: nanoid(), by: user.id, ts: Date.now(), type: 'record:create', message: `Created record ${recordRow.id} for patient ${patientId}`, meta: { recordId: recordRow.id, txHash } };
        await dbAddAudit(auditEntry);
      } catch (ae) {
        console.warn('Failed to write audit', ae);
      }

      return res.json({ ok: true, record: recordRow, txHash });
    } catch (err) {
      console.error('POST /api/records error', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // GET /api/records/:id - fetch a record if access allowed
  router.get('/:id', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const { id } = req.params;

      // Load record
      let record = null;
      if (pgPool) {
        const q = 'SELECT * FROM medisecure_records WHERE id = $1 LIMIT 1';
        const r = await pgPool.query(q, [id]);
        record = r.rows[0] || null;
      } else {
        await ensureLowDb();
        record = lowdb.data.records.find(r => r.id === id) || null;
      }

      if (!record) return res.status(404).json({ message: 'Record not found' });

      // Access rules: author or admin always allowed
      const role = (user.role || '').toLowerCase();
      if (record.authorid === user.id || role === 'admin') {
        return res.json({ access: true, record });
      }

      // Otherwise check access grants (medisecure_access table)
      let granted = false;
      if (pgPool) {
        // check for an active grant record for this resourceId and grantee
        const q = `SELECT * FROM medisecure_access WHERE resourceId = $1 AND grantee = $2 ORDER BY createdAt DESC LIMIT 1`;
        const r = await pgPool.query(q, [record.resourceid || record.resourceId || null, user.id]);
        if (r.rows && r.rows.length) {
          // Simple model: presence of latest row means granted (could be revoke records as well in production)
          granted = true;
        }
      } else {
        await ensureLowDb();
        const accessLogs = lowdb.data.access || [];
        const found = accessLogs.find(a => (a.resourceId === (record.resourceid || record.resourceId)) && a.grantee === user.id);
        if (found) granted = true;
      }

      if (!granted) return res.status(403).json({ access: false, message: 'Access Denied' });

      return res.json({ access: true, record });
    } catch (err) {
      console.error('GET /api/records/:id error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
