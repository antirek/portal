const { createApp } = require("./app");
const PORT = 3014;

const path = require('path');

const models = require('./../app_auth/models/index');
const {AccountManager} = require('./../app_desktop/accountManager');

const accountManager = new AccountManager({models});

const app = createApp({
  desciption: 'Manage API',
  apiDoc: require('./api/api-doc.js'),
  paths: path.resolve(__dirname, 'api/api-routes'),
  dependencies: {
    accountManager,
  },
});

app.listen(PORT, () => {
  console.info(`sso-server listening on port ${PORT}`);
});
