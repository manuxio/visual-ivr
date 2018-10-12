'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _config = require('../config/config.json');

var _config2 = _interopRequireDefault(_config);

var _logger = require('../libs/logger');

var _logger2 = _interopRequireDefault(_logger);

var _checkauth = require('../libs/checkauth');

var _checkauth2 = _interopRequireDefault(_checkauth);

var _paymentmethods = require('../paymentmethods/');

var _paymentmethods2 = _interopRequireDefault(_paymentmethods);

var _bnlPositivity = require('../libs/bnlPositivity');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get('/home', _checkauth2.default, function (req, res, next) {
  var session = req.session;
  // console.log('fullDbRecords', req.session.fullDbRecords);

  res.render('vivr/home', Object.assign({}, req.baseParams, {
    title: 'Benvenuto ' + session.fullDbRecords.anagrafica.Debitore,
    anagraficaEnabled: true,
    informazioniMandatoEnabled: true,
    payNowEnabled: true,
    contactEnabled: true,
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots
  }));
});

router.get('/closesession', function (req, res, next) {
  var session = req.session;
  // console.log('fullDbRecords', req.session.fullDbRecords);

  var domain = typeof session.domain !== 'undefined' ? session.domain : 'default';
  // req.session.regenerate(() => {
  req.session.dbRecord = null;
  req.session.code = null;
  req.session.validCode = false;
  req.session.askConfirmed = false;
  req.session.fullnameConfirmed = false;
  req.session.authenticated = false;
  console.log('Closing session for address', req.ip, req.sessionID, req.originalUrl);
  req.session.domain = domain;
  req.session.save(function (saveError) {
    res.render('vivr/logout', Object.assign({}, req.baseParams, {
      title: 'Uscita',
      domain: domain,
      viewEngines: req.viewEngines,
      viewRoots: req.viewRoots
    }));
  });
  // });
});

router.get('/anagrafica', _checkauth2.default, function (req, res, next) {
  var session = req.session;
  // console.log('fullDbRecords', req.session.fullDbRecords);

  (0, _logger2.default)(req, 'Accesso pagina anagrafica', 'web', req.session.code);
  res.render('vivr/anagrafica', Object.assign({}, req.baseParams, {
    title: 'Dati anagrafici',
    informazioniMandatoEnabled: true,
    payNowEnabled: true,
    contactEnabled: true,
    homeEnabled: true,
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots
  }));
});

router.get('/informazionimandato', _checkauth2.default, function (req, res, next) {
  var session = req.session;

  (0, _logger2.default)(req, 'Accesso pagina mandato', 'web', req.session.code);
  res.render('vivr/informazionimandato', Object.assign({}, req.baseParams, {
    title: 'POSIZIONE DEBITORIA',
    // informazioniMandatoEnabled: true,
    payNowEnabled: true,
    contactEnabled: true,
    homeEnabled: true,
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots
  }));
});

router.get('/pagaora', _checkauth2.default, function (req, res, next) {
  var session = req.session;
  var dbRecord = session.dbRecord,
      fullDbRecords = session.fullDbRecords;
  var enabledPaymentMethods = fullDbRecords.paymentMethods;


  var totaleDaPagare = fullDbRecords.importi.reduce(function (prev, curr) {
    return prev + curr.importoResiduo;
  }, 0);
  session.pendingChecks = 0;

  // console.log('enabledPaymentMethods', enabledPaymentMethods);

  var realPaymentMethods = enabledPaymentMethods.map(function (c) {
    if (!session.paymentMethodsConfigurations) {
      session.paymentMethodsConfigurations = {};
    }
    session.paymentMethodsConfigurations[c.module] = c;
    var theClass = _paymentmethods2.default[c.module];
    if (!theClass) {
      throw new Error('Cannot find a module with name: ' + c.module);
    }
    var m = new theClass(c);
    m.setAmount(totaleDaPagare);
    m.setCurrency('EUR');
    m.setPaymentId(dbRecord.id_pagamento_online);
    m.setIdContratto(dbRecord.idcontratto);
    m.setBaseUrl(req.get('host'));
    m.setInfo('Pagamento online per id: ' + dbRecord.id_pagamento_online);
    m.setDb(req.dbConnection);
    m.setSession(req.session);
    m.setUrlCode(req.session.code);
    return m;
  });

  // console.log('realPaymentMethods', realPaymentMethods);


  req.dbConnection.query('SELECT * FROM onlinePaymentTransactions WHERE paymentId = ' + req.dbConnection.escape(dbRecord.id_pagamento_online) + ' AND completed = 1 AND (status = \'PENDING\' OR status = \'APPROVED\')').then(function (results) {
    if (results && results.length) {
      res.render('vivr/paymentalreadymade', Object.assign({}, req.baseParams, {
        title: 'Pagamento gi&agrave; eseguito',
        paymentMethods: realPaymentMethods,
        anagraficaEnabled: true,
        informazioniMandatoEnabled: true,
        contactEnabled: true,
        homeEnabled: true,
        viewEngines: req.viewEngines,
        viewRoots: req.viewRoots
      }));
    } else {
      var getReady = realPaymentMethods.map(function (pm) {
        return function (pm) {
          return function () {
            return pm.getReady();
          };
        }(pm);
      });
      //console.log('paymentMethods', session.domain, paymentMethods);
      _async2.default.mapSeries(realPaymentMethods, function (pm, cb) {
        pm.getReady().then(function () {
          cb(null);
        }, function (e) {
          console.log('E', e);
          cb(true);
        });
      }, function (err) {
        if (!err) {
          (0, _logger2.default)(req, 'Accesso pagina pagamento', 'web', req.session.code);
          res.render('vivr/choosepaymentmethod', Object.assign({}, req.baseParams, {
            title: 'Scegli il metodo di pagamento',
            paymentMethods: realPaymentMethods,
            anagraficaEnabled: true,
            informazioniMandatoEnabled: true,
            contactEnabled: true,
            homeEnabled: true,
            viewEngines: req.viewEngines,
            viewRoots: req.viewRoots
          }));
        } else {
          next(err);
        }
      });
    }
  }, function (e) {
    return Promise.reject(e);
  });
});

