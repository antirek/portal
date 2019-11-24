const express = require("express");
const morgan = require("morgan");
const session = require("express-session");

const isAuthenticated = require("./isAuthenticated");
const checkSSORedirect = require("./checkSSORedirect");

const apps = require('./../app_auth/config/apps');

const app = express();
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan("dev"));
app.set("views", __dirname + "/views");
app.set("view engine", "pug");
app.use(checkSSORedirect());

app.get("/", isAuthenticated, (req, res, next) => {
  res.render("index", {
    what: `SSO-Desktop One ${JSON.stringify(req.session.user, null, 2)}`,
    title: "SSO-Desktop",
  });
});

app.get("/list", isAuthenticated, (req, res, next) => {
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
