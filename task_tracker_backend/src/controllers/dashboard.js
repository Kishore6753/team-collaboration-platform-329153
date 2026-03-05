const { query } = require('../db/query');

class DashboardController {
  /**
   * PUBLIC_INTERFACE
   * Get dashboard stats for the current user.
   *
   * Returns counts by status for tasks assigned to the user, plus recent tasks.
   */
  async get(req, res, next) {
    try {
      const userId = req.user.id;

      const statusCounts = await query(
        `SELECT status, COUNT(*)::int as count
         FROM tasks
         WHERE assignee_user_id = $1
         GROUP BY status`,
        [userId],
        { op: 'dashboard.statusCounts' }
      );

      const recentTasks = await query(
        `SELECT id, project_id, title, status, priority, due_date, updated_at
         FROM tasks
         WHERE assignee_user_id = $1
         ORDER BY updated_at DESC
         LIMIT 10`,
        [userId],
        { op: 'dashboard.recentTasks' }
      );

      return res.status(200).json({
        stats: {
          assignedToMeByStatus: statusCounts.rows.reduce((acc, r) => {
            acc[r.status] = r.count;
            return acc;
          }, {}),
          recentTasks: recentTasks.rows,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new DashboardController();
