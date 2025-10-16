/**
 * backend/server.js
 * Simple auth & audit microservice for MediSecure (development use)
 *
 * - JWT auth
 * - lowdb JSON storage (./db/db.json)
 * - Roles: nurse, doctor, pharmacist, lab, consultant, admin
 *
 * NOTE: For production, replace lowdb with a proper DB and secure secrets.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs');
// Human Passport route & middleware
const createPassportRouter = require('./routes/passport');
const createVerifyHuman = require('./middleware/verifyHuman');

const app = express();
app.use(cors());
app.use(express.json());

const DB_DIR = path.join(__dirname, 'db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const file = path.join(DB_DIR, 'db.json');
const adapter = new JSONFile(file);
// lowdb v6 requires default data to be provided to the Low constructor
const DEFAULT_DB = { users: [], audit: [], patients: [], appointments: [], complaints: [], emergency: [] };
const db = new Low(adapter, DEFAULT_DB);

async function initDB() {
  await db.read();
  // Ensure data exists (Low will initialize with DEFAULT_DB when missing)
  db.data ||= DEFAULT_DB;
  await db.write();
}
// Initialize databases (lowdb + optional Mongo)
// initDB must run before server starts to ensure lowdb file exists.
async function startup() {
  await initDB();
  await initMongo();
  // Now start the HTTP server
  app.listen(PORT, () => console.log(`MediSecure backend running on port ${PORT}`));
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const PORT = process.env.PORT || 4000;

startup();

// Helper: improved error logging that prints stack when available
function logErr(ctx, err) {
  try {
    if (err && err.stack) {
      console.error(`${ctx} - error:`, err.stack);
    } else {
      console.error(`${ctx} - error:`, err);
    }
  } catch (e) {
    console.error(`${ctx} - error (logging failed):`, e);
  }
}

// Optional DB support. The app historically used MongoDB (mongoose) when
// MONGO_URI was provided. We now prefer DATABASE_URL. To avoid passing a
// Postgres URL to mongoose (which would fail), we inspect the scheme:
const mongoose = require('mongoose');
const { Pool } = require('pg');
const DATABASE_URL = process.env.DATABASE_URL || process.env.MONGO_URI || '';
let UserModel = null;
let AuditModel = null;

let MONGO_ENABLED = false;
let POSTGRES_ENABLED = false;
let pgPool = null;
async function initMongo() {
  if (!DATABASE_URL) {
    console.log('No DATABASE_URL provided  lowdb fallback enabled');
    return;
  }
  // If DATABASE_URL looks like a Mongo URI, use mongoose. If it is Postgres,
  // Postgres support is not implemented (fall back to lowdb). This avoids
  // passing incompatible URLs to mongoose.
  const normalized = DATABASE_URL.toLowerCase();
  if (normalized.startsWith('mongodb://') || normalized.startsWith('mongodb+srv://')) {
    try {
      await mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    const userSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      name: String,
      email: { type: String, required: true, unique: true },
      password: String,
      role: String,
      createdAt: Number,
      resetToken: String,
      resetExpires: Number,
    }, { collection: 'medisecure_users' });

    const auditSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      by: String,
      ts: Number,
      type: String,
      message: String,
      meta: mongoose.Schema.Types.Mixed,
    }, { collection: 'medisecure_audit' });

    UserModel = mongoose.model('User', userSchema);
    AuditModel = mongoose.model('Audit', auditSchema);
    MONGO_ENABLED = true;
    console.log('Connected to MongoDB');
    } catch (err) {
      console.error('MongoDB connection failed', err);
      UserModel = null;
      AuditModel = null;
      MONGO_ENABLED = false;
    }
  } else if (normalized.startsWith('postgres://') || normalized.startsWith('postgresql://')) {
    // Initialize Postgres pool and create required tables if missing
    try {
      pgPool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
      // Simple connectivity check
      await pgPool.query('SELECT 1');

      // Create tables (id is text primary key to match nanoid usage)
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS medisecure_users (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE,
          password TEXT,
          role TEXT,
          createdAt BIGINT,
          resetToken TEXT,
          resetExpires BIGINT,
          wallet TEXT,
          humanVerified BOOLEAN DEFAULT FALSE,
          humanPassportMeta JSONB
        );
      `);

      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS medisecure_audit (
          id TEXT PRIMARY KEY,
          "by" TEXT,
          ts BIGINT,
          type TEXT,
          message TEXT,
          meta JSONB
        );
      `);

      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS medisecure_patients (
          id TEXT PRIMARY KEY,
          name TEXT,
          mrn TEXT,
          dob TEXT,
          gender TEXT,
          nationality TEXT,
          state TEXT,
          localGovernment TEXT,
          allergies TEXT,
          createdAt BIGINT
        );
      `);

      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS medisecure_appointments (
          id TEXT PRIMARY KEY,
          patientId TEXT,
          role TEXT,
          date TEXT,
          notes TEXT,
          status TEXT,
          createdAt BIGINT
        );
      `);

      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS medisecure_complaints (
          id TEXT PRIMARY KEY,
          patientId TEXT,
          message TEXT,
          createdAt BIGINT
        );
      `);

      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS medisecure_emergency (
          id TEXT PRIMARY KEY,
          patientId TEXT,
          contact JSONB,
          location JSONB,
          tempAccessToken TEXT,
          ts BIGINT,
          sent BOOLEAN,
          provider TEXT,
          payload JSONB
        );
      `);

      POSTGRES_ENABLED = true;
      console.log('Connected to Postgres and ensured tables exist');
    } catch (err) {
      console.error('Postgres initialization failed, falling back to lowdb', err);
      pgPool = null;
      POSTGRES_ENABLED = false;
    }
  } else {
    console.log('DATABASE_URL provided but unrecognized scheme; lowdb fallback enabled');
    return;
  }
}

// Database abstraction helpers (work with either mongoose models or lowdb)
async function dbFindUserByEmail(email) {
  if (POSTGRES_ENABLED && pgPool) {
    const res = await pgPool.query('SELECT * FROM medisecure_users WHERE email = $1 LIMIT 1', [email]);
    return res.rows[0] || null;
  }
  if (MONGO_ENABLED && UserModel) return await UserModel.findOne({ email }).lean();
  await db.read();
  return db.data.users.find(u => u.email === email);
}

async function dbFindUserById(id) {
  if (POSTGRES_ENABLED && pgPool) {
    const res = await pgPool.query('SELECT * FROM medisecure_users WHERE id = $1 LIMIT 1', [id]);
    return res.rows[0] || null;
  }
  if (MONGO_ENABLED && UserModel) return await UserModel.findOne({ id }).lean();
  await db.read();
  return db.data.users.find(u => u.id === id);
}

async function dbCreateUser(userObj) {
  if (POSTGRES_ENABLED && pgPool) {
    const q = `INSERT INTO medisecure_users (id, name, email, password, role, createdAt, resetToken, resetExpires, wallet, humanVerified, humanPassportMeta)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`;
    const values = [userObj.id, userObj.name || null, userObj.email || null, userObj.password || null, userObj.role || null, userObj.createdAt || Date.now(), userObj.resetToken || null, userObj.resetExpires || null, userObj.wallet || null, userObj.humanVerified || false, userObj.humanPassportMeta || null];
    const res = await pgPool.query(q, values);
    return res.rows[0];
  }
  if (MONGO_ENABLED && UserModel) {
    const toCreate = { ...userObj };
    const doc = new UserModel(toCreate);
    await doc.save();
    return doc.toObject();
  }
  await db.read();
  db.data.users.push(userObj);
  await db.write();
  return userObj;
}

async function dbUpdateUserByEmail(email, patch) {
  if (POSTGRES_ENABLED && pgPool) {
    // Build dynamic SET clause
    const keys = Object.keys(patch);
    if (keys.length === 0) return null;
    const sets = keys.map((k, i) => `${k} = $${i+2}`).join(', ');
    const values = [email, ...keys.map(k => patch[k])];
    const q = `UPDATE medisecure_users SET ${sets} WHERE email = $1 RETURNING *`;
    const res = await pgPool.query(q, values);
    return res.rows[0] || null;
  }
  if (MONGO_ENABLED && UserModel) {
    const doc = await UserModel.findOne({ email });
    if (!doc) return null;
    Object.assign(doc, patch);
    await doc.save();
    return doc.toObject();
  }
  await db.read();
  const idx = db.data.users.findIndex(u => u.email === email);
  if (idx === -1) return null;
  db.data.users[idx] = { ...db.data.users[idx], ...patch };
  await db.write();
  return db.data.users[idx];
}

async function dbUpdateUserById(id, patch) {
  if (POSTGRES_ENABLED && pgPool) {
    const keys = Object.keys(patch);
    if (keys.length === 0) return null;
    const sets = keys.map((k, i) => `${k} = $${i+2}`).join(', ');
    const values = [id, ...keys.map(k => patch[k])];
    const q = `UPDATE medisecure_users SET ${sets} WHERE id = $1 RETURNING *`;
    const res = await pgPool.query(q, values);
    return res.rows[0] || null;
  }
  if (MONGO_ENABLED && UserModel) {
    const doc = await UserModel.findOne({ id });
    if (!doc) return null;
    Object.assign(doc, patch);
    await doc.save();
    return doc.toObject();
  }
  await db.read();
  const idx = db.data.users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  db.data.users[idx] = { ...db.data.users[idx], ...patch };
  await db.write();
  return db.data.users[idx];
}

async function dbGetAllUsers() {
  if (POSTGRES_ENABLED && pgPool) {
    const res = await pgPool.query('SELECT id, name, email, role, createdAt FROM medisecure_users');
    return res.rows;
  }
  if (UserModel) return await UserModel.find({}, { password: 0, __v: 0 }).lean();
  await db.read();
  return db.data.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt }));
}

async function dbAddAudit(entry) {
  if (POSTGRES_ENABLED && pgPool) {
    const q = `INSERT INTO medisecure_audit (id, "by", ts, type, message, meta) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const values = [entry.id, entry.by, entry.ts, entry.type, entry.message, entry.meta || null];
    const res = await pgPool.query(q, values);
    return res.rows[0];
  }
  if (AuditModel) {
    const doc = new AuditModel(entry);
    await doc.save();
    return doc.toObject();
  }
  await db.read();
  db.data.audit.push(entry);
  await db.write();
  return entry;
}

// (JWT_SECRET and PORT declared above)

const ROLES = ['nurse', 'doctor', 'pharmacist', 'lab', 'consultant', 'admin'];

// Helper: create JWT
function signToken(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

// Expose db helpers & signToken for routes that need them (passport route)
const passportDeps = { dbFindUserByEmail, dbUpdateUserByEmail, dbCreateUser, signToken, JWT_SECRET };
const passportRouter = createPassportRouter(passportDeps);
app.use('/api/passport', passportRouter);

// Create verifyHuman middleware instance
const verifyHuman = createVerifyHuman({ dbFindUserById });

// Backwards-compatible inline authMiddleware (kept for existing code)
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing Authorization header' });
  const token = header.replace('Bearer ', '');
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// New modular verifyToken middleware (factory) - prefer using this in routes
const createVerifyToken = require('./middleware/verifyToken');
const verifyToken = createVerifyToken({ JWT_SECRET });

// Role guard generator
function requireRole(allowed = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    return next();
  };
}

/**
 * POST /signup
 * body: { name, email, password, role }
 */
