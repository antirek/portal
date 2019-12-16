const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
const config = require("config");
const path = require('path');
const favicon = require('serve-favicon');

const { SSOHelper } = require("./../app_auth/sso_helper");

const apps = require('./../app_auth/config/apps');
const models = require('./../app_auth/models/index');

const accountsRouter = require('./routes/accounts');
const {AccountManager} = require('./accountManager');
const accountManager = new AccountManager({models});
const app = express();

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 60000,
    }
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const sso = new SSOHelper({
  publicKeyPath: config.get('keys.publicKeyPath'),
  ssoServerJWTURL: config.get("ssoServerJWTURL"),
  issuer: config.get('issuer'),
  ssoAppToken: config.get('ssoAppToken'),
})

app.use(morgan("dev"));
app.set("views", __dirname + "/views");
app.set("view engine", "pug");
app.use('/static',
    express['static'](path.join(__dirname, './node_modules')));
app.use('/public',
    express['static'](path.join(__dirname, '/public')));


app.use(sso.checkSSORedirect());

app.use('/accounts', sso.isAuthenticated(), accountsRouter.router);

app.get("/", sso.isAuthenticated(), async (req, res, next) => {
  const accounts = await accountManager.getAccounts();
  res.render("boilerplate", {
    // what: `SSO-Desktop One ${JSON.stringify(req.session.user, null, 2)}`,
    what: req.session.user,
    title: "SSO-Desktop",
    apps,
    accounts,
  });
});


app.get("/home", sso.isAuthenticated(), async (req, res, next) => {
  const accounts = await accountManager.getAccounts();
  res.render("boilerplate", {
    // what: `SSO-Desktop One ${JSON.stringify(req.session.user, null, 2)}`,
    what: req.session.user,
    title: "SSO-Desktop",
    apps,
    accounts,
  });
});

app.get("/list", sso.isAuthenticated(), (req, res, next) => {
  res.render("index", {
    what: `SSO-Desktop One ${JSON.stringify(req.session.user, null, 2)}`,
    title: "SSO-Desktop",
    apps,
  });
});

app.get('/logout', (req, res, next) => {
  console.log('user', req.session.user);
  const globalSessionToken = req.session.user.globalSessionID;
  const redirectURL = `${req.protocol}://${req.headers.host}`;
  req.session.destroy();
  res.redirect(
    "http://sso.ankuranand.com:3010/simplesso/logout?globalSessionToken=" + 
    globalSessionToken + "&serviceURL=" + redirectURL
  );
})

app.use((req, res, next) => {
  // catch 404 and forward to error handler
  const err = new Error("Resource Not Found");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  console.error({
    message: err.message,
    error: err
  });
  const statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";

  if (statusCode === 500) {
    message = "Internal Server Error";
  }
  res.status(statusCode).json({ message });
});

module.exports = app;
