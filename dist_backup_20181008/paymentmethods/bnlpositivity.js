'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stripslashes = require('../libs/stripslashes');

var _stripslashes2 = _interopRequireDefault(_stripslashes);

var _basemethod = require('./basemethod');

var _basemethod2 = _interopRequireDefault(_basemethod);

var _formatCurrency = require('format-currency');

var _formatCurrency2 = _interopRequireDefault(_formatCurrency);

var _sha = require('sha1');

var _sha2 = _interopRequireDefault(_sha);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _logger = require('../libs/logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var bin2hex = function bin2hex(s) {
  var i = void 0;
  var l = void 0;
  var o = '';
  var n = void 0;
  s += '';
  for (i = 0, l = s.length; i < l; i += 1) {
    n = s.charCodeAt(i).toString(16);
    o += n.length < 2 ? '0' + n : n;
  }
  return o;
};

var createHashFromArray = function createHashFromArray(arrayOfStrings) {
  var fullString = arrayOfStrings.reduce(function (prev, curr) {
    return '' + prev + curr;
  }, '');
  var ascii = bin2hex(fullString);
  return (0, _sha2.default)(ascii);
};

var getDate = function getDate() {
  return (0, _moment2.default)().format('YYYY:MM:DD-HH:mm:ss');
};

var bnlPositivity = function (_baseMethod) {
  _inherits(bnlPositivity, _baseMethod);

  function bnlPositivity(params) {
    _classCallCheck(this, bnlPositivity);

    var _this = _possibleConstructorReturn(this, (bnlPositivity.__proto__ || Object.getPrototypeOf(bnlPositivity)).call(this, params));

    _this.gateWay = params.param1;
    _this.secret = params.param2;
    _this.storeId = params.param3;
    return _this;
  }

  _createClass(bnlPositivity, [{
    key: 'getIntro',
    value: function getIntro() {
      var fullText = this.description;
      var total = this.amount;
      var commission = 0;
      if (this.commission) {
        if (this.commission_type === 'percentage') {
          commission = total / 100 * this.commission;
          total += commission;
        } else {
          commission = this.commission;
          total += commission;
        }
      }
      total = total.toFixed(2);
      // console.log('Here?', this.commission_type, this.commission);
      if (commission > 0 && this.commission_type === 'percentage') {
        fullText += '<br />';
        fullText += 'Al pagamento richiesto sar&agrave; aggiunta, a titolo di commissione, la quota dell\'' + this.commission + '%, pari ad ' + (0, _formatCurrency2.default)(commission, { format: '%s%v', symbol: '&euro; ', locale: 'it-IT' }) + ', per un <strong>totale di ' + (0, _formatCurrency2.default)(total, { format: '%s%v', symbol: '&euro; ', locale: 'it-IT' }) + '</strong>';
      } else if (this.commission > 0) {
        fullText += '<br />';
        fullText += 'Al pagamento richiesto sar&agrave; aggiunta, a titolo di commissione, la somma fissa di ' + (0, _formatCurrency2.default)(commission, { format: '%s%v', symbol: '&euro; ', locale: 'it-IT' }) + ', per un <strong>totale di ' + (0, _formatCurrency2.default)(total, { format: '%s%v', symbol: '&euro; ', locale: 'it-IT' }) + '</strong>';
      }
      return fullText;
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      return this.title;
    }
  }, {
    key: 'getForm',
    value: function getForm() {
      var dateTime = this.dateTime;
      var total = this.amount;
      var commission = 0;
      if (this.commission) {
        if (this.commission_type === 'percentage') {
          commission = total / 100 * this.commission;
          total += commission;
        } else {
          commission = this.commission;
          total += commission;
        }
      }
      total = total.toFixed(2);
      // storeId, dateTime, chargeTotal, currency, signature
      var hash = createHashFromArray([this.storeId, dateTime, total, this.currency, this.secret]);
      return '\n      <form action="' + this.gateWay + '" method="POST">\n        <input type="hidden" name="txntype" value="PURCHASE">\n        <input type="hidden" name="timezone" value="CET">\n        <input type="hidden" name="txndatetime" value="' + dateTime + '">\n        <input type="hidden" name="hash" value="' + hash + '">\n        <input type="hidden" name="storename" value="' + this.storeId + '">\n        <input type="hidden" name="mode" value="payonly">\n        <input type="hidden" name="currency" value="' + this.currency + '">\n        <input type="hidden" name="language" value="IT">\n        <input type="hidden" name="oid" value="' + this.paymentId + '">\n        <input type="hidden" name="addInfo3" value="' + this.info + '">\n        <input type="hidden" name="addInfo4" value="' + this.localInfo + '">\n        <input type="hidden" name="responseSuccessURL" value="https://payment.serfin97srl.com/callback/bnl_positivity_success">\n        <input type="hidden" name="responseFailURL" value="https://payment.serfin97srl.com/callback/bnl_positivity_failure">\n        <input type="hidden" name="transactionNotificationURL" value="https://payment.serfin97srl.com/callback/bnl_transaction_check">\n        <input type="hidden" name="chargetotal" value="' + total + '">\n        <div class="form-group row">\n          <button type="submit" class="btn btn-primary">Procedi con il pagamento</button>\n        </div>\n      </form>\n    ';
    }
  }, {
    key: 'setLocalInfo',
    value: function setLocalInfo(info) {
      this.localInfo = info;
    }
  }, {
    key: 'getReady',
    value: function getReady() {
      var _JSON$stringify,
          _JSON$stringify2,
          _this2 = this;

      if (!this.db) {
        return Promise.reject('DB FAILURE');
      }
      this.dateTime = getDate();
      var total = this.amount;
      var commission = 0;
      if (this.commission) {
        if (this.commission_type === 'percentage') {
          commission = total / 100 * this.commission;
          total += commission;
        } else {
          commission = this.commission;
          total += commission;
        }
      }
      total = total.toFixed(2);
      console.log('Full Query', 'INSERT INTO\n      onlinePaymentTransactions (\n        module,\n        fullconfig,\n        paymentId,\n        idContratto,\n        status,\n        amount,\n        commission,\n        total\n      ) VALUES (\n        ' + this.db.escape('bnlpositivity') + ',\n        ' + this.db.escape(JSON.stringify((_JSON$stringify = {
        urlCode: this.urlCode,
        idContratto: this.idContratto,
        paymentId: this.paymentId,
        commission_type: this.commission_type,
        commission: this.commission,
        amount: this.amount,
        secret: this.secret,
        gateWay: this.gateWay,
        storeId: this.storeId
      }, _defineProperty(_JSON$stringify, 'amount', this.amount), _defineProperty(_JSON$stringify, 'currency', this.currency), _defineProperty(_JSON$stringify, 'dateTime', this.dateTime), _defineProperty(_JSON$stringify, 'chargetotal', total), _defineProperty(_JSON$stringify, 'title', this.getTitle()), _defineProperty(_JSON$stringify, 'intro', this.getIntro()), _JSON$stringify))) + ',\n        ' + this.db.escape(this.paymentId) + ',\n        ' + this.db.escape(this.idContratto) + ',\n        ' + this.db.escape('Waiting') + ',\n        ' + this.db.escape(this.amount) + ',\n        ' + this.db.escape(commission) + ',\n        ' + this.db.escape(total) + '\n      )');
      return this.db.query('INSERT INTO\n      onlinePaymentTransactions (\n        module,\n        fullconfig,\n        paymentId,\n        idContratto,\n        status,\n        amount,\n        commission,\n        total\n      ) VALUES (\n        ' + this.db.escape('bnlpositivity') + ',\n        ' + this.db.escape(JSON.stringify((_JSON$stringify2 = {
        urlCode: this.urlCode,
        idContratto: this.idContratto,
        paymentId: this.paymentId,
        commission_type: this.commission_type,
        commission: this.commission,
        amount: this.amount,
        secret: this.secret,
        gateWay: this.gateWay,
        storeId: this.storeId
      }, _defineProperty(_JSON$stringify2, 'amount', this.amount), _defineProperty(_JSON$stringify2, 'currency', this.currency), _defineProperty(_JSON$stringify2, 'dateTime', this.dateTime), _defineProperty(_JSON$stringify2, 'chargetotal', total), _defineProperty(_JSON$stringify2, 'title', this.getTitle()), _defineProperty(_JSON$stringify2, 'intro', this.getIntro()), _JSON$stringify2))) + ',\n        ' + this.db.escape(this.paymentId) + ',\n        ' + this.db.escape(this.idContratto) + ',\n        ' + this.db.escape('Waiting') + ',\n        ' + this.db.escape(this.amount) + ',\n        ' + this.db.escape(commission) + ',\n        ' + this.db.escape(total) + '\n      )').then(function () {
        return _this2.db.query('SELECT LAST_INSERT_ID() as myId');
      }, function (e) {
        return Promise.reject(e);
      }).then(function (results) {
        _this2.setLocalInfo(results[0].myId);
        return Promise.resolve();
      }, function (e) {
        return Promise.reject(e);
      });
    }
  }], [{
    key: 'getCallBackUrls',
    value: function getCallBackUrls() {
      return [{
        url: 'bnl_transaction_check',
        method: 'checkTransaction',
        httpMethod: 'post'
      }, {
        url: 'bnl_positivity_success',
        method: 'checkSuccess',
        httpMethod: 'post'
      }, {
        url: 'bnl_positivity_failure',
        method: 'checkUserFailure',
        httpMethod: 'post'
      }];
    }
  }, {
    key: 'checkUserFailure',
    value: function checkUserFailure(req, res, next) {
      var session = req.session,
          body = req.body;

      if (!body || !body.approval_code) {
        console.warn('[BNL Positivity] Fraud attempt, invalid body');
        (0, _logger2.default)(req, 'Tentativo di post senza validi parametri', 'audit').then(function (result) {
          next(500);
        });
        return;
      }
      var approval_code = body.approval_code,
          remotestatus = body.status,
          terminal_id = body.terminal_id,
          currency = body.currency,
          chargetotal = body.chargetotal,
          txntype = body.txntype,
          ERROR_LIST = body.ERROR_LIST,
          MYBANK = body.MYBANK,
          oid = body.oid,
          refnumber = body.refnumber,
          addInfo3 = body.addInfo3,
          addInfo4 = body.addInfo4,
          response_hash = body.response_hash;


      req.dbConnection.query('SELECT * FROM onlinePaymentTransactions WHERE ID = ' + req.dbConnection.escape(addInfo4)).then(function (results) {
        if (!results || results.length !== 1) {
          console.warn('Unable to validate addInfo4', addInfo4);
          return Promise.reject('Unable to validate addInfo4');
        }
        // console.log(results);
        return results[0];
      }, function (e) {
        return Promise.reject(e);
      }).then(function (txConfig) {
        var fullConfig = JSON.parse(txConfig.fullconfig);
        var myHash = createHashFromArray([fullConfig.secret, approval_code, fullConfig.chargetotal, 'EUR', fullConfig.dateTime, fullConfig.storeId]);
        if (myHash === response_hash) {
          // console.log('TXID', txConfig.ID);
          return Promise.resolve(fullConfig);
        } else {
          console.warn('[BNL Positivity] invalid hash', myHash, notification_hash);
          var status = 'FRAUD';
          return req.dbConnection.query('UPDATE onlinePaymentTransactions SET\n            completed = 1,\n            status = ' + req.dbConnection.escape(status) + ',\n            remotestatus = ' + req.dbConnection.escape(remotestatus) + '\n            body = ' + req.dbConnection.escape(JSON.stringify(req.body)) + ',\n            updatetime = NOW()\n            WHERE ID = ' + req.dbConnection.escape(addInfo4)).then(function (result) {
            return Promise.reject('Fraud');
          }, function (e) {
            return Promise.reject(e);
          });
        }
        // return Promise.reject('Wrong hash');
      }, function (e) {
        return Promise.reject(e);
      }).then(function (fullConfig) {
        var status = 'NOT APPROVED';
        var realApprovalCode = approval_code;
        if (approval_code.substr(0, 1) === 'Y') {
          status = 'PENDING';
          if (remotestatus === 'APPROVED' || remotestatus === 'APPROVATO' || remotestatus === 'GENEHMIGT') {
            status = 'APPROVED';
          }
        }
        // console.log('Db query', `UPDATE onlinePaymentTransactions SET completed = 1, status = ${req.dbConnection.escape(status)}, remotestatus = ${req.dbConnection.escape(remotestatus)} WHERE ID = ${req.dbConnection.escape(addInfo4)}`);
        return req.dbConnection.query('UPDATE onlinePaymentTransactions SET\n          approvalCode = ' + req.dbConnection.escape(realApprovalCode) + ',\n          completed = 1,\n          status = ' + req.dbConnection.escape(status) + ',\n          remotestatus = ' + req.dbConnection.escape((0, _stripslashes2.default)(remotestatus || null)) + ',\n          body = ' + req.dbConnection.escape(JSON.stringify(req.body)) + ',\n          updatetime = NOW()\n          WHERE ID = ' + req.dbConnection.escape(addInfo4) + '\n        ').then(function () {
          return Promise.resolve();
        }, function (e) {
          return Promise.reject(e);
        }).then(function () {
          return Promise.resolve(fullConfig);
        }, function (e) {
          return Promise.reject(e);
        });
      }, function (e) {
        return Promise.reject(e);
      }).then(function (fullConfig) {
        (0, _logger2.default)(req, 'Pagamento annullato da codice url: ' + fullConfig.urlCode, 'log', fullConfig.urlCode);
        return req.dbConnection.query('SELECT\n          SUM(ImportiContratto.ValoreA) AS affidato,\n          SUM(ImportiContratto.ValoreR) AS recuperato,\n          LookupImporti.NomeImportoEsteso as NomeImporto,\n          ImportiContratto.IDImporto,\n          SUM(ValoreA - ValoreR) AS importoResiduo\n        FROM LookupImporti, ImportiContratto\n        WHERE ImportiContratto.idContratto = ' + req.dbConnection.escape(fullConfig.idContratto) + ' AND LookupImporti.ID = ImportiContratto.IDImporto\n        GROUP BY ImportiContratto.IDImporto\n        ORDER BY ImportiContratto.IDImporto').then(function (results) {
          session.pendingTransaction = addInfo4;
          // console.log('req.session.fullDbRecords', req.session);
          req.session.fullDbRecords.importi = results;
          return Promise.resolve();
        }, function (e) {
          next(e);
        });
      }, function (e) {
        res.status(500).send('Something is not quite as it should!');
      }).then(function (result) {
        res.redirect('/vivr/waittransactionresult');
      }, function (e) {
        next(e);
      });
    }
  }, {
    key: 'checkSuccess',
    value: function checkSuccess(req, res, next) {
      (0, _logger2.default)(req, 'BNL Positivity, checking success with full body: ' + JSON.stringify(req.body), 'log');
      var session = req.session,
          body = req.body;
      var dbRecord = session.dbRecord;

      if (!body || !body.approval_code) {
        console.warn('[BNL Positivity] Fraud attempt, invalid body');
        (0, _logger2.default)(req, 'Tentativo di post senza validi parametri', 'audit').then(function (result) {
          next('Fraud attempt');
        });
        return;
      }
      var approval_code = body.approval_code,
          status = body.status,
          terminal_id = body.terminal_id,
          currency = body.currency,
          chargetotal = body.chargetotal,
          txntype = body.txntype,
          ERROR_LIST = body.ERROR_LIST,
          MYBANK = body.MYBANK,
          oid = body.oid,
          refnumber = body.refnumber,
          addInfo3 = body.addInfo3,
          addInfo4 = body.addInfo4,
          response_hash = body.response_hash;

      if (!addInfo4) {
        res.render(session.domain + '/vivr/genericerror', Object.assign({}, req.baseParams, {
          title: 'Errore in fase di pagamento',
          body: 'Si &egrave; verificato un errore in fase di pagamento, ti preghiamo di riprovare nuovamente.',
          anagraficaEnabled: true,
          informazioniMandatoEnabled: true,
          payNowEnabled: true,
          contactEnabled: true,
          homeEnabled: true
        }));
        return;
      }
      // console.log('${req.dbConnection.escape(addInfo4)}', req.dbConnection.escape(addInfo4));
      req.dbConnection.query('SELECT * FROM onlinePaymentTransactions WHERE ID = ' + req.dbConnection.escape(addInfo4)).then(function (results) {
        if (!results || results.length !== 1) {
          return Promise.reject('Unable to validate addInfo4: ' + addInfo4);
        }
        // console.log(results);
        return results[0];
      }, function (e) {
        return Promise.reject(e);
      }).then(function (txConfig) {
        var fullConfig = JSON.parse(txConfig.fullconfig);
        // console.log('fullConfig', fullConfig);
        var myHash = createHashFromArray([fullConfig.secret, approval_code, fullConfig.chargetotal, 'EUR', fullConfig.dateTime, fullConfig.storeId]);
        if (myHash === response_hash) {
          session.pendingTransaction = txConfig.ID;
          return Promise.resolve();
        }
        return Promise.reject('Wrong hash: ' + myHash + ' !== ' + response_hash);
      }, function (e) {
        return Promise.reject(e);
      }).then(function (result) {
        req.dbConnection.query('SELECT\n          SUM(ImportiContratto.ValoreA) AS affidato,\n          SUM(ImportiContratto.ValoreR) AS recuperato,\n          LookupImporti.NomeImportoEsteso as NomeImporto,\n          ImportiContratto.IDImporto,\n          SUM(ValoreA - ValoreR) AS importoResiduo\n        FROM LookupImporti, ImportiContratto\n        WHERE ImportiContratto.idContratto = ' + req.dbConnection.escape(dbRecord.idcontratto) + ' AND LookupImporti.ID = ImportiContratto.IDImporto\n        GROUP BY ImportiContratto.IDImporto\n        ORDER BY ImportiContratto.IDImporto').then(function (results) {
          req.session.fullDbRecords.importi = results;
          res.redirect('/vivr/waittransactionresult');
        }, function (e) {
          next(e);
        });
      }, function (e) {
        console.warn('[BNL Positivity] Fraud attempt', e);
        (0, _logger2.default)(req, e, 'audit').then(function (result) {
          next('Fraud attempt');
        });
      });
    }
  }, {
    key: 'checkFailure',
    value: function checkFailure(req, res, next) {
      (0, _logger2.default)(req, 'BNL Positivity, checking failure with full body: ' + JSON.stringify(req.body), 'log');
      var session = req.session;

      res.render(session.domain + '/vivr/genericerror', Object.assign({}, req.baseParams, {
        title: 'Errore in fase di pagamento',
        body: 'Si &egrave; verificato un errore in fase di pagamento, ti preghiamo di riprovare nuovamente.',
        anagraficaEnabled: true,
        informazioniMandatoEnabled: true,
        payNowEnabled: true,
        contactEnabled: true,
        homeEnabled: true
      }));
    }
  }, {
    key: 'checkTransaction',
    value: function checkTransaction(req, res, next) {
      (0, _logger2.default)(req, 'BNL Positivity, transaction with full body: ' + JSON.stringify(req.body), 'log');
      var session = req.session,
          body = req.body;
      var dbRecord = session.dbRecord;

      if (!body || !body.approval_code) {
        console.warn('[BNL Positivity] Fraud attempt, invalid body');
        (0, _logger2.default)(req, 'Tentativo di post senza validi parametri', 'audit').then(function (result) {
          next(500);
        });
        return;
      }
      var approval_code = body.approval_code,
          remotestatus = body.status,
          terminal_id = body.terminal_id,
          currency = body.currency,
          chargetotal = body.chargetotal,
          txntype = body.txntype,
          ERROR_LIST = body.ERROR_LIST,
          MYBANK = body.MYBANK,
          oid = body.oid,
          refnumber = body.refnumber,
          addInfo3 = body.addInfo3,
          addInfo4 = body.addInfo4,
          response_hash = body.response_hash;


      req.dbConnection.query('SELECT * FROM onlinePaymentTransactions WHERE ID = ' + req.dbConnection.escape(addInfo4) + ' and completed = 0').then(function (results) {
        if (!results || results.length !== 1) {
          // logger(req, note, severity = 'debug', tracking = null)
          (0, _logger2.default)(req, 'Unable to validate addInfo4 in check transaction, ' + addInfo4 + ', possible duplicate transaction notification');
          console.warn('Unable to validate addInfo4 in check transaction', addInfo4);
          return Promise.reject('Unable to validate addInfo4 in check transaction ' + addInfo4);
        }
        // console.log(results);
        return results[0];
      }, function (e) {
        return Promise.reject(e);
      }).then(function (txConfig) {
        var fullConfig = JSON.parse(txConfig.fullconfig);
        var myHash = createHashFromArray([fullConfig.secret, approval_code, fullConfig.chargetotal, 'EUR', fullConfig.dateTime, fullConfig.storeId]);
        if (myHash === response_hash) {
          // console.log('TXID', txConfig.ID);
          return Promise.resolve(fullConfig);
        } else {
          console.warn('[BNL Positivity] invalid hash', myHash, notification_hash);
          var status = 'FRAUD';
          return req.dbConnection.query('UPDATE onlinePaymentTransactions SET\n            completed = 1,\n            status = ' + req.dbConnection.escape(status) + ',\n            remotestatus = ' + req.dbConnection.escape(remotestatus) + '\n            body = ' + req.dbConnection.escape(JSON.stringify(req.body)) + ',\n            updatetime = NOW()\n            WHERE ID = ' + req.dbConnection.escape(addInfo4)).then(function (result) {
            return Promise.reject('Fraud');
          }, function (e) {
            return Promise.reject(e);
          });
        }
        // return Promise.reject('Wrong hash');
      }, function (e) {
        return Promise.reject(e);
      }).then(function (fullConfig) {
        var status = 'NOT APPROVED';
        var realApprovalCode = approval_code;
        if (approval_code.substr(0, 1) === 'Y') {
          status = 'PENDING';
          if (remotestatus === 'APPROVED' || remotestatus === 'APPROVATO' || remotestatus === 'GENEHMIGT') {
            status = 'APPROVED';
          }
        }
        // console.log('Db query', `UPDATE onlinePaymentTransactions SET completed = 1, status = ${req.dbConnection.escape(status)}, remotestatus = ${req.dbConnection.escape(remotestatus)} WHERE ID = ${req.dbConnection.escape(addInfo4)}`);
        return req.dbConnection.query('UPDATE onlinePaymentTransactions SET\n          approvalCode = ' + req.dbConnection.escape(realApprovalCode) + ',\n          completed = 1,\n          status = ' + req.dbConnection.escape(status) + ',\n          remotestatus = ' + req.dbConnection.escape((0, _stripslashes2.default)(remotestatus || null)) + ',\n          body = ' + req.dbConnection.escape(JSON.stringify(req.body)) + ',\n          updatetime = NOW()\n          WHERE ID = ' + req.dbConnection.escape(addInfo4) + '\n        ').then(function () {
          if (status === 'APPROVED' || status === 'PENDING') {
            // idContratto, amount, type, reference
            var tmpVal = {
              module: 'bnlPositivity',
              paymentId: fullConfig.paymentId,
              txId: addInfo4
            };

            return _basemethod2.default.insertPaymentIntoMainframe(req.dbConnection, fullConfig.idContratto, fullConfig.amount, 'BON', JSON.stringify(tmpVal));
          }
          return Promise.resolve();
        }, function (e) {
          return Promise.reject(e);
        }).then(function () {
          return Promise.resolve(fullConfig);
        }, function (e) {
          return Promise.reject(e);
        });
      }, function (e) {
        return Promise.reject(e);
      }).then(function (fullConfig) {
        (0, _logger2.default)(req, 'Pagamento effettuato da codice url: ' + fullConfig.urlCode, 'web', fullConfig.urlCode);
        res.status(200).send('Thank you!');
      }, function (e) {
        res.status(500).send('Something is not quite as it should!');
      });
    }
  }]);

  return bnlPositivity;
}(_basemethod2.default);

