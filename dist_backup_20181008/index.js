'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _promiseMysql = require('promise-mysql');

var _promiseMysql2 = _interopRequireDefault(_promiseMysql);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _rotatingFileStream = require('rotating-file-stream');

var _rotatingFileStream2 = _interopRequireDefault(_rotatingFileStream);

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

var _expressFileupload = require('express-fileupload');

var _expressFileupload2 = _interopRequireDefault(_expressFileupload);

var _gate = require('./routes/gate');

var _gate2 = _interopRequireDefault(_gate);

var _requestsecret = require('./routes/requestsecret');

var _requestsecret2 = _interopRequireDefault(_requestsecret);

var _requestfullname = require('./routes/requestfullname');

var _requestfullname2 = _interopRequireDefault(_requestfullname);

var _vivr = require('./routes/vivr');

var _vivr2 = _interopRequireDefault(_vivr);

var _nocode = require('./routes/nocode');

var _nocode2 = _interopRequireDefault(_nocode);

var _mailtrack = require('./routes/mailtrack');

var _mailtrack2 = _interopRequireDefault(_mailtrack);

var _config = require('./config/config.json');

var _config2 = _interopRequireDefault(_config);

var _ect = require('ect');

var _ect2 = _interopRequireDefault(_ect);

var _connectRedis = require('connect-redis');

var _connectRedis2 = _interopRequireDefault(_connectRedis);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _formatCurrency = require('format-currency');

var _formatCurrency2 = _interopRequireDefault(_formatCurrency);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _paymentmethods = require('./paymentmethods/');

var _paymentmethods2 = _interopRequireDefault(_paymentmethods);

var _stripslashes = require('./libs/stripslashes');

var _stripslashes2 = _interopRequireDefault(_stripslashes);

var _expressRateLimit = require('express-rate-limit');

var _expressRateLimit2 = _interopRequireDefault(_expressRateLimit);

var _functionalCheckAuth = require('./libs/functionalCheckAuth');

var _functionalCheckAuth2 = _interopRequireDefault(_functionalCheckAuth);

var _uniqueIds = require('./routes/uniqueIds');

var _uniqueIds2 = _interopRequireDefault(_uniqueIds);

var _expressCluster = require('express-cluster');

var _expressCluster2 = _interopRequireDefault(_expressCluster);

var _onFinished = require('on-finished');

var _onFinished2 = _interopRequireDefault(_onFinished);

var _stats = require('./routes/stats.js');

var _stats2 = _interopRequireDefault(_stats);

var _serveStatic = require('serve-static');

var _serveStatic2 = _interopRequireDefault(_serveStatic);

var _smallContent = require('./routes/smallContent.js');

