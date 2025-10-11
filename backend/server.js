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
initDB();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const PORT = process.env.PORT || 4001;

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

    await db.read();
    const existing = db.data.users.find(u => u.email === email.toLowerCase());
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = { id: nanoid(), name, email: email.toLowerCase(), password: hash, role, createdAt: Date.now() };
    db.data.users.push(user);
    await db.write();

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('/signup error', err);
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
    await db.read();
    const user = db.data.users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('/login error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /me
 * header: Authorization: Bearer <token>
 */
app.get('/me', authMiddleware, async (req, res) => {
  try {
    await db.read();
    const user = db.data.users.find(u => u.id === req.user.id);
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
    await db.read();
    const users = db.data.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt }));
    return res.json(users);
  } catch (err) {
    console.error('/users error', err);
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
    await db.read();
    const entry = { id: nanoid(), by: req.user.id, ts: Date.now(), ...req.body };
    db.data.audit.push(entry);
    await db.write();
    return res.json(entry);
  } catch (err) {
    console.error('/audit error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.get('/', (req, res) => res.send('MediSecure backend: auth & audit microservice'));

app.listen(PORT, () => console.log(`MediSecure backend running on port ${PORT}`));