exports.default = bnlPositivity;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXltZW50bWV0aG9kcy9ibmxwb3NpdGl2aXR5LmpzIl0sIm5hbWVzIjpbImJpbjJoZXgiLCJzIiwiaSIsImwiLCJvIiwibiIsImxlbmd0aCIsImNoYXJDb2RlQXQiLCJ0b1N0cmluZyIsImNyZWF0ZUhhc2hGcm9tQXJyYXkiLCJhcnJheU9mU3RyaW5ncyIsImZ1bGxTdHJpbmciLCJyZWR1Y2UiLCJwcmV2IiwiY3VyciIsImFzY2lpIiwiZ2V0RGF0ZSIsImZvcm1hdCIsImJubFBvc2l0aXZpdHkiLCJwYXJhbXMiLCJnYXRlV2F5IiwicGFyYW0xIiwic2VjcmV0IiwicGFyYW0yIiwic3RvcmVJZCIsInBhcmFtMyIsImZ1bGxUZXh0IiwiZGVzY3JpcHRpb24iLCJ0b3RhbCIsImFtb3VudCIsImNvbW1pc3Npb24iLCJjb21taXNzaW9uX3R5cGUiLCJ0b0ZpeGVkIiwic3ltYm9sIiwibG9jYWxlIiwidGl0bGUiLCJkYXRlVGltZSIsImhhc2giLCJjdXJyZW5jeSIsInBheW1lbnRJZCIsImluZm8iLCJsb2NhbEluZm8iLCJkYiIsIlByb21pc2UiLCJyZWplY3QiLCJjb25zb2xlIiwibG9nIiwiZXNjYXBlIiwiSlNPTiIsInN0cmluZ2lmeSIsInVybENvZGUiLCJpZENvbnRyYXR0byIsImdldFRpdGxlIiwiZ2V0SW50cm8iLCJxdWVyeSIsInRoZW4iLCJlIiwicmVzdWx0cyIsInNldExvY2FsSW5mbyIsIm15SWQiLCJyZXNvbHZlIiwidXJsIiwibWV0aG9kIiwiaHR0cE1ldGhvZCIsInJlcSIsInJlcyIsIm5leHQiLCJzZXNzaW9uIiwiYm9keSIsImFwcHJvdmFsX2NvZGUiLCJ3YXJuIiwicmVzdWx0IiwicmVtb3Rlc3RhdHVzIiwic3RhdHVzIiwidGVybWluYWxfaWQiLCJjaGFyZ2V0b3RhbCIsInR4bnR5cGUiLCJFUlJPUl9MSVNUIiwiTVlCQU5LIiwib2lkIiwicmVmbnVtYmVyIiwiYWRkSW5mbzMiLCJhZGRJbmZvNCIsInJlc3BvbnNlX2hhc2giLCJkYkNvbm5lY3Rpb24iLCJ0eENvbmZpZyIsImZ1bGxDb25maWciLCJwYXJzZSIsImZ1bGxjb25maWciLCJteUhhc2giLCJub3RpZmljYXRpb25faGFzaCIsInJlYWxBcHByb3ZhbENvZGUiLCJzdWJzdHIiLCJwZW5kaW5nVHJhbnNhY3Rpb24iLCJmdWxsRGJSZWNvcmRzIiwiaW1wb3J0aSIsInNlbmQiLCJyZWRpcmVjdCIsImRiUmVjb3JkIiwicmVuZGVyIiwiZG9tYWluIiwiT2JqZWN0IiwiYXNzaWduIiwiYmFzZVBhcmFtcyIsImFuYWdyYWZpY2FFbmFibGVkIiwiaW5mb3JtYXppb25pTWFuZGF0b0VuYWJsZWQiLCJwYXlOb3dFbmFibGVkIiwiY29udGFjdEVuYWJsZWQiLCJob21lRW5hYmxlZCIsIklEIiwiaWRjb250cmF0dG8iLCJ0bXBWYWwiLCJtb2R1bGUiLCJ0eElkIiwiaW5zZXJ0UGF5bWVudEludG9NYWluZnJhbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7OztBQUVBLElBQU1BLFVBQVUsU0FBVkEsT0FBVSxDQUFDQyxDQUFELEVBQU87QUFDckIsTUFBSUMsVUFBSjtBQUNBLE1BQUlDLFVBQUo7QUFDQSxNQUFJQyxJQUFJLEVBQVI7QUFDQSxNQUFJQyxVQUFKO0FBQ0FKLE9BQUssRUFBTDtBQUNBLE9BQUtDLElBQUksQ0FBSixFQUFPQyxJQUFJRixFQUFFSyxNQUFsQixFQUEwQkosSUFBSUMsQ0FBOUIsRUFBaUNELEtBQUssQ0FBdEMsRUFBeUM7QUFDdkNHLFFBQUlKLEVBQUVNLFVBQUYsQ0FBYUwsQ0FBYixFQUFnQk0sUUFBaEIsQ0FBeUIsRUFBekIsQ0FBSjtBQUNBSixTQUFLQyxFQUFFQyxNQUFGLEdBQVcsQ0FBWCxHQUFlLE1BQU1ELENBQXJCLEdBQXlCQSxDQUE5QjtBQUNEO0FBQ0QsU0FBT0QsQ0FBUDtBQUNELENBWEQ7O0FBYUEsSUFBTUssc0JBQXNCLFNBQXRCQSxtQkFB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RUEwRkUsVUFBQ3hDLENBQUQsRUFBTztBQUNMUyxZQUFJUSxNQUFKLENBQVcsR0FBWCxFQUFnQnVCLElBQWhCLENBQXFCLHNDQUFyQjtBQUNELE9BNUZIO0FBOEZEOzs7Ozs7a0JBaGFrQjlFLGEiLCJmaWxlIjoiYm5scG9zaXRpdml0eS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdHJpcHNsYXNoZXMgZnJvbSAnLi4vbGlicy9zdHJpcHNsYXNoZXMnO1xyXG5pbXBvcnQgYmFzZU1ldGhvZCBmcm9tICcuL2Jhc2VtZXRob2QnO1xyXG5pbXBvcnQgZm9ybWF0Q3VycmVuY3kgZnJvbSAnZm9ybWF0LWN1cnJlbmN5JztcclxuaW1wb3J0IHNoYTEgZnJvbSAnc2hhMSc7XHJcbmltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50JztcclxuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi9saWJzL2xvZ2dlcic7XHJcblxyXG5jb25zdCBiaW4yaGV4ID0gKHMpID0+IHtcclxuICBsZXQgaTtcclxuICBsZXQgbDtcclxuICBsZXQgbyA9ICcnO1xyXG4gIGxldCBuO1xyXG4gIHMgKz0gJyc7XHJcbiAgZm9yIChpID0gMCwgbCA9IHMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XHJcbiAgICBuID0gcy5jaGFyQ29kZUF0KGkpLnRvU3RyaW5nKDE2KTtcclxuICAgIG8gKz0gbi5sZW5ndGggPCAyID8gJzAnICsgbiA6IG47XHJcbiAgfVxyXG4gIHJldHVybiBvO1xyXG59XHJcblxyXG5jb25zdCBjcmVhdGVIYXNoRnJvbUFycmF5ID0gKGFycmF5T2ZTdHJpbmdzKSA9PiB7XHJcbiAgY29uc3QgZnVsbFN0cmluZyA9IGFycmF5T2ZTdHJpbmdzLnJlZHVjZSgocHJldiwgY3VycikgPT4ge1xyXG4gICAgcmV0dXJuIGAke3ByZXZ9JHtjdXJyfWA7XHJcbiAgfSwgJycpO1xyXG4gIGNvbnN0IGFzY2lpID0gYmluMmhleChmdWxsU3RyaW5nKTtcclxuICByZXR1cm4gc2hhMShhc2NpaSk7XHJcbn1cclxuXHJcbmNvbnN0IGdldERhdGUgPSAoKSA9PiB7XHJcbiAgcmV0dXJuIG1vbWVudCgpLmZvcm1hdCgnWVlZWTpNTTpERC1ISDptbTpzcycpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBibmxQb3NpdGl2aXR5IGV4dGVuZHMgYmFzZU1ldGhvZCB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xyXG4gICAgc3VwZXIocGFyYW1zKTtcclxuICAgIHRoaXMuZ2F0ZVdheSA9IHBhcmFtcy5wYXJhbTE7XHJcbiAgICB0aGlzLnNlY3JldCA9IHBhcmFtcy5wYXJhbTI7XHJcbiAgICB0aGlzLnN0b3JlSWQgPSBwYXJhbXMucGFyYW0zO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGdldENhbGxCYWNrVXJscygpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgIHtcclxuICAgICAgICB1cmw6ICdibmxfdHJhbnNhY3Rpb25fY2hlY2snLFxyXG4gICAgICAgIG1ldGhvZDogJ2NoZWNrVHJhbnNhY3Rpb24nLFxyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdwb3N0J1xyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgdXJsOiAnYm5sX3Bvc2l0aXZpdHlfc3VjY2VzcycsXHJcbiAgICAgICAgbWV0aG9kOiAnY2hlY2tTdWNjZXNzJyxcclxuICAgICAgICBodHRwTWV0aG9kOiAncG9zdCdcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIHVybDogJ2JubF9wb3NpdGl2aXR5X2ZhaWx1cmUnLFxyXG4gICAgICAgIG1ldGhvZDogJ2NoZWNrVXNlckZhaWx1cmUnLFxyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdwb3N0J1xyXG4gICAgICB9XHJcbiAgICBdXHJcbiAgfVxyXG5cclxuICBzdGF0aWMgY2hlY2tVc2VyRmFpbHVyZShyZXEsIHJlcywgbmV4dCkge1xyXG4gICAgY29uc3Qge1xyXG4gICAgICBzZXNzaW9uLFxyXG4gICAgICBib2R5XHJcbiAgICB9ID0gcmVxO1xyXG4gICAgaWYgKCFib2R5IHx8ICFib2R5LmFwcHJvdmFsX2NvZGUpIHtcclxuICAgICAgY29uc29sZS53YXJuKCdbQk5MIFBvc2l0aXZpdHldIEZyYXVkIGF0dGVtcHQsIGludmFsaWQgYm9keScpO1xyXG4gICAgICBsb2dnZXIocmVxLCBgVGVudGF0aXZvIGRpIHBvc3Qgc2VuemEgdmFsaWRpIHBhcmFtZXRyaWAsICdhdWRpdCcpLnRoZW4oXHJcbiAgICAgICAgKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgbmV4dCg1MDApO1xyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3Qge1xyXG4gICAgICBhcHByb3ZhbF9jb2RlLFxyXG4gICAgICBzdGF0dXM6IHJlbW90ZXN0YXR1cyxcclxuICAgICAgdGVybWluYWxfaWQsXHJcbiAgICAgIGN1cnJlbmN5LFxyXG4gICAgICBjaGFyZ2V0b3RhbCxcclxuICAgICAgdHhudHlwZSxcclxuICAgICAgRVJST1JfTElTVCxcclxuICAgICAgTVlCQU5LLFxyXG4gICAgICBvaWQsXHJcbiAgICAgIHJlZm51bWJlcixcclxuICAgICAgYWRkSW5mbzMsXHJcbiAgICAgIGFkZEluZm80LFxyXG4gICAgICByZXNwb25zZV9oYXNoXHJcbiAgICB9ID0gYm9keTtcclxuXHJcbiAgICByZXEuZGJDb25uZWN0aW9uLnF1ZXJ5KGBTRUxFQ1QgKiBGUk9NIG9ubGluZVBheW1lbnRUcmFuc2FjdGlvbnMgV0hFUkUgSUQgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGFkZEluZm80KX1gKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChyZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgaWYgKCFyZXN1bHRzIHx8IHJlc3VsdHMubGVuZ3RoICE9PSAxKSB7XHJcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ1VuYWJsZSB0byB2YWxpZGF0ZSBhZGRJbmZvNCcsIGFkZEluZm80KTtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnVW5hYmxlIHRvIHZhbGlkYXRlIGFkZEluZm80Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHJlc3VsdHMpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHRzWzBdO1xyXG4gICAgICB9LFxyXG4gICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgIClcclxuICAgIC50aGVuKFxyXG4gICAgICAodHhDb25maWcpID0+IHtcclxuICAgICAgICBjb25zdCBmdWxsQ29uZmlnID0gSlNPTi5wYXJzZSh0eENvbmZpZy5mdWxsY29uZmlnKTtcclxuICAgICAgICBjb25zdCBteUhhc2ggPSBjcmVhdGVIYXNoRnJvbUFycmF5KFtmdWxsQ29uZmlnLnNlY3JldCwgYXBwcm92YWxfY29kZSwgZnVsbENvbmZpZy5jaGFyZ2V0b3RhbCwgJ0VVUicsIGZ1bGxDb25maWcuZGF0ZVRpbWUsIGZ1bGxDb25maWcuc3RvcmVJZF0pO1xyXG4gICAgICAgIGlmIChteUhhc2ggPT09IHJlc3BvbnNlX2hhc2gpIHtcclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdUWElEJywgdHhDb25maWcuSUQpO1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmdWxsQ29uZmlnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS53YXJuKCdbQk5MIFBvc2l0aXZpdHldIGludmFsaWQgaGFzaCcsIG15SGFzaCwgbm90aWZpY2F0aW9uX2hhc2gpO1xyXG4gICAgICAgICAgY29uc3Qgc3RhdHVzID0gJ0ZSQVVEJztcclxuICAgICAgICAgIHJldHVybiByZXEuZGJDb25uZWN0aW9uXHJcbiAgICAgICAgICAucXVlcnkoYFVQREFURSBvbmxpbmVQYXltZW50VHJhbnNhY3Rpb25zIFNFVFxyXG4gICAgICAgICAgICBjb21wbGV0ZWQgPSAxLFxyXG4gICAgICAgICAgICBzdGF0dXMgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKHN0YXR1cyl9LFxyXG4gICAgICAgICAgICByZW1vdGVzdGF0dXMgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKHJlbW90ZXN0YXR1cyl9XHJcbiAgICAgICAgICAgIGJvZHkgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKEpTT04uc3RyaW5naWZ5KHJlcS5ib2R5KSl9LFxyXG4gICAgICAgICAgICB1cGRhdGV0aW1lID0gTk9XKClcclxuICAgICAgICAgICAgV0hFUkUgSUQgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGFkZEluZm80KX1gKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIChyZXN1bHQpID0+IFByb21pc2UucmVqZWN0KCdGcmF1ZCcpLFxyXG4gICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHJldHVybiBQcm9taXNlLnJlamVjdCgnV3JvbmcgaGFzaCcpO1xyXG4gICAgICB9LFxyXG4gICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgIClcclxuICAgIC50aGVuKFxyXG4gICAgICAoZnVsbENvbmZpZykgPT4ge1xyXG4gICAgICAgIGxldCBzdGF0dXMgPSAnTk9UIEFQUFJPVkVEJztcclxuICAgICAgICBsZXQgcmVhbEFwcHJvdmFsQ29kZSA9IGFwcHJvdmFsX2NvZGU7XHJcbiAgICAgICAgaWYgKGFwcHJvdmFsX2NvZGUuc3Vic3RyKDAsIDEpID09PSAnWScpIHtcclxuICAgICAgICAgIHN0YXR1cyA9ICdQRU5ESU5HJztcclxuICAgICAgICAgIGlmIChyZW1vdGVzdGF0dXMgPT09ICdBUFBST1ZFRCcgfHwgcmVtb3Rlc3RhdHVzID09PSAnQVBQUk9WQVRPJyB8fCByZW1vdGVzdGF0dXMgPT09ICdHRU5FSE1JR1QnKSB7XHJcbiAgICAgICAgICAgIHN0YXR1cyA9ICdBUFBST1ZFRCc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdEYiBxdWVyeScsIGBVUERBVEUgb25saW5lUGF5bWVudFRyYW5zYWN0aW9ucyBTRVQgY29tcGxldGVkID0gMSwgc3RhdHVzID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShzdGF0dXMpfSwgcmVtb3Rlc3RhdHVzID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShyZW1vdGVzdGF0dXMpfSBXSEVSRSBJRCA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoYWRkSW5mbzQpfWApO1xyXG4gICAgICAgIHJldHVybiByZXEuZGJDb25uZWN0aW9uXHJcbiAgICAgICAgLnF1ZXJ5KGBVUERBVEUgb25saW5lUGF5bWVudFRyYW5zYWN0aW9ucyBTRVRcclxuICAgICAgICAgIGFwcHJvdmFsQ29kZSA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUocmVhbEFwcHJvdmFsQ29kZSl9LFxyXG4gICAgICAgICAgY29tcGxldGVkID0gMSxcclxuICAgICAgICAgIHN0YXR1cyA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoc3RhdHVzKX0sXHJcbiAgICAgICAgICByZW1vdGVzdGF0dXMgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKHN0cmlwc2xhc2hlcyhyZW1vdGVzdGF0dXMgfHwgbnVsbCkpfSxcclxuICAgICAgICAgIGJvZHkgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKEpTT04uc3RyaW5naWZ5KHJlcS5ib2R5KSl9LFxyXG4gICAgICAgICAgdXBkYXRldGltZSA9IE5PVygpXHJcbiAgICAgICAgICBXSEVSRSBJRCA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoYWRkSW5mbzQpfVxyXG4gICAgICAgIGApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoZnVsbENvbmZpZyksXHJcbiAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICApXHJcbiAgICAgIH0sXHJcbiAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChmdWxsQ29uZmlnKSA9PiB7XHJcbiAgICAgICAgbG9nZ2VyKHJlcSwgYFBhZ2FtZW50byBhbm51bGxhdG8gZGEgY29kaWNlIHVybDogJHtmdWxsQ29uZmlnLnVybENvZGV9YCwgJ2xvZycsIGZ1bGxDb25maWcudXJsQ29kZSk7XHJcbiAgICAgICAgcmV0dXJuIHJlcS5kYkNvbm5lY3Rpb24ucXVlcnkoYFNFTEVDVFxyXG4gICAgICAgICAgU1VNKEltcG9ydGlDb250cmF0dG8uVmFsb3JlQSkgQVMgYWZmaWRhdG8sXHJcbiAgICAgICAgICBTVU0oSW1wb3J0aUNvbnRyYXR0by5WYWxvcmVSKSBBUyByZWN1cGVyYXRvLFxyXG4gICAgICAgICAgTG9va3VwSW1wb3J0aS5Ob21lSW1wb3J0b0VzdGVzbyBhcyBOb21lSW1wb3J0byxcclxuICAgICAgICAgIEltcG9ydGlDb250cmF0dG8uSURJbXBvcnRvLFxyXG4gICAgICAgICAgU1VNKFZhbG9yZUEgLSBWYWxvcmVSKSBBUyBpbXBvcnRvUmVzaWR1b1xyXG4gICAgICAgIEZST00gTG9va3VwSW1wb3J0aSwgSW1wb3J0aUNvbnRyYXR0b1xyXG4gICAgICAgIFdIRVJFIEltcG9ydGlDb250cmF0dG8uaWRDb250cmF0dG8gPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGZ1bGxDb25maWcuaWRDb250cmF0dG8pfSBBTkQgTG9va3VwSW1wb3J0aS5JRCA9IEltcG9ydGlDb250cmF0dG8uSURJbXBvcnRvXHJcbiAgICAgICAgR1JPVVAgQlkgSW1wb3J0aUNvbnRyYXR0by5JREltcG9ydG9cclxuICAgICAgICBPUkRFUiBCWSBJbXBvcnRpQ29udHJhdHRvLklESW1wb3J0b2ApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAocmVzdWx0cykgPT4ge1xyXG4gICAgICAgICAgICBzZXNzaW9uLnBlbmRpbmdUcmFuc2FjdGlvbiA9IGFkZEluZm80O1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygncmVxLnNlc3Npb24uZnVsbERiUmVjb3JkcycsIHJlcS5zZXNzaW9uKTtcclxuICAgICAgICAgICAgcmVxLnNlc3Npb24uZnVsbERiUmVjb3Jkcy5pbXBvcnRpID0gcmVzdWx0cztcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIChlKSA9PiB7IG5leHQoZSk7IH1cclxuICAgICAgICApO1xyXG4gICAgICB9LFxyXG4gICAgICAoZSkgPT4ge1xyXG4gICAgICAgIHJlcy5zdGF0dXMoNTAwKS5zZW5kKCdTb21ldGhpbmcgaXMgbm90IHF1aXRlIGFzIGl0IHNob3VsZCEnKTtcclxuICAgICAgfVxyXG4gICAgKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChyZXN1bHQpID0+IHtcclxuICAgICAgICByZXMucmVkaXJlY3QoJy92aXZyL3dhaXR0cmFuc2FjdGlvbnJlc3VsdCcpO1xyXG4gICAgICB9LFxyXG4gICAgICAoZSkgPT4ge1xyXG4gICAgICAgIG5leHQoZSk7XHJcbiAgICAgIH1cclxuICAgIClcclxuICB9XHJcblxyXG4gIHN0YXRpYyBjaGVja1N1Y2Nlc3MocmVxLCByZXMsIG5leHQpIHtcclxuICAgIGxvZ2dlcihyZXEsIGBCTkwgUG9zaXRpdml0eSwgY2hlY2tpbmcgc3VjY2VzcyB3aXRoIGZ1bGwgYm9keTogJHtKU09OLnN0cmluZ2lmeShyZXEuYm9keSl9YCwgJ2xvZycpXHJcbiAgICBjb25zdCB7XHJcbiAgICAgIHNlc3Npb24sXHJcbiAgICAgIGJvZHlcclxuICAgIH0gPSByZXE7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgIGRiUmVjb3JkXHJcbiAgICB9ID0gc2Vzc2lvbjtcclxuICAgIGlmICghYm9keSB8fCAhYm9keS5hcHByb3ZhbF9jb2RlKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybignW0JOTCBQb3NpdGl2aXR5XSBGcmF1ZCBhdHRlbXB0LCBpbnZhbGlkIGJvZHknKTtcclxuICAgICAgbG9nZ2VyKHJlcSwgYFRlbnRhdGl2byBkaSBwb3N0IHNlbnphIHZhbGlkaSBwYXJhbWV0cmlgLCAnYXVkaXQnKS50aGVuKFxyXG4gICAgICAgIChyZXN1bHQpID0+IHtcclxuICAgICAgICAgIG5leHQoJ0ZyYXVkIGF0dGVtcHQnKTtcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHtcclxuICAgICAgYXBwcm92YWxfY29kZSxcclxuICAgICAgc3RhdHVzLFxyXG4gICAgICB0ZXJtaW5hbF9pZCxcclxuICAgICAgY3VycmVuY3ksXHJcbiAgICAgIGNoYXJnZXRvdGFsLFxyXG4gICAgICB0eG50eXBlLFxyXG4gICAgICBFUlJPUl9MSVNULFxyXG4gICAgICBNWUJBTkssXHJcbiAgICAgIG9pZCxcclxuICAgICAgcmVmbnVtYmVyLFxyXG4gICAgICBhZGRJbmZvMyxcclxuICAgICAgYWRkSW5mbzQsXHJcbiAgICAgIHJlc3BvbnNlX2hhc2hcclxuICAgIH0gPSBib2R5O1xyXG4gICAgaWYgKCFhZGRJbmZvNCkge1xyXG4gICAgICByZXMucmVuZGVyKGAke3Nlc3Npb24uZG9tYWlufS92aXZyL2dlbmVyaWNlcnJvcmAsIE9iamVjdC5hc3NpZ24oe30sIHJlcS5iYXNlUGFyYW1zLCB7XHJcbiAgICAgICAgdGl0bGU6IGBFcnJvcmUgaW4gZmFzZSBkaSBwYWdhbWVudG9gLFxyXG4gICAgICAgIGJvZHk6ICdTaSAmZWdyYXZlOyB2ZXJpZmljYXRvIHVuIGVycm9yZSBpbiBmYXNlIGRpIHBhZ2FtZW50bywgdGkgcHJlZ2hpYW1vIGRpIHJpcHJvdmFyZSBudW92YW1lbnRlLicsXHJcbiAgICAgICAgYW5hZ3JhZmljYUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgaW5mb3JtYXppb25pTWFuZGF0b0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgcGF5Tm93RW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBjb250YWN0RW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBob21lRW5hYmxlZDogdHJ1ZVxyXG4gICAgICB9KSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIC8vIGNvbnNvbGUubG9nKCcke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGFkZEluZm80KX0nLCByZXEuZGJDb25uZWN0aW9uLmVzY2FwZShhZGRJbmZvNCkpO1xyXG4gICAgcmVxLmRiQ29ubmVjdGlvbi5xdWVyeShgU0VMRUNUICogRlJPTSBvbmxpbmVQYXltZW50VHJhbnNhY3Rpb25zIFdIRVJFIElEID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShhZGRJbmZvNCl9YClcclxuICAgIC50aGVuKFxyXG4gICAgICAocmVzdWx0cykgPT4ge1xyXG4gICAgICAgIGlmICghcmVzdWx0cyB8fCByZXN1bHRzLmxlbmd0aCAhPT0gMSkge1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGBVbmFibGUgdG8gdmFsaWRhdGUgYWRkSW5mbzQ6ICR7YWRkSW5mbzR9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHJlc3VsdHMpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHRzWzBdO1xyXG4gICAgICB9LFxyXG4gICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgIClcclxuICAgIC50aGVuKFxyXG4gICAgICAodHhDb25maWcpID0+IHtcclxuICAgICAgICBjb25zdCBmdWxsQ29uZmlnID0gSlNPTi5wYXJzZSh0eENvbmZpZy5mdWxsY29uZmlnKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygnZnVsbENvbmZpZycsIGZ1bGxDb25maWcpO1xyXG4gICAgICAgIGNvbnN0IG15SGFzaCA9IGNyZWF0ZUhhc2hGcm9tQXJyYXkoW2Z1bGxDb25maWcuc2VjcmV0LCBhcHByb3ZhbF9jb2RlLCBmdWxsQ29uZmlnLmNoYXJnZXRvdGFsLCAnRVVSJywgZnVsbENvbmZpZy5kYXRlVGltZSwgZnVsbENvbmZpZy5zdG9yZUlkXSk7XHJcbiAgICAgICAgaWYgKG15SGFzaCA9PT0gcmVzcG9uc2VfaGFzaCkge1xyXG4gICAgICAgICAgc2Vzc2lvbi5wZW5kaW5nVHJhbnNhY3Rpb24gPSB0eENvbmZpZy5JRDtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGBXcm9uZyBoYXNoOiAke215SGFzaH0gIT09ICR7cmVzcG9uc2VfaGFzaH1gKTtcclxuICAgICAgfSxcclxuICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICApXHJcbiAgICAudGhlbihcclxuICAgICAgKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgIHJlcS5kYkNvbm5lY3Rpb24ucXVlcnkoYFNFTEVDVFxyXG4gICAgICAgICAgU1VNKEltcG9ydGlDb250cmF0dG8uVmFsb3JlQSkgQVMgYWZmaWRhdG8sXHJcbiAgICAgICAgICBTVU0oSW1wb3J0aUNvbnRyYXR0by5WYWxvcmVSKSBBUyByZWN1cGVyYXRvLFxyXG4gICAgICAgICAgTG9va3VwSW1wb3J0aS5Ob21lSW1wb3J0b0VzdGVzbyBhcyBOb21lSW1wb3J0byxcclxuICAgICAgICAgIEltcG9ydGlDb250cmF0dG8uSURJbXBvcnRvLFxyXG4gICAgICAgICAgU1VNKFZhbG9yZUEgLSBWYWxvcmVSKSBBUyBpbXBvcnRvUmVzaWR1b1xyXG4gICAgICAgIEZST00gTG9va3VwSW1wb3J0aSwgSW1wb3J0aUNvbnRyYXR0b1xyXG4gICAgICAgIFdIRVJFIEltcG9ydGlDb250cmF0dG8uaWRDb250cmF0dG8gPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGRiUmVjb3JkLmlkY29udHJhdHRvKX0gQU5EIExvb2t1cEltcG9ydGkuSUQgPSBJbXBvcnRpQ29udHJhdHRvLklESW1wb3J0b1xyXG4gICAgICAgIEdST1VQIEJZIEltcG9ydGlDb250cmF0dG8uSURJbXBvcnRvXHJcbiAgICAgICAgT1JERVIgQlkgSW1wb3J0aUNvbnRyYXR0by5JREltcG9ydG9gKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKHJlc3VsdHMpID0+IHtcclxuICAgICAgICAgICAgcmVxLnNlc3Npb24uZnVsbERiUmVjb3Jkcy5pbXBvcnRpID0gcmVzdWx0cztcclxuICAgICAgICAgICAgcmVzLnJlZGlyZWN0KCcvdml2ci93YWl0dHJhbnNhY3Rpb25yZXN1bHQnKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAoZSkgPT4geyBuZXh0KGUpOyB9XHJcbiAgICAgICAgKVxyXG4gICAgICB9LFxyXG4gICAgICAoZSkgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUud2FybignW0JOTCBQb3NpdGl2aXR5XSBGcmF1ZCBhdHRlbXB0JywgZSk7XHJcbiAgICAgICAgbG9nZ2VyKHJlcSwgZSwgJ2F1ZGl0JykudGhlbihcclxuICAgICAgICAgIChyZXN1bHQpID0+IHtcclxuICAgICAgICAgICAgbmV4dCgnRnJhdWQgYXR0ZW1wdCcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gIH1cclxuXHJcbiAgc3RhdGljIGNoZWNrRmFpbHVyZShyZXEsIHJlcywgbmV4dCkge1xyXG4gICAgbG9nZ2VyKHJlcSwgYEJOTCBQb3NpdGl2aXR5LCBjaGVja2luZyBmYWlsdXJlIHdpdGggZnVsbCBib2R5OiAke0pTT04uc3RyaW5naWZ5KHJlcS5ib2R5KX1gLCAnbG9nJylcclxuICAgIGNvbnN0IHtcclxuICAgICAgc2Vzc2lvblxyXG4gICAgfSA9IHJlcTtcclxuICAgIHJlcy5yZW5kZXIoYCR7c2Vzc2lvbi5kb21haW59L3ZpdnIvZ2VuZXJpY2Vycm9yYCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgICAgdGl0bGU6IGBFcnJvcmUgaW4gZmFzZSBkaSBwYWdhbWVudG9gLFxyXG4gICAgICBib2R5OiAnU2kgJmVncmF2ZTsgdmVyaWZpY2F0byB1biBlcnJvcmUgaW4gZmFzZSBkaSBwYWdhbWVudG8sIHRpIHByZWdoaWFtbyBkaSByaXByb3ZhcmUgbnVvdmFtZW50ZS4nLFxyXG4gICAgICBhbmFncmFmaWNhRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgaW5mb3JtYXppb25pTWFuZGF0b0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgIHBheU5vd0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgIGNvbnRhY3RFbmFibGVkOiB0cnVlLFxyXG4gICAgICBob21lRW5hYmxlZDogdHJ1ZVxyXG4gICAgfSkpO1xyXG5cclxuICB9XHJcblxyXG4gIHN0YXRpYyBjaGVja1RyYW5zYWN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XHJcbiAgICBsb2dnZXIocmVxLCBgQk5MIFBvc2l0aXZpdHksIHRyYW5zYWN0aW9uIHdpdGggZnVsbCBib2R5OiAke0pTT04uc3RyaW5naWZ5KHJlcS5ib2R5KX1gLCAnbG9nJyk7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgIHNlc3Npb24sXHJcbiAgICAgIGJvZHlcclxuICAgIH0gPSByZXE7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgIGRiUmVjb3JkXHJcbiAgICB9ID0gc2Vzc2lvbjtcclxuICAgIGlmICghYm9keSB8fCAhYm9keS5hcHByb3ZhbF9jb2RlKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybignW0JOTCBQb3NpdGl2aXR5XSBGcmF1ZCBhdHRlbXB0LCBpbnZhbGlkIGJvZHknKTtcclxuICAgICAgbG9nZ2VyKHJlcSwgYFRlbnRhdGl2byBkaSBwb3N0IHNlbnphIHZhbGlkaSBwYXJhbWV0cmlgLCAnYXVkaXQnKS50aGVuKFxyXG4gICAgICAgIChyZXN1bHQpID0+IHtcclxuICAgICAgICAgIG5leHQoNTAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHtcclxuICAgICAgYXBwcm92YWxfY29kZSxcclxuICAgICAgc3RhdHVzOiByZW1vdGVzdGF0dXMsXHJcbiAgICAgIHRlcm1pbmFsX2lkLFxyXG4gICAgICBjdXJyZW5jeSxcclxuICAgICAgY2hhcmdldG90YWwsXHJcbiAgICAgIHR4bnR5cGUsXHJcbiAgICAgIEVSUk9SX0xJU1QsXHJcbiAgICAgIE1ZQkFOSyxcclxuICAgICAgb2lkLFxyXG4gICAgICByZWZudW1iZXIsXHJcbiAgICAgIGFkZEluZm8zLFxyXG4gICAgICBhZGRJbmZvNCxcclxuICAgICAgcmVzcG9uc2VfaGFzaFxyXG4gICAgfSA9IGJvZHk7XHJcblxyXG4gICAgcmVxLmRiQ29ubmVjdGlvbi5xdWVyeShgU0VMRUNUICogRlJPTSBvbmxpbmVQYXltZW50VHJhbnNhY3Rpb25zIFdIRVJFIElEID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShhZGRJbmZvNCl9IGFuZCBjb21wbGV0ZWQgPSAwYClcclxuICAgIC50aGVuKFxyXG4gICAgICAocmVzdWx0cykgPT4ge1xyXG4gICAgICAgIGlmICghcmVzdWx0cyB8fCByZXN1bHRzLmxlbmd0aCAhPT0gMSkge1xyXG4gICAgICAgICAgLy8gbG9nZ2VyKHJlcSwgbm90ZSwgc2V2ZXJpdHkgPSAnZGVidWcnLCB0cmFja2luZyA9IG51bGwpXHJcbiAgICAgICAgICBsb2dnZXIocmVxLCBgVW5hYmxlIHRvIHZhbGlkYXRlIGFkZEluZm80IGluIGNoZWNrIHRyYW5zYWN0aW9uLCAke2FkZEluZm80fSwgcG9zc2libGUgZHVwbGljYXRlIHRyYW5zYWN0aW9uIG5vdGlmaWNhdGlvbmApO1xyXG4gICAgICAgICAgY29uc29sZS53YXJuKCdVbmFibGUgdG8gdmFsaWRhdGUgYWRkSW5mbzQgaW4gY2hlY2sgdHJhbnNhY3Rpb24nLCBhZGRJbmZvNCk7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYFVuYWJsZSB0byB2YWxpZGF0ZSBhZGRJbmZvNCBpbiBjaGVjayB0cmFuc2FjdGlvbiAke2FkZEluZm80fWApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXN1bHRzKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0c1swXTtcclxuICAgICAgfSxcclxuICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICApXHJcbiAgICAudGhlbihcclxuICAgICAgKHR4Q29uZmlnKSA9PiB7XHJcbiAgICAgICAgY29uc3QgZnVsbENvbmZpZyA9IEpTT04ucGFyc2UodHhDb25maWcuZnVsbGNvbmZpZyk7XHJcbiAgICAgICAgY29uc3QgbXlIYXNoID0gY3JlYXRlSGFzaEZyb21BcnJheShbZnVsbENvbmZpZy5zZWNyZXQsIGFwcHJvdmFsX2NvZGUsIGZ1bGxDb25maWcuY2hhcmdldG90YWwsICdFVVInLCBmdWxsQ29uZmlnLmRhdGVUaW1lLCBmdWxsQ29uZmlnLnN0b3JlSWRdKTtcclxuICAgICAgICBpZiAobXlIYXNoID09PSByZXNwb25zZV9oYXNoKSB7XHJcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnVFhJRCcsIHR4Q29uZmlnLklEKTtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZnVsbENvbmZpZyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnNvbGUud2FybignW0JOTCBQb3NpdGl2aXR5XSBpbnZhbGlkIGhhc2gnLCBteUhhc2gsIG5vdGlmaWNhdGlvbl9oYXNoKTtcclxuICAgICAgICAgIGNvbnN0IHN0YXR1cyA9ICdGUkFVRCc7XHJcbiAgICAgICAgICByZXR1cm4gcmVxLmRiQ29ubmVjdGlvblxyXG4gICAgICAgICAgLnF1ZXJ5KGBVUERBVEUgb25saW5lUGF5bWVudFRyYW5zYWN0aW9ucyBTRVRcclxuICAgICAgICAgICAgY29tcGxldGVkID0gMSxcclxuICAgICAgICAgICAgc3RhdHVzID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShzdGF0dXMpfSxcclxuICAgICAgICAgICAgcmVtb3Rlc3RhdHVzID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShyZW1vdGVzdGF0dXMpfVxyXG4gICAgICAgICAgICBib2R5ID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShKU09OLnN0cmluZ2lmeShyZXEuYm9keSkpfSxcclxuICAgICAgICAgICAgdXBkYXRldGltZSA9IE5PVygpXHJcbiAgICAgICAgICAgIFdIRVJFIElEID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShhZGRJbmZvNCl9YClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAocmVzdWx0KSA9PiBQcm9taXNlLnJlamVjdCgnRnJhdWQnKSxcclxuICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1dyb25nIGhhc2gnKTtcclxuICAgICAgfSxcclxuICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICApXHJcbiAgICAudGhlbihcclxuICAgICAgKGZ1bGxDb25maWcpID0+IHtcclxuICAgICAgICBsZXQgc3RhdHVzID0gJ05PVCBBUFBST1ZFRCc7XHJcbiAgICAgICAgbGV0IHJlYWxBcHByb3ZhbENvZGUgPSBhcHByb3ZhbF9jb2RlO1xyXG4gICAgICAgIGlmIChhcHByb3ZhbF9jb2RlLnN1YnN0cigwLCAxKSA9PT0gJ1knKSB7XHJcbiAgICAgICAgICBzdGF0dXMgPSAnUEVORElORyc7XHJcbiAgICAgICAgICBpZiAocmVtb3Rlc3RhdHVzID09PSAnQVBQUk9WRUQnIHx8IHJlbW90ZXN0YXR1cyA9PT0gJ0FQUFJPVkFUTycgfHwgcmVtb3Rlc3RhdHVzID09PSAnR0VORUhNSUdUJykge1xyXG4gICAgICAgICAgICBzdGF0dXMgPSAnQVBQUk9WRUQnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBjb25zb2xlLmxvZygnRGIgcXVlcnknLCBgVVBEQVRFIG9ubGluZVBheW1lbnRUcmFuc2FjdGlvbnMgU0VUIGNvbXBsZXRlZCA9IDEsIHN0YXR1cyA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUoc3RhdHVzKX0sIHJlbW90ZXN0YXR1cyA9ICR7cmVxLmRiQ29ubmVjdGlvbi5lc2NhcGUocmVtb3Rlc3RhdHVzKX0gV0hFUkUgSUQgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGFkZEluZm80KX1gKTtcclxuICAgICAgICByZXR1cm4gcmVxLmRiQ29ubmVjdGlvblxyXG4gICAgICAgIC5xdWVyeShgVVBEQVRFIG9ubGluZVBheW1lbnRUcmFuc2FjdGlvbnMgU0VUXHJcbiAgICAgICAgICBhcHByb3ZhbENvZGUgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKHJlYWxBcHByb3ZhbENvZGUpfSxcclxuICAgICAgICAgIGNvbXBsZXRlZCA9IDEsXHJcbiAgICAgICAgICBzdGF0dXMgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKHN0YXR1cyl9LFxyXG4gICAgICAgICAgcmVtb3Rlc3RhdHVzID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShzdHJpcHNsYXNoZXMocmVtb3Rlc3RhdHVzIHx8IG51bGwpKX0sXHJcbiAgICAgICAgICBib2R5ID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShKU09OLnN0cmluZ2lmeShyZXEuYm9keSkpfSxcclxuICAgICAgICAgIHVwZGF0ZXRpbWUgPSBOT1coKVxyXG4gICAgICAgICAgV0hFUkUgSUQgPSAke3JlcS5kYkNvbm5lY3Rpb24uZXNjYXBlKGFkZEluZm80KX1cclxuICAgICAgICBgKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoc3RhdHVzID09PSAnQVBQUk9WRUQnIHx8IHN0YXR1cyA9PT0gJ1BFTkRJTkcnKSB7XHJcbiAgICAgICAgICAgICAgLy8gaWRDb250cmF0dG8sIGFtb3VudCwgdHlwZSwgcmVmZXJlbmNlXHJcbiAgICAgICAgICAgICAgY29uc3QgdG1wVmFsID0ge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiAnYm5sUG9zaXRpdml0eScsXHJcbiAgICAgICAgICAgICAgICBwYXltZW50SWQ6IGZ1bGxDb25maWcucGF5bWVudElkLFxyXG4gICAgICAgICAgICAgICAgdHhJZDogYWRkSW5mbzRcclxuICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICByZXR1cm4gYmFzZU1ldGhvZC5pbnNlcnRQYXltZW50SW50b01haW5mcmFtZShyZXEuZGJDb25uZWN0aW9uLCBmdWxsQ29uZmlnLmlkQ29udHJhdHRvLCBmdWxsQ29uZmlnLmFtb3VudCwgJ0JPTicsIEpTT04uc3RyaW5naWZ5KHRtcFZhbCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoZnVsbENvbmZpZyksXHJcbiAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICApXHJcbiAgICAgIH0sXHJcbiAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChmdWxsQ29uZmlnKSA9PiB7XHJcbiAgICAgICAgbG9nZ2VyKHJlcSwgYFBhZ2FtZW50byBlZmZldHR1YXRvIGRhIGNvZGljZSB1cmw6ICR7ZnVsbENvbmZpZy51cmxDb2RlfWAsICd3ZWInLCBmdWxsQ29uZmlnLnVybENvZGUpO1xyXG4gICAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKCdUaGFuayB5b3UhJyk7XHJcbiAgICAgIH0sXHJcbiAgICAgIChlKSA9PiB7XHJcbiAgICAgICAgcmVzLnN0YXR1cyg1MDApLnNlbmQoJ1NvbWV0aGluZyBpcyBub3QgcXVpdGUgYXMgaXQgc2hvdWxkIScpO1xyXG4gICAgICB9XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgZ2V0SW50cm8oKSB7XHJcbiAgICBsZXQgZnVsbFRleHQgPSB0aGlzLmRlc2NyaXB0aW9uO1xyXG4gICAgbGV0IHRvdGFsID0gdGhpcy5hbW91bnQ7XHJcbiAgICBsZXQgY29tbWlzc2lvbiA9IDA7XHJcbiAgICBpZiAodGhpcy5jb21taXNzaW9uKSB7XHJcbiAgICAgIGlmICh0aGlzLmNvbW1pc3Npb25fdHlwZSA9PT0gJ3BlcmNlbnRhZ2UnKSB7XHJcbiAgICAgICAgY29tbWlzc2lvbiA9IHRvdGFsIC8gMTAwICogdGhpcy5jb21taXNzaW9uO1xyXG4gICAgICAgIHRvdGFsICs9IGNvbW1pc3Npb247XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29tbWlzc2lvbiA9IHRoaXMuY29tbWlzc2lvbjtcclxuICAgICAgICB0b3RhbCArPSBjb21taXNzaW9uO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0b3RhbCA9IHRvdGFsLnRvRml4ZWQoMik7XHJcbiAgICAvLyBjb25zb2xlLmxvZygnSGVyZT8nLCB0aGlzLmNvbW1pc3Npb25fdHlwZSwgdGhpcy5jb21taXNzaW9uKTtcclxuICAgIGlmIChjb21taXNzaW9uICA+IDAgJiYgdGhpcy5jb21taXNzaW9uX3R5cGUgPT09ICdwZXJjZW50YWdlJykge1xyXG4gICAgICBmdWxsVGV4dCArPSAnPGJyIC8+JztcclxuICAgICAgZnVsbFRleHQgKz0gYEFsIHBhZ2FtZW50byByaWNoaWVzdG8gc2FyJmFncmF2ZTsgYWdnaXVudGEsIGEgdGl0b2xvIGRpIGNvbW1pc3Npb25lLCBsYSBxdW90YSBkZWxsJyR7dGhpcy5jb21taXNzaW9ufSUsIHBhcmkgYWQgJHtmb3JtYXRDdXJyZW5jeShjb21taXNzaW9uLCB7Zm9ybWF0OiAnJXMldicsIHN5bWJvbDogJyZldXJvOyAnLCBsb2NhbGU6ICdpdC1JVCd9KX0sIHBlciB1biA8c3Ryb25nPnRvdGFsZSBkaSAke2Zvcm1hdEN1cnJlbmN5KHRvdGFsLCB7Zm9ybWF0OiAnJXMldicsIHN5bWJvbDogJyZldXJvOyAnLCBsb2NhbGU6ICdpdC1JVCd9KX08L3N0cm9uZz5gO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbW1pc3Npb24gPiAwKSB7XHJcbiAgICAgIGZ1bGxUZXh0ICs9ICc8YnIgLz4nO1xyXG4gICAgICBmdWxsVGV4dCArPSBgQWwgcGFnYW1lbnRvIHJpY2hpZXN0byBzYXImYWdyYXZlOyBhZ2dpdW50YSwgYSB0aXRvbG8gZGkgY29tbWlzc2lvbmUsIGxhIHNvbW1hIGZpc3NhIGRpICR7Zm9ybWF0Q3VycmVuY3koY29tbWlzc2lvbiwgeyBmb3JtYXQ6ICclcyV2Jywgc3ltYm9sOiAnJmV1cm87ICcsIGxvY2FsZTogJ2l0LUlUJyB9KX0sIHBlciB1biA8c3Ryb25nPnRvdGFsZSBkaSAke2Zvcm1hdEN1cnJlbmN5KHRvdGFsLCB7Zm9ybWF0OiAnJXMldicsIHN5bWJvbDogJyZldXJvOyAnLCBsb2NhbGU6ICdpdC1JVCd9KX08L3N0cm9uZz5gO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZ1bGxUZXh0O1xyXG4gIH1cclxuXHJcbiAgZ2V0VGl0bGUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy50aXRsZTtcclxuICB9XHJcblxyXG4gIGdldEZvcm0oKSB7XHJcbiAgICBjb25zdCBkYXRlVGltZSA9IHRoaXMuZGF0ZVRpbWU7XHJcbiAgICBsZXQgdG90YWwgPSB0aGlzLmFtb3VudDtcclxuICAgIGxldCBjb21taXNzaW9uID0gMDtcclxuICAgIGlmICh0aGlzLmNvbW1pc3Npb24pIHtcclxuICAgICAgaWYgKHRoaXMuY29tbWlzc2lvbl90eXBlID09PSAncGVyY2VudGFnZScpIHtcclxuICAgICAgICBjb21taXNzaW9uID0gdG90YWwgLyAxMDAgKiB0aGlzLmNvbW1pc3Npb247XHJcbiAgICAgICAgdG90YWwgKz0gY29tbWlzc2lvbjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb21taXNzaW9uID0gdGhpcy5jb21taXNzaW9uO1xyXG4gICAgICAgIHRvdGFsICs9IGNvbW1pc3Npb247XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRvdGFsID0gdG90YWwudG9GaXhlZCgyKTtcclxuICAgIC8vIHN0b3JlSWQsIGRhdGVUaW1lLCBjaGFyZ2VUb3RhbCwgY3VycmVuY3ksIHNpZ25hdHVyZVxyXG4gICAgY29uc3QgaGFzaCA9IGNyZWF0ZUhhc2hGcm9tQXJyYXkoW3RoaXMuc3RvcmVJZCwgZGF0ZVRpbWUsIHRvdGFsLCB0aGlzLmN1cnJlbmN5LCB0aGlzLnNlY3JldF0pO1xyXG4gICAgcmV0dXJuIGBcclxuICAgICAgPGZvcm0gYWN0aW9uPVwiJHt0aGlzLmdhdGVXYXl9XCIgbWV0aG9kPVwiUE9TVFwiPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cInR4bnR5cGVcIiB2YWx1ZT1cIlBVUkNIQVNFXCI+XHJcbiAgICAgICAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwidGltZXpvbmVcIiB2YWx1ZT1cIkNFVFwiPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cInR4bmRhdGV0aW1lXCIgdmFsdWU9XCIke2RhdGVUaW1lfVwiPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cImhhc2hcIiB2YWx1ZT1cIiR7aGFzaH1cIj5cclxuICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJzdG9yZW5hbWVcIiB2YWx1ZT1cIiR7dGhpcy5zdG9yZUlkfVwiPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIm1vZGVcIiB2YWx1ZT1cInBheW9ubHlcIj5cclxuICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJjdXJyZW5jeVwiIHZhbHVlPVwiJHt0aGlzLmN1cnJlbmN5fVwiPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cImxhbmd1YWdlXCIgdmFsdWU9XCJJVFwiPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIm9pZFwiIHZhbHVlPVwiJHt0aGlzLnBheW1lbnRJZH1cIj5cclxuICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJhZGRJbmZvM1wiIHZhbHVlPVwiJHt0aGlzLmluZm99XCI+XHJcbiAgICAgICAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiYWRkSW5mbzRcIiB2YWx1ZT1cIiR7dGhpcy5sb2NhbEluZm99XCI+XHJcbiAgICAgICAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwicmVzcG9uc2VTdWNjZXNzVVJMXCIgdmFsdWU9XCJodHRwczovL3BheW1lbnQuc2VyZmluOTdzcmwuY29tL2NhbGxiYWNrL2JubF9wb3NpdGl2aXR5X3N1Y2Nlc3NcIj5cclxuICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJyZXNwb25zZUZhaWxVUkxcIiB2YWx1ZT1cImh0dHBzOi8vcGF5bWVudC5zZXJmaW45N3NybC5jb20vY2FsbGJhY2svYm5sX3Bvc2l0aXZpdHlfZmFpbHVyZVwiPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cInRyYW5zYWN0aW9uTm90aWZpY2F0aW9uVVJMXCIgdmFsdWU9XCJodHRwczovL3BheW1lbnQuc2VyZmluOTdzcmwuY29tL2NhbGxiYWNrL2JubF90cmFuc2FjdGlvbl9jaGVja1wiPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cImNoYXJnZXRvdGFsXCIgdmFsdWU9XCIke3RvdGFsfVwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwIHJvd1wiPlxyXG4gICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgY2xhc3M9XCJidG4gYnRuLXByaW1hcnlcIj5Qcm9jZWRpIGNvbiBpbCBwYWdhbWVudG88L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9mb3JtPlxyXG4gICAgYDtcclxuICB9XHJcblxyXG4gIHNldExvY2FsSW5mbyhpbmZvKSB7XHJcbiAgICB0aGlzLmxvY2FsSW5mbyA9IGluZm87XHJcbiAgfVxyXG5cclxuICBnZXRSZWFkeSgpIHtcclxuICAgIGlmICghdGhpcy5kYikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0RCIEZBSUxVUkUnKTtcclxuICAgIH1cclxuICAgIHRoaXMuZGF0ZVRpbWUgPSBnZXREYXRlKCk7XHJcbiAgICBsZXQgdG90YWwgPSB0aGlzLmFtb3VudDtcclxuICAgIGxldCBjb21taXNzaW9uID0gMDtcclxuICAgIGlmICh0aGlzLmNvbW1pc3Npb24pIHtcclxuICAgICAgaWYgKHRoaXMuY29tbWlzc2lvbl90eXBlID09PSAncGVyY2VudGFnZScpIHtcclxuICAgICAgICBjb21taXNzaW9uID0gdG90YWwgLyAxMDAgKiB0aGlzLmNvbW1pc3Npb247XHJcbiAgICAgICAgdG90YWwgKz0gY29tbWlzc2lvbjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb21taXNzaW9uID0gdGhpcy5jb21taXNzaW9uO1xyXG4gICAgICAgIHRvdGFsICs9IGNvbW1pc3Npb247XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRvdGFsID0gdG90YWwudG9GaXhlZCgyKTtcclxuICAgIGNvbnNvbGUubG9nKCdGdWxsIFF1ZXJ5JywgYElOU0VSVCBJTlRPXHJcbiAgICAgIG9ubGluZVBheW1lbnRUcmFuc2FjdGlvbnMgKFxyXG4gICAgICAgIG1vZHVsZSxcclxuICAgICAgICBmdWxsY29uZmlnLFxyXG4gICAgICAgIHBheW1lbnRJZCxcclxuICAgICAgICBpZENvbnRyYXR0byxcclxuICAgICAgICBzdGF0dXMsXHJcbiAgICAgICAgYW1vdW50LFxyXG4gICAgICAgIGNvbW1pc3Npb24sXHJcbiAgICAgICAgdG90YWxcclxuICAgICAgKSBWQUxVRVMgKFxyXG4gICAgICAgICR7dGhpcy5kYi5lc2NhcGUoJ2JubHBvc2l0aXZpdHknKX0sXHJcbiAgICAgICAgJHt0aGlzLmRiLmVzY2FwZShKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICB1cmxDb2RlOiB0aGlzLnVybENvZGUsXHJcbiAgICAgICAgICBpZENvbnRyYXR0bzogdGhpcy5pZENvbnRyYXR0byxcclxuICAgICAgICAgIHBheW1lbnRJZDogdGhpcy5wYXltZW50SWQsXHJcbiAgICAgICAgICBjb21taXNzaW9uX3R5cGU6IHRoaXMuY29tbWlzc2lvbl90eXBlLFxyXG4gICAgICAgICAgY29tbWlzc2lvbjogdGhpcy5jb21taXNzaW9uLFxyXG4gICAgICAgICAgYW1vdW50OiB0aGlzLmFtb3VudCxcclxuICAgICAgICAgIHNlY3JldDogdGhpcy5zZWNyZXQsXHJcbiAgICAgICAgICBnYXRlV2F5OiB0aGlzLmdhdGVXYXksXHJcbiAgICAgICAgICBzdG9yZUlkOiB0aGlzLnN0b3JlSWQsXHJcbiAgICAgICAgICBhbW91bnQ6IHRoaXMuYW1vdW50LFxyXG4gICAgICAgICAgY3VycmVuY3k6IHRoaXMuY3VycmVuY3ksXHJcbiAgICAgICAgICBkYXRlVGltZTogdGhpcy5kYXRlVGltZSxcclxuICAgICAgICAgIGNoYXJnZXRvdGFsOiB0b3RhbCxcclxuICAgICAgICAgIHRpdGxlOiB0aGlzLmdldFRpdGxlKCksXHJcbiAgICAgICAgICBpbnRybzogdGhpcy5nZXRJbnRybygpXHJcbiAgICAgICAgfSkpfSxcclxuICAgICAgICAke3RoaXMuZGIuZXNjYXBlKHRoaXMucGF5bWVudElkKX0sXHJcbiAgICAgICAgJHt0aGlzLmRiLmVzY2FwZSh0aGlzLmlkQ29udHJhdHRvKX0sXHJcbiAgICAgICAgJHt0aGlzLmRiLmVzY2FwZSgnV2FpdGluZycpfSxcclxuICAgICAgICAke3RoaXMuZGIuZXNjYXBlKHRoaXMuYW1vdW50KX0sXHJcbiAgICAgICAgJHt0aGlzLmRiLmVzY2FwZShjb21taXNzaW9uKX0sXHJcbiAgICAgICAgJHt0aGlzLmRiLmVzY2FwZSh0b3RhbCl9XHJcbiAgICAgIClgKTtcclxuICAgIHJldHVybiB0aGlzLmRiLnF1ZXJ5KGBJTlNFUlQgSU5UT1xyXG4gICAgICBvbmxpbmVQYXltZW50VHJhbnNhY3Rpb25zIChcclxuICAgICAgICBtb2R1bGUsXHJcbiAgICAgICAgZnVsbGNvbmZpZyxcclxuICAgICAgICBwYXltZW50SWQsXHJcbiAgICAgICAgaWRDb250cmF0dG8sXHJcbiAgICAgICAgc3RhdHVzLFxyXG4gICAgICAgIGFtb3VudCxcclxuICAgICAgICBjb21taXNzaW9uLFxyXG4gICAgICAgIHRvdGFsXHJcbiAgICAgICkgVkFMVUVTIChcclxuICAgICAgICAke3RoaXMuZGIuZXNjYXBlKCdibmxwb3NpdGl2aXR5Jyl9LFxyXG4gICAgICAgICR7dGhpcy5kYi5lc2NhcGUoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgdXJsQ29kZTogdGhpcy51cmxDb2RlLFxyXG4gICAgICAgICAgaWRDb250cmF0dG86IHRoaXMuaWRDb250cmF0dG8sXHJcbiAgICAgICAgICBwYXltZW50SWQ6IHRoaXMucGF5bWVudElkLFxyXG4gICAgICAgICAgY29tbWlzc2lvbl90eXBlOiB0aGlzLmNvbW1pc3Npb25fdHlwZSxcclxuICAgICAgICAgIGNvbW1pc3Npb246IHRoaXMuY29tbWlzc2lvbixcclxuICAgICAgICAgIGFtb3VudDogdGhpcy5hbW91bnQsXHJcbiAgICAgICAgICBzZWNyZXQ6IHRoaXMuc2VjcmV0LFxyXG4gICAgICAgICAgZ2F0ZVdheTogdGhpcy5nYXRlV2F5LFxyXG4gICAgICAgICAgc3RvcmVJZDogdGhpcy5zdG9yZUlkLFxyXG4gICAgICAgICAgYW1vdW50OiB0aGlzLmFtb3VudCxcclxuICAgICAgICAgIGN1cnJlbmN5OiB0aGlzLmN1cnJlbmN5LFxyXG4gICAgICAgICAgZGF0ZVRpbWU6IHRoaXMuZGF0ZVRpbWUsXHJcbiAgICAgICAgICBjaGFyZ2V0b3RhbDogdG90YWwsXHJcbiAgICAgICAgICB0aXRsZTogdGhpcy5nZXRUaXRsZSgpLFxyXG4gICAgICAgICAgaW50cm86IHRoaXMuZ2V0SW50cm8oKVxyXG4gICAgICAgIH0pKX0sXHJcbiAgICAgICAgJHt0aGlzLmRiLmVzY2FwZSh0aGlzLnBheW1lbnRJZCl9LFxyXG4gICAgICAgICR7dGhpcy5kYi5lc2NhcGUodGhpcy5pZENvbnRyYXR0byl9LFxyXG4gICAgICAgICR7dGhpcy5kYi5lc2NhcGUoJ1dhaXRpbmcnKX0sXHJcbiAgICAgICAgJHt0aGlzLmRiLmVzY2FwZSh0aGlzLmFtb3VudCl9LFxyXG4gICAgICAgICR7dGhpcy5kYi5lc2NhcGUoY29tbWlzc2lvbil9LFxyXG4gICAgICAgICR7dGhpcy5kYi5lc2NhcGUodG90YWwpfVxyXG4gICAgICApYClcclxuICAgICAgLnRoZW4oXHJcbiAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuZGIucXVlcnkoJ1NFTEVDVCBMQVNUX0lOU0VSVF9JRCgpIGFzIG15SWQnKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgIClcclxuICAgICAgLnRoZW4oXHJcbiAgICAgICAgKHJlc3VsdHMpID0+IHtcclxuICAgICAgICAgIHRoaXMuc2V0TG9jYWxJbmZvKHJlc3VsdHNbMF0ubXlJZCk7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgKTtcclxuICB9XHJcbn1cclxuIl19