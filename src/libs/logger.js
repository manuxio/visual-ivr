export default (req, note, severity = 'debug', tracking = null) => {
  const {
    ip,
    method,
    body,
    query,
    dbConnection,
    config,
    originalUrl
  } = req;
  const realparams = method === 'POST' ? body : query;
  const urlParams = req.params ? JSON.stringify(req.params) : ``;
  return dbConnection
  .query(`INSERT INTO ${config.logTable} (address, method, params, urlParams, note, url, severity, tracking) VALUES (
    ${dbConnection.escape(ip)},
    ${dbConnection.escape(method)},
    ${dbConnection.escape(JSON.stringify(realparams))},
    ${dbConnection.escape(urlParams)},
    ${dbConnection.escape(note)},
    ${dbConnection.escape(originalUrl)},
    ${dbConnection.escape(severity)},
    ${dbConnection.escape(tracking)}
  )`)
  .then(
    (result) => {
      return Promise.resolve();
    },
    (e) => {
      console.error('Unable to write into logs', e);
      return Promise.resolve();
    }
  );
}
