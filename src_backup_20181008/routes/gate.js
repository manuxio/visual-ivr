import express from 'express';
import config from '../config/config.json';
import logger from '../libs/logger';
import fs from 'fs';
import formatCurrency from 'format-currency';
import moment from 'moment';
import stripslashes from './../libs/stripslashes';
import ect from 'ect';

const router = express.Router();

const makeConcatString = (s, len = 10) => {
  let rS = s.toString();
  return `RPAD(${rS}, ${len}, 0x00)`;
  // CONCAT('VO2JE',CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'))
}

router.get('/:code?', (req, res, next) => {
  // console.log('In code!', req.url);
  if ((new RegExp('^([0-9a-zA-Z]{5,7})$')).test(req.params.code) || req.query && req.query.code) {
    const {
      code
    } = req.params.code ? req.params : req.query;
    // req.session.regenerate(() => {
      // console.log('Regenerating session for address', req.ip);
      req.session.dbRecord = null;
      req.session.code = null;
      req.session.validCode = false;
      req.session.askConfirmed = false;
      req.session.fullnameConfirmed = false;
      req.session.authenticated = false;
      // console.log('Regenerating session for address', req.ip, req.sessionID);
      req.session.domain = 'default';
      // console.log('Domain is now', req.session.domain);
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
                  timeout: 10000
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
                  console.warn(`[valid domain] From idcliente ${record.idcliente}, domain is ${req.session.domain}`);
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
          const domain = req.get('host').split(':')[0];
          return new Promise((resolve) => {
            // console.log('Lookup file', `./domainsToCustomer/${domain}`);
            fs.readFile(`./domainsToCustomer/${domain}`, (err, value) => {
              // console.log('Stats', err, value);
              if (!err && value.toString().length > 0) {
                req.session.domain = value.toString().trim();
                console.warn(`[valid domain] From url ${domain}, domain is ${req.session.domain}`);
              } else {
                console.warn(`[invalid domain from url] Unable to validate domain for from domain ${domain}`);
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
            logger(req, `Accesso con codice da url`, 'web', code).then(
              () => {
                // console.log('Going to request', req.session.domain);
                req.session.save((saveError) => {
                  // res.redirect(302, '/requestsecret');
                  req.baseParams = {
                    domain: req.session.domain,
                    dbRecord: req.session.dbRecord,
                    fullDbRecords: req.session.fullDbRecords,
                    formatCurrency,
                    stripslashes,
                    moment
                  };
                  console.log('New session saved (step 1)!', req.sessionID, req.originalUrl);
                  if (req.session && req.session.domain) {
                    const roots = [
                      `./views/${req.session.domain}`,
                      `./views/default`
                    ];
                    // console.log('Roots', roots);
                    const ectRenderer = ect({ watch: true, cache: false, root: roots, ext: '.ect'});
                    // app.set('views', roots);
                    // app.engine('ect', ectRenderer.render);
                    req.viewEngines = { '.ect': ectRenderer.render, 'default': false };
                    req.viewRoots = roots;
                  } else {
                    // console.log('No roots');
                    const roots = [
                      `./views/default`
                    ];
                    const ectRenderer = ect({ watch: true, cache: false, root: roots, ext: '.ect' });
                    // app.engine('ect', ectRenderer.render);
                    req.viewEngines = { '.ect': ectRenderer.render, 'default': true };
                    req.viewRoots = roots;
                  }
                  // console.log('Req.originalUrl', req.originalUrl);
                  // console.log('View Engines', req.viewEngines);
                  // console.log('View Roots', req.viewRoots);
                  res.render(`requestsecret`, Object.assign({}, req.baseParams, {
                    askLabel: req.session.askLabel,
                    title: 'Verifica dati',
                    viewEngines: req.viewEngines,
                    viewRoots: req.viewRoots
                  }));
                });
              },
              (e) => {
                req.session.save((saveError) => {
                  req.baseParams = {
                    domain: req.session.domain,
                    dbRecord: req.session.dbRecord,
                    fullDbRecords: req.session.fullDbRecords,
                    formatCurrency,
                    stripslashes,
                    moment
                  };
                  res.render(`nocode`, Object.assign({}, req.baseParams, {
                    title: `Nessun codice valido`,
                    domain: req.session.domain,
                    viewEngines: req.viewEngines,
                    viewRoots: req.viewRoots
                  }));
                });
              }
            );
          } else {
            req.session.save((saveError) => {
              req.baseParams = {
                domain: req.session.domain,
                dbRecord: req.session.dbRecord,
                fullDbRecords: req.session.fullDbRecords,
                formatCurrency,
                stripslashes,
                moment
              };
              res.render(`nocode`, Object.assign({}, req.baseParams, {
                title: `Nessun codice valido`,
                domain: req.session.domain,
                viewEngines: req.viewEngines,
                viewRoots: req.viewRoots
              }));
            });
          }
        },
        (e) => {
          console.error(e);
          req.session.save((saveError) => {
            next(e);
          });
        }
      );
    // });
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
      // req.session.regenerate(() => {
        // console.log('Regenerating session for address', req.ip);
        req.session.dbRecord = null;
        req.session.code = null;
        req.session.validCode = false;
        req.session.askConfirmed = false;
        req.session.fullnameConfirmed = false;
        req.session.authenticated = false;
        console.log('Regenerating session in gate (2) for address', req.ip, req.sessionID, req.originalUrl);
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
                    timeout: 10000
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
                    // reject('DB FAILURE');
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
          },
          (e) => Promise.reject(e)
        )
        .then(
          (record) => {
            const domain = req.get('host').split(':')[0];
            return new Promise((resolve) => {
              fs.readFile(`./domainsToCustomer/${domain}`, (err, value) => {
                // console.log('Stats', err, stats);
                if (!err && value.toString().length > 0) {
                  req.session.domain = value.toString().trim();
                } else {
                  console.warn(`[invalid domain from url] Unable to validate domain for from domain ${domain}`);
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
              // res.redirect(302, '/requestsecret');
              req.baseParams = {
                domain: req.session.domain,
                dbRecord: req.session.dbRecord,
                fullDbRecords: req.session.fullDbRecords,
                formatCurrency,
                stripslashes,
                moment
              };
              console.log('New session saved (step 2)!', req.sessionID, req.originalUrl);
              if (req.session && req.session.domain) {
                const roots = [
                  `./views/${req.session.domain}`,
                  `./views/default`
                ];
                // console.log('Roots', roots);
                const ectRenderer = ect({ watch: true, cache: false, root: roots, ext: '.ect'});
                // app.set('views', roots);
                // app.engine('ect', ectRenderer.render);
                req.viewEngines = { '.ect': ectRenderer.render, 'default': false };
                req.viewRoots = roots;
              } else {
                // console.log('No roots');
                const roots = [
                  `./views/default`
                ];
                const ectRenderer = ect({ watch: true, cache: false, root: roots, ext: '.ect' });
                // app.engine('ect', ectRenderer.render);
                req.viewEngines = { '.ect': ectRenderer.render, 'default': true };
                req.viewRoots = roots;
              }
              console.log('Req.originalUrl', req.originalUrl);
              console.log('View Engines', req.viewEngines);
              console.log('View Roots', req.viewRoots);
              res.render(`requestsecret`, Object.assign({}, req.baseParams, {
                askLabel: req.session.askLabel,
                title: 'Verifica dati',
                viewEngines: req.viewEngines,
                viewRoots: req.viewRoots
              }));
            } else {
              console.log('Invalid code!');
              res.redirect(302, '/nocode');
            }
          },
          (e) => {
            console.error(e);
            next(e);
          }
        );
      // });
    } else {
      next();
    }
  } else {
    next();
  }
  // res.send('CIAO!');
});

export default router;
