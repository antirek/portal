const url = require("url");
const axios = require("axios");
const config = require('config');
const { URL } = url;
const { verifyJwtToken } = require("./jwt_verify");
const validReferOrigin = "http://sso.ankuranand.com:3010";
//const ssoServerJWTURL = "http://sso.ankuranand.com:3010/simplesso/verifytoken";
const ssoServerJWTURLVerifyToken = config.get("ssoServerJWTURL") + 'verifytoken';

const ssoRedirect = () => {
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
              Authorization: "Bearer " + config.get("ssoAppToken"),
            }
          }
        );
        const { token } = response.data;
        const decoded = await verifyJwtToken(token);
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

module.exports = ssoRedirect;
