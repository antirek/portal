const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const openapi = require('express-openapi');

const checkApikey = require('./checkAuth');

const createApp = (api) => {
  const app = express();

  app.use(bodyParser.json());
  app.use(cors());

  app.use(checkApikey({
    apiKeyLookup: ()=> {
      return false;
    },
    authHeader: 'X-API-Token',
    excludes: ['/v1/api'],
    debug: true,
  }));

  openapi.initialize({
    apiDoc: api.apiDoc, // require('./api-doc.js'),
    app: app,
    docsPath: '/api',
    paths: api.paths, // path.resolve(__dirname, 'api-routes'),
    dependencies: api.dependencies,
  });

  app.get('/', (req, res) => {
    res.send(api.description || '');
  });

  return app;
};

exports.createApp = createApp;