const express = require('express');
const { z } = require('zod');
const authController = require('../controllers/auth');
const { validateBody } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a user account and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Ada Lovelace" }
 *               email: { type: string, example: "ada@example.com" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       201: { description: User created }
 *       409: { description: Email already registered }
 */
router.post(
  '/register',
  validateBody(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
    })
  ),
  authController.register.bind(authController)
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     description: Authenticates a user and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "ada@example.com" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200: { description: Logged in }
 *       401: { description: Invalid credentials }
 */
router.post(
  '/login',
  validateBody(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })
  ),
  authController.login.bind(authController)
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current user
 *     description: Returns the current authenticated user from the JWT token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Unauthorized }
 */
router.get('/me', requireAuth, authController.me.bind(authController));

module.exports = router;
