const jwt = require("jsonwebtoken");
const fs = require('fs');

const { publicKeyPath } = require("config").keys;
const publicKey = fs.readFileSync(publicKeyPath);

const ISSUER = "simple-sso";
const verifyJwtToken = token =>
  new Promise((resolve, reject) => {
    // console.log('token', token)
    jwt.verify(
      token,
      publicKey,
      { issuer: ISSUER, algorithms: ["RS256"] },
      (err, decoded) => {
        if (err) return reject(err);
        return resolve(decoded);
      }
    );
  });
module.exports = Object.assign({}, { verifyJwtToken });
