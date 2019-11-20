const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
const path = require('path');
const favicon = require('serve-favicon')

const router = require("./router");
const apps = require('./config/apps');

const app = express();

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use('/static', express.static(path.join(__dirname, 'node_modules')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan("dev"));
app.set("views", __dirname + "/views");
app.set("view engine", "pug");

app.use("/simplesso", router);

app.get("/", (req, res, next) => {
  const auth = req.session.user ? true : false;
  const defaultURL = 'http://consumer.ankuranand.in:3020/';
  if (auth) {
    console.log('auth true, redirect to', defaultURL)
    res.redirect(defaultURL);
  } else {
    console.log('auth false, redirect to login');
    res.redirect('/simplesso/login');
  }
  /*
  res.render("index", {
    what: `SSO-Server ${req.session.user}`,
    auth,
    apps: auth ? apps : [],
    title: "SSO-Server | Home"
  });
  */
});

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
