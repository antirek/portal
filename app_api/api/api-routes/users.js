module.exports = () => {
  /**
  *
  * @param {Object} req
  * @param {Object} res
  */
  const get = (req, res) => {
    console.log('request query', req.query);
    console.log('request params', req.params);

    res.json({status: 'OK'});
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