import express from 'express';
import config from '../config/config.json';
import logger from '../libs/logger';
import fs from 'fs';

const router = express.Router();

const makeConcatString = (s, len = 10) => {
  let rS = s.toString();
  return `RPAD(${rS}, ${len}, 0x00)`;
  // CONCAT('VO2JE',CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'))
}

router.get('/:code', (req, res, next) => {
  // console.log('Rq.params', (new RegExp('^([0-9a-zA-Z]{,7})$')).test(req.params.code));
  if ((new RegExp('^([0-9a-zA-Z]{5,7})$')).test(req.params.code)) {
    const {
      code
    } = req.params;
    req.session.regenerate(() => {
      req.session.domain = 'default';
      const sql = `SELECT * FROM pagamento_online_idcontratto_cf WHERE active = 1 AND codice_da_url = ${makeConcatString(req.dbConnection.escape(code))}`;
      // req.dbConnection.query(sql)
      req.dbConnection.query(sql)
      .then(
        (results) => {
          const [ record ] = results;
          if (!record) {
            req.session.dbRecord = null;
            req.session.code = code;
            req.session.validCode = false;
          } else {
            req.session.dbRecord = record;
            req.session.code = code;
            req.session.validCode = true;
            req.session.askLabel = `Inserisci le <b>prime tre lettere</b> del codice fiscale che finisce con <b>${record.cf.slice(-4)}</b>`;
            req.session.askValue = record.cf.substring(0, 3);
            if (record.cf.length !== 16) {
              req.session.askValue = record.cf.slice(-3);
              req.session.askLabel = `Inserisci le <b>ultime tre cifre</b> della partita IVA che inizia con <b>${record.cf.substring(0, 4)}</b>`;
            }
          }
          return Promise.resolve(record);
        },
        (e) => Promise.reject(e)
      )
      .then(
        (record) => {
          if (!record) {
            return Promise.resolve(null);
          } else {
            const {
              idcontratto,
              idcliente,
              codicedebitore
            } = record;
            const subqueries = {
              contratto: {
                q: `SELECT * FROM contratto WHERE idcontratto = ${req.dbConnection.escape(idcontratto)}`,
                single: true
              },
              anagrafica: {
                q: `SELECT * FROM Debitore WHERE CodiceEnte = ${req.dbConnection.escape(codicedebitore)}`,
                single: true
              },
              fatture: {
                q: `SELECT * FROM Fatture WHERE idcontratto = ${req.dbConnection.escape(idcontratto)}`
              },
              fattureAperte: {
                q: `SELECT * FROM
                  Fatture as f
                  LEFT JOIN AssegniFatture as af
                  ON f.idfattura = af.idfattura
                  WHERE
                    f.idcontratto = ${req.dbConnection.escape(idcontratto)}
                    AND
                      (
                        af.idfattura IS NULL
                      )`
              },
              importi: {
                q: `SELECT
                  SUM(ImportiContratto.ValoreA) AS affidato,
                  SUM(ImportiContratto.ValoreR) AS recuperato,
                  LookupImporti.NomeImportoEsteso as NomeImporto,
                  ImportiContratto.IDImporto,
                  SUM(ValoreA - ValoreR) AS importoResiduo
                FROM LookupImporti, ImportiContratto
                WHERE ImportiContratto.idContratto = ${req.dbConnection.escape(idcontratto)} AND LookupImporti.ID = ImportiContratto.IDImporto
                GROUP BY ImportiContratto.IDImporto
                ORDER BY ImportiContratto.IDImporto`
              },
              paymentMethods: {
                q: `SELECT metodiDiPagamentoOnline.module, metodiDiPagamentoOnlineAbilitati.* FROM metodiDiPagamentoOnline
                JOIN metodiDiPagamentoOnlineAbilitati ON metodiDiPagamentoOnline.ID = metodiDiPagamentoOnlineAbilitati.IDMetodiDiPagamentoOnline
                WHERE metodiDiPagamentoOnlineAbilitati.IDCliente = ${req.dbConnection.escape(idcliente)}
                ORDER BY metodiDiPagamentoOnlineAbilitati.ordinamento ASC`
              }
            };

            return new Promise((resolve, reject) => {
              const tmpval = {};
              const keys = Object.keys(subqueries);
              const queries = keys.map((k) => {
                const q = subqueries[k].q;
                // console.log('Q', q);
                return req.dbConnection.query({
                  sql: q,
                  timeout: 25000
                })
                .then(
                  (result) => {
                    if (subqueries[k].single ) {
                      return Promise.resolve(result[0]);
                    }
                    return Promise.resolve(result);
                  },
                  (e) => {
                    console.error('[db] Query error!', e);
                    return Promise.reject(e);
                  }
                );
              });
              Promise.all(queries)
              .then(
                (qResults) => {
                  qResults.forEach((v, pos) => {
                    const k = keys[pos];
                    tmpval[k] = v;
                  });
                  req.session.fullDbRecords = tmpval;
                  resolve(record);
                },
                (e) => {
                  console.log('Some DB queries failed!');
                  console.error(e);
                  reject('DB FAILURE');
                }
              )
            });

          }
        },
        (e) => Promise.reject(e)
      )
      .then(
        (record) => {
          if (record) {
            return logger(req, `Codice riconosciuto: codice ${code}`).then(
              () => Promise.resolve(record),
              (e) => Promise.reject(e)
            );
          } else {
            return logger(req, 'Codice non trovato').then(
              () => Promise.resolve(record),
              (e) => Promise.reject(e)
            );
          }
        },
        (e) => Promise.reject(e)
      )
      .then(
        (record) => {
          if (record) {
            const idcliente = record.idcliente;
            return new Promise((resolve) => {
              fs.readFile(`./validDomains/${idcliente}`, (err, value) => {
                // console.log('Stats', err, stats);
                if (!err && value.toString().length > 0) {
                  req.session.domain = value.toString().trim();
                } else {
                  console.warn(`[invalid domain] Unable to validate domain for idcliente ${idcliente}`);
                }
                resolve(record);
              });
            });
          } else {
            return Promise.resolve(null);
          }
        },
        (e) => Promise.reject(e)
      )
      .then(
        (record) => {
          if (record) {
            logger(req, `Accesso con codice da url`, 'web', code).then(
              () => {
                res.redirect(302, '/requestsecret');
              },
              (e) => {
                res.redirect(302, '/codicenonvalido');
              }
            );
          } else {
            res.redirect(302, '/codicenonvalido');
          }
        },
        (e) => {
          console.error(e);
          next(e);
        }
      );
    });
  } else {
    next();
  }
});

