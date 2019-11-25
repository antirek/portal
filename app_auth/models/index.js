const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/myapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const accountSchema = new Schema({
    accountId: String,
    title:  String,
    type: String,
});

const Account = mongoose.model('Account', accountSchema);

const userSchema = new Schema({
    userId: String,
    name:  String,
    accountId: String,
    email: String,
    password: String,
    level: String,
});

const User = mongoose.model('User', userSchema);

const appPolicySchema = new Schema({
    appId: String,
    userId: String,
    role: String,
});

const AppPolicy = mongoose.model('AppPolicy', appPolicySchema);

module.exports = {
    Account,
    User,
    AppPolicy,
};