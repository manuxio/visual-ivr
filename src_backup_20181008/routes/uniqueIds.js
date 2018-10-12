import express from 'express';
import config from '../config/config.json';
import logger from '../libs/logger';
const router = express.Router();
import async from 'async';
import moment from 'moment';
const CODES_CHUNK = 100;
const MAX_CODES = 500;
const createRandom = function(l) {
	var string = '';
  var letters = 'abcdefghilmnopqrstuvzxwykjABCDEFGHILMNOPQRSTUVZXWYKJ1234567890';
	for (var i = 0; i < l; i += 1) {
		var pos = Math.floor(Math.random() * (letters.length - 0) + 0);
		string += letters[pos];
	}
	return string;
}
const getCodes = (howMany, CODE_LEN) => {
  const generated = {};
  while (howMany > 0) {
          const candidate = createRandom(CODE_LEN);
          if (!generated[candidate]) {
                  generated[candidate] = 1;
                  if (howMany % 100000 === 0) {
                    // console.log('To Generate (2)', howMany);
                  }
                  howMany += -1;
          } else {
            // console.log('Collision...');
          }
  }
  const myGenerated = [];
  for (let k in generated) {
    myGenerated.push(k);
  }
  return myGenerated;
}

router.post('/getCodes', (req, res, next) => {
  const {
    dbConnection,
    ip
  } = req;
  // console.log('req.body');
  const toGenerate = parseInt(req.body.toGenerate, 10);
  const bookingName = req.body.bookingName;
  if (toGenerate < 1 || !bookingName || bookingName.length < 1) {
    next('Wrong parameters!');
    return;
  }
  new Promise((resolve, reject) => {
    dbConnection.query(`SELECT count(*) as total FROM codiciUnivociVIVR WHERE bookingName = ${dbConnection.escape(bookingName)}`)
    .then( // Preliminary checks
      (result) => {
        // console.log('Query', `SELECT count(*) as total FROM codiciUnivociVIVR WHERE bookingName = ${dbConnection.escape(bookingName)}`);
        if (result && result[0].total > 0) {
          return Promise.reject(`bookingName ${bookingName} is not unique`);
        }
        return Promise.resolve();
      },
      (e) => Promise.reject(e)
    )
    .then(
      () => {
        const sql = `SELECT len FROM codiciUnivociVIVRReport WHERE threshold - count > ${dbConnection.escape(toGenerate)} ORDER BY len ASC LIMIT 1`;
        return dbConnection.query(sql)
        .then(
          (results) => {
            if (results && results[0].len > 0) {
              return Promise.resolve(results[0].len);
            }
            return Promise.reject();
          },
          (e) => {
            // console.log('Ex', e);
            return Promise.reject(e);
          }
        )
      },
      (e) => Promise.reject(e)
    )
    .then( // Generate SQL INSERT
      (CODE_LEN) => {
        let created = 0;
        let loop = 0;
        const nowDate = moment().format('YYYY-MM-DD HH:mm:ss');
        return new Promise((inRes, inRej) => {
          async.whilst(
            () => {
              loop += 1;
              return created < Math.min(toGenerate, MAX_CODES);
            },
            (cb) => {
              const toCreate = getCodes(Math.min(Math.min(toGenerate, MAX_CODES) - created, CODES_CHUNK), CODE_LEN);
              const valueString = toCreate.map((v) => {
                return `(${dbConnection.escape(v)},${dbConnection.escape(bookingName)},${dbConnection.escape(ip)},${dbConnection.escape(nowDate)})`;
              });
              const sql = `INSERT IGNORE into codiciUnivociVIVR (code, bookingName, bookingAddress, bookingDate) VALUES ${valueString}`;
              dbConnection.query(sql)
              .then(
                (result) => {
                  created += result.affectedRows;
                  cb(null);
                },
                (e) => {
                  cb(e);
                }
              )
            },
            (e) => {
              if (e) {
                inRej(e);
              } else {
                inRes(CODE_LEN);
              }
            }
          );
        });
      },
      (e) => Promise.reject(e)
    )
    .then(
      (CODE_LEN) => {
        const sql = `SELECT code FROM codiciUnivociVIVR WHERE bookingName = ${dbConnection.escape(bookingName)}`;
        // console.log('SELECT SQL', sql);
        return dbConnection.query(sql)
        .then(
          (results) => {
            // console.log('results', results);
            return Promise.resolve([results.map((c) => {
              return c.code.toString();
            }), CODE_LEN]);
          },
          (e) => {
            return Promise.reject(e);
          }
        );
      },
      (e) => Promise.reject(e)
    )
    .then(
      ([validCodes, CODE_LEN]) => {
        if (validCodes.length > 0) {
          const sql = `UPDATE codiciUnivociVIVRReport SET count = count + ${validCodes.length} WHERE len = ${CODE_LEN}`;
          return dbConnection.query(sql)
          .then(
            () => {
              return Promise.resolve(validCodes);
            },
            (e) => Promise.reject(e)
          );
        }
        return Promise.resolve(validCodes);
      },
      (e) => Promise.reject(e)
    )
    .then(
      (validCodes) => {
        console.info(`[uniqueIds] Requested: ${toGenerate}, generated ${validCodes.length}`);
        res.json(validCodes);
      },
      (e) => {
        console.log('E', e);
        next(e);
      }
    );
  });
});

export default router;
