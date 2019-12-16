const { createApp } = require("./app");
const PORT = 3014;

const path = require('path');


const app = createApp({
  desciption: 'Manage API',
  apiDoc: require('./api/api-doc.js'),
  paths: path.resolve(__dirname, 'api/api-routes'),
  dependencies: {},
});

app.listen(PORT, () => {
  console.info(`sso-server listening on port ${PORT}`);
});