router.get('/waittransactionresult', _checkauth2.default, function (req, res, next) {
  var session = req.session;

  session.pendingChecks = session.pendingChecks > -1 ? session.pendingChecks += 1 : session.pendingChecks = 0;
  if (!session.pendingTransaction) {
    next('/home');
    return;
  }
  // console.log('waittransactionresult');
  req.dbConnection.query('SELECT completed, status, remotestatus FROM onlinePaymentTransactions WHERE id = ' + req.dbConnection.escape(session.pendingTransaction)).then(function (results) {
    if (!results || results.length !== 1) {
      next('/home');
      return;
    } else {
      var transactionResult = results[0];
      if (!transactionResult.completed) {
        res.render('vivr/pleasewait', Object.assign({}, req.baseParams, {
          title: 'Attendere...',
          reloadTimeout: 5000,
          pendingChecks: session.pendingChecks,
          listTransactionsUrl: '/vivr/showtransactions',
          viewEngines: req.viewEngines,
          viewRoots: req.viewRoots
        }));
      } else {
        // console.log('transactionResult', transactionResult);
        res.render('vivr/transactioncompleted', Object.assign({}, req.baseParams, {
          title: 'Transazione completa',
          transactionResult: transactionResult,
          listTransactionsUrl: '/vivr/showtransactions',
          anagraficaEnabled: true,
          informazioniMandatoEnabled: true,
          payNowEnabled: true,
          viewEngines: req.viewEngines,
          viewRoots: req.viewRoots
        }));
      }
    }
  }, function (e) {
    return Promise.reject(e);
  });
});

router.get('/showtransactions', _checkauth2.default, function (req, res, next) {
  var session = req.session;
  var dbRecord = session.dbRecord;

  req.dbConnection.query('SELECT fullConfig, status, remotestatus, datacreazione FROM onlinePaymentTransactions WHERE idContratto = ' + req.dbConnection.escape(dbRecord.idcontratto) + ' AND completed = 1 ORDER BY datacreazione DESC').then(function (results) {
    var myTransactions = results.map(function (result) {
      var fullConfig = JSON.parse(result.fullConfig);
      return {
        fullConfig: fullConfig,
        type: fullConfig.title,
        amount: fullConfig.chargetotal,
        status: result.status,
        remotestatus: result.remotestatus,
        date: result.datacreazione
      };
    });
    res.render('vivr/showtransactions', Object.assign({}, req.baseParams, {
      title: 'Lista transazioni',
      transactions: myTransactions,
      anagraficaEnabled: true,
      informazioniMandatoEnabled: true,
      contactEnabled: true,
      homeEnabled: true,
      viewEngines: req.viewEngines,
      viewRoots: req.viewRoots
    }));
  }, function (e) {
    next(500);
  });
});

router.get('/sendmessage', _checkauth2.default, function (req, res, next) {
  var session = req.session;

  res.render('vivr/sendmessage', Object.assign({}, req.baseParams, {
    title: 'Invia messaggio',
    anagraficaEnabled: true,
    informazioniMandatoEnabled: true,
    payNowEnabled: true,
    homeEnabled: true,
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots
  }));
});

router.post('/sendmessage', _checkauth2.default, function (req, res, next) {
  var session = req.session;
  var fullDbRecords = session.fullDbRecords;
  var contratto = fullDbRecords.contratto;
  var body = req.body;
  var contactReason = body.contactReason,
      contactMessage = body.contactMessage;
  var files = req.files;

  var testfile = files && files.contactAttachment ? files.contactAttachment : null;
  if (!contactReason || !contactMessage || testfile && testfile.data.byteLength === 512000) {
    var formError = '<ul>';
    if (testfile && testfile.data.byteLength === 512000) {
      formError += '<li>L\'allegato &egrave; troppo grande!</li>';
    }
    if (!contactReason) {
      formError += '<li>L\'oggetto &egrave; vuoto!</li>';
    }
    if (!contactMessage) {
      formError += '<li>Il messaggio &egrave; vuoto!</li>';
    }
    res.render('vivr/sendmessage', Object.assign({}, req.baseParams, {
      title: 'Invia messaggio',
      contactMessage: contactMessage,
      contactReason: contactReason,
      formError: formError,
      viewEngines: req.viewEngines,
      viewRoots: req.viewRoots
    }));
  } else {
    var file = files && files.contactAttachment ? files.contactAttachment : null;
    var filename = file ? file.name : null;
    var filemime = file ? file.mimetype : null;
    var filedata = file ? file.data : null;

    req.dbConnection.query('INSERT into onlineMessages (idcontratto, oggetto, messaggio, attachment, attachment_name, attachment_mimetype, tracking)\n    VALUES (\n      ' + req.dbConnection.escape(contratto.IDContratto) + ',\n      ' + req.dbConnection.escape(contactReason) + ',\n      ' + req.dbConnection.escape(contactMessage) + ',\n      ' + req.dbConnection.escape(filedata) + ',\n      ' + req.dbConnection.escape(filename) + ',\n      ' + req.dbConnection.escape(filemime) + ',\n      ' + req.dbConnection.escape(req.session.code) + '\n    )').then(function (result) {
      res.render('vivr/messagesent', Object.assign({}, req.baseParams, {
        title: 'Messaggio inviato correttamente',
        viewEngines: req.viewEngines,
        viewRoots: req.viewRoots
      }));
    }, function (e) {
      return Promise.reject(e);
    });
  }
});

