/**
 * backend/routes/passport.js
 * Human Passport verification integration.
 * POST /api/passport/verify
 * body: { address }
 * Uses HUMAN_PASSPORT_API_KEY from env and MONGO (if enabled) to persist verification.
 */

const express = require('express');
const axios = require('axios');
// If fetch is not available (older Node), try to require node-fetch as a fallback
let fetchFn = null;
try {
  if (typeof fetch === 'function') fetchFn = fetch;
} catch (e) {}
if (!fetchFn) {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    fetchFn = require('node-fetch');
  } catch (e) {
    fetchFn = null;
  }
}
const { nanoid } = require('nanoid');
const router = express.Router();
// Use global fetch if available (Node 18+), otherwise fall back to axios for external call

// Expect server.js to expose dbUpdateUserById, dbFindUserByEmail, dbCreateUser etc via app.locals
module.exports = function (deps) {
  const { dbFindUserByEmail, dbUpdateUserByEmail, dbCreateUser, signToken, JWT_SECRET } = deps;

  // Verify either an identifier OR a Human Passport token
  // POST body can be { humanPassportToken: '...' } or { identifier: '...' }
  router.post('/verify', async (req, res) => {
    try {
      const humanPassportToken = (req.body.humanPassportToken || '').toString().trim();
      const identifier = (req.body.identifier || '').toString().trim();

      if (!humanPassportToken && !identifier) return res.status(400).json({ message: 'Missing identifier or humanPassportToken' });

      const apiKey = process.env.HUMAN_PASSPORT_API_KEY;
      if (!apiKey) return res.status(500).json({ message: 'Human Passport API key not configured' });

      // Call Human Passport verify endpoint. Prefer using fetch if available.
      let hpResponseData = null;
      try {
        const hpUrl = 'https://api.human.tech/passport/verify';
        const body = humanPassportToken ? { token: humanPassportToken } : { identifier };

        // Use global fetch if present
        if (fetchFn) {
          const r = await fetchFn(hpUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            // node fetch implementations may not support timeout here; handled by axios fallback
          });
          // Some node fetch implementations don't support timeout option; it's fine.
          hpResponseData = await r.json();
        } else {
          const r = await axios.post('https://api.human.tech/passport/verify', body, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            timeout: 10000,
          });
          hpResponseData = r.data;
        }
      } catch (e) {
        console.error('Human Passport API call failed', e);
        return res.status(502).json({ message: 'Human Passport verification service error' });
      }

      const data = hpResponseData || {};
      const verified = !!data.verified;

      // If the Human Passport response contains a canonical identifier, use it; otherwise fall back
      const canonical = data.identifier || identifier || data.address || '';

      // Persist user record similar to previous logic
      const looksLikeEmail = canonical.includes('@');
      let user = null;

      if (looksLikeEmail) {
        user = await dbFindUserByEmail(canonical.toLowerCase());
      }

      if (!user && canonical) {
        // Try pseudo-email lookup
        const pseudoEmail = `${canonical.toLowerCase()}@identifier.local`;
        user = await dbFindUserByEmail(pseudoEmail);
      }

      if (!user) {
        const newUser = { id: nanoid(), name: canonical || (identifier || humanPassportToken), email: looksLikeEmail ? canonical.toLowerCase() : '', password: '', role: 'patient', createdAt: Date.now(), identifier: canonical || identifier, humanVerified: verified, humanPassportMeta: data };
        user = await dbCreateUser(newUser);
      } else {
        const updatePatch = { humanVerified: verified, humanPassportMeta: data };
        if (!user.identifier) updatePatch.identifier = canonical || identifier;
        await dbUpdateUserByEmail(user.email || `${(canonical||identifier).toLowerCase()}@identifier.local`, updatePatch);
      }

      // Issue JWT for this user and return as jwtToken for frontend
      const jwtToken = signToken(user);
      return res.json({ jwtToken, verified, user: { id: user.id, identifier: canonical || identifier, humanVerified: verified } });
    } catch (err) {
      console.error('/api/passport/verify error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