var _smallContent2 = _interopRequireDefault(_smallContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var env = process.env.NODE_ENV || 'dist';

var startUpFunction = function startUpFunction(worker) {
  _moment2.default.locale('IT');
  var RedisStore = (0, _connectRedis2.default)(_expressSession2.default);
  var dbPool = _promiseMysql2.default.createPool({
    connectionLimit: _config2.default.dbConnectionLimit,
    acquireTimeout: 1000,
    host: _config2.default.dbHost,
    user: _config2.default.dbUser,
    password: _config2.default.dbPassword,
    database: _config2.default.dbName
  });
  var unratedUrls = [];
  Object.keys(_paymentmethods2.default).forEach(function (moduleId) {
    var pmc = _paymentmethods2.default[moduleId];
    var urls = pmc.getCallBackUrls();
    urls.forEach(function (url) {
      unratedUrls.push(url.url);
    });
  });
  var unauthedRateLimit = (0, _expressRateLimit2.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 12,
    delayMs: 0, // disabled
    skip: function skip(req) {
      if (req.ip === '::ffff:10.161.14.173' || typeof req.ip === 'undefined') {
        return true;
      }
      if (req.ip === '::ffff:10.161.9.26' || typeof req.ip === 'undefined') {
        return true;
      }
      if (unratedUrls.indexOf(req.originalUrl) > -1 || (0, _functionalCheckAuth2.default)(req)) {
        return true;
      }
      return false;
    },
    onLimitReached: function onLimitReached(req) {
      console.warn('[Rate limit reached] Anauthed client from ' + req.ip + ' hit the rate limit!');
    }
  });
  var app = (0, _express2.default)();

  app.set('view engine', 'ect');
  app.set('views', ['./views/default']);
  app.use(function (req, res, next) {
    console.log('New request!', req.originalUrl);
    next();
  });
  // app.set('trust proxy', 'loopback, 10.161.9.26');
  app.set('trust proxy', function (ip) {
    var trusted = ['10.161.9.26', '127.0.0.1', '::ffff:127.0.0.1', '::1'];

    // console.log('Trusting proxy', ip, trusted.indexOf(ip) > -1);
    return trusted.indexOf(ip) > -1;
  });
  var ectRenderer = (0, _ect2.default)({ watch: true, cache: false, root: 'views/default' });
  app.engine('ect', ectRenderer.render);
  app.use(_bodyParser2.default.urlencoded({
    extended: true,
    limit: '1mb'
  }));
  app.use(function (req, res, next) {
    // console.log('Next', req.originalUrl);
    // console.log(req.originalUrl.substring(0, 5));
    if (!(req.originalUrl.substring(0, 5) === '/mail')) {
      // console.log('Session check', req.originalUrl, decodeURIComponent(req.headers['cookie']));
    }
    next();
  });
  app.use(function (req, res, next) {
    if (req.originalUrl.substring(0, 5) === '/mail') {
      next();
    } else {
      (0, _expressSession2.default)({
        store: new RedisStore({}),
        secret: 'SerfinPaymentGateway',
        resave: false,
        saveUninitialized: true,
        rolling: true,
        cookie: { secure: true, httpOnly: true, signed: true },
        maxAge: 600000
      })(req, res, next);
    }
  });
  // app.use(session({
  //   store: new RedisStore({
  //   }),
  //   secret: 'SerfinPaymentGateway',
  //   resave: false,
  //   saveUninitialized: true,
  //   cookie: { httpOnly: true, signed: true },
  //   maxAge: 600000
  // }));
  // app.use((req, res, next) => {
  //   console.log('Protocol', req.protocol);
  //   const trust = app.get('trust proxy fn');
  //   console.log('trust', trust);
  //   console.log('X-Forwarded-Proto', req.get('X-Forwarded-Proto'));
  //   console.log('req.headers', req.headers);
  //   next();
  // });
  app.use(function (req, res, next) {
    if (req.originalUrl.substring(0, 5) === '/mail') {
      next();
    } else {
      // if (!(req.session && req.session.code)) {
      //   console.log('Session check', req.originalUrl, req.ip, req.session && req.session.code ? 'OK' : 'NOK', req.sessionID, req.headers['cookie']);
      // } else {
      //   console.log('Session check', req.originalUrl, req.ip, req.session && req.session.code ? 'OK' : 'NOK', req.sessionID, req.headers['cookie']);
      // }
      next();
    }
  });
  app.use(function (req, res, next) {
    if (req.originalUrl.substring(0, 5) === '/vivr') {
      if (!(req.session && req.session.authenticated)) {
        console.log('Possible session error', req.originalUrl, req.ip, req.session && req.session.code ? 'OK' : 'NOK', req.sessionID, decodeURIComponent(req.headers['cookie']));
      }
    }
    next();
  });
  app.use(function (req, res, next) {
    if (req.session && req.session.domain && req.session.domain !== 'default') {
      // console.log('domain is already', req.session.domain);
      next();
    } else if (!req.session) {
      next();
    } else {
      var domain = req.get('host').split(':')[0];
      _fs2.default.readFile('./domainsToCustomer/' + domain, function (fserr, value) {
        if (!fserr && value.toString().length > 0) {
          req.session.domain = value.toString().trim();
          console.warn('[valid domain] From url ' + domain + ', domain is ' + req.session.domain);
        }
        next();
      });
    }
    // next();
  });
  app.use(function (req, res, next) {
    if (req.session && req.session.domain) {
      var roots = ['./views/' + req.session.domain, './views/default'];
      // console.log('Roots', roots);
      var _ectRenderer = (0, _ect2.default)({ watch: true, cache: false, root: roots, ext: '.ect' });
      // app.set('views', roots);
      // app.engine('ect', ectRenderer.render);
      req.viewEngines = { '.ect': _ectRenderer.render, 'default': false };
      req.viewRoots = roots;
    } else {
      // console.log('No roots');
      var _roots = ['./views/default'];
      var _ectRenderer2 = (0, _ect2.default)({ watch: true, cache: false, root: _roots, ext: '.ect' });
      // app.engine('ect', ectRenderer.render);
      req.viewEngines = { '.ect': _ectRenderer2.render, 'default': true };
      req.viewRoots = _roots;
    }
    next();
  });
  app.use(function (req, res, next) {
    // console.log('app.render', app.render);
    next();
  });
  app.use(function (req, res, next) {
    if (req && req.session && req.session.domain && req.session.domain.length > 0) {
      // console.log('Trying to serve static from', `./public/${req.session.domain}`, req.originalUrl);
      var serveStatic = (0, _serveStatic2.default)('./public/' + req.session.domain);
      serveStatic(req, res, next);
    } else {
      next();
    }
    // app.use(express.static('./public'));
  });
  app.use(_express2.default.static('./public/default'));
  var logDirectory = './logs/';
  _fs2.default.existsSync(logDirectory) || _fs2.default.mkdirSync(logDirectory);
  var accessLogStream = (0, _rotatingFileStream2.default)('access.log', {
    interval: '1d', // rotate daily
    path: logDirectory
  });
  app.use((0, _morgan2.default)('combined', { stream: accessLogStream }));
  app.use(unauthedRateLimit);
  app.use(function (req, res, next) {
    console.log('Getting db', req.ip);
    dbPool.getConnection().then(function (connection) {
      if (connection) {
        console.log('Got db!', req.ip);
        (0, _onFinished2.default)(res, function () {
          if (connection.release) {
            connection.release();
            connection.release = null;
          }
        });
        setTimeout(function () {
          if (connection.release) {
            connection.release();
            connection.release = null;
          }
        }, 5000);
        if (req.ip) {
          req.dbConnection = connection;
          return Promise.resolve({ connection: connection });
        } else {
          // connection.release();
          return Promise.reject('Client gone!');
        }
      } else {
        console.log('Did not get db!');
        req.dbConnection = connection;
        return Promise.reject('No connection!');
      }
      // return connection.query('SELECT 1')
      // .then(
      //   (result) => Promise.resolve({ connection }),
      //   (e) => Promise.reject(e)
      // );
    }, function (e) {
      console.error('[db] Unable to get connection from pool!', e);
      return Promise.reject(e);
    }).then(function (_ref) {
      var connection = _ref.connection;

      // console.log('[db] Test query success!');
      return Promise.resolve({ connection: connection });
    }, function (e) {
      console.error('[db] Test query failed!', e);
      return Promise.reject(e);
    }).then(function (_ref2) {
      var stop = _ref2.stop;

      // Qui imposto un callback sull'evento finish di express
      // L'evento finish viene chiamato ogni volta che
      // viene mandata una risposta al cliente.
      // Il callback server per restituire al pool la connessione che era
      // stata assegnata alla richiesta (req) corrente
      if (!stop) {
        next();
      } else {
        console.log('Not going next...');
      }
    }, function (e) {
      next(e);
    });
  });
  app.use('/uniqueIds', _uniqueIds2.default);
  app.use('/SerfinStats', _stats2.default);
  app.use(function (req, res, next) {
    req.config = _config2.default;
    next();
  });
  app.use(function (req, res, next) {
    // console.log('Full Session', req.session);
    next();
  });
  app.use(_gate2.default);
  app.use(function (req, res, next) {
    if (req.session) {
      req.baseParams = {
        domain: req.session.domain,
        dbRecord: req.session.dbRecord,
        fullDbRecords: req.session.fullDbRecords,
        formatCurrency: _formatCurrency2.default,
        stripslashes: _stripslashes2.default,
        moment: _moment2.default
      };
    }
    next();
  });
  app.use(_mailtrack2.default);
  app.use(_nocode2.default);
  app.use(_requestsecret2.default);
  app.use(_requestfullname2.default);
  app.use((0, _expressFileupload2.default)({
    limits: { fileSize: 500 * 1024 }
  }));
  app.use('/vivr', _vivr2.default);
  Object.keys(_paymentmethods2.default).forEach(function (moduleId) {
    // console.log('moduleId', moduleId);
    var pmc = _paymentmethods2.default[moduleId];
    var urls = pmc.getCallBackUrls();
    urls.forEach(function (c) {
      var url = c.url;
      var callback = c.method;
      var httpMethod = c.httpMethod;

      // console.log('Creating url', `/callback/${url}`, 'in', httpMethod);
      app[httpMethod]('/callback/' + url, function (req, res, next) {
        var myClass = _paymentmethods2.default[moduleId];
        var myMethod = myClass[callback];
        if (!myClass || !myMethod) {
          next(500);
        } else {
          myMethod(req, res, next);
        }
      });
    });
  });
  app.use('/', _smallContent2.default);
  app.use('/', function (req, res, next) {
    next();
  });
  app.use(function (err, req, res, next) {
    if (err) {
      console.log('Error!', err);
      var _session = req.session;

      if (err === 'Fraud attempt') {
        console.log('Fraud!');
        res.status(500).render('errors/fraud', Object.assign({}, req.baseParams, {
          title: 'Fraud attempt',
          domain: _session && _session.domain ? _session.domain : 'default_domain',
          viewEngines: req.viewEngines,
          viewRoots: req.viewRoots
        }));
      } else if (err === 'DB FAILURE') {
        console.log('FAILURE!', req.viewRoots);
        res.status(500).render('errors/dbfailure', Object.assign({}, req.baseParams, {
          title: 'Temporary error',
          domain: _session && _session.domain ? _session.domain : 'default_domain',
          viewEngines: req.viewEngines,
          viewRoots: req.viewRoots
        }));
      } else {
        res.status(500).send('Failure');
      }
    } else {
      res.status(404).send('Sorry!');
    }
  });
  if (env === 'dev') {
    app.set('port', _config2.default.httpDevPort);
  } else {
    app.set('port', _config2.default.httpPort);
  }
  var hr = 1000 * 60 * 60;
  var timeout = Math.floor(Math.random() * (3 * hr - hr)) + hr;
  var msToTime = function msToTime(s) {
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
    return hrs + ':' + mins + ':' + secs;
  };
  var server = app.listen(app.get('port'), function () {
    if (worker) {
      console.info('Web server (cluster # ' + worker.id + ') listening on port ' + app.get('port') + ', will shut down in ' + msToTime(timeout));
    } else {
      console.info('Web server (single cluster) listening on port ' + app.get('port'));
    }
  });
  if (worker) {
    setTimeout(function () {
      server.close(function () {
        dbPool.end(function () {
          console.info('Web server (cluster # ' + worker.id + ') is now offline and db is now disconnected. Worker exiting.');
          process.exit(0);
        });
      });
    }, timeout);
  }
  server.timeout = 10000;
};
if (env === 'dev') {
  startUpFunction();
} else {
  (0, _expressCluster2.default)(startUpFunction, { count: 3 });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJlbnYiLCJwcm9jZXNzIiwiTk9ERV9FTlYiLCJzdGFydFVwRnVuY3Rpb24iLCJ3b3JrZXIiLCJsb2NhbGUiLCJSZWRpc1N0b3JlIiwiZGJQb29sIiwiY3JlYXRlUG9vbCIsImNvbm5lY3Rpb25MaW1pdCIsImRiQ29ubmVjdGlvbkxpbWl0IiwiYWNxdWlyZVRpbWVvdXQiLCJob3N0IiwiZGJIb3N0IiwidXNlciIsImRiVXNlciIsInBhc3N3b3JkIiwiZGJQYXNzd29yZCIsImRhdGFiYXNlIiwiZGJOYW1lIiwidW5yYXRlZFVybHMiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsIm1vZHVsZUlkIiwicG1jIiwidXJscyIsImdldENhbGxCYWNrVXJscyIsInVybCIsInB1c2giLCJ1bmF1dGhlZFJhdGVMaW1pdCIsIndpbmRvd01zIiwibWF4IiwiZGVsYXlNcyIsInNraXAiLCJyZXEiLCJpcCIsImluZGV4T2YiLCJvcmlnaW5hbFVybCIsIm9uTGltaXRSZWFjaGVkIiwiY29uc29sZSIsIndhcm4iLCJhcHAiLCJzZXQiLCJ1c2UiLCJyZXMiLCJuZXh0IiwibG9nIiwidHJ1c3RlZCIsImVjdFJlbmRlcmVyIiwid2F0Y2giLCJjYWNoZSIsInJvb3QiLCJlbmdpbmUiLCJyZW5kZXIiLCJ1cmxlbmNvZGVkIiwiZXh0ZW5kZWQiLCJsaW1pdCIsInN1YnN0cmluZyIsInN0b3JlIiwic2VjcmV0IiwicmVzYXZlIiwic2F2ZVVuaW5pdGlhbGl6ZWQiLCJyb2xsaW5nIiwiY29va2llIiwic2VjdXJlIiwiaHR0cE9ubHkiLCJzaWduZWQiLCJtYXhBZ2UiLCJzZXNzaW9uIiwiYXV0aGVudGljYXRlZCIsImNvZGUiLCJzZXNzaW9uSUQiLCJkZWNvZGVVUklDb21wb25lbnQiLCJoZWFkZXJzIiwiZG9tYWluIiwiZ2V0Iiwic3BsaXQiLCJyZWFkRmlsZSIsImZzZXJyIiwidmFsdWUiLCJ0b1N0cmluZyIsImxlbmd0aCIsInRyaW0iLCJyb290cyIsImV4dCIsInZpZXdFbmdpbmVzIiwidmlld1Jvb3RzIiwic2VydmVTdGF0aWMiLCJzdGF0aWMiLCJsb2dEaXJlY3RvcnkiLCJleGlzdHNTeW5jIiwibWtkaXJTeW5jIiwiYWNjZXNzTG9nU3RyZWFtIiwiaW50ZXJ2YWwiLCJwYXRoIiwic3RyZWFtIiwiZ2V0Q29ubmVjdGlvbiIsInRoZW4iLCJjb25uZWN0aW9uIiwicmVsZWFzZSIsInNldFRpbWVvdXQiLCJkYkNvbm5lY3Rpb24iLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImUiLCJlcnJvciIsInN0b3AiLCJjb25maWciLCJiYXNlUGFyYW1zIiwiZGJSZWNvcmQiLCJmdWxsRGJSZWNvcmRzIiwiZm9ybWF0Q3VycmVuY3kiLCJzdHJpcHNsYXNoZXMiLCJtb21lbnQiLCJsaW1pdHMiLCJmaWxlU2l6ZSIsImMiLCJjYWxsYmFjayIsIm1ldGhvZCIsImh0dHBNZXRob2QiLCJteUNsYXNzIiwibXlNZXRob2QiLCJlcnIiLCJzdGF0dXMiLCJhc3NpZ24iLCJ0aXRsZSIsInNlbmQiLCJodHRwRGV2UG9ydCIsImh0dHBQb3J0IiwiaHIiLCJ0aW1lb3V0IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwibXNUb1RpbWUiLCJzIiwibXMiLCJzZWNzIiwibWlucyIsImhycyIsInNlcnZlciIsImxpc3RlbiIsImluZm8iLCJpZCIsImNsb3NlIiwiZW5kIiwiZXhpdCIsImNvdW50Il0sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FB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QUNqQjNJLGVBQU80SSxHQUFQLENBQVcsWUFBTTtBQUNmM0csa0JBQVF3RyxJQUFSLDRCQUFzQzVJLE9BQU82SSxFQUE3QztBQUNBaEosa0JBQVFtSixJQUFSLENBQWEsQ0FBYjtBQUNELFNBSEQ7QUFJRCxPQUxEO0FBTUQsS0FQRCxFQU9HaEIsT0FQSDtBQVFEO0FBQ0RVLFNBQU9WLE9BQVAsR0FBaUIsS0FBakI7QUFDRCxDQTNYRDtBQTRYQSxJQUFJcEksUUFBUSxLQUFaLEVBQW1CO0FBQ2pCRztBQUNELENBRkQsTUFFTztBQUNMLGdDQUFRQSxlQUFSLEVBQXlCLEVBQUVrSixPQUFPLENBQVQsRUFBekI7QUFDRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IG15c3FsIGZyb20gJ3Byb21pc2UtbXlzcWwnO1xuaW1wb3J0IG1vcmdhbiBmcm9tICdtb3JnYW4nO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHJmcyBmcm9tICdyb3RhdGluZy1maWxlLXN0cmVhbSc7XG5pbXBvcnQgc2Vzc2lvbiBmcm9tICdleHByZXNzLXNlc3Npb24nO1xuaW1wb3J0IGZpbGV1cGxvYWQgZnJvbSAnZXhwcmVzcy1maWxldXBsb2FkJztcbmltcG9ydCBnYXRlIGZyb20gJy4vcm91dGVzL2dhdGUnO1xuaW1wb3J0IHJlcXVlc3RzZWNyZXQgZnJvbSAnLi9yb3V0ZXMvcmVxdWVzdHNlY3JldCc7XG5pbXBvcnQgcmVxdWVzdGZ1bGxuYW1lIGZyb20gJy4vcm91dGVzL3JlcXVlc3RmdWxsbmFtZSc7XG5pbXBvcnQgdml2ciBmcm9tICcuL3JvdXRlcy92aXZyJztcbmltcG9ydCBub2NvZGUgZnJvbSAnLi9yb3V0ZXMvbm9jb2RlJztcbmltcG9ydCBtYWlsdHJhY2sgZnJvbSAnLi9yb3V0ZXMvbWFpbHRyYWNrJztcbmltcG9ydCBjb25maWcgZnJvbSAnLi9jb25maWcvY29uZmlnLmpzb24nO1xuaW1wb3J0IGVjdCBmcm9tICdlY3QnO1xuaW1wb3J0IHJlZGlzQ29ubmVjdCBmcm9tICdjb25uZWN0LXJlZGlzJztcbmltcG9ydCBib2R5UGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcbmltcG9ydCBmb3JtYXRDdXJyZW5jeSBmcm9tICdmb3JtYXQtY3VycmVuY3knO1xuaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xuaW1wb3J0IHBheW1lbnRDbGFzc2VzIGZyb20gJy4vcGF5bWVudG1ldGhvZHMvJztcbmltcG9ydCBzdHJpcHNsYXNoZXMgZnJvbSAnLi9saWJzL3N0cmlwc2xhc2hlcyc7XG5pbXBvcnQgZXhwcmVzc1JhdGVMaW1pdCBmcm9tICdleHByZXNzLXJhdGUtbGltaXQnO1xuaW1wb3J0IGlzQXV0aGVudGljYXRlZCBmcm9tICcuL2xpYnMvZnVuY3Rpb25hbENoZWNrQXV0aCc7XG5pbXBvcnQgdW5pcXVlSWRSb3V0ZXIgZnJvbSAnLi9yb3V0ZXMvdW5pcXVlSWRzJztcbmltcG9ydCBjbHVzdGVyIGZyb20gJ2V4cHJlc3MtY2x1c3Rlcic7XG5pbXBvcnQgb25GaW5pc2hlZCBmcm9tICdvbi1maW5pc2hlZCc7XG5pbXBvcnQgc3RhdHNSb3V0ZXIgZnJvbSAnLi9yb3V0ZXMvc3RhdHMuanMnO1xuaW1wb3J0IHNlcnZlU3RhdGljUm91dGUgZnJvbSAnc2VydmUtc3RhdGljJztcbmltcG9ydCBzbWFsbENvbnRlbnRSb3V0ZSBmcm9tICcuL3JvdXRlcy9zbWFsbENvbnRlbnQuanMnO1xuXG5jb25zdCBlbnYgPSBwcm9jZXNzLmVudi5OT0RFX0VOViB8fCAnZGlzdCc7XG5cbmNvbnN0IHN0YXJ0VXBGdW5jdGlvbiA9ICh3b3JrZXIpID0+IHtcbiAgbW9tZW50LmxvY2FsZSgnSVQnKTtcbiAgY29uc3QgUmVkaXNTdG9yZSA9IHJlZGlzQ29ubmVjdChzZXNzaW9uKTtcbiAgY29uc3QgZGJQb29sID0gbXlzcWwuY3JlYXRlUG9vbCh7XG4gICAgY29ubmVjdGlvbkxpbWl0IDogY29uZmlnLmRiQ29ubmVjdGlvbkxpbWl0LFxuICAgIGFjcXVpcmVUaW1lb3V0OiAxMDAwLFxuICAgIGhvc3QgOiBjb25maWcuZGJIb3N0LFxuICAgIHVzZXI6IGNvbmZpZy5kYlVzZXIsXG4gICAgcGFzc3dvcmQ6IGNvbmZpZy5kYlBhc3N3b3JkLFxuICAgIGRhdGFiYXNlOiBjb25maWcuZGJOYW1lXG4gIH0pO1xuICBjb25zdCB1bnJhdGVkVXJscyA9IFtdO1xuICBPYmplY3Qua2V5cyhwYXltZW50Q2xhc3NlcykuZm9yRWFjaCgobW9kdWxlSWQpID0+IHtcbiAgICBjb25zdCBwbWMgPSBwYXltZW50Q2xhc3Nlc1ttb2R1bGVJZF07XG4gICAgY29uc3QgdXJscyA9IHBtYy5nZXRDYWxsQmFja1VybHMoKTtcbiAgICB1cmxzLmZvckVhY2goKHVybCkgPT4ge1xuICAgICAgdW5yYXRlZFVybHMucHVzaCh1cmwudXJsKTtcbiAgICB9KTtcbiAgfSk7XG4gIGNvbnN0IHVuYXV0aGVkUmF0ZUxpbWl0ID0gZXhwcmVzc1JhdGVMaW1pdCh7XG4gICAgd2luZG93TXM6IDYwICogMTAwMCwgLy8gMSBtaW51dGVcbiAgICBtYXg6IDEyLFxuICAgIGRlbGF5TXM6IDAsIC8vIGRpc2FibGVkXG4gICAgc2tpcDogKHJlcSkgPT4ge1xuICAgICAgaWYgKHJlcS5pcCA9PT0gJzo6ZmZmZjoxMC4xNjEuMTQuMTczJyB8fCB0eXBlb2YgcmVxLmlwID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXEuaXAgPT09ICc6OmZmZmY6MTAuMTYxLjkuMjYnIHx8IHR5cGVvZiByZXEuaXAgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHVucmF0ZWRVcmxzLmluZGV4T2YocmVxLm9yaWdpbmFsVXJsKSA+IC0xIHx8IGlzQXV0aGVudGljYXRlZChyZXEpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG4gICAgb25MaW1pdFJlYWNoZWQ6IChyZXEpID0+IHtcbiAgICAgIGNvbnNvbGUud2FybihgW1JhdGUgbGltaXQgcmVhY2hlZF0gQW5hdXRoZWQgY2xpZW50IGZyb20gJHtyZXEuaXB9IGhpdCB0aGUgcmF0ZSBsaW1pdCFgKTtcbiAgICB9XG4gIH0pO1xuICBjb25zdCBhcHAgPSBleHByZXNzKCk7XG5cbiAgYXBwLnNldCgndmlldyBlbmdpbmUnLCAnZWN0Jyk7XG4gIGFwcC5zZXQoJ3ZpZXdzJywgW2AuL3ZpZXdzL2RlZmF1bHRgXSk7XG4gIGFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgY29uc29sZS5sb2coJ05ldyByZXF1ZXN0IScsIHJlcS5vcmlnaW5hbFVybCk7XG4gICAgbmV4dCgpO1xuICB9KTtcbiAgLy8gYXBwLnNldCgndHJ1c3QgcHJveHknLCAnbG9vcGJhY2ssIDEwLjE2MS45LjI2Jyk7XG4gIGFwcC5zZXQoJ3RydXN0IHByb3h5JywgZnVuY3Rpb24gKGlwKSB7XG4gICAgY29uc3QgdHJ1c3RlZCA9IFtcbiAgICAgICcxMC4xNjEuOS4yNicsXG4gICAgICAnMTI3LjAuMC4xJyxcbiAgICAgICc6OmZmZmY6MTI3LjAuMC4xJyxcbiAgICAgICc6OjEnXG4gICAgXTtcblxuICAgIC8vIGNvbnNvbGUubG9nKCdUcnVzdGluZyBwcm94eScsIGlwLCB0cnVzdGVkLmluZGV4T2YoaXApID4gLTEpO1xuICAgIHJldHVybiB0cnVzdGVkLmluZGV4T2YoaXApID4gLTE7XG4gIH0pO1xuICBjb25zdCBlY3RSZW5kZXJlciA9IGVjdCh7IHdhdGNoOiB0cnVlLCBjYWNoZTogZmFsc2UsIHJvb3Q6IGB2aWV3cy9kZWZhdWx0YCB9KTtcbiAgYXBwLmVuZ2luZSgnZWN0JywgZWN0UmVuZGVyZXIucmVuZGVyKTtcbiAgYXBwLnVzZShib2R5UGFyc2VyLnVybGVuY29kZWQoe1xuICAgIGV4dGVuZGVkOiB0cnVlLFxuICAgIGxpbWl0OiAnMW1iJ1xuICB9KSk7XG4gIGFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgLy8gY29uc29sZS5sb2coJ05leHQnLCByZXEub3JpZ2luYWxVcmwpO1xuICAgIC8vIGNvbnNvbGUubG9nKHJlcS5vcmlnaW5hbFVybC5zdWJzdHJpbmcoMCwgNSkpO1xuICAgIGlmICghKHJlcS5vcmlnaW5hbFVybC5zdWJzdHJpbmcoMCwgNSkgPT09ICcvbWFpbCcpKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZygnU2Vzc2lvbiBjaGVjaycsIHJlcS5vcmlnaW5hbFVybCwgZGVjb2RlVVJJQ29tcG9uZW50KHJlcS5oZWFkZXJzWydjb29raWUnXSkpO1xuICAgIH1cbiAgICBuZXh0KCk7XG4gIH0pO1xuICBhcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgIGlmIChyZXEub3JpZ2luYWxVcmwuc3Vic3RyaW5nKDAsIDUpID09PSAnL21haWwnKSB7XG4gICAgICBuZXh0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlc3Npb24oe1xuICAgICAgICBzdG9yZTogbmV3IFJlZGlzU3RvcmUoe1xuICAgICAgICB9KSxcbiAgICAgICAgc2VjcmV0OiAnU2VyZmluUGF5bWVudEdhdGV3YXknLFxuICAgICAgICByZXNhdmU6IGZhbHNlLFxuICAgICAgICBzYXZlVW5pbml0aWFsaXplZDogdHJ1ZSxcbiAgICAgICAgcm9sbGluZzogdHJ1ZSxcbiAgICAgICAgY29va2llOiB7IHNlY3VyZTogdHJ1ZSwgaHR0cE9ubHk6IHRydWUsIHNpZ25lZDogdHJ1ZSB9LFxuICAgICAgICBtYXhBZ2U6IDYwMDAwMFxuICAgICAgfSkocmVxLCByZXMsIG5leHQpO1xuICAgIH1cbiAgfSk7XG4gIC8vIGFwcC51c2Uoc2Vzc2lvbih7XG4gIC8vICAgc3RvcmU6IG5ldyBSZWRpc1N0b3JlKHtcbiAgLy8gICB9KSxcbiAgLy8gICBzZWNyZXQ6ICdTZXJmaW5QYXltZW50R2F0ZXdheScsXG4gIC8vICAgcmVzYXZlOiBmYWxzZSxcbiAgLy8gICBzYXZlVW5pbml0aWFsaXplZDogdHJ1ZSxcbiAgLy8gICBjb29raWU6IHsgaHR0cE9ubHk6IHRydWUsIHNpZ25lZDogdHJ1ZSB9LFxuICAvLyAgIG1heEFnZTogNjAwMDAwXG4gIC8vIH0pKTtcbiAgLy8gYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgLy8gICBjb25zb2xlLmxvZygnUHJvdG9jb2wnLCByZXEucHJvdG9jb2wpO1xuICAvLyAgIGNvbnN0IHRydXN0ID0gYXBwLmdldCgndHJ1c3QgcHJveHkgZm4nKTtcbiAgLy8gICBjb25zb2xlLmxvZygndHJ1c3QnLCB0cnVzdCk7XG4gIC8vICAgY29uc29sZS5sb2coJ1gtRm9yd2FyZGVkLVByb3RvJywgcmVxLmdldCgnWC1Gb3J3YXJkZWQtUHJvdG8nKSk7XG4gIC8vICAgY29uc29sZS5sb2coJ3JlcS5oZWFkZXJzJywgcmVxLmhlYWRlcnMpO1xuICAvLyAgIG5leHQoKTtcbiAgLy8gfSk7XG4gIGFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgaWYgKHJlcS5vcmlnaW5hbFVybC5zdWJzdHJpbmcoMCwgNSkgPT09ICcvbWFpbCcpIHtcbiAgICAgIG5leHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgKCEocmVxLnNlc3Npb24gJiYgcmVxLnNlc3Npb24uY29kZSkpIHtcbiAgICAgIC8vICAgY29uc29sZS5sb2coJ1Nlc3Npb24gY2hlY2snLCByZXEub3JpZ2luYWxVcmwsIHJlcS5pcCwgcmVxLnNlc3Npb24gJiYgcmVxLnNlc3Npb24uY29kZSA/ICdPSycgOiAnTk9LJywgcmVxLnNlc3Npb25JRCwgcmVxLmhlYWRlcnNbJ2Nvb2tpZSddKTtcbiAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAvLyAgIGNvbnNvbGUubG9nKCdTZXNzaW9uIGNoZWNrJywgcmVxLm9yaWdpbmFsVXJsLCByZXEuaXAsIHJlcS5zZXNzaW9uICYmIHJlcS5zZXNzaW9uLmNvZGUgPyAnT0snIDogJ05PSycsIHJlcS5zZXNzaW9uSUQsIHJlcS5oZWFkZXJzWydjb29raWUnXSk7XG4gICAgICAvLyB9XG4gICAgICBuZXh0KCk7XG4gICAgfVxuICB9KTtcbiAgYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICBpZiAocmVxLm9yaWdpbmFsVXJsLnN1YnN0cmluZygwLCA1KSA9PT0gJy92aXZyJykge1xuICAgICAgaWYgKCEocmVxLnNlc3Npb24gJiYgcmVxLnNlc3Npb24uYXV0aGVudGljYXRlZCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Bvc3NpYmxlIHNlc3Npb24gZXJyb3InLCByZXEub3JpZ2luYWxVcmwsIHJlcS5pcCwgcmVxLnNlc3Npb24gJiYgcmVxLnNlc3Npb24uY29kZSA/ICdPSycgOiAnTk9LJywgcmVxLnNlc3Npb25JRCwgZGVjb2RlVVJJQ29tcG9uZW50KHJlcS5oZWFkZXJzWydjb29raWUnXSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBuZXh0KCk7XG4gIH0pO1xuICBhcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgIGlmIChyZXEuc2Vzc2lvbiAmJiByZXEuc2Vzc2lvbi5kb21haW4gJiYgcmVxLnNlc3Npb24uZG9tYWluICE9PSAnZGVmYXVsdCcpIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdkb21haW4gaXMgYWxyZWFkeScsIHJlcS5zZXNzaW9uLmRvbWFpbik7XG4gICAgICBuZXh0KCk7XG4gICAgfSBlbHNlIGlmICghcmVxLnNlc3Npb24pIHtcbiAgICAgIG5leHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZG9tYWluID0gcmVxLmdldCgnaG9zdCcpLnNwbGl0KCc6JylbMF07XG4gICAgICBmcy5yZWFkRmlsZShgLi9kb21haW5zVG9DdXN0b21lci8ke2RvbWFpbn1gLCAoZnNlcnIsIHZhbHVlKSA9PiB7XG4gICAgICAgIGlmICghZnNlcnIgJiYgdmFsdWUudG9TdHJpbmcoKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmVxLnNlc3Npb24uZG9tYWluID0gdmFsdWUudG9TdHJpbmcoKS50cmltKCk7XG4gICAgICAgICAgY29uc29sZS53YXJuKGBbdmFsaWQgZG9tYWluXSBGcm9tIHVybCAke2RvbWFpbn0sIGRvbWFpbiBpcyAke3JlcS5zZXNzaW9uLmRvbWFpbn1gKTtcbiAgICAgICAgfVxuICAgICAgICBuZXh0KCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gbmV4dCgpO1xuICB9KTtcbiAgYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICBpZiAocmVxLnNlc3Npb24gJiYgcmVxLnNlc3Npb24uZG9tYWluKSB7XG4gICAgICBjb25zdCByb290cyA9IFtcbiAgICAgICAgYC4vdmlld3MvJHtyZXEuc2Vzc2lvbi5kb21haW59YCxcbiAgICAgICAgYC4vdmlld3MvZGVmYXVsdGBcbiAgICAgIF07XG4gICAgICAvLyBjb25zb2xlLmxvZygnUm9vdHMnLCByb290cyk7XG4gICAgICBjb25zdCBlY3RSZW5kZXJlciA9IGVjdCh7IHdhdGNoOiB0cnVlLCBjYWNoZTogZmFsc2UsIHJvb3Q6IHJvb3RzLCBleHQ6ICcuZWN0J30pO1xuICAgICAgLy8gYXBwLnNldCgndmlld3MnLCByb290cyk7XG4gICAgICAvLyBhcHAuZW5naW5lKCdlY3QnLCBlY3RSZW5kZXJlci5yZW5kZXIpO1xuICAgICAgcmVxLnZpZXdFbmdpbmVzID0geyAnLmVjdCc6IGVjdFJlbmRlcmVyLnJlbmRlciwgJ2RlZmF1bHQnOiBmYWxzZSB9O1xuICAgICAgcmVxLnZpZXdSb290cyA9IHJvb3RzO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBjb25zb2xlLmxvZygnTm8gcm9vdHMnKTtcbiAgICAgIGNvbnN0IHJvb3RzID0gW1xuICAgICAgICBgLi92aWV3cy9kZWZhdWx0YFxuICAgICAgXTtcbiAgICAgIGNvbnN0IGVjdFJlbmRlcmVyID0gZWN0KHsgd2F0Y2g6IHRydWUsIGNhY2hlOiBmYWxzZSwgcm9vdDogcm9vdHMsIGV4dDogJy5lY3QnIH0pO1xuICAgICAgLy8gYXBwLmVuZ2luZSgnZWN0JywgZWN0UmVuZGVyZXIucmVuZGVyKTtcbiAgICAgIHJlcS52aWV3RW5naW5lcyA9IHsgJy5lY3QnOiBlY3RSZW5kZXJlci5yZW5kZXIsICdkZWZhdWx0JzogdHJ1ZSB9O1xuICAgICAgcmVxLnZpZXdSb290cyA9IHJvb3RzO1xuICAgIH1cbiAgICBuZXh0KCk7XG4gIH0pO1xuICBhcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgIC8vIGNvbnNvbGUubG9nKCdhcHAucmVuZGVyJywgYXBwLnJlbmRlcik7XG4gICAgbmV4dCgpO1xuICB9KTtcbiAgYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICBpZiAocmVxICYmIHJlcS5zZXNzaW9uICYmIHJlcS5zZXNzaW9uLmRvbWFpbiAmJiByZXEuc2Vzc2lvbi5kb21haW4ubGVuZ3RoID4gMCkge1xuICAgICAgLy8gY29uc29sZS5sb2coJ1RyeWluZyB0byBzZXJ2ZSBzdGF0aWMgZnJvbScsIGAuL3B1YmxpYy8ke3JlcS5zZXNzaW9uLmRvbWFpbn1gLCByZXEub3JpZ2luYWxVcmwpO1xuICAgICAgY29uc3Qgc2VydmVTdGF0aWMgPSBzZXJ2ZVN0YXRpY1JvdXRlKGAuL3B1YmxpYy8ke3JlcS5zZXNzaW9uLmRvbWFpbn1gKTtcbiAgICAgIHNlcnZlU3RhdGljKHJlcSwgcmVzLCBuZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dCgpO1xuICAgIH1cbiAgICAvLyBhcHAudXNlKGV4cHJlc3Muc3RhdGljKCcuL3B1YmxpYycpKTtcbiAgfSk7XG4gIGFwcC51c2UoZXhwcmVzcy5zdGF0aWMoJy4vcHVibGljL2RlZmF1bHQnKSk7XG4gIGNvbnN0IGxvZ0RpcmVjdG9yeSA9ICcuL2xvZ3MvJztcbiAgZnMuZXhpc3RzU3luYyhsb2dEaXJlY3RvcnkpIHx8IGZzLm1rZGlyU3luYyhsb2dEaXJlY3RvcnkpO1xuICB2YXIgYWNjZXNzTG9nU3RyZWFtID0gcmZzKCdhY2Nlc3MubG9nJywge1xuICAgIGludGVydmFsOiAnMWQnLCAvLyByb3RhdGUgZGFpbHlcbiAgICBwYXRoOiBsb2dEaXJlY3RvcnlcbiAgfSk7XG4gIGFwcC51c2UobW9yZ2FuKCdjb21iaW5lZCcsIHtzdHJlYW06IGFjY2Vzc0xvZ1N0cmVhbX0pKTtcbiAgYXBwLnVzZSh1bmF1dGhlZFJhdGVMaW1pdCk7XG4gIGFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgY29uc29sZS5sb2coJ0dldHRpbmcgZGInLCByZXEuaXApO1xuICAgIGRiUG9vbC5nZXRDb25uZWN0aW9uKClcbiAgICAudGhlbihcbiAgICAgIChjb25uZWN0aW9uKSA9PiB7XG4gICAgICAgIGlmIChjb25uZWN0aW9uKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ0dvdCBkYiEnLCByZXEuaXApO1xuICAgICAgICAgIG9uRmluaXNoZWQocmVzLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5yZWxlYXNlKSB7XG4gICAgICAgICAgICAgIGNvbm5lY3Rpb24ucmVsZWFzZSgpO1xuXHQgICAgICBjb25uZWN0aW9uLnJlbGVhc2UgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXHQgIHNldFRpbWVvdXQoKCkgPT4gIHtcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLnJlbGVhc2UpIHtcbiAgICAgICAgICAgICAgY29ubmVjdGlvbi5yZWxlYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ucmVsZWFzZSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgNTAwMCk7XG4gICAgICAgICAgaWYgKHJlcS5pcCkge1xuICAgICAgICAgICAgcmVxLmRiQ29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgY29ubmVjdGlvbiB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gY29ubmVjdGlvbi5yZWxlYXNlKCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0NsaWVudCBnb25lIScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnRGlkIG5vdCBnZXQgZGIhJyk7XG4gICAgICAgICAgcmVxLmRiQ29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCdObyBjb25uZWN0aW9uIScpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJldHVybiBjb25uZWN0aW9uLnF1ZXJ5KCdTRUxFQ1QgMScpXG4gICAgICAgIC8vIC50aGVuKFxuICAgICAgICAvLyAgIChyZXN1bHQpID0+IFByb21pc2UucmVzb2x2ZSh7IGNvbm5lY3Rpb24gfSksXG4gICAgICAgIC8vICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXG4gICAgICAgIC8vICk7XG4gICAgICB9LFxuICAgICAgKGUpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW2RiXSBVbmFibGUgdG8gZ2V0IGNvbm5lY3Rpb24gZnJvbSBwb29sIScsIGUpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgICB9XG4gICAgKVxuICAgIC50aGVuKFxuICAgICAgKHsgY29ubmVjdGlvbiB9KSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdbZGJdIFRlc3QgcXVlcnkgc3VjY2VzcyEnKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGNvbm5lY3Rpb24gfSk7XG4gICAgICB9LFxuICAgICAgKGUpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW2RiXSBUZXN0IHF1ZXJ5IGZhaWxlZCEnLCBlKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGUpO1xuICAgICAgfVxuICAgIClcbiAgICAudGhlbihcbiAgICAgICh7IHN0b3AgfSkgPT4ge1xuICAgICAgICAvLyBRdWkgaW1wb3N0byB1biBjYWxsYmFjayBzdWxsJ2V2ZW50byBmaW5pc2ggZGkgZXhwcmVzc1xuICAgICAgICAvLyBMJ2V2ZW50byBmaW5pc2ggdmllbmUgY2hpYW1hdG8gb2duaSB2b2x0YSBjaGVcbiAgICAgICAgLy8gdmllbmUgbWFuZGF0YSB1bmEgcmlzcG9zdGEgYWwgY2xpZW50ZS5cbiAgICAgICAgLy8gSWwgY2FsbGJhY2sgc2VydmVyIHBlciByZXN0aXR1aXJlIGFsIHBvb2wgbGEgY29ubmVzc2lvbmUgY2hlIGVyYVxuICAgICAgICAvLyBzdGF0YSBhc3NlZ25hdGEgYWxsYSByaWNoaWVzdGEgKHJlcSkgY29ycmVudGVcbiAgICAgICAgaWYgKCFzdG9wKSB7XG4gICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdOb3QgZ29pbmcgbmV4dC4uLicpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgKGUpID0+IHsgbmV4dChlKTsgfVxuICAgICk7XG4gIH0pO1xuICBhcHAudXNlKCcvdW5pcXVlSWRzJywgdW5pcXVlSWRSb3V0ZXIpO1xuICBhcHAudXNlKCcvU2VyZmluU3RhdHMnLCBzdGF0c1JvdXRlcik7XG4gIGFwcC51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgcmVxLmNvbmZpZyA9IGNvbmZpZztcbiAgICBuZXh0KCk7XG4gIH0pO1xuICBhcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgIC8vIGNvbnNvbGUubG9nKCdGdWxsIFNlc3Npb24nLCByZXEuc2Vzc2lvbik7XG4gICAgbmV4dCgpO1xuICB9KTtcbiAgYXBwLnVzZShnYXRlKTtcbiAgYXBwLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICBpZiAocmVxLnNlc3Npb24pIHtcbiAgICAgIHJlcS5iYXNlUGFyYW1zID0ge1xuICAgICAgICBkb21haW46IHJlcS5zZXNzaW9uLmRvbWFpbixcbiAgICAgICAgZGJSZWNvcmQ6IHJlcS5zZXNzaW9uLmRiUmVjb3JkLFxuICAgICAgICBmdWxsRGJSZWNvcmRzOiByZXEuc2Vzc2lvbi5mdWxsRGJSZWNvcmRzLFxuICAgICAgICBmb3JtYXRDdXJyZW5jeSxcbiAgICAgICAgc3RyaXBzbGFzaGVzLFxuICAgICAgICBtb21lbnRcbiAgICAgIH07XG4gICAgfVxuICAgIG5leHQoKTtcbiAgfSk7XG4gIGFwcC51c2UobWFpbHRyYWNrKTtcbiAgYXBwLnVzZShub2NvZGUpO1xuICBhcHAudXNlKHJlcXVlc3RzZWNyZXQpO1xuICBhcHAudXNlKHJlcXVlc3RmdWxsbmFtZSk7XG4gIGFwcC51c2UoZmlsZXVwbG9hZCh7XG4gICAgbGltaXRzOiB7IGZpbGVTaXplOiA1MDAgKiAxMDI0IH0sXG4gIH0pKTtcbiAgYXBwLnVzZSgnL3ZpdnInLCB2aXZyKTtcbiAgT2JqZWN0LmtleXMocGF5bWVudENsYXNzZXMpLmZvckVhY2goKG1vZHVsZUlkKSA9PiB7XG4gICAgLy8gY29uc29sZS5sb2coJ21vZHVsZUlkJywgbW9kdWxlSWQpO1xuICAgIGNvbnN0IHBtYyA9IHBheW1lbnRDbGFzc2VzW21vZHVsZUlkXTtcbiAgICBjb25zdCB1cmxzID0gcG1jLmdldENhbGxCYWNrVXJscygpO1xuICAgIHVybHMuZm9yRWFjaCgoYykgPT4ge1xuICAgICAgY29uc3QgdXJsID0gYy51cmw7XG4gICAgICBjb25zdCBjYWxsYmFjayA9IGMubWV0aG9kO1xuICAgICAgY29uc3QgaHR0cE1ldGhvZCA9IGMuaHR0cE1ldGhvZDtcblxuICAgICAgLy8gY29uc29sZS5sb2coJ0NyZWF0aW5nIHVybCcsIGAvY2FsbGJhY2svJHt1cmx9YCwgJ2luJywgaHR0cE1ldGhvZCk7XG4gICAgICBhcHBbaHR0cE1ldGhvZF0oYC9jYWxsYmFjay8ke3VybH1gLCAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgY29uc3QgbXlDbGFzcyA9IHBheW1lbnRDbGFzc2VzW21vZHVsZUlkXTtcbiAgICAgICAgY29uc3QgbXlNZXRob2QgPSBteUNsYXNzW2NhbGxiYWNrXTtcbiAgICAgICAgaWYgKCFteUNsYXNzIHx8ICFteU1ldGhvZCkge1xuICAgICAgICAgIG5leHQoNTAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBteU1ldGhvZChyZXEsIHJlcywgbmV4dCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbiAgYXBwLnVzZSgnLycsIHNtYWxsQ29udGVudFJvdXRlKTtcbiAgYXBwLnVzZSgnLycsIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgIG5leHQoKTtcbiAgfSk7XG4gIGFwcC51c2UoKGVyciwgcmVxLCByZXMsIG5leHQpID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnRXJyb3IhJywgZXJyKTtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgc2Vzc2lvblxuICAgICAgfSA9IHJlcTtcbiAgICAgIGlmIChlcnIgPT09ICdGcmF1ZCBhdHRlbXB0Jykge1xuICAgICAgICBjb25zb2xlLmxvZygnRnJhdWQhJyk7XG4gICAgICAgIHJlcy5zdGF0dXMoNTAwKS5yZW5kZXIoYGVycm9ycy9mcmF1ZGAsIE9iamVjdC5hc3NpZ24oe30sIHJlcS5iYXNlUGFyYW1zLCB7XG4gICAgICAgICAgdGl0bGU6IGBGcmF1ZCBhdHRlbXB0YCxcbiAgICAgICAgICBkb21haW46IHNlc3Npb24gJiYgc2Vzc2lvbi5kb21haW4gPyBzZXNzaW9uLmRvbWFpbiA6ICdkZWZhdWx0X2RvbWFpbicsXG4gICAgICAgICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcbiAgICAgICAgICB2aWV3Um9vdHM6IHJlcS52aWV3Um9vdHNcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIGlmIChlcnIgPT09ICdEQiBGQUlMVVJFJykge1xuICAgICAgICBjb25zb2xlLmxvZygnRkFJTFVSRSEnLCByZXEudmlld1Jvb3RzKTtcbiAgICAgICAgcmVzLnN0YXR1cyg1MDApLnJlbmRlcihgZXJyb3JzL2RiZmFpbHVyZWAsIE9iamVjdC5hc3NpZ24oe30sIHJlcS5iYXNlUGFyYW1zLCB7XG4gICAgICAgICAgdGl0bGU6IGBUZW1wb3JhcnkgZXJyb3JgLFxuICAgICAgICAgIGRvbWFpbjogc2Vzc2lvbiAmJiBzZXNzaW9uLmRvbWFpbiA/IHNlc3Npb24uZG9tYWluIDogJ2RlZmF1bHRfZG9tYWluJyxcbiAgICAgICAgICB2aWV3RW5naW5lczogcmVxLnZpZXdFbmdpbmVzLFxuICAgICAgICAgIHZpZXdSb290czogcmVxLnZpZXdSb290c1xuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXMuc3RhdHVzKDUwMCkuc2VuZCgnRmFpbHVyZScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXMuc3RhdHVzKDQwNCkuc2VuZCgnU29ycnkhJyk7XG4gICAgfVxuICB9KTtcbiAgaWYgKGVudiA9PT0gJ2RldicpIHtcbiAgICBhcHAuc2V0KCdwb3J0JywgY29uZmlnLmh0dHBEZXZQb3J0KTtcbiAgfSBlbHNlIHtcbiAgICBhcHAuc2V0KCdwb3J0JywgY29uZmlnLmh0dHBQb3J0KTtcbiAgfVxuICBjb25zdCBociA9IDEwMDAgKiA2MCAqIDYwO1xuICBjb25zdCB0aW1lb3V0ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKCgzICogaHIpIC0gaHIpKSArIGhyO1xuICBjb25zdCBtc1RvVGltZSA9IChzKSA9PiB7XG4gICAgdmFyIG1zID0gcyAlIDEwMDA7XG4gICAgcyA9IChzIC0gbXMpIC8gMTAwMDtcbiAgICB2YXIgc2VjcyA9IHMgJSA2MDtcbiAgICBzID0gKHMgLSBzZWNzKSAvIDYwO1xuICAgIHZhciBtaW5zID0gcyAlIDYwO1xuICAgIHZhciBocnMgPSAocyAtIG1pbnMpIC8gNjA7XG4gICAgcmV0dXJuIGhycyArICc6JyArIG1pbnMgKyAnOicgKyBzZWNzO1xuICB9XG4gIGNvbnN0IHNlcnZlciA9IGFwcC5saXN0ZW4oYXBwLmdldCgncG9ydCcpLCAoKSA9PiB7XG4gICAgaWYgKHdvcmtlcikge1xuICAgICAgY29uc29sZS5pbmZvKGBXZWIgc2VydmVyIChjbHVzdGVyICMgJHt3b3JrZXIuaWR9KSBsaXN0ZW5pbmcgb24gcG9ydCAke2FwcC5nZXQoJ3BvcnQnKX0sIHdpbGwgc2h1dCBkb3duIGluICR7bXNUb1RpbWUodGltZW91dCl9YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuaW5mbyhgV2ViIHNlcnZlciAoc2luZ2xlIGNsdXN0ZXIpIGxpc3RlbmluZyBvbiBwb3J0ICR7YXBwLmdldCgncG9ydCcpfWApO1xuICAgIH1cbiAgfSk7XG4gIGlmICh3b3JrZXIpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHNlcnZlci5jbG9zZSgoKSA9PiB7XG4gICAgICAgIGRiUG9vbC5lbmQoKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUuaW5mbyhgV2ViIHNlcnZlciAoY2x1c3RlciAjICR7d29ya2VyLmlkfSkgaXMgbm93IG9mZmxpbmUgYW5kIGRiIGlzIG5vdyBkaXNjb25uZWN0ZWQuIFdvcmtlciBleGl0aW5nLmApO1xuICAgICAgICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgfVxuICBzZXJ2ZXIudGltZW91dCA9IDEwMDAwO1xufTtcbmlmIChlbnYgPT09ICdkZXYnKSB7XG4gIHN0YXJ0VXBGdW5jdGlvbigpO1xufSBlbHNlIHtcbiAgY2x1c3RlcihzdGFydFVwRnVuY3Rpb24sIHsgY291bnQ6IDMgfSk7XG59XG4iXX0=