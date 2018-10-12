'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _config = require('../config/config.json');

var _config2 = _interopRequireDefault(_config);

var _logger = require('../libs/logger');

var _logger2 = _interopRequireDefault(_logger);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _formatCurrency = require('format-currency');

var _formatCurrency2 = _interopRequireDefault(_formatCurrency);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _stripslashes = require('./../libs/stripslashes');

var _stripslashes2 = _interopRequireDefault(_stripslashes);

var _ect = require('ect');

var _ect2 = _interopRequireDefault(_ect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

var makeConcatString = function makeConcatString(s) {
  var len = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

  var rS = s.toString();
  return 'RPAD(' + rS + ', ' + len + ', 0x00)';
  // CONCAT('VO2JE',CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'))
};

router.get('/:code?', function (req, res, next) {
  // console.log('In code!', req.url);
  if (new RegExp('^([0-9a-zA-Z]{5,7})$').test(req.params.code) || req.query && req.query.code) {
    var _ref = req.params.code ? req.params : req.query,
        code = _ref.code;
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
    var sql = 'SELECT * FROM pagamento_online_idcontratto_cf WHERE active = 1 AND codice_da_url = ' + makeConcatString(req.dbConnection.escape(code));
    // req.dbConnection.query(sql)
    req.dbConnection.query(sql).then(function (results) {
      var _results = _slicedToArray(results, 1),
          record = _results[0];

      if (!record) {
        req.session.dbRecord = null;
        req.session.code = code;
        req.session.validCode = false;
      } else {
        req.session.dbRecord = record;
        req.session.code = code;
        req.session.validCode = true;
        req.session.askLabel = 'Inserisci le <b>prime tre lettere</b> del codice fiscale che finisce con <b>' + record.cf.slice(-4) + '</b>';
        req.session.askValue = record.cf.substring(0, 3);
        if (record.cf.length !== 16) {
          req.session.askValue = record.cf.slice(-3);
          req.session.askLabel = 'Inserisci le <b>ultime tre cifre</b> della partita IVA che inizia con <b>' + record.cf.substring(0, 4) + '</b>';
        }
      }
      return Promise.resolve(record);
    }, function (e) {
      return Promise.reject(e);
    }).then(function (record) {
      if (!record) {
        return Promise.resolve(null);
      } else {
        var idcontratto = record.idcontratto,
            idcliente = record.idcliente,
            codicedebitore = record.codicedebitore;

        var subqueries = {
          contratto: {
            q: 'SELECT * FROM contratto WHERE idcontratto = ' + req.dbConnection.escape(idcontratto),
            single: true
          },
          anagrafica: {
            q: 'SELECT * FROM Debitore WHERE CodiceEnte = ' + req.dbConnection.escape(codicedebitore),
            single: true
          },
          fatture: {
            q: 'SELECT * FROM Fatture WHERE idcontratto = ' + req.dbConnection.escape(idcontratto)
          },
          fattureAperte: {
            q: 'SELECT * FROM\n                  Fatture as f\n                  LEFT JOIN AssegniFatture as af\n                  ON f.idfattura = af.idfattura\n                  WHERE\n                    f.idcontratto = ' + req.dbConnection.escape(idcontratto) + '\n                    AND\n                      (\n                        af.idfattura IS NULL\n                      )'
          },
          importi: {
            q: 'SELECT\n                  SUM(ImportiContratto.ValoreA) AS affidato,\n                  SUM(ImportiContratto.ValoreR) AS recuperato,\n                  LookupImporti.NomeImportoEsteso as NomeImporto,\n                  ImportiContratto.IDImporto,\n                  SUM(ValoreA - ValoreR) AS importoResiduo\n                FROM LookupImporti, ImportiContratto\n                WHERE ImportiContratto.idContratto = ' + req.dbConnection.escape(idcontratto) + ' AND LookupImporti.ID = ImportiContratto.IDImporto\n                GROUP BY ImportiContratto.IDImporto\n                ORDER BY ImportiContratto.IDImporto'
          },
          paymentMethods: {
            q: 'SELECT metodiDiPagamentoOnline.module, metodiDiPagamentoOnlineAbilitati.* FROM metodiDiPagamentoOnline\n                JOIN metodiDiPagamentoOnlineAbilitati ON metodiDiPagamentoOnline.ID = metodiDiPagamentoOnlineAbilitati.IDMetodiDiPagamentoOnline\n                WHERE metodiDiPagamentoOnlineAbilitati.IDCliente = ' + req.dbConnection.escape(idcliente) + '\n                ORDER BY metodiDiPagamentoOnlineAbilitati.ordinamento ASC'
          }
        };

        return new Promise(function (resolve, reject) {
          var tmpval = {};
          var keys = Object.keys(subqueries);
          var queries = keys.map(function (k) {
            var q = subqueries[k].q;
            // console.log('Q', q);
            return req.dbConnection.query({
              sql: q,
              timeout: 10000
            }).then(function (result) {
              if (subqueries[k].single) {
                return Promise.resolve(result[0]);
              }
              return Promise.resolve(result);
            }, function (e) {
              console.error('[db] Query error!', e);
              return Promise.reject(e);
            });
          });
          Promise.all(queries).then(function (qResults) {
            qResults.forEach(function (v, pos) {
              var k = keys[pos];
              tmpval[k] = v;
            });
            req.session.fullDbRecords = tmpval;
            resolve(record);
          }, function (e) {
            console.log('Some DB queries failed!');
            console.error(e);
            reject('DB FAILURE');
          });
        });
      }
    }, function (e) {
      return Promise.reject(e);
    }).then(function (record) {
      if (record) {
        return (0, _logger2.default)(req, 'Codice riconosciuto: codice ' + code).then(function () {
          return Promise.resolve(record);
        }, function (e) {
          return Promise.reject(e);
        });
      } else {
        return (0, _logger2.default)(req, 'Codice non trovato').then(function () {
          return Promise.resolve(record);
        }, function (e) {
          return Promise.reject(e);
        });
      }
    }, function (e) {
      return Promise.reject(e);
    }).then(function (record) {
      if (record) {
        var idcliente = record.idcliente;
        return new Promise(function (resolve) {
          _fs2.default.readFile('./validDomains/' + idcliente, function (err, value) {
            // console.log('Stats', err, stats);
            if (!err && value.toString().length > 0) {
              req.session.domain = value.toString().trim();
              console.warn('[valid domain] From idcliente ' + record.idcliente + ', domain is ' + req.session.domain);
            } else {
              console.warn('[invalid domain] Unable to validate domain for idcliente ' + idcliente);
            }
            resolve(record);
          });
        });
      } else {
        return Promise.resolve(null);
      }
    }, function (e) {
      return Promise.reject(e);
    }).then(function (record) {
      var domain = req.get('host').split(':')[0];
      return new Promise(function (resolve) {
        // console.log('Lookup file', `./domainsToCustomer/${domain}`);
        _fs2.default.readFile('./domainsToCustomer/' + domain, function (err, value) {
          // console.log('Stats', err, value);
          if (!err && value.toString().length > 0) {
            req.session.domain = value.toString().trim();
            console.warn('[valid domain] From url ' + domain + ', domain is ' + req.session.domain);
          } else {
            console.warn('[invalid domain from url] Unable to validate domain for from domain ' + domain);
          }
          resolve(record);
        });
      });
    }, function (e) {
      return Promise.reject(e);
    }).then(function (record) {
      if (record) {
        (0, _logger2.default)(req, 'Accesso con codice da url', 'web', code).then(function () {
          // console.log('Going to request', req.session.domain);
          req.session.save(function (saveError) {
            // res.redirect(302, '/requestsecret');
            req.baseParams = {
              domain: req.session.domain,
              dbRecord: req.session.dbRecord,
              fullDbRecords: req.session.fullDbRecords,
              formatCurrency: _formatCurrency2.default,
              stripslashes: _stripslashes2.default,
              moment: _moment2.default
            };
            console.log('New session saved (step 1)!', req.sessionID, req.originalUrl);
            if (req.session && req.session.domain) {
              var roots = ['./views/' + req.session.domain, './views/default'];
              // console.log('Roots', roots);
              var ectRenderer = (0, _ect2.default)({ watch: true, cache: false, root: roots, ext: '.ect' });
              // app.set('views', roots);
              // app.engine('ect', ectRenderer.render);
              req.viewEngines = { '.ect': ectRenderer.render, 'default': false };
              req.viewRoots = roots;
            } else {
              // console.log('No roots');
              var _roots = ['./views/default'];
              var _ectRenderer = (0, _ect2.default)({ watch: true, cache: false, root: _roots, ext: '.ect' });
              // app.engine('ect', ectRenderer.render);
              req.viewEngines = { '.ect': _ectRenderer.render, 'default': true };
              req.viewRoots = _roots;
            }
            // console.log('Req.originalUrl', req.originalUrl);
            // console.log('View Engines', req.viewEngines);
            // console.log('View Roots', req.viewRoots);
            res.render('requestsecret', Object.assign({}, req.baseParams, {
              askLabel: req.session.askLabel,
              title: 'Verifica dati',
              viewEngines: req.viewEngines,
              viewRoots: req.viewRoots
            }));
          });
        }, function (e) {
          req.session.save(function (saveError) {
            req.baseParams = {
              domain: req.session.domain,
              dbRecord: req.session.dbRecord,
              fullDbRecords: req.session.fullDbRecords,
              formatCurrency: _formatCurrency2.default,
              stripslashes: _stripslashes2.default,
              moment: _moment2.default
            };
            res.render('nocode', Object.assign({}, req.baseParams, {
              title: 'Nessun codice valido',
              domain: req.session.domain,
              viewEngines: req.viewEngines,
              viewRoots: req.viewRoots
            }));
          });
        });
      } else {
        req.session.save(function (saveError) {
          req.baseParams = {
            domain: req.session.domain,
            dbRecord: req.session.dbRecord,
            fullDbRecords: req.session.fullDbRecords,
            formatCurrency: _formatCurrency2.default,
            stripslashes: _stripslashes2.default,
            moment: _moment2.default
          };
          res.render('nocode', Object.assign({}, req.baseParams, {
            title: 'Nessun codice valido',
            domain: req.session.domain,
            viewEngines: req.viewEngines,
            viewRoots: req.viewRoots
          }));
        });
      }
    }, function (e) {
      console.error(e);
      req.session.save(function (saveError) {
        next(e);
      });
    });
    // });
  } else {
    next();
  }
});

router.get('/', function (req, res, next) {
  if (req.query) {
    var code = req.query.code;

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
      var sql = 'SELECT * FROM pagamento_online_idcontratto_cf WHERE active = 1 AND codice_da_url = ' + makeConcatString(req.dbConnection.escape(code));
      // req.dbConnection.query(sql)
      req.dbConnection.query(sql).then(function (results) {
        var _results2 = _slicedToArray(results, 1),
            record = _results2[0];

        if (!record) {
          req.session.dbRecord = null;
          req.session.code = code;
          req.session.validCode = false;
        } else {
          req.session.dbRecord = record;
          req.session.code = code;
          req.session.validCode = true;
          req.session.askLabel = 'Inserisci le <b>prime tre lettere</b> del codice fiscale che finisce con <b>' + record.cf.slice(-4) + '</b>';
          req.session.askValue = record.cf.substring(0, 3);
          if (record.cf.length !== 16) {
            req.session.askLabel = 'Inserisci le <b>prime tre cifre</b> della partita IVA che finisce con <b>' + record.cf.slice(-4) + '</b>';
          }
        }
        return Promise.resolve(record);
      }, function (e) {
        return Promise.reject(e);
      }).then(function (record) {
        if (!record) {
          return Promise.resolve(null);
        } else {
          var idcontratto = record.idcontratto,
              idcliente = record.idcliente,
              codicedebitore = record.codicedebitore;

          var subqueries = {
            contratto: {
              q: 'SELECT * FROM contratto WHERE idcontratto = ' + req.dbConnection.escape(idcontratto),
              single: true
            },
            anagrafica: {
              q: 'SELECT * FROM Debitore WHERE CodiceEnte = ' + req.dbConnection.escape(codicedebitore),
              single: true
            },
            fatture: {
              q: 'SELECT * FROM Fatture WHERE idcontratto = ' + req.dbConnection.escape(idcontratto)
            },
            importi: {
              q: 'SELECT\n                    SUM(ImportiContratto.ValoreA) AS affidato,\n                    SUM(ImportiContratto.ValoreR) AS recuperato,\n                    LookupImporti.NomeImportoEsteso as NomeImporto,\n                    ImportiContratto.IDImporto,\n                    SUM(ValoreA - ValoreR) AS importoResiduo\n                  FROM LookupImporti, ImportiContratto\n                  WHERE ImportiContratto.idContratto = ' + req.dbConnection.escape(idcontratto) + ' AND LookupImporti.ID = ImportiContratto.IDImporto\n                  GROUP BY ImportiContratto.IDImporto\n                  ORDER BY ImportiContratto.IDImporto'
            },
            paymentMethods: {
              q: 'SELECT metodiDiPagamentoOnline.module, metodiDiPagamentoOnlineAbilitati.* FROM metodiDiPagamentoOnline\n                  JOIN metodiDiPagamentoOnlineAbilitati ON metodiDiPagamentoOnline.ID = metodiDiPagamentoOnlineAbilitati.IDMetodiDiPagamentoOnline\n                  WHERE metodiDiPagamentoOnlineAbilitati.IDCliente = ' + req.dbConnection.escape(idcliente) + '\n                  ORDER BY metodiDiPagamentoOnlineAbilitati.ordinamento ASC'
            }
          };

          return new Promise(function (resolve, reject) {
            var tmpval = {};
            var keys = Object.keys(subqueries);
            var queries = keys.map(function (k) {
              var q = subqueries[k].q;
              return req.dbConnection.query({
                sql: q,
                timeout: 10000
              }).then(function (result) {
                if (subqueries[k].single) {
                  return Promise.resolve(result[0]);
                }
                return Promise.resolve(result);
              }, function (e) {
                console.error('[db] Query error!', e);
                return Promise.reject(e);
              });
            });
            Promise.all(queries).then(function (qResults) {
              qResults.forEach(function (v, pos) {
                var k = keys[pos];
                tmpval[k] = v;
              });
              req.session.fullDbRecords = tmpval;
              resolve(record);
              // reject('DB FAILURE');
            }, function (e) {
              console.log('Some DB queries failed!');
              console.error(e);
              reject('DB FAILURE');
            });
          });
        }
      }, function (e) {
        return Promise.reject(e);
      }).then(function (record) {
        if (record) {
          return (0, _logger2.default)(req, 'Codice riconosciuto: codice ' + code).then(function () {
            return Promise.resolve(record);
          }, function (e) {
            return Promise.reject(e);
          });
        } else {
          return (0, _logger2.default)(req, 'Codice non trovato').then(function () {
            return Promise.resolve(record);
          }, function (e) {
            return Promise.reject(e);
          });
        }
      }, function (e) {
        return Promise.reject(e);
      }).then(function (record) {
        if (!record) {
          return Promise.resolve(record);
        }
        var idcliente = record.idcliente;
        return new Promise(function (resolve) {
          _fs2.default.readFile('./validDomains/' + idcliente, function (err, value) {
            // console.log('Stats', err, stats);
            if (!err && value.toString().length > 0) {
              req.session.domain = value.toString().trim();
            } else {
              console.warn('[invalid domain] Unable to validate domain for idcliente ' + idcliente);
            }
            resolve(record);
          });
        });
      }, function (e) {
        return Promise.reject(e);
      }).then(function (record) {
        var domain = req.get('host').split(':')[0];
        return new Promise(function (resolve) {
          _fs2.default.readFile('./domainsToCustomer/' + domain, function (err, value) {
            // console.log('Stats', err, stats);
            if (!err && value.toString().length > 0) {
              req.session.domain = value.toString().trim();
            } else {
              console.warn('[invalid domain from url] Unable to validate domain for from domain ' + domain);
            }
            resolve(record);
          });
        });
      }, function (e) {
        return Promise.reject(e);
      }).then(function (record) {
        if (record) {
          // res.redirect(302, '/requestsecret');
          req.baseParams = {
            domain: req.session.domain,
            dbRecord: req.session.dbRecord,
            fullDbRecords: req.session.fullDbRecords,
            formatCurrency: _formatCurrency2.default,
            stripslashes: _stripslashes2.default,
            moment: _moment2.default
          };
          console.log('New session saved (step 2)!', req.sessionID, req.originalUrl);
          if (req.session && req.session.domain) {
            var roots = ['./views/' + req.session.domain, './views/default'];
            // console.log('Roots', roots);
            var ectRenderer = (0, _ect2.default)({ watch: true, cache: false, root: roots, ext: '.ect' });
            // app.set('views', roots);
            // app.engine('ect', ectRenderer.render);
            req.viewEngines = { '.ect': ectRenderer.render, 'default': false };
            req.viewRoots = roots;
          } else {
            // console.log('No roots');
            var _roots2 = ['./views/default'];
            var _ectRenderer2 = (0, _ect2.default)({ watch: true, cache: false, root: _roots2, ext: '.ect' });
            // app.engine('ect', ectRenderer.render);
            req.viewEngines = { '.ect': _ectRenderer2.render, 'default': true };
            req.viewRoots = _roots2;
          }
          console.log('Req.originalUrl', req.originalUrl);
          console.log('View Engines', req.viewEngines);
          console.log('View Roots', req.viewRoots);
          res.render('requestsecret', Object.assign({}, req.baseParams, {
            askLabel: req.session.askLabel,
            title: 'Verifica dati',
            viewEngines: req.viewEngines,
            viewRoots: req.viewRoots
          }));
        } else {
          console.log('Invalid code!');
          res.redirect(302, '/nocode');
        }
      }, function (e) {
        console.error(e);
        next(e);
      });
      // });
    } else {
      next();
    }
  } else {
    next();
  }
  // res.send('CIAO!');
});

