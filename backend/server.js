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

const app = express();
app.use(cors());
app.use(express.json());

const DB_DIR = path.join(__dirname, 'db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const file = path.join(DB_DIR, 'db.json');
const adapter = new JSONFile(file);
// lowdb v6 requires default data to be provided to the Low constructor
const DEFAULT_DB = { users: [], audit: [] };
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

// Optional MongoDB support (use MONGO_URI env variable). When provided,
// we initialize mongoose and use Mongo for users/audit. If not provided
// we keep using the lowdb JSON file. This preserves developer workflow.
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || '';
let UserModel = null;
let AuditModel = null;

let MONGO_ENABLED = false;
async function initMongo() {
  if (!MONGO_URI) {
    console.log('MONGO_URI not configured — lowdb fallback enabled');
    return;
  }
  try {
    // connect returns a promise that resolves when connected
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
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
}

// Database abstraction helpers (work with either mongoose models or lowdb)
async function dbFindUserByEmail(email) {
  if (MONGO_ENABLED && UserModel) return await UserModel.findOne({ email }).lean();
  await db.read();
  return db.data.users.find(u => u.email === email);
}

async function dbFindUserById(id) {
  if (MONGO_ENABLED && UserModel) return await UserModel.findOne({ id }).lean();
  await db.read();
  return db.data.users.find(u => u.id === id);
}

async function dbCreateUser(userObj) {
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
  if (UserModel) return await UserModel.find({}, { password: 0, __v: 0 }).lean();
  await db.read();
  return db.data.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt }));
}

async function dbAddAudit(entry) {
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

// Auth middleware
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

// (server started in startup())
