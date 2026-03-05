const express = require('express');
const healthController = require('../controllers/health');

const authRoutes = require('./auth');
const projectRoutes = require('./projects');
const taskRoutes = require('./tasks');
const commentRoutes = require('./comments');
const dashboardRoutes = require('./dashboard');

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Health endpoint
 *     responses:
 *       200:
 *         description: Service health check passed
 */
router.get('/', healthController.check.bind(healthController));

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
