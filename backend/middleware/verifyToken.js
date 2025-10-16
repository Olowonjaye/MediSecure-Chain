/**
 * backend/middleware/verifyToken.js
 * Middleware to verify JWT from Authorization header using JWT_SECRET.
 * Exports a factory that accepts deps (optional) so it can read JWT_SECRET from env
 * and provide access to db helpers if needed.
 */
const jwt = require('jsonwebtoken');

module.exports = function createVerifyToken(deps = {}) {
  const JWT_SECRET = process.env.JWT_SECRET || deps.JWT_SECRET || 'dev_jwt_secret_change_me';

  return function verifyToken(req, res, next) {
    try {
      const header = req.headers.authorization;
      if (!header) return res.status(401).json({ message: 'Missing Authorization header' });
      const token = header.replace('Bearer ', '').trim();
      if (!token) return res.status(401).json({ message: 'Missing token' });
      let data;
      try {
        data = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      req.user = data;
      return next();
    } catch (err) {
      console.error('verifyToken middleware error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};
