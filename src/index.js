import express from 'express';
import mysql from 'promise-mysql';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import rfs from 'rotating-file-stream';
import session from 'express-session';
import fileupload from 'express-fileupload';
import gate from './routes/gate';
import requestsecret from './routes/requestsecret';
import requestfullname from './routes/requestfullname';
import vivr from './routes/vivr';
import nocode from './routes/nocode';
import mailtrack from './routes/mailtrack';
import config from './config/config.json';
import ect from 'ect';
import redisConnect from 'connect-redis';
import bodyParser from 'body-parser';
import formatCurrency from 'format-currency';
import moment from 'moment';
import paymentClasses from './paymentmethods/';
import stripslashes from './libs/stripslashes';
import expressRateLimit from 'express-rate-limit';
import isAuthenticated from './libs/functionalCheckAuth';
import uniqueIdRouter from './routes/uniqueIds';
import cluster from 'express-cluster';
import onFinished from 'on-finished';
import statsRouter from './routes/stats.js';
import serveStaticRoute from 'serve-static';
import smallContentRoute from './routes/smallContent.js';

const env = process.env.NODE_ENV || 'dist';

const startUpFunction = (worker) => {
  moment.locale('IT');
  const RedisStore = redisConnect(session);
  const dbPool = mysql.createPool({
    connectionLimit : config.dbConnectionLimit,
    acquireTimeout: 1000,
    host : config.dbHost,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName
  });
  const unratedUrls = [];
  Object.keys(paymentClasses).forEach((moduleId) => {
    const pmc = paymentClasses[moduleId];
    const urls = pmc.getCallBackUrls();
    urls.forEach((url) => {
      unratedUrls.push(url.url);
    });
  });
  const unauthedRateLimit = expressRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 12,
    delayMs: 0, // disabled
    skip: (req) => {
      if (req.ip === '::ffff:10.161.14.173' || typeof req.ip === 'undefined') {
        return true;
      }
      if (req.ip === '::ffff:10.161.9.26' || typeof req.ip === 'undefined') {
        return true;
      }
      if (unratedUrls.indexOf(req.originalUrl) > -1 || isAuthenticated(req)) {
        return true;
      }
      return false;
    },
    onLimitReached: (req) => {
      console.warn(`[Rate limit reached] Anauthed client from ${req.ip} hit the rate limit!`);
    }
  });
  const app = express();

  app.set('view engine', 'ect');
  app.set('views', [`./views/default`]);
  app.use((req, res, next) => {
    console.log('New request!', req.originalUrl);
    next();
  });
  // app.set('trust proxy', 'loopback, 10.161.9.26');
  app.set('trust proxy', function (ip) {
    const trusted = [
      '10.161.9.26',
      '127.0.0.1',
      '::ffff:127.0.0.1',
      '::1'
    ];

    // console.log('Trusting proxy', ip, trusted.indexOf(ip) > -1);
    return trusted.indexOf(ip) > -1;
  });
  const ectRenderer = ect({ watch: true, cache: false, root: `views/default` });
  app.engine('ect', ectRenderer.render);
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '1mb'
  }));
  app.use((req, res, next) => {
    // console.log('Next', req.originalUrl);
    // console.log(req.originalUrl.substring(0, 5));
    if (!(req.originalUrl.substring(0, 5) === '/mail')) {
      // console.log('Session check', req.originalUrl, decodeURIComponent(req.headers['cookie']));
    }
    next();
  });
  app.use((req, res, next) => {
    if (req.originalUrl.substring(0, 5) === '/mail') {
      next();
    } else {
      session({
        store: new RedisStore({
        }),
        secret: 'SerfinPaymentGateway',
        resave: false,
        saveUninitialized: true,
        rolling: true,
        cookie: { secure: env !== 'dev', httpOnly: true, signed: true },
        maxAge: 600000
      })(req, res, next);
    }
  });
  // app.use((req, res, next) => {
  //   console.log('Req.session right after session start', req.session);
  //   next();
  // });
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
  app.use((req, res, next) => {
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
  app.use((req, res, next) => {
    if (req.originalUrl.substring(0, 5) === '/vivr') {
      if (!(req.session && req.session.authenticated)) {
        console.log('Possible session error', req.originalUrl, req.ip, req.session && req.session.code ? 'OK' : 'NOK', req.sessionID, decodeURIComponent(req.headers['cookie']));
      }
    }
    next();
  });
  app.use((req, res, next) => {
    if (req.session && req.session.domain && req.session.domain !== 'default') {
      // console.log('domain is already', req.session.domain);
      next();
    } else if (!req.session) {
      next();
    } else {
      const domain = req.get('host').split(':')[0];
      fs.readFile(`./domainsToCustomer/${domain}`, (fserr, value) => {
        if (!fserr && value.toString().length > 0) {
          req.session.domain = value.toString().trim();
          console.warn(`[valid domain] From url ${domain}, domain is ${req.session.domain}`);
        }
        next();
      });
    }
    // next();
  });
  app.use((req, res, next) => {
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
    next();
  });
  app.use((req, res, next) => {
    // console.log('app.render', app.render);
    next();
  });
  app.use((req, res, next) => {
    // console.log('Req.session', req.session);
    if (req && req.session && req.session.domain && req.session.domain.length > 0) {
      // console.log('Trying to serve static from', `./public/${req.session.domain}`, req.originalUrl);
      const serveStatic = serveStaticRoute(`./public/${req.session.domain}`);
      serveStatic(req, res, next);
    } else {
      // console.log('Req.session has no domain!');
      next();
    }
    // app.use(express.static('./public'));
  });
  app.use(express.static('./public/default'));
  const logDirectory = './logs/';
  fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
  var accessLogStream = rfs('access.log', {
    interval: '1d', // rotate daily
    path: logDirectory
  });
  app.use(morgan('combined', {stream: accessLogStream}));
  app.use(unauthedRateLimit);
  app.use((req, res, next) => {
    console.log('Getting db', req.ip);
    dbPool.getConnection()
    .then(
      (connection) => {
        if (connection) {
          console.log('Got db!', req.ip);
          onFinished(res, () => {
            if (connection.release) {
              connection.release();
	      connection.release = null;
            }
          });
	  setTimeout(() =>  {
            if (connection.release) {
              connection.release();
                    connection.release = null;
            }
          }, 5000);
          if (req.ip) {
            req.dbConnection = connection;
            return Promise.resolve({ connection });
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
      },
      (e) => {
        console.error('[db] Unable to get connection from pool!', e);
        return Promise.reject(e);
      }
    )
    .then(
      ({ connection }) => {
        // console.log('[db] Test query success!');
        return Promise.resolve({ connection });
      },
      (e) => {
        console.error('[db] Test query failed!', e);
        return Promise.reject(e);
      }
    )
    .then(
      ({ stop }) => {
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
      },
      (e) => { next(e); }
    );
  });
  app.use('/uniqueIds', uniqueIdRouter);
  app.use('/SerfinStats', statsRouter);
  app.use((req, res, next) => {
    req.config = config;
    next();
  });
  app.use((req, res, next) => {
    // console.log('Full Session', req.session);
    next();
  });
  app.use(gate);
  app.use((req, res, next) => {
    if (req.session) {
      req.baseParams = {
        domain: req.session.domain,
        dbRecord: req.session.dbRecord,
        fullDbRecords: req.session.fullDbRecords,
        formatCurrency,
        stripslashes,
        moment
      };
    }
    next();
  });
  app.use(mailtrack);
  app.use(nocode);
  app.use(requestsecret);
  app.use(requestfullname);
  app.use(fileupload({
    limits: { fileSize: 500 * 1024 },
  }));
  app.use('/vivr', vivr);
  Object.keys(paymentClasses).forEach((moduleId) => {
    // console.log('moduleId', moduleId);
    const pmc = paymentClasses[moduleId];
    const urls = pmc.getCallBackUrls();
    urls.forEach((c) => {
      const url = c.url;
      const callback = c.method;
      const httpMethod = c.httpMethod;

      // console.log('Creating url', `/callback/${url}`, 'in', httpMethod);
      app[httpMethod](`/callback/${url}`, (req, res, next) => {
        const myClass = paymentClasses[moduleId];
        const myMethod = myClass[callback];
        if (!myClass || !myMethod) {
          next(500);
        } else {
          myMethod(req, res, next);
        }
      });
    });
  });
  app.use('/', smallContentRoute);
  app.use('/', (req, res, next) => {
    next();
  });
  app.use((err, req, res, next) => {
    if (err) {
      console.log('Error!', err);
      const {
        session
      } = req;
      if (err === 'Fraud attempt') {
        console.log('Fraud!');
        res.status(500).render(`errors/fraud`, Object.assign({}, req.baseParams, {
          title: `Fraud attempt`,
          domain: session && session.domain ? session.domain : 'default_domain',
          viewEngines: req.viewEngines,
          viewRoots: req.viewRoots
        }));
      } else if (err === 'DB FAILURE') {
        console.log('FAILURE!', req.viewRoots);
        res.status(500).render(`errors/dbfailure`, Object.assign({}, req.baseParams, {
          title: `Temporary error`,
          domain: session && session.domain ? session.domain : 'default_domain',
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
    app.set('port', config.httpDevPort);
  } else {
    app.set('port', config.httpPort);
  }
  const hr = 1000 * 60 * 60;
  const timeout = Math.floor(Math.random() * ((3 * hr) - hr)) + hr;
  const msToTime = (s) => {
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
    return hrs + ':' + mins + ':' + secs;
  }
  const server = app.listen(app.get('port'), () => {
    if (worker) {
      console.info(`Web server (cluster # ${worker.id}) listening on port ${app.get('port')}, will shut down in ${msToTime(timeout)}`);
    } else {
      console.info(`Web server (single cluster) listening on port ${app.get('port')}`);
    }
  });
  if (worker) {
    setTimeout(() => {
      server.close(() => {
        dbPool.end(() => {
          console.info(`Web server (cluster # ${worker.id}) is now offline and db is now disconnected. Worker exiting.`);
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
  cluster(startUpFunction, { count: 3 });
}
