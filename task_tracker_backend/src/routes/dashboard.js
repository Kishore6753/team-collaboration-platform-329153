const express = require('express');
const dashboardController = require('../controllers/dashboard');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard stats for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Dashboard stats }
 */
router.get('/', requireAuth, dashboardController.get.bind(dashboardController));

module.exports = router;
