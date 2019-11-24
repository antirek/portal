const jwt = require("jsonwebtoken");
const fs = require('fs');
const url = require("url");
const axios = require("axios");

const verifyJwtToken = ({token, publicKeyPath, issuer}) => {
  const publicKey = fs.readFileSync(publicKeyPath);
  return new Promise((resolve, reject) => {
    // console.log('token', token)
    jwt.verify(
      token,
      publicKey,
      { 
        issuer, 
        algorithms: ["RS256"] 
      },
      (err, decoded) => {
        if (err) return reject(err);
        return resolve(decoded);
      }
    );
  });
}

const isAuthenticated = ({ssoServerJWTURL}) => {
  return (req, res, next) => {
    // simple check to see if the user is authenicated or not,
    // if not redirect the user to the SSO Server for Login
    // pass the redirect URL as current URL
    // serviceURL is where the sso should redirect in case of valid user
    const redirectURL = `${req.protocol}://${req.headers.host}${req.path}`;
    if (req.session.user == null) {
      return res.redirect(
        ssoServerJWTURL + `login?serviceURL=${redirectURL}`
      );
    }
    next();
  };
}

const checkSSORedirect = ({
  ssoServerJWTURLVerifyToken,
  ssoAppToken,
  publicKeyPath,
  issuer,
}) => {
  return async function(req, res, next) {
    // check if the req has the queryParameter as ssoToken
    // and who is the referer.
    const { ssoToken } = req.query;
    
    if (ssoToken != null) {
      // to remove the ssoToken in query parameter redirect.
      const redirectURL = url.parse(req.url).pathname;
      try {
        const response = await axios.get(
          `${ssoServerJWTURLVerifyToken}?ssoToken=${ssoToken}`,
          {
            headers: {
              Authorization: "Bearer " + ssoAppToken,
            }
          }
        );
        const { token } = response.data;
        const decoded = await verifyJwtToken({token, publicKeyPath, issuer});
        // now that we have the decoded jwt, use the,
        // global-session-id as the session id so that
        // the logout can be implemented with the global session.
        console.log('set valid user', decoded);
        req.session.user = decoded;
      } catch (err) {
        return next(err);
      }
      console.log('do redirect')
      return res.redirect(`${redirectURL}`);
    }

    return next();
  };
};

module.exports = { 
  verifyJwtToken,
  isAuthenticated,
  checkSSORedirect,
};
