'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _config = require('../config/config.json');

var _config2 = _interopRequireDefault(_config);

var _logger = require('../libs/logger');

var _logger2 = _interopRequireDefault(_logger);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();


var rightPadTo = function rightPadTo(s, len) {
  var rS = s.toString();
  var curLen = rS.length;
  var diff = len - curLen;
  if (diff < 1) {
    return s;
  }
  for (var i = 0; i < diff; i += 1) {
    rS += ' ';
  }
  return rS;
};

var makeConcatString = function makeConcatString(s, len) {
  var rS = s.toString();
  var curLen = rS.length;
  var diff = len - curLen;
  return 'RPAD(\'' + rS + '\', ' + len + ', 0x00)';
  rS = 'CONCAT(\'' + rS + '\'';
  if (diff < 1) {
    return rS + ')';
  }
  for (var i = 0; i < diff; i += 1) {
    rS += ', CHAR(X\'00\')';
  }
  return rS + ')';
  // CONCAT('VO2JE',CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'))
};

var cleanString = function cleanString(s) {
  var finalString = '';
  for (var i = 0; i < s.length; i += 1) {
    var ascii = s.charCodeAt(i);
    if (ascii > 47 && ascii < 91) {
      finalString += s[i];
    }
    if (ascii > 96 && ascii < 123) {
      finalString += s[i];
    }
  }
  return finalString;
};

router.get('/', function (req, res, next) {
  var dbConnection = req.dbConnection,
      ip = req.ip;
  // console.log('req.body');

  res.render('_stats/index', {
    title: 'Accesso statistiche',
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots
  });
});

router.post('/', function (req, res, next) {
  var body = req.body;

  if (body.mandato) {
    req.session.stats = {
      cliente: body.cliente,
      mandato: body.mandato,
      dati: {}
    };
    res.redirect('/SerfinStats/overview');
  } else {
    res.redirect('/SerfinStats/');
  }
});

router.get('/overview', function (req, res, next) {
  var dbConnection = req.dbConnection,
      session = req.session;

  dbConnection.query('SELECT count(DISTINCT idcontratto) as totaleContratti, count(DISTINCT codice_da_url) as totaleCodiciDaUrl FROM pagamento_online_idcontratto_cf WHERE mandato = ' + dbConnection.escape(session.stats.mandato) + ' AND idcliente = ' + dbConnection.escape(session.stats.cliente)).then(function (results) {
    // console.log('Results', results);
    if (results && results[0] && results[0].totaleContratti > 0) {
      return Promise.resolve({
        totaleContratti: results[0].totaleContratti,
        totaleCodiciDaUrl: results[0].totaleCodiciDaUrl
      });
    } else {
      return Promise.reject();
    }
  }, function (e) {
    return Promise.reject(e);
  }).then(function (data) {
    // console.log(`SELECT DISTINCT codice_da_url as codice FROM pagamento_online_idcontratto_cf WHERE mandato = ${dbConnection.escape(session.stats.mandato)}  AND idcliente = ${dbConnection.escape(session.stats.cliente)}`);
    return dbConnection.query('SELECT DISTINCT codice_da_url as codice FROM pagamento_online_idcontratto_cf WHERE mandato = ' + dbConnection.escape(session.stats.mandato) + '  AND idcliente = ' + dbConnection.escape(session.stats.cliente)).then(function (results) {
      var uniqueCodes = results.map(function (r) {
        return r.codice;
      });
      return Promise.resolve(_extends({
        uniqueCodes: uniqueCodes
      }, data));
    }, function (e) {
      return Promise.reject(e);
    });
  }, function (e) {
    return Promise.reject(e);
  }).then(function (data) {
    var sql = 'SELECT DISTINCT tracking as tracking FROM online_payment_logs WHERE tracking IN (' + data.uniqueCodes.map(function (el) {
      return makeConcatString(el, 10);
    }).join(',') + ')';
    // console.log('Sql', sql);
    return dbConnection.query(sql).then(function (results) {
      var totalConsumedCodes = results.length;
      return Promise.resolve(_extends({
        totalConsumedCodes: totalConsumedCodes,
        consumedCodes: results.map(function (r) {
          if (!r.tracking) {
            console.error('R TRACKING IS NULL');
            console.log(r);
          }
          return cleanString(r.tracking.toString());
        })
      }, data));
    }, function (e) {
      return Promise.reject(e);
    });
  }, function (e) {
    return Promise.reject(e);
  }).then(function (data) {
    if (data.consumedCodes.length === 0) {
      return Promise.resolve(_extends({
        totalConsumedContratti: 0,
        consumedContratti: []
      }, data));
    }
    var sql = 'SELECT count(DISTINCT idcontratto) as totalConsumedContratti, idcontratto FROM pagamento_online_idcontratto_cf WHERE codice_da_url IN (' + data.consumedCodes.map(function (el) {
      return dbConnection.escape(el);
    }).join(',') + ')';
    return dbConnection.query(sql).then(function (results) {
      var totalConsumedContratti = 0;
      if (results && results[0]) {
        totalConsumedContratti = results[0].totalConsumedContratti;
      }
      return Promise.resolve(_extends({
        totalConsumedContratti: totalConsumedContratti,
        consumedContratti: totalConsumedContratti > 0 ? results.map(function (r) {
          if (!r.idcontratto) {
            console.error('NO R IDCONTRATTO');
            console.log(r);
          }
          return r.idcontratto.toString();
        }) : []
      }, data));
    }, function (e) {
      return Promise.reject(e);
    });
  }, function (e) {
    return Promise.reject(e);
  }).then(function (data) {
    if (data.consumedCodes.length === 0) {
      return Promise.resolve(_extends({
        addresses: []
      }, data));
    }
    var sql = 'SELECT email_debitore FROM pagamento_online_idcontratto_cf WHERE codice_da_url IN (' + data.consumedCodes.map(function (el) {
      return dbConnection.escape(el);
    }).join(',') + ')';
    return dbConnection.query(sql).then(function (results) {
      return Promise.resolve(_extends({
        addresses: results.map(function (r) {
          return r.email_debitore;
        })
      }, data));
    }, function (e) {
      return Promise.reject(e);
    });
  }, function (e) {
    return Promise.reject(e);
  }).then(function (data) {
    if (data.consumedContratti.length === 0) {
      return Promise.resolve(_extends({
        totaleContrattiPagati: 0
      }, data));
    }
    var sql = 'SELECT count(DISTINCT idContratto) as totaleContrattiPagati, idcontratto FROM onlinePaymentTransactions WHERE\n          status = \'APPROVED\'\n          AND\n          completed = 1\n          AND\n          idContratto IN (' + data.consumedContratti.map(function (el) {
      return dbConnection.escape(el);
    }).join(',') + ')';
    return dbConnection.query(sql).then(function (results) {
      var totaleContrattiPagati = 0;
      if (results && results[0]) {
        totaleContrattiPagati = results[0].totaleContrattiPagati;
      }
      return Promise.resolve(_extends({
        totaleContrattiPagati: totaleContrattiPagati
      }, data));
    }, function (e) {
      return Promise.reject(e);
    });
  }, function (e) {
    return Promise.reject(e);
  }).then(function (data) {
    if (data.consumedContratti.length === 0) {
      return Promise.resolve(_extends({
        totaleContrattiNonPagati: 0
      }, data));
    }
    var sql = 'SELECT count(DISTINCT idContratto) as totaleContrattiNonPagati, idcontratto FROM onlinePaymentTransactions WHERE\n          status != \'APPROVED\'\n          AND\n          idContratto IN (' + data.consumedContratti.map(function (el) {
      return dbConnection.escape(el);
    }).join(',') + ')';
    return dbConnection.query(sql).then(function (results) {
      var totaleContrattiNonPagati = 0;
      if (results && results[0]) {
        totaleContrattiNonPagati = results[0].totaleContrattiNonPagati;
      }
      return Promise.resolve(_extends({
        totaleContrattiNonPagati: totaleContrattiNonPagati
      }, data));
    }, function (e) {
      return Promise.reject(e);
    });
  }, function (e) {
    return Promise.reject(e);
  }).then(function (data) {
    // console.log('addresses', data.addresses);
    var emails = data.addresses.filter(function (add) {
      return add.indexOf('@') > -1;
    });
    var cellphones = data.addresses.filter(function (add) {
      return add.indexOf('@') < 0;
    });
    var totalEmails = emails.length;
    var totalCellphones = cellphones.length;

    return Promise.resolve(_extends({
      emails: emails,
      cellphones: cellphones,
      totalEmails: totalEmails,
      totalCellphones: totalCellphones
    }, data));
  }, function (e) {
    return Promise.reject(e);
  }).then(function (data) {
    // console.log('Data', data);
    req.session.stats.dati[req.session.stats.mandato] = data;
    res.render('_stats/overview', _extends({
      title: 'Sommario'
    }, data, {
      viewEngines: req.viewEngines,
      viewRoots: req.viewRoots
    }));
  }, function (e) {
    console.log('Error', e);
    res.redirect('/SerfinStats/');
  });
});

