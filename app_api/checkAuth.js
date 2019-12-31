
module.exports = ({
    apiKeyLookup,
    authHeader = 'X-API-Token',
    excludes = [],
    debug = false,
  }) => {
    const log = (...args) => {
      if (debug) console.log(args);
    };

    return async (req, res, next) =>{
      const apiKeyValue = req.get(authHeader);
      log('req.path', req.path);

      if (excludes.indexOf(req.path) !== -1) {
        log('auth not required');
        return next();
      }
      const result = await apiKeyLookup(apiKeyValue)
      console.log('result');

      if (!result) {
        log('Invalid api_key:', apiKeyValue);
        res.status(401).send({
          error: 'Invalid API auth key',
          authHeader,
        });
      } else {
        log('auth verified good', apiKeyValue);
        req.sessionDataL = JSON.parse(result);
        return next();
      }
    };
  };