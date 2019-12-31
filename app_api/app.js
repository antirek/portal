const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const openapi = require('express-openapi');
const redis = require('redis');

const redisClient = redis.createClient();

const checkApikey = require('./checkAuth');

const apiKeyLookup = async (key) => {
  return new Promise((resolve, reject) => {
    console.log('key', key)
    redisClient.get(key, (err, res) => {
      console.log('data', res);
      resolve(res);
    });
  })
}

const createApp = (api) => {
  const app = express();

  app.use(bodyParser.json());
  app.use(cors());

  app.use(checkApikey({
    apiKeyLookup,
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