app.post('/signup', async (req, res) => {
  try {
    const { name = '', email = '', password = '', role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ message: 'Missing required fields' });
    if (!ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  const lower = email.toLowerCase();
  const existing = await dbFindUserByEmail(lower);
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const user = { id: nanoid(), name, email: lower, password: hash, role, createdAt: Date.now() };
  await dbCreateUser(user);

  const token = signToken(user);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    logErr('/signup', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Example protected route: current user's profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    // req.user is populated by verifyToken middleware
    const user = await dbFindUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, humanVerified: !!user.humanVerified });
  } catch (err) {
    logErr('/api/profile', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Example protected route: list records (placeholder)
app.get('/api/records', verifyToken, async (req, res) => {
  try {
    // This is a stub - in a real app you'd query records owned by the user
    return res.json({ records: [], message: 'No records yet (this is a stub endpoint)' });
  } catch (err) {
    logErr('/api/records', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /login
 * body: { email, password }
 */
app.post('/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body;
  const lower = email.toLowerCase();
  const user = await dbFindUserByEmail(lower);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken(user);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    logErr('/login', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// --- Backwards-compatible /auth routes (preferred frontend target) ---
app.post('/auth/signup', async (req, res) => {
  try {
    const { name = '', email = '', password = '', role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ message: 'Missing required fields' });
    if (!ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  const lower = email.toLowerCase();
  const existing = await dbFindUserByEmail(lower);
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const user = { id: nanoid(), name, email: lower, password: hash, role, createdAt: Date.now() };
  await dbCreateUser(user);

  const token = signToken(user);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    logErr('/auth/signup', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body;
    const user = await dbFindUserByEmail(email.toLowerCase());
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    logErr('/auth/login', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Token verification endpoint (used by frontend to validate token)
app.get('/auth/verify', authMiddleware, async (req, res) => {
  try {
    const user = await dbFindUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error('/auth/verify error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /auth/forgot-password
 * body: { email }
 * Dev behaviour: returns token in response so UI can show it.
 */
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email = '' } = req.body;
    if (!email) return res.status(400).json({ message: 'Missing email' });
    const lower = email.toLowerCase();
    const user = await dbFindUserByEmail(lower);
    if (!user) return res.json({ message: 'If the email exists, a reset token was issued' });

    const token = nanoid(10);
    await dbUpdateUserByEmail(lower, { resetToken: token, resetExpires: Date.now() + 1000 * 60 * 60 });

    const resp = { message: 'Reset token issued' };
    if (process.env.NODE_ENV !== 'production') resp.token = token;
    return res.json(resp);
  } catch (err) {
    console.error('/auth/forgot-password error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /auth/reset-password
 * body: { email, token, password }
 */
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { email = '', token = '', password = '' } = req.body;
    if (!email || !token || !password) return res.status(400).json({ message: 'Missing fields' });
    const lower = email.toLowerCase();
    const user = await dbFindUserByEmail(lower);
    if (!user || !user.resetToken || user.resetToken !== token || !user.resetExpires || user.resetExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hash = await bcrypt.hash(password, 10);
    await dbUpdateUserByEmail(lower, { password: hash, resetToken: undefined, resetExpires: undefined });

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('/auth/reset-password error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /me
 * header: Authorization: Bearer <token>
 */
app.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await dbFindUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error('/me error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /users
 * Admin-only
 */
app.get('/users', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const users = await dbGetAllUsers();
    return res.json(users);
  } catch (err) {
    console.error('/users error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin: update user role
app.patch('/users/:userId/role', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });

    const userId = req.params.userId;
    const updated = await dbUpdateUserById(userId, { role });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    return res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
  } catch (err) {
    console.error('/users/:userId/role error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /audit
 * Store small audit entry
 * body: { type, message, meta }
 */
app.post('/audit', authMiddleware, async (req, res) => {
  try {
    const entry = { id: nanoid(), by: req.user.id, ts: Date.now(), ...req.body };
    const saved = await dbAddAudit(entry);
    return res.json(saved);
  } catch (err) {
    console.error('/audit error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.get('/', (req, res) => res.send('MediSecure backend: auth & audit microservice'));

// Quick DB connectivity test route
app.get('/test-db', async (req, res) => {
  try {
    if (POSTGRES_ENABLED && pgPool) {
      const r = await pgPool.query('SELECT COUNT(*)::int as users_count FROM medisecure_users');
      return res.json({ ok: true, engine: 'postgres', users: r.rows[0].users_count });
    }
    if (MONGO_ENABLED) return res.json({ ok: true, engine: 'mongodb' });
    return res.json({ ok: true, engine: 'lowdb' });
  } catch (err) {
    console.error('/test-db error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// (server started in startup())

/**
 * Patient management: GET /api/hospital/patients
 * Supports optional query `q` for simple name/MRN search and pagination params `page` & `limit`.
 */
app.get('/api/hospital/patients', authMiddleware, verifyHuman, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    await db.read();
    let items = db.data.patients || [];
    if (q) {
      items = items.filter(p => (p.name||'').toLowerCase().includes(q) || (String(p.mrn||p.id||'')).toLowerCase().includes(q));
    }
    const total = items.length;
    const start = (page-1)*limit;
    const pageItems = items.slice(start, start+limit);
    return res.json({ total, page, limit, items: pageItems });
  } catch (err) {
    logErr('/api/hospital/patients GET', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/hospital/patients
 * Create a patient record. Body accepts { name, mrn?, dob?, gender?, nationality?, state?, localGovernment?, allergies? }
 * Returns created patient object including generated `id`/`mrn`.
 */
app.post('/api/hospital/patients', authMiddleware, verifyHuman, async (req, res) => {
  try {
    const { name = '', mrn = '', dob = '', gender = '', nationality = '', state = '', localGovernment = '', allergies = '' } = req.body;
    if (!name) return res.status(400).json({ message: 'Missing patient name' });
    await db.read();
    const id = nanoid();
    const patient = { id, name, mrn: mrn || id, dob, gender, nationality, state, localGovernment, allergies, createdAt: Date.now() };
    db.data.patients = db.data.patients || [];
    db.data.patients.push(patient);
    await db.write();
    return res.json(patient);
  } catch (err) {
    logErr('/api/hospital/patients POST', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/hospital/patients/:id/appointments
 * Body: { role, date, notes }
 */
app.post('/api/hospital/patients/:id/appointments', authMiddleware, verifyHuman, async (req, res) => {
  try {
    const pid = req.params.id;
    const { role, date, notes } = req.body;
    if (!role || !date) return res.status(400).json({ message: 'Missing fields' });
    await db.read();
    const appt = { id: nanoid(), patientId: pid, role, date, notes, status: 'requested', createdAt: Date.now() };
    db.data.appointments = db.data.appointments || [];
    db.data.appointments.push(appt);
    await db.write();
    return res.json(appt);
  } catch (err) {
    logErr('/api/hospital/patients/:id/appointments POST', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/hospital/patients/:id/complaints
 * Body: { message }
 */
app.post('/api/hospital/patients/:id/complaints', authMiddleware, verifyHuman, async (req, res) => {
  try {
    const pid = req.params.id;
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Missing message' });
    await db.read();
    const c = { id: nanoid(), patientId: pid, message, createdAt: Date.now() };
    db.data.complaints = db.data.complaints || [];
    db.data.complaints.push(c);
    await db.write();
    return res.json(c);
  } catch (err) {
    logErr('/api/hospital/patients/:id/complaints POST', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/hospital/emergency/notify
 * Body: { patientId, contact: { name, phone, email, address }, location, tempAccessToken }
 * Server will attempt to send email/SMS via configured providers. If none configured, it will store a record in db.emergency and return the generated payload for manual sending.
 */
app.post('/api/hospital/emergency/notify', async (req, res) => {
  try {
    const { patientId, contact = {}, location = null, tempAccessToken } = req.body;
    if (!contact || (!contact.phone && !contact.email)) return res.status(400).json({ message: 'Missing contact details' });
    await db.read();
    const entry = { id: nanoid(), patientId, contact, location, tempAccessToken, ts: Date.now(), sent: false };

    // Try to send via Twilio/SMS or SendGrid/Email if configured
    let sendResult = { ok: false, provider: null };
    try {
      // Send SMS via Twilio if configured
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
        const Twilio = require('twilio');
        const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const body = `Emergency access for patient ${patientId}. Temporary token: ${tempAccessToken}. Location: ${location ? JSON.stringify(location) : 'n/a'}`;
        if (contact.phone) {
          await client.messages.create({ to: contact.phone, from: process.env.TWILIO_FROM, body });
          sendResult = { ok: true, provider: 'twilio' };
        }
      }
      // Send Email via SendGrid if configured
      if (!sendResult.ok && process.env.SENDGRID_API_KEY && contact.email) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
          to: contact.email,
          from: process.env.SENDGRID_FROM || 'noreply@medisecure.app',
          subject: 'Emergency access to patient record',
          text: `Temporary access token: ${tempAccessToken}\nLocation: ${location ? JSON.stringify(location) : 'n/a'}`,
        };
        await sgMail.send(msg);
        sendResult = { ok: true, provider: 'sendgrid' };
      }
    } catch (err) {
      console.warn('External send failed', err);
    }

    entry.sent = sendResult.ok;
    entry.provider = sendResult.provider || null;
    db.data.emergency = db.data.emergency || [];
    db.data.emergency.push(entry);
    await db.write();

    return res.json({ ok: sendResult.ok, provider: sendResult.provider, payload: entry });
  } catch (err) {
    logErr('/api/hospital/emergency/notify POST', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
