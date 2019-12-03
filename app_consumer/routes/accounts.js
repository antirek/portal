const express = require('express');

const models = require('./../../app_auth/models/index');
const {AccountManager} = require('./../accountManager');

const router = express.Router();
const accountManager = new AccountManager({models});

router.get('/', async (req, res) => {
  const accounts = await accountManager.getAccounts();
  res.render('index', {
      accounts,
  });
})

router.get('/users/:accountId', async (req, res) => {
  const accountId = req.params.accountId;
  const users = await accountManager.getUsers(accountId);
  res.render('index', {
      users,
  })
})


router.get('/change/:accountId', async (req, res) => {
  const accountId = req.params.accountId;
  console.log('account id', accountId);
  const user = req.session.user.user;
  console.log('user', user);
  const result = await accountManager.changeAccount(user.id, accountId);
  //const sso_helper = require('./../sso_helper');  

  res.redirect('http://sso.ankuranand.com:3010/simplesso/login?rnd=' + Math.random(4));
});

module.exports = {
  router,
}