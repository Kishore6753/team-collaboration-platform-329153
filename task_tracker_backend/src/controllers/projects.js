const { query } = require('../db/query');

class ProjectsController {
  /**
   * PUBLIC_INTERFACE
   * List projects the current user created or is a member of.
   *
   * Note: the DB schema uses `projects.created_by`. For API compatibility we
   * expose this as `owner_user_id`.
   */
  async list(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await query(
        `SELECT DISTINCT p.id,
                p.name,
                p.description,
                p.created_by AS owner_user_id,
                p.created_at
         FROM projects p
         LEFT JOIN project_memberships pm ON pm.project_id = p.id
         WHERE p.created_by = $1 OR pm.user_id = $1
         ORDER BY p.created_at DESC`,
        [userId],
        { op: 'projects.list' }
      );

      return res.status(200).json({ projects: result.rows });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Create a project created by current user and add them as an admin member.
   */
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, description } = req.validatedBody;

      const created = await query(
        `INSERT INTO projects (created_by, name, description)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, created_by AS owner_user_id, created_at`,
        [userId, name, description ?? null],
        { op: 'projects.create' }
      );

      const project = created.rows[0];

      await query(
        `INSERT INTO project_memberships (project_id, user_id, role)
         VALUES ($1, $2, 'admin')
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [project.id, userId],
        { op: 'projects.create.add_member' }
      );

      return res.status(201).json({ project });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Get a single project if the user has access.
   */
  async get(req, res, next) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      const result = await query(
        `SELECT p.id,
                p.name,
                p.description,
                p.created_by AS owner_user_id,
                p.created_at
         FROM projects p
         LEFT JOIN project_memberships pm ON pm.project_id = p.id AND pm.user_id = $2
         WHERE p.id = $1 AND (p.created_by = $2 OR pm.user_id = $2)`,
        [projectId, userId],
        { op: 'projects.get' }
      );

      const project = result.rows[0];
      if (!project) {
        return res.status(404).json({ error: 'not_found', message: 'Project not found.' });
      }

      return res.status(200).json({ project });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Update a project (creator only).
   */
  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { name, description } = req.validatedBody;

      const result = await query(
        `UPDATE projects
         SET name = COALESCE($2, name),
             description = COALESCE($3, description)
         WHERE id = $1 AND created_by = $4
         RETURNING id, name, description, created_by AS owner_user_id, created_at`,
        [projectId, name ?? null, description ?? null, userId],
        { op: 'projects.update' }
      );

      const project = result.rows[0];
      if (!project) {
        return res.status(404).json({
          error: 'not_found_or_forbidden',
          message: 'Project not found or you are not the owner.',
        });
      }

      return res.status(200).json({ project });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Add a member to a project (currently creator only).
   */
  async addMember(req, res, next) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { email, role } = req.validatedBody;

      // Check ownership (simple for now).
      const ownerCheck = await query(
        'SELECT id FROM projects WHERE id = $1 AND created_by = $2',
        [projectId, userId],
        { op: 'projects.addMember.ownerCheck' }
      );
      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'forbidden', message: 'Owner access required.' });
      }

      const userResult = await query(
        'SELECT id, name, email FROM users WHERE email = $1',
        [email.toLowerCase()],
        { op: 'projects.addMember.findUser' }
      );
      const member = userResult.rows[0];
      if (!member) {
        return res.status(404).json({ error: 'not_found', message: 'User not found.' });
      }

      await query(
        `INSERT INTO project_memberships (project_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
        [projectId, member.id, role || 'member'],
        { op: 'projects.addMember.insert' }
      );

      return res.status(200).json({ member: { ...member, role: role || 'member' } });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new ProjectsController();
