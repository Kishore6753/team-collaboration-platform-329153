const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/query');

function signUserToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET missing from environment.');
  }
  // Keep token payload minimal.
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, secret, {
    expiresIn: '7d',
  });
}

class AuthController {
  /**
   * PUBLIC_INTERFACE
   * Register a new user.
   */
  async register(req, res, next) {
    try {
      const { name, email, password } = req.validatedBody;

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, created_at`,
        [name, email.toLowerCase(), passwordHash],
        { op: 'auth.register' }
      );

      const user = result.rows[0];
      const token = signUserToken(user);

      return res.status(201).json({ user, token });
    } catch (err) {
      // unique violation
      if (err.code === '23505') {
        return res.status(409).json({ error: 'email_in_use', message: 'Email already registered.' });
      }
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Login with email/password.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.validatedBody;

      const result = await query(
        `SELECT id, name, email, password_hash
         FROM users
         WHERE email = $1`,
        [email.toLowerCase()],
        { op: 'auth.login' }
      );

      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({ error: 'invalid_credentials', message: 'Invalid login.' });
      }

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'invalid_credentials', message: 'Invalid login.' });
      }

      const token = signUserToken(user);
      return res.status(200).json({
        user: { id: user.id, name: user.name, email: user.email },
        token,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Get current authenticated user (token payload).
   */
  async me(req, res) {
    return res.status(200).json({ user: req.user });
  }
}

module.exports = new AuthController();
