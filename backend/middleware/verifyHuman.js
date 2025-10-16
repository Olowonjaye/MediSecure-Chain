/**
 * backend/middleware/verifyHuman.js
 * Middleware to ensure the authenticated user has been verified by Human Passport.
 * Depends on req.user being set by authMiddleware (JWT auth).
 */
module.exports = function (deps) {
  const { dbFindUserById } = deps;

  return async function verifyHuman(req, res, next) {
    try {
      if (!req.user || !req.user.id) return res.status(401).json({ message: 'Unauthorized' });
      const user = await dbFindUserById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (!user.humanVerified) return res.status(403).json({ message: 'Human verification required' });
      return next();
    } catch (err) {
      console.error('verifyHuman middleware error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};
