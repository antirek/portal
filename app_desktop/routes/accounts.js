
const express = require('express');

const models = require('./../../app_auth/models/index');

const router = express.Router();

router.get('/', async (req, res) => {
    const accounts = await models.Account.find();
    res.render('index', {accounts});
})


module.exports = {
    router,
}