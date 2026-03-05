const express = require('express');
const { z } = require('zod');
const tasksController = require('../controllers/tasks');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks (requires projectId query param)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task list }
 */
router.get('/', requireAuth, tasksController.list.bind(tasksController));

/**
 * @swagger
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, title]
 *             properties:
 *               projectId: { type: string }
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, example: "todo" }
 *               priority: { type: string, example: "medium" }
 *               assigneeUserId: { type: string, nullable: true }
 *               dueDate: { type: string, nullable: true, example: "2026-03-20" }
 *     responses:
 *       201: { description: Task created }
 */
router.post(
  '/',
  requireAuth,
  validateBody(
    z.object({
      projectId: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(['todo', 'in_progress', 'done', 'blocked']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      assigneeUserId: z.string().uuid().nullable().optional(),
      dueDate: z.string().nullable().optional(),
    })
  ),
  tasksController.create.bind(tasksController)
);

/**
 * @swagger
 * /tasks/{taskId}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string }
 *               priority: { type: string }
 *               assigneeUserId: { type: string, nullable: true }
 *               dueDate: { type: string, nullable: true }
 *     responses:
 *       200: { description: Task updated }
 */
router.patch(
  '/:taskId',
  requireAuth,
  validateBody(
    z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.enum(['todo', 'in_progress', 'done', 'blocked']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      assigneeUserId: z.string().uuid().nullable().optional(),
      dueDate: z.string().nullable().optional(),
    })
  ),
  tasksController.update.bind(tasksController)
);

module.exports = router;
