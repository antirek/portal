const URL = require("url").URL;
const apps = require('./../config/apps');
const userDB = require('./../config/users');

const defaultURL = 'http://desktop.ankuranand.com:3030/';

const { genJwtToken } = require("./jwt_helper");
const { 
  encodedId, 
  fromAuthHeaderAsBearerToken,
} = require('./auth_helper');


const appTokenFromRequest = fromAuthHeaderAsBearerToken();

// app token to validate the request is coming from the authenticated server only.

const appTokenDB = {};
apps.map(app => {
  appTokenDB[app.id] = app.token;
})

const alloweOrigin = {}
apps.map(app => {
  alloweOrigin[app.url] = true;
})

const originAppName = {};
apps.map(app => {
  originAppName[app.url] = app.id;
});


// these token are for the validation purpose
const intrmTokenCache = {};
// A temporary cahce to store all the application that has login using the current session.
// It can be useful for variuos audit purpose
const sessionUser = {};
const sessionApp = {};


const fillIntrmTokenCache = (origin, id, intrmToken) => {
  intrmTokenCache[intrmToken] = [id, originAppName[origin]];
};
const storeApplicationInCache = (origin, id, intrmToken) => {
  if (sessionApp[id] == null) {
    sessionApp[id] = {
      [originAppName[origin]]: true
    };
    fillIntrmTokenCache(origin, id, intrmToken);
  } else {
    sessionApp[id][originAppName[origin]] = true;
    fillIntrmTokenCache(origin, id, intrmToken);
  }
  console.log('session app:', { ...sessionApp }, 
              'session user:', { ...sessionUser },
              'intermediate token:', { ...intrmTokenCache });
};

const generatePayload = ssoToken => {
  const globalSessionToken = intrmTokenCache[ssoToken][0];
  const appName = intrmTokenCache[ssoToken][1];
  const userEmail = sessionUser[globalSessionToken];
  const user = userDB[userEmail];
  const appPolicy = user.appPolicy[appName];
  const email = appPolicy.shareEmail === true ? userEmail : undefined;
  const payload = {
    ...{ ...appPolicy },
    ...{
      email,
      shareEmail: undefined,
      uid: user.userId,
      accountId: user.accountId || '0',
      // global SessionID for the logout functionality.
      globalSessionID: globalSessionToken
    }
  };
  return payload;
};

const verifySsoToken = async (req, res, next) => {
  const appToken = appTokenFromRequest(req);
  const { ssoToken } = req.query;
  // if the application token is not present or ssoToken request is invalid
  // if the ssoToken is not present in the cache some is
  // smart.
  if (
    appToken == null ||
    ssoToken == null ||
    intrmTokenCache[ssoToken] == null
  ) {
    return res.status(400).json({ message: "badRequest" });
  }

  // if the appToken is present and check if it's valid for the application
  const appName = intrmTokenCache[ssoToken][1];
  const globalSessionToken = intrmTokenCache[ssoToken][0];
  // If the appToken is not equal to token given during the sso app registraion or later stage than invalid
  if (
    appToken !== appTokenDB[appName] ||
    sessionApp[globalSessionToken][appName] !== true
  ) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  // checking if the token passed has been generated
  const payload = generatePayload(ssoToken);

  const token = await genJwtToken(payload);
  console.log('token', token);
  // delete the itremCache key for no futher use,
  delete intrmTokenCache[ssoToken];
  return res.status(200).json({ token });
};


const doLogin = (req, res, next) => {
  // do the validation with email and password
  // but the goal is not to do the same in this right now,
  // like checking with Datebase and all, we are skiping these section
  const { email, password } = req.body;
  if (!(userDB[email] && password === userDB[email].password)) {
    return res.redirect("/simplesso/login?error=Invalid email and password");
    //return res.status(404).json({ message: "Invalid email and password" });
  }

  // else redirect
  const { serviceURL } = req.query;
  const id = encodedId();
  req.session.user = id;
  sessionUser[id] = email;
  if (serviceURL == null) {
    // return res.redirect("/");
    return res.redirect(defaultURL);
  }
  const url = new URL(serviceURL);
  const intrmid = encodedId();
  storeApplicationInCache(url.origin, id, intrmid);
  return res.redirect(`${serviceURL}?ssoToken=${intrmid}`);
};

const doLogout = (req, res, next) => {
  const {globalSessionToken} = req.query;
  delete sessionApp[globalSessionToken];
  delete sessionUser[globalSessionToken];

  console.log('session app:', { ...sessionApp },
              'session user:', { ...sessionUser },
              'intermediate token:', { ...intrmTokenCache });

  req.session.destroy();
  res.redirect('/');
}

const login = (req, res, next) => {
  // The req.query will have the redirect url where we need to redirect after successful
  // login and with sso token.
  // This can also be used to verify the origin from where the request has came in
  // for the redirection
  const { serviceURL, error } = req.query;
  // direct access will give the error inside new URL.
  if (serviceURL != null) {
    const url = new URL(serviceURL);
    if (alloweOrigin[url.origin] !== true) {
      return res
        .status(400)
        .json({ message: "Your are not allowed to access the sso-server" });
    }
  }
  if (req.session.user != null && serviceURL == null) {
    //return res.redirect("/");
    return res.redirect(defaultURL);
  }
  // if global session already has the user directly redirect with the token
  if (req.session.user != null && serviceURL != null) {
    const url = new URL(serviceURL);
    const intrmid = encodedId();
    storeApplicationInCache(url.origin, req.session.user, intrmid);
    return res.redirect(`${serviceURL}?ssoToken=${intrmid}`);
  }

  return res.render("login", {
    title: "SSO-Server | Login",
    error,
  });
};

module.exports = Object.assign({}, { 
  doLogin,
  login,
  doLogout,
  verifySsoToken,
});
