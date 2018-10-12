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
  const { session } = req;
  const dbRecord = session && session.dbRecord ? session.dbRecord : null;
  if (tracking === null) {
    tracking = session && session.code ? session.code : null;
  }
  const idcliente = dbRecord ? dbRecord.idcliente : null;
  const mandato = dbRecord ? dbRecord.mandato : null;
  const idcontratto = dbRecord ? dbRecord.idcontratto : null;
  const codicedebitore = dbRecord ? dbRecord.codicedebitore : null;
  const sessionid = req.sessionID ? req.sessionID : null;

  const realparams = method === 'POST' ? body : query;
  const urlParams = req.params ? JSON.stringify(req.params) : ``;
  return dbConnection
  .query(`INSERT INTO ${config.logTable} (address, method, params, urlParams, note, url, severity, tracking, idcliente, mandato, idcontratto, codicedebitore, sessionid) VALUES (
    ${dbConnection.escape(ip)},
    ${dbConnection.escape(method)},
    ${dbConnection.escape(JSON.stringify(realparams))},
    ${dbConnection.escape(urlParams)},
    ${dbConnection.escape(note)},
    ${dbConnection.escape(originalUrl)},
    ${dbConnection.escape(severity)},
    ${dbConnection.escape(tracking)},
    ${dbConnection.escape(idcliente)},
    ${dbConnection.escape(mandato)},
    ${dbConnection.escape(idcontratto)},
    ${dbConnection.escape(codicedebitore)},
    ${dbConnection.escape(sessionid)}
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
