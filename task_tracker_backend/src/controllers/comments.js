const { query } = require('../db/query');

async function assertTaskProjectAccess({ taskId, userId }) {
  const result = await query(
    `SELECT 1
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
     WHERE t.id = $1 AND (p.owner_user_id = $2 OR pm.user_id = $2)`,
    [taskId, userId],
    { op: 'comments.assertTaskProjectAccess' }
  );
  return result.rows.length > 0;
}

class CommentsController {
  /**
   * PUBLIC_INTERFACE
   * List comments for a task.
   */
  async list(req, res, next) {
    try {
      const userId = req.user.id;
      const { taskId } = req.query;
      if (!taskId) {
        return res.status(400).json({ error: 'validation_error', message: 'taskId is required.' });
      }

      const ok = await assertTaskProjectAccess({ taskId, userId });
      if (!ok) {
        return res.status(403).json({ error: 'forbidden', message: 'No access to this task.' });
      }

      const result = await query(
        `SELECT c.id, c.task_id, c.user_id, c.body, c.created_at,
                u.name as user_name, u.email as user_email
         FROM comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.task_id = $1
         ORDER BY c.created_at ASC`,
        [taskId],
        { op: 'comments.list' }
      );

      return res.status(200).json({ comments: result.rows });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Create a comment on a task.
   */
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { taskId, body } = req.validatedBody;

      const ok = await assertTaskProjectAccess({ taskId, userId });
      if (!ok) {
        return res.status(403).json({ error: 'forbidden', message: 'No access to this task.' });
      }

      const result = await query(
        `INSERT INTO comments (task_id, user_id, body)
         VALUES ($1, $2, $3)
         RETURNING id, task_id, user_id, body, created_at`,
        [taskId, userId, body],
        { op: 'comments.create' }
      );

      return res.status(201).json({ comment: result.rows[0] });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new CommentsController();
