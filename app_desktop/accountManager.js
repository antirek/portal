
class AccountManager {
  constructor ({models}) {
    this.models = models;
  }

  _formatAccount (account) {
    return {
      title: account.title,
      accountId: account.accountId,
      type: account.type,
    }
  }

  async createAccount(obj) {
    const acc = await this.models.Account(obj);
    if (!acc) return;
    return this._formatAccount(acc);
  }

  async getAccounts() {
    const accounts = await this.models.Account.find();
    if (!accounts) return;
    return accounts.map(acc => this._formatAccount(acc));
  }

  _formatUser (user) {
    return {
      userId: user.userId,
      name: user.name,
      accountId: user.managedAccountId ? user.managedAccountId : user.accountId,
      ownAccountId: user.accountId,
    }
  }

  async getUsers(accountId) {
    const users = await this.models.User.find({accountId});
    if (!users) return;
    return users.map(user => this._formatUser(user));
  }

  async changeAccount(userId, accountId) {
    const user = await this.models.User.findOne({userId});
    user.managedAccountId = accountId;
    const userSaved = await user.save();
    return this._formatUser(userSaved);
  }
}

module.exports = {
    AccountManager,
}