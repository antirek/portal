module.exports = {
  swagger: '2.0',
  basePath: '/v1',
  schemes: ['http'],

  info: {
    title: 'manage api',
    version: '1.0.0',
  },

  securityDefinitions: {
    // # X-API-Key: abcdef12345
    APIKeyHeader: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Token',
    },
  },
  security: [
    {
      APIKeyHeader: [],
    },
  ],

  definitions: {
    Error: {
      additionalProperties: true,
    },
  },
  // paths are derived from args.routes.  These are filled in by fs-routes.
  paths: {},
};