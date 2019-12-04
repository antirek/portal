const jwt = require("jsonwebtoken");
const fs = require('fs');
const url = require("url");
const fetch = require('node-fetch');

class SSOHelper {
  constructor ({
    publicKeyPath, 
    issuer, 
    ssoServerJWTURL,
    ssoAppToken,
  }) {
    this.publicKey = fs.readFileSync(publicKeyPath);
    this.issuer = issuer;
    this.ssoServerJWTURL = ssoServerJWTURL;
    this.ssoAppToken = ssoAppToken;
    this.ssoServerJWTURLVerifyToken = ssoServerJWTURL + 'verifytoken';
    this.ssoToken;
  }

  verifyJwtToken (token) {
    return new Promise((resolve, reject) => {
      // console.log('token', token)
      jwt.verify(
        token,
        this.publicKey,
        { 
          issuer: this.issuer, 
          algorithms: ["RS256"] 
        },
        (err, decoded) => {
          if (err) return reject(err);
          return resolve(decoded);
        }
      );
    });
  }


  __isAuthenticated (req, res) {
    const update = req.path === '/' ? true : false;

    const redirectURL = `${req.protocol}://${req.headers.host}/home`;
    if (req.session.user == null || update) {
      return res.redirect(
        this.ssoServerJWTURL + `login?serviceURL=${redirectURL}`
      );
    }
  }

  isAuthenticated () {
    return async (req, res, next) => {
      this.__isAuthenticated(req,res);
      next();
    };
  }


  checkSSORedirect () {
    //const that = this;

    return async (req, res, next) => {
      // check if the req has the queryParameter as ssoToken
      // and who is the referer.
      const { ssoToken } = req.query;
      
      if (ssoToken != null) {
        // to remove the ssoToken in query parameter redirect.
        this.ssoToken = ssoToken;
        //console.log('req url', req.url);
        //console.log('req original  url', req.originalUrl);
        //console.dir('req base url', req.baseUrl) 
        const redirectURL = url.parse(req.url).pathname;
        try {
          const response = await fetch(
            `${this.ssoServerJWTURLVerifyToken}?ssoToken=${ssoToken}`,
            {
              headers: {
                Authorization: "Bearer " + this.ssoAppToken,
              }
            }
          );
          const { token } = await response.json();
          const decoded = await this.verifyJwtToken(token);
          // now that we have the decoded jwt, use the,
          // global-session-id as the session id so that
          // the logout can be implemented with the global session.
          console.log('set valid user', decoded);
          req.session.user = decoded;
          req.updateToken = this.updateToken;
        } catch (err) {
          return next(err);
        }
        console.log('do redirect')
        return res.redirect(`${redirectURL}`);
      }

      this.__isAuthenticated(req, res);

      return next();
    };
  };

}

module.exports = { 
  SSOHelper,
};