exports.default = router;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvdml2ci5qcyJdLCJuYW1lcyI6WyJyb3V0ZXIiLCJSb3V0ZXIiLCJnZXQiLCJyZXEiLCJyZXMiLCJuZXh0Iiwic2Vzc2lvbiIsInJlbmRlciIsIk9iamVjdCIsImFzc2lnbiIsImJhc2VQYXJhbXMiLCJ0aXRsZSIsImZ1bGxEYlJlY29yZHMiLCJhbmFncmFmaWNhIiwiRGViaXRvcmUiLCJhbmFncmFmaWNhRW5hYmxlZCIsImluZm9ybWF6aW9uaU1hbmRhdG9FbmFibGVkIiwicGF5Tm93RW5hYmxlZCIsImNvbnRhY3RFbmFibGVkIiwidmlld0VuZ2luZXMiLCJ2aWV3Um9vdHMiLCJkb21haW4iLCJkYlJlY29yZCIsImNvZGUiLCJ2YWxpZENvZGUiLCJhc2tDb25maXJtZWQiLCJmdWxsbmFtZUNvbmZpcm1lZCIsImF1dGhlbnRpY2F0ZWQiLCJjb25zb2xlIiwibG9nIiwiaXAiLCJzZXNzaW9uSUQiLCJvcmlnaW5hbFVybCIsInNhdmUiLCJzYXZlRXJyb3IiLCJob21lRW5hYmxlZCIsImVuYWJsZWRQYXltZW50TWV0aG9kcyIsInBheW1lbnRNZXRob2RzIiwidG90YWxlRGFQYWdhcmUiLCJpbXBvcnRpIiwicmVkdWNlIiwicHJldiIsImN1cnIiLCJpbXBvcnRvUmVzaWR1byIsInBlbmRpbmdDaGVja3MiLCJyZWFsUGF5bWVudE1ldGhvZHMiLCJtYXAiLCJjIiwicGF5bWVudE1ldGhvZHNDb25maWd1cmF0aW9ucyIsIm1vZHVsZSIsInRoZUNsYXNzIiwiRXJyb3IiLCJtIiwic2V0QW1vdW50Iiwic2V0Q3VycmVuY3kiLCJzZXRQYXltZW50SWQiLCJpZF9wYWdhbWVudG9fb25saW5lIiwic2V0SWRDb250cmF0dG8iLCJpZGNvbnRyYXR0byIsInNldEJhc2VVcmwiLCJzZXRJbmZvIiwic2V0RGIiLCJkYkNvbm5lY3Rpb24iLCJzZXRTZXNzaW9uIiwic2V0VXJsQ29kZSIsInF1ZXJ5IiwiZXNjYXBlIiwidGhlbiIsInJlc3VsdHMiLCJsZW5ndGgiLCJnZXRSZWFkeSIsInBtIiwibWFwU2VyaWVzIiwiY2IiLCJlIiwiZXJyIiwiUHJvbWlzZSIsInJlamVjdCIsInBlbmRpbmdUcmFuc2FjdGlvbiIsInRyYW5zYWN0aW9uUmVzdWx0IiwiY29tcGxldGVkIiwicmVsb2FkVGltZW91dCIsImxpc3RUcmFuc2FjdGlvbnNVcmwiLCJteVRyYW5zYWN0aW9ucyIsInJlc3VsdCIsImZ1bGxDb25maWciLCJKU09OIiwicGFyc2UiLCJ0eXBlIiwiYW1vdW50IiwiY2hhcmdldG90YWwiLCJzdGF0dXMiLCJyZW1vdGVzdGF0dXMiLCJkYXRlIiwiZGF0YWNyZWF6aW9uZSIsInRyYW5zYWN0aW9ucyIsInBvc3QiLCJjb250cmF0dG8iLCJib2R5IiwiY29udGFjdFJlYXNvbiIsImNvbnRhY3RNZXNzYWdlIiwiZmlsZXMiLCJ0ZXN0ZmlsZSIsImNvbnRhY3RBdHRhY2htZW50IiwiZGF0YSIsImJ5dGVMZW5ndGgiLCJmb3JtRXJyb3IiLCJmaWxlIiwiZmlsZW5hbWUiLCJuYW1lIiwiZmlsZW1pbWUiLCJtaW1ldHlwZSIsImZpbGVkYXRhIiwiSURDb250cmF0dG8iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUEsSUFBTUEsU0FBUyxrQkFBUUMsTUFBUixFQUFmOztBQUVBRCxPQUFPRSxHQUFQLENBQVcsT0FBWCx1QkFBK0IsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQVdDLElBQVgsRUFBb0I7QUFBQSxNQUUvQ0MsT0FGK0MsR0FHN0NILEdBSDZDLENBRS9DRyxPQUYrQztBQUlqRDs7QUFDQUYsTUFBSUcsTUFBSixjQUF3QkMsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0JOLElBQUlPLFVBQXRCLEVBQWtDO0FBQ3hEQywwQkFBb0JMLFFBQVFNLGFBQVIsQ0FBc0JDLFVBQXRCLENBQWlDQyxRQURHO0FBRXhEQyx1QkFBbUIsSUFGcUM7QUFHeERDLGdDQUE0QixJQUg0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aUJJLE1BQWpCLENBQXdCaUMsYUFBeEIsQ0FKSixpQkFLSWhHLElBQUkyRCxZQUFKLENBQWlCSSxNQUFqQixDQUF3QmtDLGNBQXhCLENBTEosaUJBTUlqRyxJQUFJMkQsWUFBSixDQUFpQkksTUFBakIsQ0FBd0I4QyxRQUF4QixDQU5KLGlCQU9JN0csSUFBSTJELFlBQUosQ0FBaUJJLE1BQWpCLENBQXdCMEMsUUFBeEIsQ0FQSixpQkFRSXpHLElBQUkyRCxZQUFKLENBQWlCSSxNQUFqQixDQUF3QjRDLFFBQXhCLENBUkosaUJBU0kzRyxJQUFJMkQsWUFBSixDQUFpQkksTUFBakIsQ0FBd0IvRCxJQUFJRyxPQUFKLENBQVlpQixJQUFwQyxDQVRKLGNBV0M0QyxJQVhELENBWUUsVUFBQ2lCLE1BQUQsRUFBWTtBQUNWaEYsVUFBSUcsTUFBSixxQkFBK0JDLE9BQU9DLE1BQVAsQ0FBYyxFQUFkLEVBQWtCTixJQUFJTyxVQUF0QixFQUFrQztBQUMvREMsZ0RBRCtEO0FBRS9EUSxxQkFBYWhCLElBQUlnQixXQUY4QztBQUcvREMsbUJBQVdqQixJQUFJaUI7QUFIZ0QsT0FBbEMsQ0FBL0I7QUFLRCxLQWxCSCxFQW1CRSxVQUFDc0QsQ0FBRDtBQUFBLGFBQU9FLFFBQVFDLE1BQVIsQ0FBZUgsQ0FBZixDQUFQO0FBQUEsS0FuQkY7QUFzQkQ7QUFDRixDQXJFRDs7a0JBdUVlMUUsTSIsImZpbGUiOiJ2aXZyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XHJcbmltcG9ydCBhc3luYyBmcm9tICdhc3luYyc7XHJcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnL2NvbmZpZy5qc29uJztcclxuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi9saWJzL2xvZ2dlcic7XHJcbmltcG9ydCBjaGVja2F1dGggZnJvbSAnLi4vbGlicy9jaGVja2F1dGgnO1xyXG5pbXBvcnQgcGF5bWVudE1ldGhvZHMgZnJvbSAnLi4vcGF5bWVudG1ldGhvZHMvJztcclxuaW1wb3J0IHtnZXREYXRlLCBjcmVhdGVIYXNoLCBjcmVhdGVSZXNwb25zZUhhc2h9IGZyb20gJy4uL2xpYnMvYm5sUG9zaXRpdml0eSc7XHJcblxyXG5jb25zdCByb3V0ZXIgPSBleHByZXNzLlJvdXRlcigpO1xyXG5cclxucm91dGVyLmdldCgnL2hvbWUnLCBjaGVja2F1dGgsIChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gIGNvbnN0IHtcclxuICAgIHNlc3Npb25cclxuICB9ID0gcmVxO1xyXG4gIC8vIGNvbnNvbGUubG9nKCdmdWxsRGJSZWNvcmRzJywgcmVxLnNlc3Npb24uZnVsbERiUmVjb3Jkcyk7XHJcbiAgcmVzLnJlbmRlcihgdml2ci9ob21lYCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgIHRpdGxlOiBgQmVudmVudXRvICR7c2Vzc2lvbi5mdWxsRGJSZWNvcmRzLmFuYWdyYWZpY2EuRGViaXRvcmV9YCxcclxuICAgIGFuYWdyYWZpY2FFbmFibGVkOiB0cnVlLFxyXG4gICAgaW5mb3JtYXppb25pTWFuZGF0b0VuYWJsZWQ6IHRydWUsXHJcbiAgICBwYXlOb3dFbmFibGVkOiB0cnVlLFxyXG4gICAgY29udGFjdEVuYWJsZWQ6IHRydWUsXHJcbiAgICB2aWV3RW5naW5lczogcmVxLnZpZXdFbmdpbmVzLFxyXG4gICAgdmlld1Jvb3RzOiByZXEudmlld1Jvb3RzXHJcbiAgfSkpO1xyXG59KTtcclxuXHJcbnJvdXRlci5nZXQoJy9jbG9zZXNlc3Npb24nLCAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICBjb25zdCB7XHJcbiAgICBzZXNzaW9uXHJcbiAgfSA9IHJlcTtcclxuICAvLyBjb25zb2xlLmxvZygnZnVsbERiUmVjb3JkcycsIHJlcS5zZXNzaW9uLmZ1bGxEYlJlY29yZHMpO1xyXG4gIGNvbnN0IGRvbWFpbiA9IHR5cGVvZiBzZXNzaW9uLmRvbWFpbiAhPT0gJ3VuZGVmaW5lZCcgPyBzZXNzaW9uLmRvbWFpbiA6ICdkZWZhdWx0JztcclxuICAvLyByZXEuc2Vzc2lvbi5yZWdlbmVyYXRlKCgpID0+IHtcclxuICAgIHJlcS5zZXNzaW9uLmRiUmVjb3JkID0gbnVsbDtcclxuICAgIHJlcS5zZXNzaW9uLmNvZGUgPSBudWxsO1xyXG4gICAgcmVxLnNlc3Npb24udmFsaWRDb2RlID0gZmFsc2U7XHJcbiAgICByZXEuc2Vzc2lvbi5hc2tDb25maXJtZWQgPSBmYWxzZTtcclxuICAgIHJlcS5zZXNzaW9uLmZ1bGxuYW1lQ29uZmlybWVkID0gZmFsc2U7XHJcbiAgICByZXEuc2Vzc2lvbi5hdXRoZW50aWNhdGVkID0gZmFsc2U7XHJcbiAgICBjb25zb2xlLmxvZygnQ2xvc2luZyBzZXNzaW9uIGZvciBhZGRyZXNzJywgcmVxLmlwLCByZXEuc2Vzc2lvbklELCByZXEub3JpZ2luYWxVcmwpO1xyXG4gICAgcmVxLnNlc3Npb24uZG9tYWluID0gZG9tYWluO1xyXG4gICAgcmVxLnNlc3Npb24uc2F2ZSgoc2F2ZUVycm9yKSA9PiB7XHJcbiAgICAgIHJlcy5yZW5kZXIoYHZpdnIvbG9nb3V0YCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgICAgICB0aXRsZTogYFVzY2l0YWAsXHJcbiAgICAgICAgZG9tYWluLFxyXG4gICAgICAgIHZpZXdFbmdpbmVzOiByZXEudmlld0VuZ2luZXMsXHJcbiAgICAgICAgdmlld1Jvb3RzOiByZXEudmlld1Jvb3RzXHJcbiAgICAgIH0pKTtcclxuICAgIH0pO1xyXG4gIC8vIH0pO1xyXG59KTtcclxuXHJcbnJvdXRlci5nZXQoJy9hbmFncmFmaWNhJywgY2hlY2thdXRoLCAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICBjb25zdCB7XHJcbiAgICBzZXNzaW9uXHJcbiAgfSA9IHJlcTtcclxuICAvLyBjb25zb2xlLmxvZygnZnVsbERiUmVjb3JkcycsIHJlcS5zZXNzaW9uLmZ1bGxEYlJlY29yZHMpO1xyXG4gIGxvZ2dlcihyZXEsIGBBY2Nlc3NvIHBhZ2luYSBhbmFncmFmaWNhYCwgJ3dlYicsIHJlcS5zZXNzaW9uLmNvZGUpO1xyXG4gIHJlcy5yZW5kZXIoYHZpdnIvYW5hZ3JhZmljYWAsIE9iamVjdC5hc3NpZ24oe30sIHJlcS5iYXNlUGFyYW1zLCB7XHJcbiAgICB0aXRsZTogYERhdGkgYW5hZ3JhZmljaWAsXHJcbiAgICBpbmZvcm1hemlvbmlNYW5kYXRvRW5hYmxlZDogdHJ1ZSxcclxuICAgIHBheU5vd0VuYWJsZWQ6IHRydWUsXHJcbiAgICBjb250YWN0RW5hYmxlZDogdHJ1ZSxcclxuICAgIGhvbWVFbmFibGVkOiB0cnVlLFxyXG4gICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcclxuICAgIHZpZXdSb290czogcmVxLnZpZXdSb290c1xyXG4gIH0pKTtcclxufSk7XHJcblxyXG5yb3V0ZXIuZ2V0KCcvaW5mb3JtYXppb25pbWFuZGF0bycsIGNoZWNrYXV0aCwgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgY29uc3Qge1xyXG4gICAgc2Vzc2lvblxyXG4gIH0gPSByZXE7XHJcbiAgbG9nZ2VyKHJlcSwgYEFjY2Vzc28gcGFnaW5hIG1hbmRhdG9gLCAnd2ViJywgcmVxLnNlc3Npb24uY29kZSk7XHJcbiAgcmVzLnJlbmRlcihgdml2ci9pbmZvcm1hemlvbmltYW5kYXRvYCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgIHRpdGxlOiBgUE9TSVpJT05FIERFQklUT1JJQWAsXHJcbiAgICAvLyBpbmZvcm1hemlvbmlNYW5kYXRvRW5hYmxlZDogdHJ1ZSxcclxuICAgIHBheU5vd0VuYWJsZWQ6IHRydWUsXHJcbiAgICBjb250YWN0RW5hYmxlZDogdHJ1ZSxcclxuICAgIGhvbWVFbmFibGVkOiB0cnVlLFxyXG4gICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcclxuICAgIHZpZXdSb290czogcmVxLnZpZXdSb290c1xyXG4gIH0pKTtcclxufSk7XHJcblxyXG5yb3V0ZXIuZ2V0KCcvcGFnYW9yYScsIGNoZWNrYXV0aCwgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgY29uc3Qge1xyXG4gICAgc2Vzc2lvblxyXG4gIH0gPSByZXE7XHJcbiAgY29uc3Qge1xyXG4gICAgZGJSZWNvcmQsXHJcbiAgICBmdWxsRGJSZWNvcmRzXHJcbiAgfSA9IHNlc3Npb247XHJcbiAgY29uc3Qge1xyXG4gICAgcGF5bWVudE1ldGhvZHM6IGVuYWJsZWRQYXltZW50TWV0aG9kc1xyXG4gIH0gPSBmdWxsRGJSZWNvcmRzO1xyXG5cclxuICBjb25zdCB0b3RhbGVEYVBhZ2FyZSA9IGZ1bGxEYlJlY29yZHMuaW1wb3J0aS5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IHtcclxuICAgIHJldHVybiBwcmV2ICsgY3Vyci5pbXBvcnRvUmVzaWR1bztcclxuICB9LCAwKTtcclxuICBzZXNzaW9uLnBlbmRpbmdDaGVja3MgPSAwO1xyXG5cclxuICAvLyBjb25zb2xlLmxvZygnZW5hYmxlZFBheW1lbnRNZXRob2RzJywgZW5hYmxlZFBheW1lbnRNZXRob2RzKTtcclxuXHJcbiAgY29uc3QgcmVhbFBheW1lbnRNZXRob2RzID0gZW5hYmxlZFBheW1lbnRNZXRob2RzLm1hcCgoYykgPT4ge1xyXG4gICAgaWYgKCFzZXNzaW9uLnBheW1lbnRNZXRob2RzQ29uZmlndXJhdGlvbnMpIHtcclxuICAgICAgc2Vzc2lvbi5wYXltZW50TWV0aG9kc0NvbmZpZ3VyYXRpb25zID0ge307XHJcbiAgICB9XHJcbiAgICBzZXNzaW9uLnBheW1lbnRNZXRob2RzQ29uZmlndXJhdGlvbnNbYy5tb2R1bGVdID0gYztcclxuICAgIGNvbnN0IHRoZUNsYXNzID0gcGF5bWVudE1ldGhvZHNbYy5tb2R1bGVdO1xyXG4gICAgaWYgKCF0aGVDbGFzcykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kIGEgbW9kdWxlIHdpdGggbmFtZTogJHtjLm1vZHVsZX1gKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG0gPSBuZXcgdGhlQ2xhc3MoYyk7XHJcbiAgICBtLnNldEFtb3VudCh0b3RhbGVEYVBhZ2FyZSk7XHJcbiAgICBtLnNldEN1cnJlbmN5KCdFVVInKTtcclxuICAgIG0uc2V0UGF5bWVudElkKGRiUmVjb3JkLmlkX3BhZ2FtZW50b19vbmxpbmUpO1xyXG4gICAgbS5zZXRJZENvbnRyYXR0byhkYlJlY29yZC5pZGNvbnRyYXR0byk7XHJcbiAgICBtLnNldEJhc2VVcmwocmVxLmdldCgnaG9zdCcpKTtcclxuICAgIG0uc2V0SW5mbyhgUGFnYW1lbnRvIG9ubGluZSBwZXIgaWQ6ICR7ZGJSZWNvcmQuaWRfcGFnYW1lbnRvX29ubGluZX1gKTtcclxuICAgIG0uc2V0RGIocmVxLmRiQ29ubmVjdGlvbik7XHJcbiAgICBtLnNldFNlc3Npb24ocmVxLnNlc3Npb24pO1xyXG4gICAgbS5zZXRVcmxDb2RlKHJlcS5zZXNzaW9uLmNvZGUpO1xyXG4gICAgcmV0dXJuIG07XHJcbiAgfSk7XHJcblxyXG4gIC8vIGNvbnNvbGUubG9nKCdyZWFsUGF5bWVudE1ldGhvZHMnLCByZWFsUGF5bWVudE1ldGhvZHMpO1xyXG5cclxuXHJcbiAgcmVxLmRiQ29ubmVjdGlvbi5xdWVyeShgU0VMRUNUICogRlJPTSBvbmxpbmVQYXltZW50VHJhbnNhY3Rpb25zIFdIRVJFIHBheW1lbnRJZCA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoZGJSZWNvcmQuaWRfcGFnYW1lbnRvX29ubGluZSl9IEFORCBjb21wbGV0ZWQgPSAxIEFORCAoc3RhdHVzID0gJ1BFTkRJTkcnIE9SIHN0YXR1cyA9ICdBUFBST1ZFRCcpYClcclxuICAudGhlbihcclxuICAgIChyZXN1bHRzKSA9PiB7XHJcbiAgICAgIGlmIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoKSB7XHJcbiAgICAgICAgcmVzLnJlbmRlcihgdml2ci9wYXltZW50YWxyZWFkeW1hZGVgLCBPYmplY3QuYXNzaWduKHt9LCByZXEuYmFzZVBhcmFtcywge1xyXG4gICAgICAgICAgdGl0bGU6IGBQYWdhbWVudG8gZ2kmYWdyYXZlOyBlc2VndWl0b2AsXHJcbiAgICAgICAgICBwYXltZW50TWV0aG9kczogcmVhbFBheW1lbnRNZXRob2RzLFxyXG4gICAgICAgICAgYW5hZ3JhZmljYUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICBpbmZvcm1hemlvbmlNYW5kYXRvRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgIGNvbnRhY3RFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgaG9tZUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICB2aWV3RW5naW5lczogcmVxLnZpZXdFbmdpbmVzLFxyXG4gICAgICAgICAgdmlld1Jvb3RzOiByZXEudmlld1Jvb3RzXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IGdldFJlYWR5ID0gcmVhbFBheW1lbnRNZXRob2RzLm1hcCgocG0pID0+IHtcclxuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihwbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHBtLmdldFJlYWR5KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0ocG0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3BheW1lbnRNZXRob2RzJywgc2Vzc2lvbi5kb21haW4sIHBheW1lbnRNZXRob2RzKTtcclxuICAgICAgICBhc3luYy5tYXBTZXJpZXMocmVhbFBheW1lbnRNZXRob2RzLCAocG0sIGNiKSA9PiB7XHJcbiAgICAgICAgICBwbS5nZXRSZWFkeSgpXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNiKG51bGwpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFJywgZSk7XHJcbiAgICAgICAgICAgICAgY2IodHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSwgKGVycikgPT4ge1xyXG4gICAgICAgICAgaWYgKCFlcnIpIHtcclxuICAgICAgICAgICAgbG9nZ2VyKHJlcSwgYEFjY2Vzc28gcGFnaW5hIHBhZ2FtZW50b2AsICd3ZWInLCByZXEuc2Vzc2lvbi5jb2RlKTtcclxuICAgICAgICAgICAgcmVzLnJlbmRlcihgdml2ci9jaG9vc2VwYXltZW50bWV0aG9kYCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgICAgICAgICAgICB0aXRsZTogYFNjZWdsaSBpbCBtZXRvZG8gZGkgcGFnYW1lbnRvYCxcclxuICAgICAgICAgICAgICBwYXltZW50TWV0aG9kczogcmVhbFBheW1lbnRNZXRob2RzLFxyXG4gICAgICAgICAgICAgIGFuYWdyYWZpY2FFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgIGluZm9ybWF6aW9uaU1hbmRhdG9FbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgIGNvbnRhY3RFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgIGhvbWVFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgIHZpZXdFbmdpbmVzOiByZXEudmlld0VuZ2luZXMsXHJcbiAgICAgICAgICAgICAgdmlld1Jvb3RzOiByZXEudmlld1Jvb3RzXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG5leHQoZXJyKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICk7XHJcblxyXG5cclxufSk7XHJcblxyXG5yb3V0ZXIuZ2V0KCcvd2FpdHRyYW5zYWN0aW9ucmVzdWx0JywgY2hlY2thdXRoLCAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICBjb25zdCB7XHJcbiAgICBzZXNzaW9uXHJcbiAgfSA9IHJlcTtcclxuICBzZXNzaW9uLnBlbmRpbmdDaGVja3MgPSBzZXNzaW9uLnBlbmRpbmdDaGVja3MgPiAtMSA/IHNlc3Npb24ucGVuZGluZ0NoZWNrcyArPSAxIDogc2Vzc2lvbi5wZW5kaW5nQ2hlY2tzID0gMDtcclxuICBpZiAoIXNlc3Npb24ucGVuZGluZ1RyYW5zYWN0aW9uKSB7XHJcbiAgICBuZXh0KCcvaG9tZScpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICAvLyBjb25zb2xlLmxvZygnd2FpdHRyYW5zYWN0aW9ucmVzdWx0Jyk7XHJcbiAgcmVxLmRiQ29ubmVjdGlvbi5xdWVyeShgU0VMRUNUIGNvbXBsZXRlZCwgc3RhdHVzLCByZW1vdGVzdGF0dXMgRlJPTSBvbmxpbmVQYXltZW50VHJhbnNhY3Rpb25zIFdIRVJFIGlkID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShzZXNzaW9uLnBlbmRpbmdUcmFuc2FjdGlvbil9YClcclxuICAudGhlbihcclxuICAgIChyZXN1bHRzKSA9PiB7XHJcbiAgICAgIGlmICghcmVzdWx0cyB8fCByZXN1bHRzLmxlbmd0aCAhPT0gMSkge1xyXG4gICAgICAgIG5leHQoJy9ob21lJyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uUmVzdWx0ID0gcmVzdWx0c1swXTtcclxuICAgICAgICBpZiAoIXRyYW5zYWN0aW9uUmVzdWx0LmNvbXBsZXRlZCkge1xyXG4gICAgICAgICAgcmVzLnJlbmRlcihgdml2ci9wbGVhc2V3YWl0YCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgICAgICAgICAgdGl0bGU6IGBBdHRlbmRlcmUuLi5gLFxyXG4gICAgICAgICAgICByZWxvYWRUaW1lb3V0OiA1MDAwLFxyXG4gICAgICAgICAgICBwZW5kaW5nQ2hlY2tzOiBzZXNzaW9uLnBlbmRpbmdDaGVja3MsXHJcbiAgICAgICAgICAgIGxpc3RUcmFuc2FjdGlvbnNVcmw6ICcvdml2ci9zaG93dHJhbnNhY3Rpb25zJyxcclxuICAgICAgICAgICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcclxuICAgICAgICAgICAgdmlld1Jvb3RzOiByZXEudmlld1Jvb3RzXHJcbiAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCd0cmFuc2FjdGlvblJlc3VsdCcsIHRyYW5zYWN0aW9uUmVzdWx0KTtcclxuICAgICAgICAgIHJlcy5yZW5kZXIoYHZpdnIvdHJhbnNhY3Rpb25jb21wbGV0ZWRgLCBPYmplY3QuYXNzaWduKHt9LCByZXEuYmFzZVBhcmFtcywge1xyXG4gICAgICAgICAgICB0aXRsZTogYFRyYW5zYXppb25lIGNvbXBsZXRhYCxcclxuICAgICAgICAgICAgdHJhbnNhY3Rpb25SZXN1bHQsXHJcbiAgICAgICAgICAgIGxpc3RUcmFuc2FjdGlvbnNVcmw6ICcvdml2ci9zaG93dHJhbnNhY3Rpb25zJyxcclxuICAgICAgICAgICAgYW5hZ3JhZmljYUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIGluZm9ybWF6aW9uaU1hbmRhdG9FbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICBwYXlOb3dFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICB2aWV3RW5naW5lczogcmVxLnZpZXdFbmdpbmVzLFxyXG4gICAgICAgICAgICB2aWV3Um9vdHM6IHJlcS52aWV3Um9vdHNcclxuICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICApXHJcbn0pO1xyXG5cclxucm91dGVyLmdldCgnL3Nob3d0cmFuc2FjdGlvbnMnLCBjaGVja2F1dGgsIChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gIGNvbnN0IHtcclxuICAgIHNlc3Npb25cclxuICB9ID0gcmVxO1xyXG4gIGNvbnN0IHtcclxuICAgIGRiUmVjb3JkXHJcbiAgfSA9IHNlc3Npb247XHJcbiAgcmVxLmRiQ29ubmVjdGlvbi5xdWVyeShgU0VMRUNUIGZ1bGxDb25maWcsIHN0YXR1cywgcmVtb3Rlc3RhdHVzLCBkYXRhY3JlYXppb25lIEZST00gb25saW5lUGF5bWVudFRyYW5zYWN0aW9ucyBXSEVSRSBpZENvbnRyYXR0byA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoZGJSZWNvcmQuaWRjb250cmF0dG8pfSBBTkQgY29tcGxldGVkID0gMSBPUkRFUiBCWSBkYXRhY3JlYXppb25lIERFU0NgKVxyXG4gIC50aGVuKFxyXG4gICAgKHJlc3VsdHMpID0+IHtcclxuICAgICAgY29uc3QgbXlUcmFuc2FjdGlvbnMgPSByZXN1bHRzLm1hcCgocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgZnVsbENvbmZpZyA9IEpTT04ucGFyc2UocmVzdWx0LmZ1bGxDb25maWcpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBmdWxsQ29uZmlnLFxyXG4gICAgICAgICAgdHlwZTogZnVsbENvbmZpZy50aXRsZSxcclxuICAgICAgICAgIGFtb3VudDogZnVsbENvbmZpZy5jaGFyZ2V0b3RhbCxcclxuICAgICAgICAgIHN0YXR1czogcmVzdWx0LnN0YXR1cyxcclxuICAgICAgICAgIHJlbW90ZXN0YXR1czogcmVzdWx0LnJlbW90ZXN0YXR1cyxcclxuICAgICAgICAgIGRhdGU6IHJlc3VsdC5kYXRhY3JlYXppb25lXHJcbiAgICAgICAgfTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJlcy5yZW5kZXIoYHZpdnIvc2hvd3RyYW5zYWN0aW9uc2AsIE9iamVjdC5hc3NpZ24oe30sIHJlcS5iYXNlUGFyYW1zLCB7XHJcbiAgICAgICAgdGl0bGU6IGBMaXN0YSB0cmFuc2F6aW9uaWAsXHJcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBteVRyYW5zYWN0aW9ucyxcclxuICAgICAgICBhbmFncmFmaWNhRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBpbmZvcm1hemlvbmlNYW5kYXRvRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBjb250YWN0RW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBob21lRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICB2aWV3RW5naW5lczogcmVxLnZpZXdFbmdpbmVzLFxyXG4gICAgICAgIHZpZXdSb290czogcmVxLnZpZXdSb290c1xyXG4gICAgICB9KSk7XHJcbiAgICB9LFxyXG4gICAgKGUpID0+IHtcclxuICAgICAgbmV4dCg1MDApO1xyXG4gICAgfVxyXG4gICk7XHJcblxyXG59KTtcclxuXHJcbnJvdXRlci5nZXQoJy9zZW5kbWVzc2FnZScsIGNoZWNrYXV0aCwgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgY29uc3Qge1xyXG4gICAgc2Vzc2lvblxyXG4gIH0gPSByZXE7XHJcbiAgcmVzLnJlbmRlcihgdml2ci9zZW5kbWVzc2FnZWAsIE9iamVjdC5hc3NpZ24oe30sIHJlcS5iYXNlUGFyYW1zLCB7XHJcbiAgICB0aXRsZTogYEludmlhIG1lc3NhZ2dpb2AsXHJcbiAgICBhbmFncmFmaWNhRW5hYmxlZDogdHJ1ZSxcclxuICAgIGluZm9ybWF6aW9uaU1hbmRhdG9FbmFibGVkOiB0cnVlLFxyXG4gICAgcGF5Tm93RW5hYmxlZDogdHJ1ZSxcclxuICAgIGhvbWVFbmFibGVkOiB0cnVlLFxyXG4gICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcclxuICAgIHZpZXdSb290czogcmVxLnZpZXdSb290c1xyXG4gIH0pKTtcclxufSk7XHJcblxyXG5yb3V0ZXIucG9zdCgnL3NlbmRtZXNzYWdlJywgY2hlY2thdXRoLCAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICBjb25zdCB7XHJcbiAgICBzZXNzaW9uXHJcbiAgfSA9IHJlcTtcclxuICBjb25zdCB7XHJcbiAgICBmdWxsRGJSZWNvcmRzXHJcbiAgfSA9IHNlc3Npb247XHJcbiAgY29uc3Qge1xyXG4gICAgY29udHJhdHRvXHJcbiAgfSA9IGZ1bGxEYlJlY29yZHM7XHJcbiAgY29uc3Qge1xyXG4gICAgYm9keVxyXG4gIH0gPSByZXE7XHJcbiAgY29uc3Qge1xyXG4gICAgY29udGFjdFJlYXNvbixcclxuICAgIGNvbnRhY3RNZXNzYWdlXHJcbiAgfSA9IGJvZHk7XHJcbiAgY29uc3Qge1xyXG4gICAgZmlsZXNcclxuICB9ID0gcmVxO1xyXG4gIGNvbnN0IHRlc3RmaWxlID0gZmlsZXMgJiYgZmlsZXMuY29udGFjdEF0dGFjaG1lbnQgPyBmaWxlcy5jb250YWN0QXR0YWNobWVudCA6IG51bGw7XHJcbiAgaWYgKCFjb250YWN0UmVhc29uIHx8ICFjb250YWN0TWVzc2FnZSB8fCAodGVzdGZpbGUgJiYgdGVzdGZpbGUuZGF0YS5ieXRlTGVuZ3RoID09PSA1MTIwMDApKSB7XHJcbiAgICBsZXQgZm9ybUVycm9yID0gJzx1bD4nO1xyXG4gICAgaWYgKHRlc3RmaWxlICYmIHRlc3RmaWxlLmRhdGEuYnl0ZUxlbmd0aCA9PT0gNTEyMDAwKSB7XHJcbiAgICAgIGZvcm1FcnJvciArPSAnPGxpPkxcXCdhbGxlZ2F0byAmZWdyYXZlOyB0cm9wcG8gZ3JhbmRlITwvbGk+JztcclxuICAgIH1cclxuICAgIGlmICghY29udGFjdFJlYXNvbikge1xyXG4gICAgICBmb3JtRXJyb3IgKz0gJzxsaT5MXFwnb2dnZXR0byAmZWdyYXZlOyB2dW90byE8L2xpPic7XHJcbiAgICB9XHJcbiAgICBpZiAoIWNvbnRhY3RNZXNzYWdlKSB7XHJcbiAgICAgIGZvcm1FcnJvciArPSAnPGxpPklsIG1lc3NhZ2dpbyAmZWdyYXZlOyB2dW90byE8L2xpPic7XHJcbiAgICB9XHJcbiAgICByZXMucmVuZGVyKGB2aXZyL3NlbmRtZXNzYWdlYCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgICAgdGl0bGU6IGBJbnZpYSBtZXNzYWdnaW9gLFxyXG4gICAgICBjb250YWN0TWVzc2FnZSxcclxuICAgICAgY29udGFjdFJlYXNvbixcclxuICAgICAgZm9ybUVycm9yLFxyXG4gICAgICB2aWV3RW5naW5lczogcmVxLnZpZXdFbmdpbmVzLFxyXG4gICAgICB2aWV3Um9vdHM6IHJlcS52aWV3Um9vdHNcclxuICAgIH0pKTtcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3QgZmlsZSA9IGZpbGVzICYmIGZpbGVzLmNvbnRhY3RBdHRhY2htZW50ID8gZmlsZXMuY29udGFjdEF0dGFjaG1lbnQgOiBudWxsO1xyXG4gICAgY29uc3QgZmlsZW5hbWUgPSBmaWxlID8gZmlsZS5uYW1lIDogbnVsbDtcclxuICAgIGNvbnN0IGZpbGVtaW1lID0gZmlsZSA/IGZpbGUubWltZXR5cGUgOiBudWxsO1xyXG4gICAgY29uc3QgZmlsZWRhdGEgPSBmaWxlID8gZmlsZS5kYXRhIDogbnVsbDtcclxuXHJcbiAgICByZXEuZGJDb25uZWN0aW9uXHJcbiAgICAucXVlcnkoYElOU0VSVCBpbnRvIG9ubGluZU1lc3NhZ2VzIChpZGNvbnRyYXR0bywgb2dnZXR0bywgbWVzc2FnZ2lvLCBhdHRhY2htZW50LCBhdHRhY2htZW50X25hbWUsIGF0dGFjaG1lbnRfbWltZXR5cGUsIHRyYWNraW5nKVxyXG4gICAgVkFMVUVTIChcclxuICAgICAgJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShjb250cmF0dG8uSURDb250cmF0dG8pfSxcclxuICAgICAgJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShjb250YWN0UmVhc29uKX0sXHJcbiAgICAgICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoY29udGFjdE1lc3NhZ2UpfSxcclxuICAgICAgJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShmaWxlZGF0YSl9LFxyXG4gICAgICAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGZpbGVuYW1lKX0sXHJcbiAgICAgICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoZmlsZW1pbWUpfSxcclxuICAgICAgJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShyZXEuc2Vzc2lvbi5jb2RlKX1cclxuICAgIClgKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChyZXN1bHQpID0+IHtcclxuICAgICAgICByZXMucmVuZGVyKGB2aXZyL21lc3NhZ2VzZW50YCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgICAgICAgIHRpdGxlOiBgTWVzc2FnZ2lvIGludmlhdG8gY29ycmV0dGFtZW50ZWAsXHJcbiAgICAgICAgICB2aWV3RW5naW5lczogcmVxLnZpZXdFbmdpbmVzLFxyXG4gICAgICAgICAgdmlld1Jvb3RzOiByZXEudmlld1Jvb3RzXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9LFxyXG4gICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgIClcclxuXHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjtcclxuIl19