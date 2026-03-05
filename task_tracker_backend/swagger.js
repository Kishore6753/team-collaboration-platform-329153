const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Team Task Tracker API',
      version: '1.0.0',
      description:
        'REST API for the Team Task Tracker application (auth, projects, tasks, comments, dashboard).',
    },
    tags: [
      { name: 'Health', description: 'Service health and status endpoints' },
      { name: 'Auth', description: 'Authentication and current-user endpoints' },
      { name: 'Projects', description: 'Project and membership management' },
      { name: 'Tasks', description: 'Task CRUD, assignment, and status updates' },
      { name: 'Comments', description: 'Task comments' },
      { name: 'Dashboard', description: 'Aggregated statistics and summaries' },
    ],
  },
  apis: ['./src/routes/*.js', './src/routes/**/*.js'], // include nested route modules
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
