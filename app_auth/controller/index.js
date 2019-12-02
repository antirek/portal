const URL = require("url").URL;
const config = require('config');

const apps = require('./../config/apps');
// const userDB = require('./../config/users');

const {AccountManager} = require('./../../app_desktop/accountManager');
const models = require('./../models/index');
const accountManager = new AccountManager({models});

const defaultURL = config.defaultURL;

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

const generatePayload = async ssoToken => {
  const globalSessionToken = intrmTokenCache[ssoToken][0];
  const appName = intrmTokenCache[ssoToken][1];
  const userEmail = sessionUser[globalSessionToken];
  // const user = userDB[userEmail];
  const user = await accountManager.findUserByEmailAndPassword(userEmail, false);
  console.log('user formated', user);
  const appPolicy = await accountManager.getAppPolicy(appName, user.userId);
  const account = await accountManager.getAccountById(user.accountId);
  //console.log('account', account);
  // if (!account) {return};


  const payload = {    
    userId: user.userId,
    accountId: user.accountId,
    account: {
      type: account.type,
      id: account.accountId,
      title: account.title,
    },
    user: {
      id: user.userId,
      accountId: user.ownAccountId,
      level: 'super.admin',
      role: appPolicy.role || null,
      email: user.email,
      name: user.name, 
    },
    urls: {
      start: 'http://desktop',
      support: 'http://support',
      flush: 'http://sso.flush',
    },
    // global SessionID for the logout functionality.
    globalSessionID: globalSessionToken
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
    // console.log('1');
    return res.status(403).json({ message: "Unauthorized" });
  }
  // checking if the token passed has been generated
  const payload = await generatePayload(ssoToken);
  console.log('payload', payload);  
  const token = await genJwtToken(payload);
  // console.log('token', token);
  // delete the itremCache key for no futher use,
  delete intrmTokenCache[ssoToken];
  return res.status(200).json({ token });
};


const doLogin = async (req, res, next) => {
  // do the validation with email and password
  // but the goal is not to do the same in this right now,
  // like checking with Datebase and all, we are skiping these section
  const { email, password } = req.body;
  const user = await accountManager.findUserByEmailAndPassword(email, password);
  if (!user) {
    return res.redirect("/simplesso/login?error=Invalid email and password");
  }

  /*
  if (!(userDB[email] && password === userDB[email].password)) {
    return res.redirect("/simplesso/login?error=Invalid email and password");
    //return res.status(404).json({ message: "Invalid email and password" });
  }
  */

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
  const { serviceURL, error, rnd } = req.query;
  // direct access will give the error inside new URL.
  if (serviceURL != null) {
    const url = new URL(serviceURL);
    if (alloweOrigin[url.origin] !== true) {
      return res
        .status(400)
        .json({ message: "Your are not allowed to access the sso-server" });
    }
  }
  if (req.session.user != null && serviceURL == null && rnd == null) {
    //return res.redirect("/");
    return res.redirect(defaultURL);
  }
  // if global session already has the user directly redirect with the token
  if (req.session.user != null && (serviceURL != null || rnd !=null)) {
    const followUrl = serviceURL ? serviceURL : defaultURL;
    
    const url = new URL(followUrl);
    const intrmid = encodedId();
    storeApplicationInCache(url.origin, req.session.user, intrmid);
    return res.redirect(`${followUrl}?ssoToken=${intrmid}`);
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
