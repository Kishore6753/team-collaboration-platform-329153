const express = require('express');
const { z } = require('zod');
const projectsController = require('../controllers/projects');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

/**
 * @swagger
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List projects accessible to the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Projects list }
 *       401: { description: Unauthorized }
 */
router.get('/', requireAuth, projectsController.list.bind(projectsController));

/**
 * @swagger
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Website Redesign" }
 *               description: { type: string, example: "Q2 redesign tasks" }
 *     responses:
 *       201: { description: Project created }
 */
router.post(
  '/',
  requireAuth,
  validateBody(z.object({ name: z.string().min(1), description: z.string().optional() })),
  projectsController.create.bind(projectsController)
);

/**
 * @swagger
 * /projects/{projectId}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Project }
 *       404: { description: Not found }
 */
router.get('/:projectId', requireAuth, projectsController.get.bind(projectsController));

/**
 * @swagger
 * /projects/{projectId}:
 *   put:
 *     tags: [Projects]
 *     summary: Update a project (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: Updated project }
 */
router.put(
  '/:projectId',
  requireAuth,
  validateBody(z.object({ name: z.string().min(1).optional(), description: z.string().optional() })),
  projectsController.update.bind(projectsController)
);

/**
 * @swagger
 * /projects/{projectId}/members:
 *   post:
 *     tags: [Projects]
 *     summary: Add/update a project member (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "teammate@example.com" }
 *               role: { type: string, example: "member" }
 *     responses:
 *       200: { description: Member added/updated }
 */
router.post(
  '/:projectId/members',
  requireAuth,
  validateBody(z.object({ email: z.string().email(), role: z.string().optional() })),
  projectsController.addMember.bind(projectsController)
);

module.exports = router;
