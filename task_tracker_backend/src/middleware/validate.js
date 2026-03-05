const { ZodError } = require('zod');

/**
 * PUBLIC_INTERFACE
 * Validates req.body against a Zod schema.
 *
 * Contract:
 * - Input: zod schema
 * - Output: req.validatedBody assigned with parsed body
 * - Errors: 400 with structured issues
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body ?? {});
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'validation_error',
          issues: err.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        });
      }
      return next(err);
    }
  };
}

module.exports = { validateBody };