router.get('/', (req, res, next) => {

  if (req.query) {
    const {
      code
    } = req.query;
    if (code) {
      req.session.regenerate(() => {
        // req.session.domain = config.validDomains.indexOf(domain) > -1 ? domain : config.defaultDomain;
        req.session.domain = 'default';
        const sql = `SELECT * FROM pagamento_online_idcontratto_cf WHERE active = 1 AND codice_da_url = ${makeConcatString(req.dbConnection.escape(code))}`;
        // req.dbConnection.query(sql)
        req.dbConnection.query(sql)
        .then(
          (results) => {
            const [ record ] = results;
            if (!record) {
              req.session.dbRecord = null;
              req.session.code = code;
              req.session.validCode = false;
            } else {
              req.session.dbRecord = record;
              req.session.code = code;
              req.session.validCode = true;
              req.session.askLabel = `Inserisci le <b>prime tre lettere</b> del codice fiscale che finisce con <b>${record.cf.slice(-4)}</b>`;
              req.session.askValue = record.cf.substring(0, 3);
              if (record.cf.length !== 16) {
                req.session.askLabel = `Inserisci le <b>prime tre cifre</b> della partita IVA che finisce con <b>${record.cf.slice(-4)}</b>`;
              }
            }
            return Promise.resolve(record);
          },
          (e) => Promise.reject(e)
        )
        .then(
          (record) => {
            if (!record) {
              return Promise.resolve(null);
            } else {
              const {
                idcontratto,
                idcliente,
                codicedebitore
              } = record;
              const subqueries = {
                contratto: {
                  q: `SELECT * FROM contratto WHERE idcontratto = ${req.dbConnection.escape(idcontratto)}`,
                  single: true
                },
                anagrafica: {
                  q: `SELECT * FROM Debitore WHERE CodiceEnte = ${req.dbConnection.escape(codicedebitore)}`,
                  single: true
                },
                fatture: {
                  q: `SELECT * FROM Fatture WHERE idcontratto = ${req.dbConnection.escape(idcontratto)}`
                },
                importi: {
                  q: `SELECT
                    SUM(ImportiContratto.ValoreA) AS affidato,
                    SUM(ImportiContratto.ValoreR) AS recuperato,
                    LookupImporti.NomeImportoEsteso as NomeImporto,
                    ImportiContratto.IDImporto,
                    SUM(ValoreA - ValoreR) AS importoResiduo
                  FROM LookupImporti, ImportiContratto
                  WHERE ImportiContratto.idContratto = ${req.dbConnection.escape(idcontratto)} AND LookupImporti.ID = ImportiContratto.IDImporto
                  GROUP BY ImportiContratto.IDImporto
                  ORDER BY ImportiContratto.IDImporto`
                },
                paymentMethods: {
                  q: `SELECT metodiDiPagamentoOnline.module, metodiDiPagamentoOnlineAbilitati.* FROM metodiDiPagamentoOnline
                  JOIN metodiDiPagamentoOnlineAbilitati ON metodiDiPagamentoOnline.ID = metodiDiPagamentoOnlineAbilitati.IDMetodiDiPagamentoOnline
                  WHERE metodiDiPagamentoOnlineAbilitati.IDCliente = ${req.dbConnection.escape(idcliente)}
                  ORDER BY metodiDiPagamentoOnlineAbilitati.ordinamento ASC`
                }
              };

              return new Promise((resolve, reject) => {
                const tmpval = {};
                const keys = Object.keys(subqueries);
                const queries = keys.map((k) => {
                  const q = subqueries[k].q;
                  return req.dbConnection.query({
                    sql: q,
                    timeout: 5000
                  })
                  .then(
                    (result) => {
                      if (subqueries[k].single ) {
                        return Promise.resolve(result[0]);
                      }
                      return Promise.resolve(result);
                    },
                    (e) => {
                      console.error('[db] Query error!', e);
                      return Promise.reject(e);
                    }
                  );
                });
                Promise.all(queries)
                .then(
                  (qResults) => {
                    qResults.forEach((v, pos) => {
                      const k = keys[pos];
                      tmpval[k] = v;
                    });
                    req.session.fullDbRecords = tmpval;
                    resolve(record);
                  },
                  (e) => {
                    console.log('Some DB queries failed!');
                    console.error(e);
                    reject('DB FAILURE');
                  }
                )
              });

            }
          },
          (e) => Promise.reject(e)
        )
        .then(
          (record) => {
            if (record) {
              return logger(req, `Codice riconosciuto: codice ${code}`).then(
                () => Promise.resolve(record),
                (e) => Promise.reject(e)
              );
            } else {
              return logger(req, 'Codice non trovato').then(
                () => Promise.resolve(record),
                (e) => Promise.reject(e)
              );
            }
          },
          (e) => Promise.reject(e)
        )
        .then(
          (record) => {
            if (!record) {
              return Promise.resolve(record);
            }
            const idcliente = record.idcliente;
            return new Promise((resolve) => {
              fs.stat(`./validDomains/${idcliente}`, (err, stats) => {
                // console.log('Stats', err, stats);
                if (!err) {
                  req.session.domain = idcliente;
                } else {
                  console.warn(`[invalid domain] Unable to validate domain for idcliente ${idcliente}`);
                }
                resolve(record);
              });
            });
          },
          (e) => Promise.reject(e)
        )
        .then(
          (record) => {
            if (record) {
              res.redirect(302, '/requestsecret');
            } else {
              res.redirect(302, '/nocode');
            }
          },
          (e) => {
            console.error(e);
            next(e);
          }
        );
      });
    } else {
      next();
    }
  } else {
    next();
  }
  // res.send('CIAO!');
});

export default router;
