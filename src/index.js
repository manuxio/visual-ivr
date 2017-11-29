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

const msToTime = (s) => {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return hrs + ':' + mins + ':' + secs;
}
let dbConnReq = 0;

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
      if (unratedUrls.indexOf(req.originalUrl) > -1 || isAuthenticated(req)) {
        return true;
      }
      return false;
    },
    onLimitReached: (req) => {
      console.warn(`[Rate limit reached] Anauthed client from ${req.ip} hit the rate limit!`);
    }
  });

  // Creo una istanza di express, il server web!
  const app = express();

  // Dico a express che il motore di rendering sarà "ect"
  app.set('view engine', 'ect')
  // Istanzio il renderer dei template ECT

  // Specifico dove trovare il sistema in grado di renderizzare le pagine "ect"
  app.use((req, res, next) => {
    next();
  });

  app.set('trust proxy', 'loopback, 10.161.9.26');
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '1mb'
  }));
  app.use(session({
    store: new RedisStore({
    }),
    secret: 'SerfinPaymentGateway',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
    maxAge: 60000
  }));
  // const ectRenderer = ect({ watch: true, root: `views/` });
  // const ectRenderer = ect({ watch: true, cache: false, root: `views/default` });
  // app.engine('ect', ectRenderer.render);
  app.use((req, res, next) => {
    if (req.session && req.session.domain) {
      const roots = [
        `./views/${req.session.domain}`,
        `./views/default`
      ];
      const ectRenderer = ect({ watch: true, cache: false, root: roots });
      app.set('views', roots);
      app.engine('ect', ectRenderer.render);
    } else {
      const ectRenderer = ect({ watch: true, cache: false, root: `views/default` });
      app.engine('ect', ectRenderer.render);
    }
    next();
  });
  app.use((req, res, next) => {
    if (req && req.session && req.session.domain && req.session.domain.length > 0) {
      const serveStatic = serveStaticRoute(`./public/${req.session.domain}`);
      serveStatic(req, res, next);
      // if (fs.existsSync(`./public/${req.session.domain}`)) {
      //   console.log(`Serving statics from ${req.session.domain}`);
      //   app.use(express.static(`./public/${req.session.domain}`));
      // }
    } else {
      next();
    }
    // app.use(express.static('./public'));
  });

  app.use(express.static('./public/default'));

  const logDirectory = path.join(__dirname, 'logs');
  fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
  var accessLogStream = rfs('access.log', {
    interval: '1d', // rotate daily
    path: logDirectory
  });

  app.use(morgan('combined', {stream: accessLogStream}));

  app.use(unauthedRateLimit);

  app.use((req, res, next) => {
    // res.on('finish', () => {
    //   if (req.dbConnection) {
    //     console.log('Releasing db!');
    //     dbConnReq--;
    //     req.dbConnection.release();
    //   } else {
    //     console.log('No db on res.finish', worker.id);
    //   }
    // });
    // res.on('end', () => {
    //   if (req.dbConnection) {
    //     console.log('Releasing db (on end)!', worker.id);
    //     dbConnReq--;
    //     req.dbConnection.release();
    //   } else {
    //     console.log('No db on res.end');
    //   }
    // });
    // req.on('close', () => {
    //   if (req.dbConnection) {
    //     console.log('Releasing db (on req.close)!', worker.id);
    //     dbConnReq--;
    //     req.dbConnection.release();
    //   } else {
    //     console.log('No db on req.close');
    //   }
    // });
    // req.on('finish', () => {
    //   if (req.dbConnection) {
    //     console.log('Releasing db (on end)!', worker.id);
    //     dbConnReq--;
    //     req.dbConnection.release();
    //   } else {
    //     console.log('No db on req.finish');
    //   }
    // });
    // console.log('Getting db!');
    dbConnReq++;
    dbPool.getConnection()
    .then(
      (connection) => {
        if (connection) {
          // console.log('Got db!', req.ip, res, worker.id);
          onFinished(res, () => {
            dbConnReq--;
            connection.release();
          });
          if (req.ip) {
            req.dbConnection = connection;
            return Promise.resolve({ connection });
          } else {
            // connection.release();
            return Promise.reject('Client gone!');
          }
        } else {
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
  app.use(gate);
  app.use((req, res, next) => {
    req.baseParams = {
      domain: req.session.domain,
      dbRecord: req.session.dbRecord,
      fullDbRecords: req.session.fullDbRecords,
      formatCurrency,
      stripslashes,
      moment
    };
    next();
  });
  // Uso il router "requestsecret"
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

  app.use((err, req, res, next) => {
    if (err) {
      console.log('Error!', err);
      const {
        session
      } = req;
      if (err === 'Fraud attempt') {
        res.status(500).render(`${session.domain ? session.domain : 'default_domain'}/errors/fraud`, Object.assign({}, req.baseParams, {
          title: `Fraud attempt`,
          domain: session.domain ? session.domain : 'default_domain',
        }));
      } else if (err === 'DB FAILURE') {
        res.status(500).render(`${session.domain ? session.domain : 'default_domain'}/errors/dbfailure`, Object.assign({}, req.baseParams, {
          title: `Temporary error`,
          domain: session.domain ? session.domain : 'default_domain',
        }));
      } else {
        res.status(500).send('Failure');
      }
    } else {
      res.status(404).send('Sorry!');
    }
  });
  app.set('port', config.httpPort);

  const hr = 1000 * 60 * 60;
  const timeout = Math.floor(Math.random() * ((3 * hr) - hr)) + hr;
  const server = app.listen(app.get('port'), () => {
    if (worker) {
      console.log(`Web server (cluster # ${worker.id}) listening on port ${app.get('port')}, will shut down in ${msToTime(timeout)}`);
    } else {
      console.log(`Web server (single cluster) listening on port ${app.get('port')}`);
    }
  });
  if (worker) {
    setTimeout(() => {
      server.close(() => {
        dbPool.end(() => {
          console.log(`Web server (cluster # ${worker.id}) is now offline and db is now disconnected. Worker exiting.`);
          process.exit(0);
        });
      });
    }, timeout);
  }
  server.timeout = 10000;

};
const env = process.env.NODE_ENV || 'dist';
if (env === 'dev') {
  startUpFunction();
} else {
  cluster(startUpFunction, { count: 3 });
}
