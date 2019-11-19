const express = require("express");
const morgan = require("morgan");
const engine = require("ejs-mate");
const session = require("express-session");
const FileStore = require('session-file-store')(session);

const router = require("./router");
const apps = require('./config/apps');

const app = express();

app.use(session({
    store: new FileStore({}),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));
app.use((req, res, next) => {
  console.log(req.session);
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan("dev"));
app.engine("ejs", engine);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use("/simplesso", router);

app.get("/", (req, res, next) => {

  console.log('session', req.session);
  const auth = req.session.user ? true : false;

  res.render("index", {
    what: `SSO-Server ${req.session.user}`,
    auth,
    apps: auth ? apps : [],
    title: "SSO-Server | Home"
  });
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
