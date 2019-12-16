
module.exports = ({
    apiKeyLookup,
    authHeader = 'X-API-Token',
    excludes = [],
    debug = false,
  }) => {
    const log = (...args) => {
      if (debug) console.log(args);
    };

    return (req, res, next) => {
      const apiKeyValue = req.get(authHeader);
      log('req.path', req.path);

      if (excludes.indexOf(req.path) !== -1) {
        log('auth not required');
        return next();
      }

      if (!apiKeyLookup(apiKeyValue)) {
        log('Invalid api_key:', apiKeyValue);
        res.status(401).send({
          error: 'Invalid API auth key',
          authHeader,
        });
      } else {
        log('auth verified good', apiKeyValue);
        return next();
      }
    };
  };