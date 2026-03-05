const { query } = require('../db/query');

async function assertProjectAccess({ projectId, userId }) {
  const result = await query(
    `SELECT 1
     FROM projects p
     LEFT JOIN project_memberships pm ON pm.project_id = p.id AND pm.user_id = $2
     WHERE p.id = $1 AND (p.created_by = $2 OR pm.user_id = $2)`,
    [projectId, userId],
    { op: 'tasks.assertProjectAccess' }
  );
  return result.rows.length > 0;
}

class TasksController {
  /**
   * PUBLIC_INTERFACE
   * List tasks in a project.
   */
  async list(req, res, next) {
    try {
      const userId = req.user.id;
      const { projectId } = req.query;

      if (!projectId) {
        return res.status(400).json({ error: 'validation_error', message: 'projectId is required.' });
      }

      const ok = await assertProjectAccess({ projectId, userId });
      if (!ok) {
        return res.status(403).json({ error: 'forbidden', message: 'No access to this project.' });
      }

      const result = await query(
        `SELECT t.id,
                t.project_id,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.assigned_to AS assignee_user_id,
                t.due_date,
                t.created_by AS created_by_user_id,
                t.created_at,
                t.updated_at
         FROM tasks t
         WHERE t.project_id = $1
         ORDER BY t.created_at DESC`,
        [projectId],
        { op: 'tasks.list' }
      );

      return res.status(200).json({ tasks: result.rows });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Create a task in a project.
   */
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { projectId, title, description, status, priority, assigneeUserId, dueDate } =
        req.validatedBody;

      const ok = await assertProjectAccess({ projectId, userId });
      if (!ok) {
        return res.status(403).json({ error: 'forbidden', message: 'No access to this project.' });
      }

      const result = await query(
        `INSERT INTO tasks (
            project_id, title, description, status, priority, assigned_to, due_date, created_by
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id,
                   project_id,
                   title,
                   description,
                   status,
                   priority,
                   assigned_to AS assignee_user_id,
                   due_date,
                   created_by AS created_by_user_id,
                   created_at,
                   updated_at`,
        [
          projectId,
          title,
          description ?? null,
          status ?? 'todo',
          priority ?? 'medium',
          assigneeUserId ?? null,
          dueDate ?? null,
          userId,
        ],
        { op: 'tasks.create' }
      );

      return res.status(201).json({ task: result.rows[0] });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Update task fields (status/priority/title/description/assignee/dueDate).
   */
  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const { taskId } = req.params;
      const { title, description, status, priority, assigneeUserId, dueDate } = req.validatedBody;

      // Determine project access via task -> project.
      const taskLookup = await query(
        'SELECT project_id FROM tasks WHERE id = $1',
        [taskId],
        { op: 'tasks.update.lookup' }
      );
      const row = taskLookup.rows[0];
      if (!row) {
        return res.status(404).json({ error: 'not_found', message: 'Task not found.' });
      }

      const ok = await assertProjectAccess({ projectId: row.project_id, userId });
      if (!ok) {
        return res.status(403).json({ error: 'forbidden', message: 'No access to this project.' });
      }

      const updated = await query(
        `UPDATE tasks
         SET title = COALESCE($2, title),
             description = COALESCE($3, description),
             status = COALESCE($4, status),
             priority = COALESCE($5, priority),
             assigned_to = COALESCE($6, assigned_to),
             due_date = COALESCE($7, due_date)
         WHERE id = $1
         RETURNING id,
                   project_id,
                   title,
                   description,
                   status,
                   priority,
                   assigned_to AS assignee_user_id,
                   due_date,
                   created_by AS created_by_user_id,
                   created_at,
                   updated_at`,
        [
          taskId,
          title ?? null,
          description ?? null,
          status ?? null,
          priority ?? null,
          assigneeUserId ?? null,
          dueDate ?? null,
        ],
        { op: 'tasks.update' }
      );

      return res.status(200).json({ task: updated.rows[0] });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new TasksController();
