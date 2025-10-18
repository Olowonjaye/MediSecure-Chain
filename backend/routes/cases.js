/**
 * backend/routes/cases.js
 * Simple cases API used by Consultant / Doctor dashboards in the frontend.
 * - GET /cases/consultant  -> returns cases assigned to the authenticated consultant
 * - PUT /cases/:id/diagnosis -> updates diagnosis for a case (requires auth)
 *
 * This is intentionally lightweight: it stores cases inside the same lowdb JSON file
 * used by the backend (backend/db/db.json). It uses the Low / JSONFile adapter so
 * changes are visible to other backend modules that also read that file.
 */

const express = require('express');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { nanoid } = require('nanoid');

module.exports = function createCasesRouter(verifyToken) {
  const router = express.Router();

  // Path to the shared lowdb file used by the server
  const dbFile = path.join(__dirname, '..', 'db', 'db.json');
  const adapter = new JSONFile(dbFile);
  const db = new Low(adapter, { cases: [] });

  async function ensureLoaded() {
    await db.read();
    db.data ||= {};
    db.data.cases ||= [];
  }

  // Return cases assigned to the authenticated consultant
  router.get('/consultant', verifyToken, async (req, res) => {
    try {
      await ensureLoaded();
      const userId = req.user && req.user.id;
      // If user not found in token, return empty set
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      // Filter cases assigned to this consultant
      const assigned = db.data.cases.filter((c) => c.assignedTo === userId);

      // If no cases found, return a helpful empty array to the UI
      return res.json({ data: assigned });
    } catch (err) {
      console.error('/cases/consultant error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Update diagnosis for a case
  router.put('/:id/diagnosis', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { diagnosis } = req.body || {};
      await ensureLoaded();
      const idx = db.data.cases.findIndex((c) => c.id === id);
      if (idx === -1) return res.status(404).json({ message: 'Case not found' });

      db.data.cases[idx].diagnosis = diagnosis;
      db.data.cases[idx].diagnosedAt = Date.now();
      await db.write();
      return res.json({ data: db.data.cases[idx] });
    } catch (err) {
      console.error('PUT /cases/:id/diagnosis error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Small helper to create a demo case (not exposed as a route)
  async function createDemoCaseIfEmpty() {
    await ensureLoaded();
    if (!db.data.cases.length) {
      db.data.cases.push({
        id: nanoid(),
        patientName: 'Jane Doe',
        symptoms: 'Fever, cough',
        assignedTo: null, // leave null so GET /consultant returns empty until assigned
        assignedAt: Date.now(),
        diagnosis: null,
      });
      await db.write();
    }
  }

  // Create a demo case at startup if file empty (keeps behaviour friendly on dev)
  createDemoCaseIfEmpty().catch((e) => console.error('cases init error', e));

  return router;
};