exports.default = router;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvc3RhdHMuanMiXSwibmFtZXMiOlsicm91dGVyIiwiUm91dGVyIiwicmlnaHRQYWRUbyIsInMiLCJsZW4iLCJyUyIsInRvU3RyaW5nIiwiY3VyTGVuIiwibGVuZ3RoIiwiZGlmZiIsImkiLCJtYWtlQ29uY2F0U3RyaW5nIiwiY2xlYW5TdHJpbmciLCJmaW5hbFN0cmluZyIsImFzY2lpIiwiY2hhckNvZGVBdCIsImdldCIsInJlcSIsInJlcyIsIm5leHQiLCJkYkNvbm5lY3Rpb24iLCJpcCIsInJlbmRlciIsInRpdGxlIiwidmlld0VuZ2luZXMiLCJ2aWV3Um9vdHMiLCJwb3N0IiwiYm9keSIsIm1hbmRhdG8iLCJzZXNzaW9uIiwic3RhdHMiLCJjbGllbnRlIiwiZGF0aSIsInJlZGlyZWN0IiwicXVlcnkiLCJlc2NhcGUiLCJ0aGVuIiwicmVzdWx0cyIsInRvdGFsZUNvbnRyYXR0aSIsIlByb21pc2UiLCJyZXNvbHZlIiwidG90YWxlQ29kaWNpRGFVcmwiLCJyZWplY3QiLCJlIiwiZGF0YSIsInVuaXF1ZUNvZGVzIiwibWFwIiwiciIsImNvZGljZSIsInNxbCIsImVsIiwiam9pbiIsInRvdGFsQ29uc3VtZWRDb2RlcyIsImNvbnN1bWVkQ29kZXMiLCJ0cmFja2luZyIsImNvbnNvbGUiLCJlcnJvciIsImxvZyIsInRvdGFsQ29uc3VtZWRDb250cmF0dGkiLCJjb25zdW1lZENvbnRyYXR0aSIsImlkY29udHJhdHRvIiwiYWRkcmVzc2VzIiwiZW1haWxfZGViaXRvcmUiLCJ0b3RhbGVDb250cmF0dGlQYWdhdGkiLCJ0b3RhbGVDb250cmF0dGlOb25QYWdhdGkiLCJlbWFpbHMiLCJmaWx0ZXIiLCJhZGQiLCJpbmRleE9mIiwiY2VsbHBob25lcyIsInRvdGFsRW1haWxzIiwidG90YWxDZWxscGhvbmVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBOzs7O0FBQ0E7Ozs7OztBQUZBLElBQU1BLFNBQVMsa0JBQVFDLE1BQVIsRUFBZjs7O0FBSUEsSUFBTUMsYUFBYSxTQUFiQSxVQUFhLENBQUNDLENBQUQsRUFBSUMsR0FBSixFQUFZO0FBQzdCLE1BQUlDLEtBQUtGLEVBQUVHLFFBQUYsRUFBVDtBQUNBLE1BQU1DLFNBQVNGLEdBQUdHLE1BQWxCO0FBQ0EsTUFBTUMsT0FBT0wsTUFBTUcsTUFBbkI7QUFDQSxNQUFJRSxPQUFPLENBQVgsRUFBYztBQUFFLFdBQU9OLENBQVA7QUFBVztBQUMzQixPQUFLLElBQUlPLElBQUksQ0FBYixFQUFnQkEsSUFBSUQsSUFBcEIsRUFBMEJDLEtBQUssQ0FBL0IsRUFBa0M7QUFDaENMLFVBQU0sR0FBTjtBQUNEO0FBQ0QsU0FBT0EsRUFBUDtBQUNELENBVEQ7O0FBV0EsSUFBTU0sbUJBQW1CLFNBQW5CQSxnQkFBbUIsQ0FBQ1IsQ0FBRCxFQUFJQyxHQUFKLEVBQVk7QUFDbkMsTUFBSUMsS0FBS0YsRUFBRUcsUUFBRixFQUFUO0FBQ0EsTUFBTUMsU0FBU0YsR0FBR0csTUFBbEI7QUFDQSxNQUFNQyxPQUFPTCxNQUFNRyxNQUFuQjtBQUNBLHFCQUFnQkYsRUFBaEIsWUFBd0JELEdBQXhCO0FBQ0FDLE9BQUssY0FBY0EsRUFBZCxHQUFtQixJQUF4QjtBQUNBLE1BQUlJLE9BQU8sQ0FBWCxFQUFjO0FBQUUsV0FBT0osS0FBSyxHQUFaO0FBQWtCO0FBQ2xDLE9BQUssSUFBSUssSUFBSSxDQUFiLEVBQWdCQSxJQUFJRCxJQUFwQixFQUEwQkMsS0FBSyxDQUEvQixFQUFrQztBQUNoQ0wsVUFBTSxpQkFBTjtBQUNEO0FBQ0QsU0FBT0EsS0FBSyxHQUFaO0FBQ0E7QUFDRCxDQVpEOztBQWNBLElBQU1PLGNBQWMsU0FBZEEsV0FBYyxDQUFDVCxDQUFELEVBQU87QUFDekIsTUFBSVUsY0FBYyxFQUFsQjtBQUNBLE9BQUssSUFBSUgsSUFBSSxDQUFiLEVBQWdCQSxJQUFJUCxFQUFFSyxNQUF0QixFQUE4QkUsS0FBSyxDQUFuQyxFQUFzQztBQUNwQyxRQUFNSSxRQUFRWCxFQUFFWSxVQUFGLENBQWFMLENBQWIsQ0FBZDtBQUNBLFFBQUlJLFFBQVEsRUFBUixJQUFjQSxRQUFRLEVBQTFCLEVBQThCO0FBQzVCRCxxQkFBZVYsRUFBRU8sQ0FBRixDQUFmO0FBQ0Q7QUFDRCxRQUFJSSxRQUFRLEVBQVIsSUFBY0EsUUFBUSxHQUExQixFQUErQjtBQUM3QkQscUJBQWVWLEVBQUVPLENBQUYsQ0FBZjtBQUNEO0FBQ0Y7QUFDRCxTQUFPRyxXQUFQO0FBQ0QsQ0FaRDs7QUFjQWIsT0FBT2dCLEdBQVAsQ0FBVyxHQUFYLEVBQWdCLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFXQyxJQUFYLEVBQW9CO0FBQUEsTUFFaENDLFlBRmdDLEdBSTlCSCxHQUo4QixDQUVoQ0csWUFGZ0M7QUFBQSxNQUdoQ0MsRUFIZ0MsR0FJOUJKLEdBSjhCLENBR2hDSSxFQUhnQztBQUtsQzs7QUFDQUgsTUFBSUksTUFBSixDQUFXLGNBQVgsRUFBMkI7QUFDekJDLFdBQU8scUJBRGtCO0FBRXpCQyxpQkFBYVAsSUFBSU8sV0FGUTtBQUd6QkMsZUFBV1IsSUFBSVE7QUFIVSxHQUEzQjtBQUtELENBWEQ7O0FBYUF6QixPQUFPMEIsSUFBUCxDQUFZLEdBQVosRUFBaUIsVUFBQ1QsR0FBRCxFQUFNQyxHQUFOLEVBQVdDLElBQVgsRUFBb0I7QUFBQSxNQUVqQ1EsSUFGaUMsR0FHL0JWLEdBSCtCLENBRWpDVSxJQUZpQzs7QUFJbkMsTUFBSUEsS0FBS0MsT0FBVCxFQUFrQjtBQUNoQlgsUUFBSVksT0FBSixDQUFZQyxLQUFaLEdBQW9CO0FBQ2xCQyxlQUFTSixLQUFLSSxPQURJO0FBRWxCSCxlQUFTRCxLQUFLQyxPQUZJO0FBR2xCSSxZQUFNO0FBSFksS0FBcEI7QUFLQWQsUUFBSWUsUUFBSixDQUFhLHVCQUFiO0FBQ0QsR0FQRCxNQU9PO0FBQ0xmLFFBQUllLFFBQUosQ0FBYSxlQUFiO0FBQ0Q7QUFDRixDQWREOztBQWdCQWpDLE9BQU9nQixHQUFQLENBQVcsV0FBWCxFQUF3QixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBV0MsSUFBWCxFQUFvQjtBQUFBLE1BRXhDQyxZQUZ3QyxHQUl0Q0gsR0FKc0MsQ0FFeENHLFlBRndDO0FBQUEsTUFHeENTLE9BSHdDLEdBSXRDWixHQUpzQyxDQUd4Q1ksT0FId0M7O0FBSzFDVCxlQUFhYyxLQUFiLHFLQUFxTGQsYUFBYWUsTUFBYixDQUFvQk4sUUFBUUMsS0FBUixDQUFjRixPQUFsQyxDQUFyTCx5QkFBbVBSLGFBQWFlLE1BQWIsQ0FBb0JOLFFBQVFDLEtBQVIsQ0FBY0MsT0FBbEMsQ0FBblAsRUFDR0ssSUFESCxDQUVJLFVBQUNDLE9BQUQsRUFBYTtBQUNYO0FBQ0EsUUFBSUEsV0FBV0EsUUFBUSxDQUFSLENBQVgsSUFBeUJBLFFBQVEsQ0FBUixFQUFXQyxlQUFYLEdBQTZCLENBQTFELEVBQTZEO0FBQzNELGFBQU9DLFFBQVFDLE9BQVIsQ0FBZ0I7QUFDckJGLHlCQUFpQkQsUUFBUSxDQUFSLEVBQVdDLGVBRFA7QUFFckJHLDJCQUFtQkosUUFBUSxDQUFSLEVBQVdJO0FBRlQsT0FBaEIsQ0FBUDtBQUlELEtBTEQsTUFLTztBQUNMLGFBQU9GLFFBQVFHLE1BQVIsRUFBUDtBQUNEO0FBQ0YsR0FaTCxFQWFJLFVBQUNDLENBQUQ7QUFBQSxXQUFPSixRQUFRRyxNQUFSLENBQWVDLENBQWYsQ0FBUDtBQUFBLEdBYkosRUFlR1AsSUFmSCxDQWdCSSxVQUFDUSxJQUFELEVBQVU7QUFDUjtBQUNBLFdBQU94QixhQUFhYyxLQUFiLG1HQUFtSGQsYUFBYWUsTUFBYixDQUFvQk4sUUFBUUMsS0FBUixDQUFjRixPQUFsQyxDQUFuSCwwQkFBa0xSLGFBQWFlLE1BQWIsQ0FBb0JOLFFBQVFDLEtBQVIsQ0FBY0MsT0FBbEMsQ0FBbEwsRUFDSkssSUFESSxDQUVILFVBQUNDLE9BQUQsRUFBYTtBQUNYLFVBQU1RLGNBQWNSLFFBQVFTLEdBQVIsQ0FBWSxVQUFDQyxDQUFEO0FBQUEsZUFBT0EsRUFBRUMsTUFBVDtBQUFBLE9BQVosQ0FBcEI7QUFDQSxhQUFPVCxRQUFRQyxPQUFSO0FBQ0xLO0FBREssU0FFRkQsSUFGRSxFQUFQO0FBSUQsS0FSRSxFQVNILFVBQUNELENBQUQ7QUFBQSxhQUFPSixRQUFRRyxNQUFSLENBQWVDLENBQWYsQ0FBUDtBQUFBLEtBVEcsQ0FBUDtBQVdELEdBN0JMLEVBOEJJLFVBQUNBLENBQUQ7QUFBQSxXQUFPSixRQUFRRyxNQUFSLENBQWVDLENBQWYsQ0FBUDtBQUFBLEdBOUJKLEVBZ0NHUCxJQWhDSCxDQWlDSSxVQUFDUSxJQUFELEVBQVU7QUFDUixRQUFNSyw0RkFBMEZMLEtBQUtDLFdBQUwsQ0FBaUJDLEdBQWpCLENBQXFCLFVBQUNJLEVBQUQ7QUFBQSxhQUFRdkMsaUJBQWlCdUMsRUFBakIsRUFBcUIsRUFBckIsQ0FBUjtBQUFBLEtBQXJCLEVBQXVEQyxJQUF2RCxDQUE0RCxHQUE1RCxDQUExRixNQUFOO0FBQ0E7QUFDQSxXQUFPL0IsYUFBYWMsS0FBYixDQUFtQmUsR0FBbkIsRUFDSmIsSUFESSxDQUVILFVBQUNDLE9BQUQsRUFBYTtBQUNYLFVBQUllLHFCQUFxQmYsUUFBUTdCLE1BQWpDO0FBQ0EsYUFBTytCLFFBQVFDLE9BQVI7QUFDTFksNEJBQW9CQSxrQkFEZjtBQUVMQyx1QkFBZWhCLFFBQVFTLEdBQVIsQ0FBWSxVQUFDQyxDQUFELEVBQU87QUFDaEMsY0FBSSxDQUFDQSxFQUFFTyxRQUFQLEVBQWlCO0FBQ2ZDLG9CQUFRQyxLQUFSLENBQWMsb0JBQWQ7QUFDQUQsb0JBQVFFLEdBQVIsQ0FBWVYsQ0FBWjtBQUNEO0FBQ0QsaUJBQU9uQyxZQUFZbUMsRUFBRU8sUUFBRixDQUFXaEQsUUFBWCxFQUFaLENBQVA7QUFDRCxTQU5jO0FBRlYsU0FTRnNDLElBVEUsRUFBUDtBQVdELEtBZkUsRUFnQkgsVUFBQ0QsQ0FBRDtBQUFBLGFBQU9KLFFBQVFHLE1BQVIsQ0FBZUMsQ0FBZixDQUFQO0FBQUEsS0FoQkcsQ0FBUDtBQWtCRCxHQXRETCxFQXVESSxVQUFDQSxDQUFEO0FBQUEsV0FBT0osUUFBUUcsTUFBUixDQUFlQyxDQUFmLENBQVA7QUFBQSxHQXZESixFQXlER1AsSUF6REgsQ0EwREksVUFBQ1EsSUFBRCxFQUFVO0FBQ1IsUUFBSUEsS0FBS1MsYUFBTCxDQUFtQjdDLE1BQW5CLEtBQThCLENBQWxDLEVBQXFDO0FBQ25DLGFBQU8rQixRQUFRQyxPQUFSO0FBQ0xrQixnQ0FBd0IsQ0FEbkI7QUFFTEMsMkJBQW1CO0FBRmQsU0FHRmYsSUFIRSxFQUFQO0FBS0Q7QUFDRCxRQUFNSyxrSkFBZ0pMLEtBQUtTLGFBQUwsQ0FBbUJQLEdBQW5CLENBQXVCLFVBQUNJLEVBQUQ7QUFBQSxhQUFROUIsYUFBYWUsTUFBYixDQUFvQmUsRUFBcEIsQ0FBUjtBQUFBLEtBQXZCLEVBQXdEQyxJQUF4RCxDQUE2RCxHQUE3RCxDQUFoSixNQUFOO0FBQ0EsV0FBTy9CLGFBQWFjLEtBQWIsQ0FBbUJlLEdBQW5CLEVBQ0piLElBREksQ0FFSCxVQUFDQyxPQUFELEVBQWE7QUFDWCxVQUFJcUIseUJBQXlCLENBQTdCO0FBQ0EsVUFBSXJCLFdBQVdBLFFBQVEsQ0FBUixDQUFmLEVBQTJCO0FBQ3pCcUIsaUNBQXlCckIsUUFBUSxDQUFSLEVBQVdxQixzQkFBcEM7QUFDRDtBQUNELGFBQU9uQixRQUFRQyxPQUFSO0FBQ0xrQixnQ0FBd0JBLHNCQURuQjtBQUVMQywyQkFBbUJELHlCQUF5QixDQUF6QixHQUE2QnJCLFFBQVFTLEdBQVIsQ0FBWSxVQUFDQyxDQUFELEVBQU87QUFDakUsY0FBSSxDQUFDQSxFQUFFYSxXQUFQLEVBQW9CO0FBQ2xCTCxvQkFBUUMsS0FBUixDQUFjLGtCQUFkO0FBQ0FELG9CQUFRRSxHQUFSLENBQVlWLENBQVo7QUFDRDtBQUNELGlCQUFPQSxFQUFFYSxXQUFGLENBQWN0RCxRQUFkLEVBQVA7QUFDRCxTQU4rQyxDQUE3QixHQU1kO0FBUkEsU0FTRnNDLElBVEUsRUFBUDtBQVdELEtBbEJFLEVBbUJILFVBQUNELENBQUQ7QUFBQSxhQUFPSixRQUFRRyxNQUFSLENBQWVDLENBQWYsQ0FBUDtBQUFBLEtBbkJHLENBQVA7QUFxQkQsR0F4RkwsRUF5RkksVUFBQ0EsQ0FBRDtBQUFBLFdBQU9KLFFBQVFHLE1BQVIsQ0FBZUMsQ0FBZixDQUFQO0FBQUEsR0F6RkosRUEyRkdQLElBM0ZILENBNEZJLFVBQUNRLElBQUQsRUFBVTtBQUNSLFFBQUlBLEtBQUtTLGFBQUwsQ0FBbUI3QyxNQUFuQixLQUE4QixDQUFsQyxFQUFxQztBQUNuQyxhQUFPK0IsUUFBUUMsT0FBUjtBQUNMcUIsbUJBQVc7QUFETixTQUVGakIsSUFGRSxFQUFQO0FBSUQ7QUFDRCxRQUFNSyw4RkFBNEZMLEtBQUtTLGFBQUwsQ0FBbUJQLEdBQW5CLENBQXVCLFVBQUNJLEVBQUQ7QUFBQSxhQUFROUIsYUFBYWUsTUFBYixDQUFvQmUsRUFBcEIsQ0FBUjtBQUFBLEtBQXZCLEVBQXdEQyxJQUF4RCxDQUE2RCxHQUE3RCxDQUE1RixNQUFOO0FBQ0EsV0FBTy9CLGFBQWFjLEtBQWIsQ0FBbUJlLEdBQW5CLEVBQ0piLElBREksQ0FFSCxVQUFDQyxPQUFELEVBQWE7QUFDWCxhQUFPRSxRQUFRQyxPQUFSO0FBQ0xxQixtQkFBV3hCLFFBQVFTLEdBQVIsQ0FBWSxVQUFDQyxDQUFEO0FBQUEsaUJBQU9BLEVBQUVlLGNBQVQ7QUFBQSxTQUFaO0FBRE4sU0FFRmxCLElBRkUsRUFBUDtBQUlELEtBUEUsRUFRSCxVQUFDRCxDQUFEO0FBQUEsYUFBT0osUUFBUUcsTUFBUixDQUFlQyxDQUFmLENBQVA7QUFBQSxLQVJHLENBQVA7QUFVRCxHQTlHTCxFQStHSSxVQUFDQSxDQUFEO0FBQUEsV0FBT0osUUFBUUcsTUFBUixDQUFlQyxDQUFmLENBQVA7QUFBQSxHQS9HSixFQWlIR1AsSUFqSEgsQ0FrSEksVUFBQ1EsSUFBRCxFQUFVO0FBQ1IsUUFBSUEsS0FBS2UsaUJBQUwsQ0FBdUJuRCxNQUF2QixLQUFrQyxDQUF0QyxFQUF5QztBQUN2QyxhQUFPK0IsUUFBUUMsT0FBUjtBQUNMdUIsK0JBQXVCO0FBRGxCLFNBRUZuQixJQUZFLEVBQVA7QUFJRDtBQUNELFFBQU1LLDRPQUtjTCxLQUFLZSxpQkFBTCxDQUF1QmIsR0FBdkIsQ0FBMkIsVUFBQ0ksRUFBRDtBQUFBLGFBQVE5QixhQUFhZSxNQUFiLENBQW9CZSxFQUFwQixDQUFSO0FBQUEsS0FBM0IsRUFBNERDLElBQTVELENBQWlFLEdBQWpFLENBTGQsTUFBTjtBQU1BLFdBQU8vQixhQUFhYyxLQUFiLENBQW1CZSxHQUFuQixFQUNKYixJQURJLENBRUgsVUFBQ0MsT0FBRCxFQUFhO0FBQ1gsVUFBSTBCLHdCQUF3QixDQUE1QjtBQUNBLFVBQUkxQixXQUFXQSxRQUFRLENBQVIsQ0FBZixFQUEyQjtBQUN6QjBCLGdDQUF3QjFCLFFBQVEsQ0FBUixFQUFXMEIscUJBQW5DO0FBQ0Q7QUFDRCxhQUFPeEIsUUFBUUMsT0FBUjtBQUNMdUIsK0JBQXVCQTtBQURsQixTQUVGbkIsSUFGRSxFQUFQO0FBSUQsS0FYRSxFQVlILFVBQUNELENBQUQ7QUFBQSxhQUFPSixRQUFRRyxNQUFSLENBQWVDLENBQWYsQ0FBUDtBQUFBLEtBWkcsQ0FBUDtBQWNELEdBN0lMLEVBOElJLFVBQUNBLENBQUQ7QUFBQSxXQUFPSixRQUFRRyxNQUFSLENBQWVDLENBQWYsQ0FBUDtBQUFBLEdBOUlKLEVBZ0pHUCxJQWhKSCxDQWlKSSxVQUFDUSxJQUFELEVBQVU7QUFDUixRQUFJQSxLQUFLZSxpQkFBTCxDQUF1Qm5ELE1BQXZCLEtBQWtDLENBQXRDLEVBQXlDO0FBQ3ZDLGFBQU8rQixRQUFRQyxPQUFSO0FBQ0x3QixrQ0FBMEI7QUFEckIsU0FFRnBCLElBRkUsRUFBUDtBQUlEO0FBQ0QsUUFBTUssd01BR2NMLEtBQUtlLGlCQUFMLENBQXVCYixHQUF2QixDQUEyQixVQUFDSSxFQUFEO0FBQUEsYUFBUTlCLGFBQWFlLE1BQWIsQ0FBb0JlLEVBQXBCLENBQVI7QUFBQSxLQUEzQixFQUE0REMsSUFBNUQsQ0FBaUUsR0FBakUsQ0FIZCxNQUFOO0FBSUEsV0FBTy9CLGFBQWFjLEtBQWIsQ0FBbUJlLEdBQW5CLEVBQ0piLElBREksQ0FFSCxVQUFDQyxPQUFELEVBQWE7QUFDWCxVQUFJMkIsMkJBQTJCLENBQS9CO0FBQ0EsVUFBSTNCLFdBQVdBLFFBQVEsQ0FBUixDQUFmLEVBQTJCO0FBQ3pCMkIsbUNBQTJCM0IsUUFBUSxDQUFSLEVBQVcyQix3QkFBdEM7QUFDRDtBQUNELGFBQU96QixRQUFRQyxPQUFSO0FBQ0x3QixrQ0FBMEJBO0FBRHJCLFNBRUZwQixJQUZFLEVBQVA7QUFJRCxLQVhFLEVBWUgsVUFBQ0QsQ0FBRDtBQUFBLGFBQU9KLFFBQVFHLE1BQVIsQ0FBZUMsQ0FBZixDQUFQO0FBQUEsS0FaRyxDQUFQO0FBY0QsR0ExS0wsRUEyS0ksVUFBQ0EsQ0FBRDtBQUFBLFdBQU9KLFFBQVFHLE1BQVIsQ0FBZUMsQ0FBZixDQUFQO0FBQUEsR0EzS0osRUE2S0dQLElBN0tILENBOEtJLFVBQUNRLElBQUQsRUFBVTtBQUNSO0FBQ0EsUUFBTXFCLFNBQVNyQixLQUFLaUIsU0FBTCxDQUFlSyxNQUFmLENBQXNCLFVBQUNDLEdBQUQ7QUFBQSxhQUFTQSxJQUFJQyxPQUFKLENBQVksR0FBWixJQUFtQixDQUFDLENBQTdCO0FBQUEsS0FBdEIsQ0FBZjtBQUNBLFFBQU1DLGFBQWF6QixLQUFLaUIsU0FBTCxDQUFlSyxNQUFmLENBQXNCLFVBQUNDLEdBQUQ7QUFBQSxhQUFTQSxJQUFJQyxPQUFKLENBQVksR0FBWixJQUFtQixDQUE1QjtBQUFBLEtBQXRCLENBQW5CO0FBQ0EsUUFBTUUsY0FBY0wsT0FBT3pELE1BQTNCO0FBQ0EsUUFBTStELGtCQUFrQkYsV0FBVzdELE1BQW5DOztBQUVBLFdBQU8rQixRQUFRQyxPQUFSO0FBQ0x5QixvQkFESztBQUVMSSw0QkFGSztBQUdMQyw4QkFISztBQUlMQztBQUpLLE9BS0YzQixJQUxFLEVBQVA7QUFPRCxHQTVMTCxFQTZMSSxVQUFDRCxDQUFEO0FBQUEsV0FBT0osUUFBUUcsTUFBUixDQUFlQyxDQUFmLENBQVA7QUFBQSxHQTdMSixFQStMR1AsSUEvTEgsQ0FnTUksVUFBQ1EsSUFBRCxFQUFVO0FBQ1I7QUFDQTNCLFFBQUlZLE9BQUosQ0FBWUMsS0FBWixDQUFrQkUsSUFBbEIsQ0FBdUJmLElBQUlZLE9BQUosQ0FBWUMsS0FBWixDQUFrQkYsT0FBekMsSUFBb0RnQixJQUFwRDtBQUNBMUIsUUFBSUksTUFBSixDQUFXLGlCQUFYO0FBQ0VDLGFBQU87QUFEVCxPQUVLcUIsSUFGTDtBQUdFcEIsbUJBQWFQLElBQUlPLFdBSG5CO0FBSUVDLGlCQUFXUixJQUFJUTtBQUpqQjtBQU1ELEdBek1MLEVBME1JLFVBQUNrQixDQUFELEVBQU87QUFDTFksWUFBUUUsR0FBUixDQUFZLE9BQVosRUFBcUJkLENBQXJCO0FBQ0F6QixRQUFJZSxRQUFKLENBQWEsZUFBYjtBQUNELEdBN01MO0FBK01ELENBcE5EOztrQkFzTmVqQyxNIiwiZmlsZSI6InN0YXRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XHJcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnL2NvbmZpZy5qc29uJztcclxuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi9saWJzL2xvZ2dlcic7XHJcbmNvbnN0IHJvdXRlciA9IGV4cHJlc3MuUm91dGVyKCk7XHJcbmltcG9ydCBhc3luYyBmcm9tICdhc3luYyc7XHJcbmltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50JztcclxuXHJcbmNvbnN0IHJpZ2h0UGFkVG8gPSAocywgbGVuKSA9PiB7XHJcbiAgbGV0IHJTID0gcy50b1N0cmluZygpO1xyXG4gIGNvbnN0IGN1ckxlbiA9IHJTLmxlbmd0aDtcclxuICBjb25zdCBkaWZmID0gbGVuIC0gY3VyTGVuO1xyXG4gIGlmIChkaWZmIDwgMSkgeyByZXR1cm4gczsgfVxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGlmZjsgaSArPSAxKSB7XHJcbiAgICByUyArPSAnICc7XHJcbiAgfVxyXG4gIHJldHVybiByUztcclxufVxyXG5cclxuY29uc3QgbWFrZUNvbmNhdFN0cmluZyA9IChzLCBsZW4pID0+IHtcclxuICBsZXQgclMgPSBzLnRvU3RyaW5nKCk7XHJcbiAgY29uc3QgY3VyTGVuID0gclMubGVuZ3RoO1xyXG4gIGNvbnN0IGRpZmYgPSBsZW4gLSBjdXJMZW47XHJcbiAgcmV0dXJuIGBSUEFEKCcke3JTfScsICR7bGVufSwgMHgwMClgO1xyXG4gIHJTID0gJ0NPTkNBVChcXCcnICsgclMgKyAnXFwnJztcclxuICBpZiAoZGlmZiA8IDEpIHsgcmV0dXJuIHJTICsgJyknOyB9XHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaWZmOyBpICs9IDEpIHtcclxuICAgIHJTICs9ICcsIENIQVIoWFxcJzAwXFwnKSc7XHJcbiAgfVxyXG4gIHJldHVybiByUyArICcpJztcclxuICAvLyBDT05DQVQoJ1ZPMkpFJyxDSEFSKFgnMDAnKSxDSEFSKFgnMDAnKSxDSEFSKFgnMDAnKSxDSEFSKFgnMDAnKSxDSEFSKFgnMDAnKSlcclxufVxyXG5cclxuY29uc3QgY2xlYW5TdHJpbmcgPSAocykgPT4ge1xyXG4gIGxldCBmaW5hbFN0cmluZyA9ICcnO1xyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgY29uc3QgYXNjaWkgPSBzLmNoYXJDb2RlQXQoaSk7XHJcbiAgICBpZiAoYXNjaWkgPiA0NyAmJiBhc2NpaSA8IDkxKSB7XHJcbiAgICAgIGZpbmFsU3RyaW5nICs9IHNbaV07XHJcbiAgICB9XHJcbiAgICBpZiAoYXNjaWkgPiA5NiAmJiBhc2NpaSA8IDEyMykge1xyXG4gICAgICBmaW5hbFN0cmluZyArPSBzW2ldO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZmluYWxTdHJpbmc7XHJcbn1cclxuXHJcbnJvdXRlci5nZXQoJy8nLCAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICBjb25zdCB7XHJcbiAgICBkYkNvbm5lY3Rpb24sXHJcbiAgICBpcFxyXG4gIH0gPSByZXE7XHJcbiAgLy8gY29uc29sZS5sb2coJ3JlcS5ib2R5Jyk7XHJcbiAgcmVzLnJlbmRlcignX3N0YXRzL2luZGV4Jywge1xyXG4gICAgdGl0bGU6ICdBY2Nlc3NvIHN0YXRpc3RpY2hlJyxcclxuICAgIHZpZXdFbmdpbmVzOiByZXEudmlld0VuZ2luZXMsXHJcbiAgICB2aWV3Um9vdHM6IHJlcS52aWV3Um9vdHNcclxuICB9KTtcclxufSk7XHJcblxyXG5yb3V0ZXIucG9zdCgnLycsIChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gIGNvbnN0IHtcclxuICAgIGJvZHlcclxuICB9ID0gcmVxO1xyXG4gIGlmIChib2R5Lm1hbmRhdG8pIHtcclxuICAgIHJlcS5zZXNzaW9uLnN0YXRzID0ge1xyXG4gICAgICBjbGllbnRlOiBib2R5LmNsaWVudGUsXHJcbiAgICAgIG1hbmRhdG86IGJvZHkubWFuZGF0byxcclxuICAgICAgZGF0aToge31cclxuICAgIH07XHJcbiAgICByZXMucmVkaXJlY3QoJy9TZXJmaW5TdGF0cy9vdmVydmlldycpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXMucmVkaXJlY3QoJy9TZXJmaW5TdGF0cy8nKTtcclxuICB9XHJcbn0pO1xyXG5cclxucm91dGVyLmdldCgnL292ZXJ2aWV3JywgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgY29uc3Qge1xyXG4gICAgZGJDb25uZWN0aW9uLFxyXG4gICAgc2Vzc2lvblxyXG4gIH0gPSByZXE7XHJcbiAgZGJDb25uZWN0aW9uLnF1ZXJ5KGBTRUxFQ1QgY291bnQoRElTVElOQ1QgaWRjb250cmF0dG8pIGFzIHRvdGFsZUNvbnRyYXR0aSwgY291bnQoRElTVElOQ1QgY29kaWNlX2RhX3VybCkgYXMgdG90YWxlQ29kaWNpRGFVcmwgRlJPTSBwYWdhbWVudG9fb25saW5lX2lkY29udHJhdHRvX2NmIFdIRVJFIG1hbmRhdG8gPSAke2RiQ29ubmVjdGlvbi5lc2NhcGUoc2Vzc2lvbi5zdGF0cy5tYW5kYXRvKX0gQU5EIGlkY2xpZW50ZSA9ICR7ZGJDb25uZWN0aW9uLmVzY2FwZShzZXNzaW9uLnN0YXRzLmNsaWVudGUpfWApXHJcbiAgICAudGhlbihcclxuICAgICAgKHJlc3VsdHMpID0+IHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygnUmVzdWx0cycsIHJlc3VsdHMpO1xyXG4gICAgICAgIGlmIChyZXN1bHRzICYmIHJlc3VsdHNbMF0gJiYgcmVzdWx0c1swXS50b3RhbGVDb250cmF0dGkgPiAwKSB7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgICAgdG90YWxlQ29udHJhdHRpOiByZXN1bHRzWzBdLnRvdGFsZUNvbnRyYXR0aSxcclxuICAgICAgICAgICAgdG90YWxlQ29kaWNpRGFVcmw6IHJlc3VsdHNbMF0udG90YWxlQ29kaWNpRGFVcmxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICApXHJcbiAgICAudGhlbihcclxuICAgICAgKGRhdGEpID0+IHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgU0VMRUNUIERJU1RJTkNUIGNvZGljZV9kYV91cmwgYXMgY29kaWNlIEZST00gcGFnYW1lbnRvX29ubGluZV9pZGNvbnRyYXR0b19jZiBXSEVSRSBtYW5kYXRvID0gJHtkYkNvbm5lY3Rpb24uZXNjYXBlKHNlc3Npb24uc3RhdHMubWFuZGF0byl9ICBBTkQgaWRjbGllbnRlID0gJHtkYkNvbm5lY3Rpb24uZXNjYXBlKHNlc3Npb24uc3RhdHMuY2xpZW50ZSl9YCk7XHJcbiAgICAgICAgcmV0dXJuIGRiQ29ubmVjdGlvbi5xdWVyeShgU0VMRUNUIERJU1RJTkNUIGNvZGljZV9kYV91cmwgYXMgY29kaWNlIEZST00gcGFnYW1lbnRvX29ubGluZV9pZGNvbnRyYXR0b19jZiBXSEVSRSBtYW5kYXRvID0gJHtkYkNvbm5lY3Rpb24uZXNjYXBlKHNlc3Npb24uc3RhdHMubWFuZGF0byl9ICBBTkQgaWRjbGllbnRlID0gJHtkYkNvbm5lY3Rpb24uZXNjYXBlKHNlc3Npb24uc3RhdHMuY2xpZW50ZSl9YClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAocmVzdWx0cykgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHVuaXF1ZUNvZGVzID0gcmVzdWx0cy5tYXAoKHIpID0+IHIuY29kaWNlKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgIHVuaXF1ZUNvZGVzLFxyXG4gICAgICAgICAgICAgICAgLi4uZGF0YVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICk7XHJcbiAgICAgIH0sXHJcbiAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChkYXRhKSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc3FsID0gYFNFTEVDVCBESVNUSU5DVCB0cmFja2luZyBhcyB0cmFja2luZyBGUk9NIG9ubGluZV9wYXltZW50X2xvZ3MgV0hFUkUgdHJhY2tpbmcgSU4gKCR7ZGF0YS51bmlxdWVDb2Rlcy5tYXAoKGVsKSA9PiBtYWtlQ29uY2F0U3RyaW5nKGVsLCAxMCkpLmpvaW4oJywnKX0pYDtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygnU3FsJywgc3FsKTtcclxuICAgICAgICByZXR1cm4gZGJDb25uZWN0aW9uLnF1ZXJ5KHNxbClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAocmVzdWx0cykgPT4ge1xyXG4gICAgICAgICAgICAgIGxldCB0b3RhbENvbnN1bWVkQ29kZXMgPSByZXN1bHRzLmxlbmd0aDtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgIHRvdGFsQ29uc3VtZWRDb2RlczogdG90YWxDb25zdW1lZENvZGVzLFxyXG4gICAgICAgICAgICAgICAgY29uc3VtZWRDb2RlczogcmVzdWx0cy5tYXAoKHIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgaWYgKCFyLnRyYWNraW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignUiBUUkFDS0lORyBJUyBOVUxMJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocik7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGNsZWFuU3RyaW5nKHIudHJhY2tpbmcudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICAgIC4uLmRhdGFcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9LFxyXG4gICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgIClcclxuICAgIC50aGVuKFxyXG4gICAgICAoZGF0YSkgPT4ge1xyXG4gICAgICAgIGlmIChkYXRhLmNvbnN1bWVkQ29kZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgICAgdG90YWxDb25zdW1lZENvbnRyYXR0aTogMCxcclxuICAgICAgICAgICAgY29uc3VtZWRDb250cmF0dGk6IFtdLFxyXG4gICAgICAgICAgICAuLi5kYXRhXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc3FsID0gYFNFTEVDVCBjb3VudChESVNUSU5DVCBpZGNvbnRyYXR0bykgYXMgdG90YWxDb25zdW1lZENvbnRyYXR0aSwgaWRjb250cmF0dG8gRlJPTSBwYWdhbWVudG9fb25saW5lX2lkY29udHJhdHRvX2NmIFdIRVJFIGNvZGljZV9kYV91cmwgSU4gKCR7ZGF0YS5jb25zdW1lZENvZGVzLm1hcCgoZWwpID0+IGRiQ29ubmVjdGlvbi5lc2NhcGUoZWwpKS5qb2luKCcsJyl9KWA7XHJcbiAgICAgICAgcmV0dXJuIGRiQ29ubmVjdGlvbi5xdWVyeShzcWwpXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgKHJlc3VsdHMpID0+IHtcclxuICAgICAgICAgICAgICBsZXQgdG90YWxDb25zdW1lZENvbnRyYXR0aSA9IDA7XHJcbiAgICAgICAgICAgICAgaWYgKHJlc3VsdHMgJiYgcmVzdWx0c1swXSkge1xyXG4gICAgICAgICAgICAgICAgdG90YWxDb25zdW1lZENvbnRyYXR0aSA9IHJlc3VsdHNbMF0udG90YWxDb25zdW1lZENvbnRyYXR0aTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICB0b3RhbENvbnN1bWVkQ29udHJhdHRpOiB0b3RhbENvbnN1bWVkQ29udHJhdHRpLFxyXG4gICAgICAgICAgICAgICAgY29uc3VtZWRDb250cmF0dGk6IHRvdGFsQ29uc3VtZWRDb250cmF0dGkgPiAwID8gcmVzdWx0cy5tYXAoKHIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgaWYgKCFyLmlkY29udHJhdHRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignTk8gUiBJRENPTlRSQVRUTycpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHIpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiByLmlkY29udHJhdHRvLnRvU3RyaW5nKClcclxuICAgICAgICAgICAgICAgIH0pIDogW10sXHJcbiAgICAgICAgICAgICAgICAuLi5kYXRhXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSxcclxuICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICApXHJcbiAgICAudGhlbihcclxuICAgICAgKGRhdGEpID0+IHtcclxuICAgICAgICBpZiAoZGF0YS5jb25zdW1lZENvZGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgICAgIGFkZHJlc3NlczogW10sXHJcbiAgICAgICAgICAgIC4uLmRhdGFcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzcWwgPSBgU0VMRUNUIGVtYWlsX2RlYml0b3JlIEZST00gcGFnYW1lbnRvX29ubGluZV9pZGNvbnRyYXR0b19jZiBXSEVSRSBjb2RpY2VfZGFfdXJsIElOICgke2RhdGEuY29uc3VtZWRDb2Rlcy5tYXAoKGVsKSA9PiBkYkNvbm5lY3Rpb24uZXNjYXBlKGVsKSkuam9pbignLCcpfSlgO1xyXG4gICAgICAgIHJldHVybiBkYkNvbm5lY3Rpb24ucXVlcnkoc3FsKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIChyZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICBhZGRyZXNzZXM6IHJlc3VsdHMubWFwKChyKSA9PiByLmVtYWlsX2RlYml0b3JlKSxcclxuICAgICAgICAgICAgICAgIC4uLmRhdGFcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9LFxyXG4gICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgIClcclxuICAgIC50aGVuKFxyXG4gICAgICAoZGF0YSkgPT4ge1xyXG4gICAgICAgIGlmIChkYXRhLmNvbnN1bWVkQ29udHJhdHRpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgICAgIHRvdGFsZUNvbnRyYXR0aVBhZ2F0aTogMCxcclxuICAgICAgICAgICAgLi4uZGF0YVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNxbCA9IGBTRUxFQ1QgY291bnQoRElTVElOQ1QgaWRDb250cmF0dG8pIGFzIHRvdGFsZUNvbnRyYXR0aVBhZ2F0aSwgaWRjb250cmF0dG8gRlJPTSBvbmxpbmVQYXltZW50VHJhbnNhY3Rpb25zIFdIRVJFXHJcbiAgICAgICAgICBzdGF0dXMgPSAnQVBQUk9WRUQnXHJcbiAgICAgICAgICBBTkRcclxuICAgICAgICAgIGNvbXBsZXRlZCA9IDFcclxuICAgICAgICAgIEFORFxyXG4gICAgICAgICAgaWRDb250cmF0dG8gSU4gKCR7ZGF0YS5jb25zdW1lZENvbnRyYXR0aS5tYXAoKGVsKSA9PiBkYkNvbm5lY3Rpb24uZXNjYXBlKGVsKSkuam9pbignLCcpfSlgO1xyXG4gICAgICAgIHJldHVybiBkYkNvbm5lY3Rpb24ucXVlcnkoc3FsKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIChyZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgICAgICAgbGV0IHRvdGFsZUNvbnRyYXR0aVBhZ2F0aSA9IDA7XHJcbiAgICAgICAgICAgICAgaWYgKHJlc3VsdHMgJiYgcmVzdWx0c1swXSkge1xyXG4gICAgICAgICAgICAgICAgdG90YWxlQ29udHJhdHRpUGFnYXRpID0gcmVzdWx0c1swXS50b3RhbGVDb250cmF0dGlQYWdhdGk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgdG90YWxlQ29udHJhdHRpUGFnYXRpOiB0b3RhbGVDb250cmF0dGlQYWdhdGksXHJcbiAgICAgICAgICAgICAgICAuLi5kYXRhXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSxcclxuICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICApXHJcbiAgICAudGhlbihcclxuICAgICAgKGRhdGEpID0+IHtcclxuICAgICAgICBpZiAoZGF0YS5jb25zdW1lZENvbnRyYXR0aS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgICAgICB0b3RhbGVDb250cmF0dGlOb25QYWdhdGk6IDAsXHJcbiAgICAgICAgICAgIC4uLmRhdGFcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzcWwgPSBgU0VMRUNUIGNvdW50KERJU1RJTkNUIGlkQ29udHJhdHRvKSBhcyB0b3RhbGVDb250cmF0dGlOb25QYWdhdGksIGlkY29udHJhdHRvIEZST00gb25saW5lUGF5bWVudFRyYW5zYWN0aW9ucyBXSEVSRVxyXG4gICAgICAgICAgc3RhdHVzICE9ICdBUFBST1ZFRCdcclxuICAgICAgICAgIEFORFxyXG4gICAgICAgICAgaWRDb250cmF0dG8gSU4gKCR7ZGF0YS5jb25zdW1lZENvbnRyYXR0aS5tYXAoKGVsKSA9PiBkYkNvbm5lY3Rpb24uZXNjYXBlKGVsKSkuam9pbignLCcpfSlgO1xyXG4gICAgICAgIHJldHVybiBkYkNvbm5lY3Rpb24ucXVlcnkoc3FsKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIChyZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgICAgICAgbGV0IHRvdGFsZUNvbnRyYXR0aU5vblBhZ2F0aSA9IDA7XHJcbiAgICAgICAgICAgICAgaWYgKHJlc3VsdHMgJiYgcmVzdWx0c1swXSkge1xyXG4gICAgICAgICAgICAgICAgdG90YWxlQ29udHJhdHRpTm9uUGFnYXRpID0gcmVzdWx0c1swXS50b3RhbGVDb250cmF0dGlOb25QYWdhdGk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgdG90YWxlQ29udHJhdHRpTm9uUGFnYXRpOiB0b3RhbGVDb250cmF0dGlOb25QYWdhdGksXHJcbiAgICAgICAgICAgICAgICAuLi5kYXRhXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSxcclxuICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICApXHJcbiAgICAudGhlbihcclxuICAgICAgKGRhdGEpID0+IHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygnYWRkcmVzc2VzJywgZGF0YS5hZGRyZXNzZXMpO1xyXG4gICAgICAgIGNvbnN0IGVtYWlscyA9IGRhdGEuYWRkcmVzc2VzLmZpbHRlcigoYWRkKSA9PiBhZGQuaW5kZXhPZignQCcpID4gLTEpO1xyXG4gICAgICAgIGNvbnN0IGNlbGxwaG9uZXMgPSBkYXRhLmFkZHJlc3Nlcy5maWx0ZXIoKGFkZCkgPT4gYWRkLmluZGV4T2YoJ0AnKSA8IDApO1xyXG4gICAgICAgIGNvbnN0IHRvdGFsRW1haWxzID0gZW1haWxzLmxlbmd0aDtcclxuICAgICAgICBjb25zdCB0b3RhbENlbGxwaG9uZXMgPSBjZWxscGhvbmVzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgICBlbWFpbHMsXHJcbiAgICAgICAgICBjZWxscGhvbmVzLFxyXG4gICAgICAgICAgdG90YWxFbWFpbHMsXHJcbiAgICAgICAgICB0b3RhbENlbGxwaG9uZXMsXHJcbiAgICAgICAgICAuLi5kYXRhXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChkYXRhKSA9PiB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ0RhdGEnLCBkYXRhKTtcclxuICAgICAgICByZXEuc2Vzc2lvbi5zdGF0cy5kYXRpW3JlcS5zZXNzaW9uLnN0YXRzLm1hbmRhdG9dID0gZGF0YTtcclxuICAgICAgICByZXMucmVuZGVyKCdfc3RhdHMvb3ZlcnZpZXcnLCB7XHJcbiAgICAgICAgICB0aXRsZTogJ1NvbW1hcmlvJyxcclxuICAgICAgICAgIC4uLmRhdGEsXHJcbiAgICAgICAgICB2aWV3RW5naW5lczogcmVxLnZpZXdFbmdpbmVzLFxyXG4gICAgICAgICAgdmlld1Jvb3RzOiByZXEudmlld1Jvb3RzXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIChlKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yJywgZSk7XHJcbiAgICAgICAgcmVzLnJlZGlyZWN0KCcvU2VyZmluU3RhdHMvJyk7XHJcbiAgICAgIH1cclxuICAgIClcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7XHJcbiJdfQ==