exports.default = router;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvZ2F0ZS5qcyJdLCJuYW1lcyI6WyJyb3V0ZXIiLCJSb3V0ZXIiLCJtYWtlQ29uY2F0U3RyaW5nIiwicyIsImxlbiIsInJTIiwidG9TdHJpbmciLCJnZXQiLCJyZXEiLCJyZXMiLCJuZXh0IiwiUmVnRXhwIiwidGVzdCIsInBhcmFtcyIsImNvZGUiLCJxdWVyeSIsInNlc3Npb24iLCJkYlJlY29yZCIsInZhbGlkQ29kZSIsImFza0NvbmZpcm1lZCIsImZ1bGxuYW1lQ29uZmlybWVkIiwiYXV0aGVudGljYXRlZCIsImRvbWFpbiIsInNxbCIsImRiQ29ubmVjdGlvbiIsImVzY2FwZSIsInRoZW4iLCJyZXN1bHRzIiwicmVjb3JkIiwiYXNrTGFiZWwiLCJjZiIsInNsaWNlIiwiYXNrVmFsdWUiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJQcm9taXNlIiwicmVzb2x2ZSIsImUiLCJyZWplY3QiLCJpZGNvbnRyYXR0byIsImlkY2xpZW50ZSIsImNvZGljZWRlYml0b3JlIiwic3VicXVlcmllcyIsImNvbnRyYXR0byIsInEiLCJzaW5nbGUiLCJhbmFncmFmaWNhIiwiZmF0dHVyZSIsImZhdHR1cmVBcGVydGUiLCJpbXBvcnRpIiwicGF5bWVudE1ldGhvZHMiLCJ0bXB2YWwiLCJrZXlzIiwiT2JqZWN0IiwicXVlcmllcyIsIm1hcCIsImsiLCJ0aW1lb3V0IiwicmVzdWx0IiwiY29uc29sZSIsImVycm9yIiwiYWxsIiwicVJlc3VsdHMiLCJmb3JFYWNoIiwidiIsInBvcyIsImZ1bGxEYlJlY29yZHMiLCJsb2ciLCJyZWFkRmlsZSIsImVyciIsInZhbHVlIiwidHJpbSIsIndhcm4iLCJzcGxpdCIsInNhdmUiLCJzYXZlRXJyb3IiLCJiYXNlUGFyYW1zIiwiZm9ybWF0Q3VycmVuY3kiLCJzdHJpcHNsYXNoZXMiLCJtb21lbnQiLCJzZXNzaW9uSUQiLCJvcmlnaW5hbFVybCIsInJvb3RzIiwiZWN0UmVuZGVyZXIiLCJ3YXRjaCIsImNhY2hlIiwicm9vdCIsImV4dCIsInZpZXdFbmdpbmVzIiwicmVuZGVyIiwidmlld1Jvb3RzIiwiYXNzaWduIiwidGl0bGUiLCJpcCIsInJlZGlyZWN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQU1BLFNBQVMsa0JBQVFDLE1BQVIsRUFBZjs7QUFFQSxJQUFNQyxtQkFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxDQUFELEVBQWlCO0FBQUEsTUFBYkMsR0FBYSx1RUFBUCxFQUFPOztBQUN4QyxNQUFJQyxLQUFLRixFQUFFRyxRQUFGLEVBQVQ7QUFDQSxtQkFBZUQsRUFBZixVQUFzQkQsR0FBdEI7QUFDQTtBQUNELENBSkQ7O0FBTUFKLE9BQU9PLEdBQVAsQ0FBVyxTQUFYLEVBQXNCLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFXQyxJQUFYLEVBQW9CO0FBQ3hDO0FBQ0EsTUFBSyxJQUFJQyxNQUFKLENBQVcsc0JBQVgsQ0FBRCxDQUFxQ0MsSUFBckMsQ0FBMENKLElBQUlLLE1BQUosQ0FBV0MsSUFBckQsS0FBOEROLElBQUlPLEtBQUosSUFBYVAsSUFBSU8sS0FBSixDQUFVRCxJQUF6RixFQUErRjtBQUFBLGVBR3pGTixJQUFJSyxNQUFKLENBQVdDLElBQVgsR0FBa0JOLElBQUlLLE1BQXRCLEdBQStCTCxJQUFJTyxLQUhzRDtBQUFBLFFBRTNGRCxJQUYyRixRQUUzRkEsSUFGMkY7QUFJN0Y7QUFDRTs7O0FBQ0FOLFFBQUlRLE9BQUosQ0FBWUMsUUFBWixHQUF1QixJQUF2QjtBQUNBVCxRQUFJUSxPQUFKLENBQVlGLElBQVosR0FBbUIsSUFBbkI7QUFDQU4sUUFBSVEsT0FBSixDQUFZRSxTQUFaLEdBQXdCLEtBQXhCO0FBQ0FWLFFBQUlRLE9BQUosQ0FBWUcsWUFBWixHQUEyQixLQUEzQjtBQUNBWCxRQUFJUSxPQUFKLENBQVlJLGlCQUFaLEdBQWdDLEtBQWhDO0FBQ0FaLFFBQUlRLE9B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LEdBNU9ELE1BNE9PO0FBQ0xBO0FBQ0Q7QUFDRDtBQUNELENBalBEOztrQkFtUGVWLE0iLCJmaWxlIjoiZ2F0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xyXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uL2NvbmZpZy9jb25maWcuanNvbic7XHJcbmltcG9ydCBsb2dnZXIgZnJvbSAnLi4vbGlicy9sb2dnZXInO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgZm9ybWF0Q3VycmVuY3kgZnJvbSAnZm9ybWF0LWN1cnJlbmN5JztcclxuaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xyXG5pbXBvcnQgc3RyaXBzbGFzaGVzIGZyb20gJy4vLi4vbGlicy9zdHJpcHNsYXNoZXMnO1xyXG5pbXBvcnQgZWN0IGZyb20gJ2VjdCc7XHJcblxyXG5jb25zdCByb3V0ZXIgPSBleHByZXNzLlJvdXRlcigpO1xyXG5cclxuY29uc3QgbWFrZUNvbmNhdFN0cmluZyA9IChzLCBsZW4gPSAxMCkgPT4ge1xyXG4gIGxldCByUyA9IHMudG9TdHJpbmcoKTtcclxuICByZXR1cm4gYFJQQUQoJHtyU30sICR7bGVufSwgMHgwMClgO1xyXG4gIC8vIENPTkNBVCgnVk8ySkUnLENIQVIoWCcwMCcpLENIQVIoWCcwMCcpLENIQVIoWCcwMCcpLENIQVIoWCcwMCcpLENIQVIoWCcwMCcpKVxyXG59XHJcblxyXG5yb3V0ZXIuZ2V0KCcvOmNvZGU/JywgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgLy8gY29uc29sZS5sb2coJ0luIGNvZGUhJywgcmVxLnVybCk7XHJcbiAgaWYgKChuZXcgUmVnRXhwKCdeKFswLTlhLXpBLVpdezUsN30pJCcpKS50ZXN0KHJlcS5wYXJhbXMuY29kZSkgfHwgcmVxLnF1ZXJ5ICYmIHJlcS5xdWVyeS5jb2RlKSB7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgIGNvZGVcclxuICAgIH0gPSByZXEucGFyYW1zLmNvZGUgPyByZXEucGFyYW1zIDogcmVxLnF1ZXJ5O1xyXG4gICAgLy8gcmVxLnNlc3Npb24ucmVnZW5lcmF0ZSgoKSA9PiB7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdSZWdlbmVyYXRpbmcgc2Vzc2lvbiBmb3IgYWRkcmVzcycsIHJlcS5pcCk7XHJcbiAgICAgIHJlcS5zZXNzaW9uLmRiUmVjb3JkID0gbnVsbDtcclxuICAgICAgcmVxLnNlc3Npb24uY29kZSA9IG51bGw7XHJcbiAgICAgIHJlcS5zZXNzaW9uLnZhbGlkQ29kZSA9IGZhbHNlO1xyXG4gICAgICByZXEuc2Vzc2lvbi5hc2tDb25maXJtZWQgPSBmYWxzZTtcclxuICAgICAgcmVxLnNlc3Npb24uZnVsbG5hbWVDb25maXJtZWQgPSBmYWxzZTtcclxuICAgICAgcmVxLnNlc3Npb24uYXV0aGVudGljYXRlZCA9IGZhbHNlO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZygnUmVnZW5lcmF0aW5nIHNlc3Npb24gZm9yIGFkZHJlc3MnLCByZXEuaXAsIHJlcS5zZXNzaW9uSUQpO1xyXG4gICAgICByZXEuc2Vzc2lvbi5kb21haW4gPSAnZGVmYXVsdCc7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdEb21haW4gaXMgbm93JywgcmVxLnNlc3Npb24uZG9tYWluKTtcclxuICAgICAgY29uc3Qgc3FsID0gYFNFTEVDVCAqIEZST00gcGFnYW1lbnRvX29ubGluZV9pZGNvbnRyYXR0b19jZiBXSEVSRSBhY3RpdmUgPSAxIEFORCBjb2RpY2VfZGFfdXJsID0gJHttYWtlQ29uY2F0U3RyaW5nKHJlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGNvZGUpKX1gO1xyXG4gICAgICAvLyByZXEuZGJDb25uZWN0aW9uLnF1ZXJ5KHNxbClcclxuICAgICAgcmVxLmRiQ29ubmVjdGlvbi5xdWVyeShzcWwpXHJcbiAgICAgIC50aGVuKFxyXG4gICAgICAgIChyZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBbIHJlY29yZCBdID0gcmVzdWx0cztcclxuICAgICAgICAgIGlmICghcmVjb3JkKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZXNzaW9uLmRiUmVjb3JkID0gbnVsbDtcclxuICAgICAgICAgICAgcmVxLnNlc3Npb24uY29kZSA9IGNvZGU7XHJcbiAgICAgICAgICAgIHJlcS5zZXNzaW9uLnZhbGlkQ29kZSA9IGZhbHNlO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVxLnNlc3Npb24uZGJSZWNvcmQgPSByZWNvcmQ7XHJcbiAgICAgICAgICAgIHJlcS5zZXNzaW9uLmNvZGUgPSBjb2RlO1xyXG4gICAgICAgICAgICByZXEuc2Vzc2lvbi52YWxpZENvZGUgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXEuc2Vzc2lvbi5hc2tMYWJlbCA9IGBJbnNlcmlzY2kgbGUgPGI+cHJpbWUgdHJlIGxldHRlcmU8L2I+IGRlbCBjb2RpY2UgZmlzY2FsZSBjaGUgZmluaXNjZSBjb24gPGI+JHtyZWNvcmQuY2Yuc2xpY2UoLTQpfTwvYj5gO1xyXG4gICAgICAgICAgICByZXEuc2Vzc2lvbi5hc2tWYWx1ZSA9IHJlY29yZC5jZi5zdWJzdHJpbmcoMCwgMyk7XHJcbiAgICAgICAgICAgIGlmIChyZWNvcmQuY2YubGVuZ3RoICE9PSAxNikge1xyXG4gICAgICAgICAgICAgIHJlcS5zZXNzaW9uLmFza1ZhbHVlID0gcmVjb3JkLmNmLnNsaWNlKC0zKTtcclxuICAgICAgICAgICAgICByZXEuc2Vzc2lvbi5hc2tMYWJlbCA9IGBJbnNlcmlzY2kgbGUgPGI+dWx0aW1lIHRyZSBjaWZyZTwvYj4gZGVsbGEgcGFydGl0YSBJVkEgY2hlIGluaXppYSBjb24gPGI+JHtyZWNvcmQuY2Yuc3Vic3RyaW5nKDAsIDQpfTwvYj5gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlY29yZCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgKVxyXG4gICAgICAudGhlbihcclxuICAgICAgICAocmVjb3JkKSA9PiB7XHJcbiAgICAgICAgICBpZiAoIXJlY29yZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3Qge1xyXG4gICAgICAgICAgICAgIGlkY29udHJhdHRvLFxyXG4gICAgICAgICAgICAgIGlkY2xpZW50ZSxcclxuICAgICAgICAgICAgICBjb2RpY2VkZWJpdG9yZVxyXG4gICAgICAgICAgICB9ID0gcmVjb3JkO1xyXG4gICAgICAgICAgICBjb25zdCBzdWJxdWVyaWVzID0ge1xyXG4gICAgICAgICAgICAgIGNvbnRyYXR0bzoge1xyXG4gICAgICAgICAgICAgICAgcTogYFNFTEVDVCAqIEZST00gY29udHJhdHRvIFdIRVJFIGlkY29udHJhdHRvID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShpZGNvbnRyYXR0byl9YCxcclxuICAgICAgICAgICAgICAgIHNpbmdsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgYW5hZ3JhZmljYToge1xyXG4gICAgICAgICAgICAgICAgcTogYFNFTEVDVCAqIEZST00gRGViaXRvcmUgV0hFUkUgQ29kaWNlRW50ZSA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoY29kaWNlZGViaXRvcmUpfWAsXHJcbiAgICAgICAgICAgICAgICBzaW5nbGU6IHRydWVcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGZhdHR1cmU6IHtcclxuICAgICAgICAgICAgICAgIHE6IGBTRUxFQ1QgKiBGUk9NIEZhdHR1cmUgV0hFUkUgaWRjb250cmF0dG8gPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGlkY29udHJhdHRvKX1gXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBmYXR0dXJlQXBlcnRlOiB7XHJcbiAgICAgICAgICAgICAgICBxOiBgU0VMRUNUICogRlJPTVxyXG4gICAgICAgICAgICAgICAgICBGYXR0dXJlIGFzIGZcclxuICAgICAgICAgICAgICAgICAgTEVGVCBKT0lOIEFzc2VnbmlGYXR0dXJlIGFzIGFmXHJcbiAgICAgICAgICAgICAgICAgIE9OIGYuaWRmYXR0dXJhID0gYWYuaWRmYXR0dXJhXHJcbiAgICAgICAgICAgICAgICAgIFdIRVJFXHJcbiAgICAgICAgICAgICAgICAgICAgZi5pZGNvbnRyYXR0byA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoaWRjb250cmF0dG8pfVxyXG4gICAgICAgICAgICAgICAgICAgIEFORFxyXG4gICAgICAgICAgICAgICAgICAgICAgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZi5pZGZhdHR1cmEgSVMgTlVMTFxyXG4gICAgICAgICAgICAgICAgICAgICAgKWBcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGltcG9ydGk6IHtcclxuICAgICAgICAgICAgICAgIHE6IGBTRUxFQ1RcclxuICAgICAgICAgICAgICAgICAgU1VNKEltcG9ydGlDb250cmF0dG8uVmFsb3JlQSkgQVMgYWZmaWRhdG8sXHJcbiAgICAgICAgICAgICAgICAgIFNVTShJbXBvcnRpQ29udHJhdHRvLlZhbG9yZVIpIEFTIHJlY3VwZXJhdG8sXHJcbiAgICAgICAgICAgICAgICAgIExvb2t1cEltcG9ydGkuTm9tZUltcG9ydG9Fc3Rlc28gYXMgTm9tZUltcG9ydG8sXHJcbiAgICAgICAgICAgICAgICAgIEltcG9ydGlDb250cmF0dG8uSURJbXBvcnRvLFxyXG4gICAgICAgICAgICAgICAgICBTVU0oVmFsb3JlQSAtIFZhbG9yZVIpIEFTIGltcG9ydG9SZXNpZHVvXHJcbiAgICAgICAgICAgICAgICBGUk9NIExvb2t1cEltcG9ydGksIEltcG9ydGlDb250cmF0dG9cclxuICAgICAgICAgICAgICAgIFdIRVJFIEltcG9ydGlDb250cmF0dG8uaWRDb250cmF0dG8gPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGlkY29udHJhdHRvKX0gQU5EIExvb2t1cEltcG9ydGkuSUQgPSBJbXBvcnRpQ29udHJhdHRvLklESW1wb3J0b1xyXG4gICAgICAgICAgICAgICAgR1JPVVAgQlkgSW1wb3J0aUNvbnRyYXR0by5JREltcG9ydG9cclxuICAgICAgICAgICAgICAgIE9SREVSIEJZIEltcG9ydGlDb250cmF0dG8uSURJbXBvcnRvYFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgcGF5bWVudE1ldGhvZHM6IHtcclxuICAgICAgICAgICAgICAgIHE6IGBTRUxFQ1QgbWV0b2RpRGlQYWdhbWVudG9PbmxpbmUubW9kdWxlLCBtZXRvZGlEaVBhZ2FtZW50b09ubGluZUFiaWxpdGF0aS4qIEZST00gbWV0b2RpRGlQYWdhbWVudG9PbmxpbmVcclxuICAgICAgICAgICAgICAgIEpPSU4gbWV0b2RpRGlQYWdhbWVudG9PbmxpbmVBYmlsaXRhdGkgT04gbWV0b2RpRGlQYWdhbWVudG9PbmxpbmUuSUQgPSBtZXRvZGlEaVBhZ2FtZW50b09ubGluZUFiaWxpdGF0aS5JRE1ldG9kaURpUGFnYW1lbnRvT25saW5lXHJcbiAgICAgICAgICAgICAgICBXSEVSRSBtZXRvZGlEaVBhZ2FtZW50b09ubGluZUFiaWxpdGF0aS5JRENsaWVudGUgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGlkY2xpZW50ZSl9XHJcbiAgICAgICAgICAgICAgICBPUkRFUiBCWSBtZXRvZGlEaVBhZ2FtZW50b09ubGluZUFiaWxpdGF0aS5vcmRpbmFtZW50byBBU0NgXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCB0bXB2YWwgPSB7fTtcclxuICAgICAgICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoc3VicXVlcmllcyk7XHJcbiAgICAgICAgICAgICAgY29uc3QgcXVlcmllcyA9IGtleXMubWFwKChrKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBxID0gc3VicXVlcmllc1trXS5xO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ1EnLCBxKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXEuZGJDb25uZWN0aW9uLnF1ZXJ5KHtcclxuICAgICAgICAgICAgICAgICAgc3FsOiBxLFxyXG4gICAgICAgICAgICAgICAgICB0aW1lb3V0OiAxMDAwMFxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAgICAgICAocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnF1ZXJpZXNba10uc2luZ2xlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHRbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2RiXSBRdWVyeSBlcnJvciEnLCBlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgUHJvbWlzZS5hbGwocXVlcmllcylcclxuICAgICAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgICAgIChxUmVzdWx0cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBxUmVzdWx0cy5mb3JFYWNoKCh2LCBwb3MpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBrID0ga2V5c1twb3NdO1xyXG4gICAgICAgICAgICAgICAgICAgIHRtcHZhbFtrXSA9IHY7XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICByZXEuc2Vzc2lvbi5mdWxsRGJSZWNvcmRzID0gdG1wdmFsO1xyXG4gICAgICAgICAgICAgICAgICByZXNvbHZlKHJlY29yZCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1NvbWUgREIgcXVlcmllcyBmYWlsZWQhJyk7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICAgIHJlamVjdCgnREIgRkFJTFVSRScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgIClcclxuICAgICAgLnRoZW4oXHJcbiAgICAgICAgKHJlY29yZCkgPT4ge1xyXG4gICAgICAgICAgaWYgKHJlY29yZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbG9nZ2VyKHJlcSwgYENvZGljZSByaWNvbm9zY2l1dG86IGNvZGljZSAke2NvZGV9YCkudGhlbihcclxuICAgICAgICAgICAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUocmVjb3JkKSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBsb2dnZXIocmVxLCAnQ29kaWNlIG5vbiB0cm92YXRvJykudGhlbihcclxuICAgICAgICAgICAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUocmVjb3JkKSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgICApXHJcbiAgICAgIC50aGVuKFxyXG4gICAgICAgIChyZWNvcmQpID0+IHtcclxuICAgICAgICAgIGlmIChyZWNvcmQpIHtcclxuICAgICAgICAgICAgY29uc3QgaWRjbGllbnRlID0gcmVjb3JkLmlkY2xpZW50ZTtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgICAgZnMucmVhZEZpbGUoYC4vdmFsaWREb21haW5zLyR7aWRjbGllbnRlfWAsIChlcnIsIHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnU3RhdHMnLCBlcnIsIHN0YXRzKTtcclxuICAgICAgICAgICAgICAgIGlmICghZXJyICYmIHZhbHVlLnRvU3RyaW5nKCkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICByZXEuc2Vzc2lvbi5kb21haW4gPSB2YWx1ZS50b1N0cmluZygpLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbdmFsaWQgZG9tYWluXSBGcm9tIGlkY2xpZW50ZSAke3JlY29yZC5pZGNsaWVudGV9LCBkb21haW4gaXMgJHtyZXEuc2Vzc2lvbi5kb21haW59YCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtpbnZhbGlkIGRvbWFpbl0gVW5hYmxlIHRvIHZhbGlkYXRlIGRvbWFpbiBmb3IgaWRjbGllbnRlICR7aWRjbGllbnRlfWApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWNvcmQpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgKVxyXG4gICAgICAudGhlbihcclxuICAgICAgICAocmVjb3JkKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBkb21haW4gPSByZXEuZ2V0KCdob3N0Jykuc3BsaXQoJzonKVswXTtcclxuICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnTG9va3VwIGZpbGUnLCBgLi9kb21haW5zVG9DdXN0b21lci8ke2RvbWFpbn1gKTtcclxuICAgICAgICAgICAgZnMucmVhZEZpbGUoYC4vZG9tYWluc1RvQ3VzdG9tZXIvJHtkb21haW59YCwgKGVyciwgdmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnU3RhdHMnLCBlcnIsIHZhbHVlKTtcclxuICAgICAgICAgICAgICBpZiAoIWVyciAmJiB2YWx1ZS50b1N0cmluZygpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHJlcS5zZXNzaW9uLmRvbWFpbiA9IHZhbHVlLnRvU3RyaW5nKCkudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbdmFsaWQgZG9tYWluXSBGcm9tIHVybCAke2RvbWFpbn0sIGRvbWFpbiBpcyAke3JlcS5zZXNzaW9uLmRvbWFpbn1gKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbaW52YWxpZCBkb21haW4gZnJvbSB1cmxdIFVuYWJsZSB0byB2YWxpZGF0ZSBkb21haW4gZm9yIGZyb20gZG9tYWluICR7ZG9tYWlufWApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXNvbHZlKHJlY29yZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgKVxyXG4gICAgICAudGhlbihcclxuICAgICAgICAocmVjb3JkKSA9PiB7XHJcbiAgICAgICAgICBpZiAocmVjb3JkKSB7XHJcbiAgICAgICAgICAgIGxvZ2dlcihyZXEsIGBBY2Nlc3NvIGNvbiBjb2RpY2UgZGEgdXJsYCwgJ3dlYicsIGNvZGUpLnRoZW4oXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ0dvaW5nIHRvIHJlcXVlc3QnLCByZXEuc2Vzc2lvbi5kb21haW4pO1xyXG4gICAgICAgICAgICAgICAgcmVxLnNlc3Npb24uc2F2ZSgoc2F2ZUVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIHJlcy5yZWRpcmVjdCgzMDIsICcvcmVxdWVzdHNlY3JldCcpO1xyXG4gICAgICAgICAgICAgICAgICByZXEuYmFzZVBhcmFtcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBkb21haW46IHJlcS5zZXNzaW9uLmRvbWFpbixcclxuICAgICAgICAgICAgICAgICAgICBkYlJlY29yZDogcmVxLnNlc3Npb24uZGJSZWNvcmQsXHJcbiAgICAgICAgICAgICAgICAgICAgZnVsbERiUmVjb3JkczogcmVxLnNlc3Npb24uZnVsbERiUmVjb3JkcyxcclxuICAgICAgICAgICAgICAgICAgICBmb3JtYXRDdXJyZW5jeSxcclxuICAgICAgICAgICAgICAgICAgICBzdHJpcHNsYXNoZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9tZW50XHJcbiAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdOZXcgc2Vzc2lvbiBzYXZlZCAoc3RlcCAxKSEnLCByZXEuc2Vzc2lvbklELCByZXEub3JpZ2luYWxVcmwpO1xyXG4gICAgICAgICAgICAgICAgICBpZiAocmVxLnNlc3Npb24gJiYgcmVxLnNlc3Npb24uZG9tYWluKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdHMgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgICBgLi92aWV3cy8ke3JlcS5zZXNzaW9uLmRvbWFpbn1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgYC4vdmlld3MvZGVmYXVsdGBcclxuICAgICAgICAgICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdSb290cycsIHJvb3RzKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlY3RSZW5kZXJlciA9IGVjdCh7IHdhdGNoOiB0cnVlLCBjYWNoZTogZmFsc2UsIHJvb3Q6IHJvb3RzLCBleHQ6ICcuZWN0J30pO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFwcC5zZXQoJ3ZpZXdzJywgcm9vdHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFwcC5lbmdpbmUoJ2VjdCcsIGVjdFJlbmRlcmVyLnJlbmRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxLnZpZXdFbmdpbmVzID0geyAnLmVjdCc6IGVjdFJlbmRlcmVyLnJlbmRlciwgJ2RlZmF1bHQnOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcS52aWV3Um9vdHMgPSByb290cztcclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnTm8gcm9vdHMnKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290cyA9IFtcclxuICAgICAgICAgICAgICAgICAgICAgIGAuL3ZpZXdzL2RlZmF1bHRgXHJcbiAgICAgICAgICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlY3RSZW5kZXJlciA9IGVjdCh7IHdhdGNoOiB0cnVlLCBjYWNoZTogZmFsc2UsIHJvb3Q6IHJvb3RzLCBleHQ6ICcuZWN0JyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBhcHAuZW5naW5lKCdlY3QnLCBlY3RSZW5kZXJlci5yZW5kZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcS52aWV3RW5naW5lcyA9IHsgJy5lY3QnOiBlY3RSZW5kZXJlci5yZW5kZXIsICdkZWZhdWx0JzogdHJ1ZSB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcS52aWV3Um9vdHMgPSByb290cztcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnUmVxLm9yaWdpbmFsVXJsJywgcmVxLm9yaWdpbmFsVXJsKTtcclxuICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ1ZpZXcgRW5naW5lcycsIHJlcS52aWV3RW5naW5lcyk7XHJcbiAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdWaWV3IFJvb3RzJywgcmVxLnZpZXdSb290cyk7XHJcbiAgICAgICAgICAgICAgICAgIHJlcy5yZW5kZXIoYHJlcXVlc3RzZWNyZXRgLCBPYmplY3QuYXNzaWduKHt9LCByZXEuYmFzZVBhcmFtcywge1xyXG4gICAgICAgICAgICAgICAgICAgIGFza0xhYmVsOiByZXEuc2Vzc2lvbi5hc2tMYWJlbCxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ1ZlcmlmaWNhIGRhdGknLFxyXG4gICAgICAgICAgICAgICAgICAgIHZpZXdFbmdpbmVzOiByZXEudmlld0VuZ2luZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlld1Jvb3RzOiByZXEudmlld1Jvb3RzXHJcbiAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlcS5zZXNzaW9uLnNhdmUoKHNhdmVFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICByZXEuYmFzZVBhcmFtcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBkb21haW46IHJlcS5zZXNzaW9uLmRvbWFpbixcclxuICAgICAgICAgICAgICAgICAgICBkYlJlY29yZDogcmVxLnNlc3Npb24uZGJSZWNvcmQsXHJcbiAgICAgICAgICAgICAgICAgICAgZnVsbERiUmVjb3JkczogcmVxLnNlc3Npb24uZnVsbERiUmVjb3JkcyxcclxuICAgICAgICAgICAgICAgICAgICBmb3JtYXRDdXJyZW5jeSxcclxuICAgICAgICAgICAgICAgICAgICBzdHJpcHNsYXNoZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9tZW50XHJcbiAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgIHJlcy5yZW5kZXIoYG5vY29kZWAsIE9iamVjdC5hc3NpZ24oe30sIHJlcS5iYXNlUGFyYW1zLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGBOZXNzdW4gY29kaWNlIHZhbGlkb2AsXHJcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluOiByZXEuc2Vzc2lvbi5kb21haW4sXHJcbiAgICAgICAgICAgICAgICAgICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcclxuICAgICAgICAgICAgICAgICAgICB2aWV3Um9vdHM6IHJlcS52aWV3Um9vdHNcclxuICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVxLnNlc3Npb24uc2F2ZSgoc2F2ZUVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmVxLmJhc2VQYXJhbXMgPSB7XHJcbiAgICAgICAgICAgICAgICBkb21haW46IHJlcS5zZXNzaW9uLmRvbWFpbixcclxuICAgICAgICAgICAgICAgIGRiUmVjb3JkOiByZXEuc2Vzc2lvbi5kYlJlY29yZCxcclxuICAgICAgICAgICAgICAgIGZ1bGxEYlJlY29yZHM6IHJlcS5zZXNzaW9uLmZ1bGxEYlJlY29yZHMsXHJcbiAgICAgICAgICAgICAgICBmb3JtYXRDdXJyZW5jeSxcclxuICAgICAgICAgICAgICAgIHN0cmlwc2xhc2hlcyxcclxuICAgICAgICAgICAgICAgIG1vbWVudFxyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgcmVzLnJlbmRlcihgbm9jb2RlYCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBgTmVzc3VuIGNvZGljZSB2YWxpZG9gLFxyXG4gICAgICAgICAgICAgICAgZG9tYWluOiByZXEuc2Vzc2lvbi5kb21haW4sXHJcbiAgICAgICAgICAgICAgICB2aWV3RW5naW5lczogcmVxLnZpZXdFbmdpbmVzLFxyXG4gICAgICAgICAgICAgICAgdmlld1Jvb3RzOiByZXEudmlld1Jvb3RzXHJcbiAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIChlKSA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgcmVxLnNlc3Npb24uc2F2ZSgoc2F2ZUVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIG5leHQoZSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcbiAgICAvLyB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgbmV4dCgpO1xyXG4gIH1cclxufSk7XHJcblxyXG5yb3V0ZXIuZ2V0KCcvJywgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgaWYgKHJlcS5xdWVyeSkge1xyXG4gICAgY29uc3Qge1xyXG4gICAgICBjb2RlXHJcbiAgICB9ID0gcmVxLnF1ZXJ5O1xyXG4gICAgaWYgKGNvZGUpIHtcclxuICAgICAgLy8gcmVxLnNlc3Npb24ucmVnZW5lcmF0ZSgoKSA9PiB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ1JlZ2VuZXJhdGluZyBzZXNzaW9uIGZvciBhZGRyZXNzJywgcmVxLmlwKTtcclxuICAgICAgICByZXEuc2Vzc2lvbi5kYlJlY29yZCA9IG51bGw7XHJcbiAgICAgICAgcmVxLnNlc3Npb24uY29kZSA9IG51bGw7XHJcbiAgICAgICAgcmVxLnNlc3Npb24udmFsaWRDb2RlID0gZmFsc2U7XHJcbiAgICAgICAgcmVxLnNlc3Npb24uYXNrQ29uZmlybWVkID0gZmFsc2U7XHJcbiAgICAgICAgcmVxLnNlc3Npb24uZnVsbG5hbWVDb25maXJtZWQgPSBmYWxzZTtcclxuICAgICAgICByZXEuc2Vzc2lvbi5hdXRoZW50aWNhdGVkID0gZmFsc2U7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1JlZ2VuZXJhdGluZyBzZXNzaW9uIGluIGdhdGUgKDIpIGZvciBhZGRyZXNzJywgcmVxLmlwLCByZXEuc2Vzc2lvbklELCByZXEub3JpZ2luYWxVcmwpO1xyXG4gICAgICAgIHJlcS5zZXNzaW9uLmRvbWFpbiA9ICdkZWZhdWx0JztcclxuICAgICAgICBjb25zdCBzcWwgPSBgU0VMRUNUICogRlJPTSBwYWdhbWVudG9fb25saW5lX2lkY29udHJhdHRvX2NmIFdIRVJFIGFjdGl2ZSA9IDEgQU5EIGNvZGljZV9kYV91cmwgPSAke21ha2VDb25jYXRTdHJpbmcocmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoY29kZSkpfWA7XHJcbiAgICAgICAgLy8gcmVxLmRiQ29ubmVjdGlvbi5xdWVyeShzcWwpXHJcbiAgICAgICAgcmVxLmRiQ29ubmVjdGlvbi5xdWVyeShzcWwpXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAocmVzdWx0cykgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBbIHJlY29yZCBdID0gcmVzdWx0cztcclxuICAgICAgICAgICAgaWYgKCFyZWNvcmQpIHtcclxuICAgICAgICAgICAgICByZXEuc2Vzc2lvbi5kYlJlY29yZCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgcmVxLnNlc3Npb24uY29kZSA9IGNvZGU7XHJcbiAgICAgICAgICAgICAgcmVxLnNlc3Npb24udmFsaWRDb2RlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmVxLnNlc3Npb24uZGJSZWNvcmQgPSByZWNvcmQ7XHJcbiAgICAgICAgICAgICAgcmVxLnNlc3Npb24uY29kZSA9IGNvZGU7XHJcbiAgICAgICAgICAgICAgcmVxLnNlc3Npb24udmFsaWRDb2RlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICByZXEuc2Vzc2lvbi5hc2tMYWJlbCA9IGBJbnNlcmlzY2kgbGUgPGI+cHJpbWUgdHJlIGxldHRlcmU8L2I+IGRlbCBjb2RpY2UgZmlzY2FsZSBjaGUgZmluaXNjZSBjb24gPGI+JHtyZWNvcmQuY2Yuc2xpY2UoLTQpfTwvYj5gO1xyXG4gICAgICAgICAgICAgIHJlcS5zZXNzaW9uLmFza1ZhbHVlID0gcmVjb3JkLmNmLnN1YnN0cmluZygwLCAzKTtcclxuICAgICAgICAgICAgICBpZiAocmVjb3JkLmNmLmxlbmd0aCAhPT0gMTYpIHtcclxuICAgICAgICAgICAgICAgIHJlcS5zZXNzaW9uLmFza0xhYmVsID0gYEluc2VyaXNjaSBsZSA8Yj5wcmltZSB0cmUgY2lmcmU8L2I+IGRlbGxhIHBhcnRpdGEgSVZBIGNoZSBmaW5pc2NlIGNvbiA8Yj4ke3JlY29yZC5jZi5zbGljZSgtNCl9PC9iPmA7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVjb3JkKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAocmVjb3JkKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghcmVjb3JkKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjb25zdCB7XHJcbiAgICAgICAgICAgICAgICBpZGNvbnRyYXR0byxcclxuICAgICAgICAgICAgICAgIGlkY2xpZW50ZSxcclxuICAgICAgICAgICAgICAgIGNvZGljZWRlYml0b3JlXHJcbiAgICAgICAgICAgICAgfSA9IHJlY29yZDtcclxuICAgICAgICAgICAgICBjb25zdCBzdWJxdWVyaWVzID0ge1xyXG4gICAgICAgICAgICAgICAgY29udHJhdHRvOiB7XHJcbiAgICAgICAgICAgICAgICAgIHE6IGBTRUxFQ1QgKiBGUk9NIGNvbnRyYXR0byBXSEVSRSBpZGNvbnRyYXR0byA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoaWRjb250cmF0dG8pfWAsXHJcbiAgICAgICAgICAgICAgICAgIHNpbmdsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGFuYWdyYWZpY2E6IHtcclxuICAgICAgICAgICAgICAgICAgcTogYFNFTEVDVCAqIEZST00gRGViaXRvcmUgV0hFUkUgQ29kaWNlRW50ZSA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoY29kaWNlZGViaXRvcmUpfWAsXHJcbiAgICAgICAgICAgICAgICAgIHNpbmdsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGZhdHR1cmU6IHtcclxuICAgICAgICAgICAgICAgICAgcTogYFNFTEVDVCAqIEZST00gRmF0dHVyZSBXSEVSRSBpZGNvbnRyYXR0byA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoaWRjb250cmF0dG8pfWBcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBpbXBvcnRpOiB7XHJcbiAgICAgICAgICAgICAgICAgIHE6IGBTRUxFQ1RcclxuICAgICAgICAgICAgICAgICAgICBTVU0oSW1wb3J0aUNvbnRyYXR0by5WYWxvcmVBKSBBUyBhZmZpZGF0byxcclxuICAgICAgICAgICAgICAgICAgICBTVU0oSW1wb3J0aUNvbnRyYXR0by5WYWxvcmVSKSBBUyByZWN1cGVyYXRvLFxyXG4gICAgICAgICAgICAgICAgICAgIExvb2t1cEltcG9ydGkuTm9tZUltcG9ydG9Fc3Rlc28gYXMgTm9tZUltcG9ydG8sXHJcbiAgICAgICAgICAgICAgICAgICAgSW1wb3J0aUNvbnRyYXR0by5JREltcG9ydG8sXHJcbiAgICAgICAgICAgICAgICAgICAgU1VNKFZhbG9yZUEgLSBWYWxvcmVSKSBBUyBpbXBvcnRvUmVzaWR1b1xyXG4gICAgICAgICAgICAgICAgICBGUk9NIExvb2t1cEltcG9ydGksIEltcG9ydGlDb250cmF0dG9cclxuICAgICAgICAgICAgICAgICAgV0hFUkUgSW1wb3J0aUNvbnRyYXR0by5pZENvbnRyYXR0byA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoaWRjb250cmF0dG8pfSBBTkQgTG9va3VwSW1wb3J0aS5JRCA9IEltcG9ydGlDb250cmF0dG8uSURJbXBvcnRvXHJcbiAgICAgICAgICAgICAgICAgIEdST1VQIEJZIEltcG9ydGlDb250cmF0dG8uSURJbXBvcnRvXHJcbiAgICAgICAgICAgICAgICAgIE9SREVSIEJZIEltcG9ydGlDb250cmF0dG8uSURJbXBvcnRvYFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHBheW1lbnRNZXRob2RzOiB7XHJcbiAgICAgICAgICAgICAgICAgIHE6IGBTRUxFQ1QgbWV0b2RpRGlQYWdhbWVudG9PbmxpbmUubW9kdWxlLCBtZXRvZGlEaVBhZ2FtZW50b09ubGluZUFiaWxpdGF0aS4qIEZST00gbWV0b2RpRGlQYWdhbWVudG9PbmxpbmVcclxuICAgICAgICAgICAgICAgICAgSk9JTiBtZXRvZGlEaVBhZ2FtZW50b09ubGluZUFiaWxpdGF0aSBPTiBtZXRvZGlEaVBhZ2FtZW50b09ubGluZS5JRCA9IG1ldG9kaURpUGFnYW1lbnRvT25saW5lQWJpbGl0YXRpLklETWV0b2RpRGlQYWdhbWVudG9PbmxpbmVcclxuICAgICAgICAgICAgICAgICAgV0hFUkUgbWV0b2RpRGlQYWdhbWVudG9PbmxpbmVBYmlsaXRhdGkuSURDbGllbnRlID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShpZGNsaWVudGUpfVxyXG4gICAgICAgICAgICAgICAgICBPUkRFUiBCWSBtZXRvZGlEaVBhZ2FtZW50b09ubGluZUFiaWxpdGF0aS5vcmRpbmFtZW50byBBU0NgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRtcHZhbCA9IHt9O1xyXG4gICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHN1YnF1ZXJpZXMpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcXVlcmllcyA9IGtleXMubWFwKChrKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHEgPSBzdWJxdWVyaWVzW2tdLnE7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiByZXEuZGJDb25uZWN0aW9uLnF1ZXJ5KHtcclxuICAgICAgICAgICAgICAgICAgICBzcWw6IHEsXHJcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dDogMTAwMDBcclxuICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICAgICAgICAgKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnF1ZXJpZXNba10uc2luZ2xlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdFswXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2RiXSBRdWVyeSBlcnJvciEnLCBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIFByb21pc2UuYWxsKHF1ZXJpZXMpXHJcbiAgICAgICAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgICAgICAgKHFSZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcVJlc3VsdHMuZm9yRWFjaCgodiwgcG9zKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrID0ga2V5c1twb3NdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgdG1wdmFsW2tdID0gdjtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXEuc2Vzc2lvbi5mdWxsRGJSZWNvcmRzID0gdG1wdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVjb3JkKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZWplY3QoJ0RCIEZBSUxVUkUnKTtcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnU29tZSBEQiBxdWVyaWVzIGZhaWxlZCEnKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnREIgRkFJTFVSRScpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKHJlY29yZCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVjb3JkKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGxvZ2dlcihyZXEsIGBDb2RpY2Ugcmljb25vc2NpdXRvOiBjb2RpY2UgJHtjb2RlfWApLnRoZW4oXHJcbiAgICAgICAgICAgICAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUocmVjb3JkKSxcclxuICAgICAgICAgICAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGxvZ2dlcihyZXEsICdDb2RpY2Ugbm9uIHRyb3ZhdG8nKS50aGVuKFxyXG4gICAgICAgICAgICAgICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKHJlY29yZCksXHJcbiAgICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKHJlY29yZCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXJlY29yZCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVjb3JkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBpZGNsaWVudGUgPSByZWNvcmQuaWRjbGllbnRlO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgICBmcy5yZWFkRmlsZShgLi92YWxpZERvbWFpbnMvJHtpZGNsaWVudGV9YCwgKGVyciwgdmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdTdGF0cycsIGVyciwgc3RhdHMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlcnIgJiYgdmFsdWUudG9TdHJpbmcoKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJlcS5zZXNzaW9uLmRvbWFpbiA9IHZhbHVlLnRvU3RyaW5nKCkudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbaW52YWxpZCBkb21haW5dIFVuYWJsZSB0byB2YWxpZGF0ZSBkb21haW4gZm9yIGlkY2xpZW50ZSAke2lkY2xpZW50ZX1gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVjb3JkKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKHJlY29yZCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBkb21haW4gPSByZXEuZ2V0KCdob3N0Jykuc3BsaXQoJzonKVswXTtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgICAgZnMucmVhZEZpbGUoYC4vZG9tYWluc1RvQ3VzdG9tZXIvJHtkb21haW59YCwgKGVyciwgdmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdTdGF0cycsIGVyciwgc3RhdHMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlcnIgJiYgdmFsdWUudG9TdHJpbmcoKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJlcS5zZXNzaW9uLmRvbWFpbiA9IHZhbHVlLnRvU3RyaW5nKCkudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbaW52YWxpZCBkb21haW4gZnJvbSB1cmxdIFVuYWJsZSB0byB2YWxpZGF0ZSBkb21haW4gZm9yIGZyb20gZG9tYWluICR7ZG9tYWlufWApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWNvcmQpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAocmVjb3JkKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZWNvcmQpIHtcclxuICAgICAgICAgICAgICAvLyByZXMucmVkaXJlY3QoMzAyLCAnL3JlcXVlc3RzZWNyZXQnKTtcclxuICAgICAgICAgICAgICByZXEuYmFzZVBhcmFtcyA9IHtcclxuICAgICAgICAgICAgICAgIGRvbWFpbjogcmVxLnNlc3Npb24uZG9tYWluLFxyXG4gICAgICAgICAgICAgICAgZGJSZWNvcmQ6IHJlcS5zZXNzaW9uLmRiUmVjb3JkLFxyXG4gICAgICAgICAgICAgICAgZnVsbERiUmVjb3JkczogcmVxLnNlc3Npb24uZnVsbERiUmVjb3JkcyxcclxuICAgICAgICAgICAgICAgIGZvcm1hdEN1cnJlbmN5LFxyXG4gICAgICAgICAgICAgICAgc3RyaXBzbGFzaGVzLFxyXG4gICAgICAgICAgICAgICAgbW9tZW50XHJcbiAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTmV3IHNlc3Npb24gc2F2ZWQgKHN0ZXAgMikhJywgcmVxLnNlc3Npb25JRCwgcmVxLm9yaWdpbmFsVXJsKTtcclxuICAgICAgICAgICAgICBpZiAocmVxLnNlc3Npb24gJiYgcmVxLnNlc3Npb24uZG9tYWluKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByb290cyA9IFtcclxuICAgICAgICAgICAgICAgICAgYC4vdmlld3MvJHtyZXEuc2Vzc2lvbi5kb21haW59YCxcclxuICAgICAgICAgICAgICAgICAgYC4vdmlld3MvZGVmYXVsdGBcclxuICAgICAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnUm9vdHMnLCByb290cyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlY3RSZW5kZXJlciA9IGVjdCh7IHdhdGNoOiB0cnVlLCBjYWNoZTogZmFsc2UsIHJvb3Q6IHJvb3RzLCBleHQ6ICcuZWN0J30pO1xyXG4gICAgICAgICAgICAgICAgLy8gYXBwLnNldCgndmlld3MnLCByb290cyk7XHJcbiAgICAgICAgICAgICAgICAvLyBhcHAuZW5naW5lKCdlY3QnLCBlY3RSZW5kZXJlci5yZW5kZXIpO1xyXG4gICAgICAgICAgICAgICAgcmVxLnZpZXdFbmdpbmVzID0geyAnLmVjdCc6IGVjdFJlbmRlcmVyLnJlbmRlciwgJ2RlZmF1bHQnOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgcmVxLnZpZXdSb290cyA9IHJvb3RzO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnTm8gcm9vdHMnKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RzID0gW1xyXG4gICAgICAgICAgICAgICAgICBgLi92aWV3cy9kZWZhdWx0YFxyXG4gICAgICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVjdFJlbmRlcmVyID0gZWN0KHsgd2F0Y2g6IHRydWUsIGNhY2hlOiBmYWxzZSwgcm9vdDogcm9vdHMsIGV4dDogJy5lY3QnIH0pO1xyXG4gICAgICAgICAgICAgICAgLy8gYXBwLmVuZ2luZSgnZWN0JywgZWN0UmVuZGVyZXIucmVuZGVyKTtcclxuICAgICAgICAgICAgICAgIHJlcS52aWV3RW5naW5lcyA9IHsgJy5lY3QnOiBlY3RSZW5kZXJlci5yZW5kZXIsICdkZWZhdWx0JzogdHJ1ZSB9O1xyXG4gICAgICAgICAgICAgICAgcmVxLnZpZXdSb290cyA9IHJvb3RzO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVxLm9yaWdpbmFsVXJsJywgcmVxLm9yaWdpbmFsVXJsKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVmlldyBFbmdpbmVzJywgcmVxLnZpZXdFbmdpbmVzKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVmlldyBSb290cycsIHJlcS52aWV3Um9vdHMpO1xyXG4gICAgICAgICAgICAgIHJlcy5yZW5kZXIoYHJlcXVlc3RzZWNyZXRgLCBPYmplY3QuYXNzaWduKHt9LCByZXEuYmFzZVBhcmFtcywge1xyXG4gICAgICAgICAgICAgICAgYXNrTGFiZWw6IHJlcS5zZXNzaW9uLmFza0xhYmVsLFxyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdWZXJpZmljYSBkYXRpJyxcclxuICAgICAgICAgICAgICAgIHZpZXdFbmdpbmVzOiByZXEudmlld0VuZ2luZXMsXHJcbiAgICAgICAgICAgICAgICB2aWV3Um9vdHM6IHJlcS52aWV3Um9vdHNcclxuICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludmFsaWQgY29kZSEnKTtcclxuICAgICAgICAgICAgICByZXMucmVkaXJlY3QoMzAyLCAnL25vY29kZScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKGUpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgbmV4dChlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAvLyB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG5leHQoKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgbmV4dCgpO1xyXG4gIH1cclxuICAvLyByZXMuc2VuZCgnQ0lBTyEnKTtcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7XHJcbiJdfQ==