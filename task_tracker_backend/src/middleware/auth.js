const jwt = require('jsonwebtoken');

/**
 * PUBLIC_INTERFACE
 * Express middleware that authenticates requests via Bearer JWT.
 *
 * Contract:
 * - Input: Authorization: Bearer <token>
 * - Output: req.user = { id, email, name }
 * - Errors: 401 if missing/invalid token
 * - Side effects: none
 */
function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'unauthorized', message: 'Missing Bearer token.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({
      error: 'server_misconfigured',
      message: 'JWT_SECRET missing from environment.',
    });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth };
