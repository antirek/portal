const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/myapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});

const accountSchema = new Schema({
    accountId: {
        type: String,
        index: {
            unique: true,
        },
    },
    title:  String,
    type: String,
    parentId: String,
});

const Account = mongoose.model('Account', accountSchema);

const userSchema = new Schema({
    userId: {
        type: String,
        index: {
            unique: true,
        },
    },
    name:  String,
    accountId: String,
    managedAccountId: String,
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

appPolicySchema.index({
    appId: 1, 
    userId: 1, 
    role: 1
}, {unique: true});

const AppPolicy = mongoose.model('AppPolicy', appPolicySchema);

module.exports = {
    Account,
    User,
    AppPolicy,
};