module.exports = (accountManager) => {
  /**
  *
  * @param {Object} req
  * @param {Object} res
  */
  const get = async (req, res) => {
    console.log('request query', req.query);
    console.log('request params', req.params);
    console.log('req session data', req.sessionDataL);
    const accountId = req.sessionDataL.accountId;
    const users = await accountManager.getUsers(accountId);
    res.json({users});
  };

  get.apiDoc = {
    summary: 'список',
    description: 'users json',
    tags: ['account'],
    consumes: [
      'application/json',
    ],
    parameters: [
    ],
    produces: [
      'application/json',
    ],
    responses: {
      200: {
        description: 'success response',
      },
      default: {
        description: 'Unexpected error',
        schema: {
          $ref: '#/definitions/Error',
        },
      },
    },
  };

  return {
    get,
  };
};