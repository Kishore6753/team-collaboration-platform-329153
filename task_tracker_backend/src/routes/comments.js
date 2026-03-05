const express = require('express');
const { z } = require('zod');
const commentsController = require('../controllers/comments');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * /comments:
 *   get:
 *     tags: [Comments]
 *     summary: List comments for a task (requires taskId query param)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Comment list }
 */
router.get('/', requireAuth, commentsController.list.bind(commentsController));

/**
 * @swagger
 * /comments:
 *   post:
 *     tags: [Comments]
 *     summary: Create a comment on a task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskId, body]
 *             properties:
 *               taskId: { type: string }
 *               body: { type: string, example: "Looks good to me." }
 *     responses:
 *       201: { description: Comment created }
 */
router.post(
  '/',
  requireAuth,
  validateBody(z.object({ taskId: z.string().min(1), body: z.string().min(1) })),
  commentsController.create.bind(commentsController)
);

module.exports = router;
