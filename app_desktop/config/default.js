const path = require('path');
const publicKeyPath = path.resolve(__dirname, "./keys/jwtPublic.key");

module.exports = {
  ssoServerJWTURL: "http://sso.ankuranand.com:3010/simplesso/",
  ssoAppToken: "l1Q7zkOL59cRqWBkQ12ZiGVW2DBL",
  keys: {
    publicKeyPath,
    jwtValidatityKey: "simple-sso-jwt-validatity",
  }
};
