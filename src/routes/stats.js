import express from 'express';
import config from '../config/config.json';
import logger from '../libs/logger';
const router = express.Router();
import async from 'async';
import moment from 'moment';

const rightPadTo = (s, len) => {
  let rS = s.toString();
  const curLen = rS.length;
  const diff = len - curLen;
  if (diff < 1) { return s; }
  for (let i = 0; i < diff; i += 1) {
    rS += ' ';
  }
  return rS;
}

const makeConcatString = (s, len) => {
  let rS = s.toString();
  const curLen = rS.length;
  const diff = len - curLen;
  return `RPAD('${rS}', ${len}, 0x00)`;
  rS = 'CONCAT(\'' + rS + '\'';
  if (diff < 1) { return rS + ')'; }
  for (let i = 0; i < diff; i += 1) {
    rS += ', CHAR(X\'00\')';
  }
  return rS + ')';
  // CONCAT('VO2JE',CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'))
}

const cleanString = (s) => {
  let finalString = '';
  for (let i = 0; i < s.length; i += 1) {
    const ascii = s.charCodeAt(i);
    if (ascii > 47 && ascii < 91) {
      finalString += s[i];
    }
    if (ascii > 96 && ascii < 123) {
      finalString += s[i];
    }
  }
  return finalString;
}

router.get('/', (req, res, next) => {
  const {
    dbConnection,
    ip
  } = req;
  // console.log('req.body');
  res.render('_stats/index', {
    title: 'Accesso statistiche'
  });
});

router.post('/', (req, res, next) => {
  const {
    body
  } = req;
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

router.get('/overview', (req, res, next) => {
  const {
    dbConnection,
    session
  } = req;
  dbConnection.query(`SELECT count(DISTINCT idcontratto) as totaleContratti, count(DISTINCT codice_da_url) as totaleCodiciDaUrl FROM pagamento_online_idcontratto_cf WHERE mandato = ${dbConnection.escape(session.stats.mandato)} AND idcliente = ${dbConnection.escape(session.stats.cliente)}`)
    .then(
      (results) => {
        console.log('Results', results);
        if (results && results[0] && results[0].totaleContratti < 1) {
          return Promise.resolve({
            totaleContratti: results[0].totaleContratti,
            totaleCodiciDaUrl: results[0].totaleCodiciDaUrl
          });
        } else {
          return Promise.reject(e)
        }
      },
      (e) => Promise.reject(e)
    )
    .then(
      (data) => {
        return dbConnection.query(`SELECT DISTINCT codice_da_url as codice FROM pagamento_online_idcontratto_cf WHERE mandato = ${dbConnection.escape(session.stats.mandato)}`)
          .then(
            (results) => {
              const uniqueCodes = results.map((r) => r.codice);
              return Promise.resolve({
                uniqueCodes,
                ...data
              });
            },
            (e) => Promise.reject(e)
          );
      },
      (e) => Promise.reject(e)
    )
    .then(
      (data) => {
        const sql = `SELECT DISTINCT tracking as tracking FROM online_payment_logs WHERE tracking IN (${data.uniqueCodes.map((el) => makeConcatString(el, 10)).join(',')})`;
        // console.log('Sql', sql);
        return dbConnection.query(sql)
          .then(
            (results) => {
              let totalConsumedCodes = results.length;
              return Promise.resolve({
                totalConsumedCodes: totalConsumedCodes,
                consumedCodes: results.map((r) => cleanString(r.tracking.toString())),
                ...data
              });
            },
            (e) => Promise.reject(e)
          );
      },
      (e) => Promise.reject(e)
    )
    .then(
      (data) => {
        const sql = `SELECT count(DISTINCT idcontratto) as totalConsumedContratti, idcontratto FROM pagamento_online_idcontratto_cf WHERE codice_da_url IN (${data.consumedCodes.map((el) => dbConnection.escape(el)).join(',')})`;
        return dbConnection.query(sql)
          .then(
            (results) => {
              let totalConsumedContratti = 0;
              if (results && results[0]) {
                totalConsumedContratti = results[0].totalConsumedContratti;
              }
              return Promise.resolve({
                totalConsumedContratti: totalConsumedContratti,
                consumedContratti: results.map((r) => r.idcontratto.toString()),
                ...data
              });
            },
            (e) => Promise.reject(e)
          );
      },
      (e) => Promise.reject(e)
    )
    .then(
      (data) => {
        const sql = `SELECT email_debitore FROM pagamento_online_idcontratto_cf WHERE codice_da_url IN (${data.consumedCodes.map((el) => dbConnection.escape(el)).join(',')})`;
        return dbConnection.query(sql)
          .then(
            (results) => {
              return Promise.resolve({
                addresses: results.map((r) => r.email_debitore),
                ...data
              });
            },
            (e) => Promise.reject(e)
          );
      },
      (e) => Promise.reject(e)
    )
    .then(
      (data) => {
        const sql = `SELECT count(DISTINCT idContratto) as totaleContrattiPagati, idcontratto FROM onlinePaymentTransactions WHERE
          status = 'APPROVED'
          AND
          completed = 1
          AND
          idContratto IN (${data.consumedContratti.map((el) => dbConnection.escape(el)).join(',')})`;
        return dbConnection.query(sql)
          .then(
            (results) => {
              let totaleContrattiPagati = 0;
              if (results && results[0]) {
                totaleContrattiPagati = results[0].totaleContrattiPagati;
              }
              return Promise.resolve({
                totaleContrattiPagati: totaleContrattiPagati,
                ...data
              });
            },
            (e) => Promise.reject(e)
          );
      },
      (e) => Promise.reject(e)
    )
    .then(
      (data) => {
        const sql = `SELECT count(DISTINCT idContratto) as totaleContrattiNonPagati, idcontratto FROM onlinePaymentTransactions WHERE
          status != 'APPROVED'
          AND
          idContratto IN (${data.consumedContratti.map((el) => dbConnection.escape(el)).join(',')})`;
        return dbConnection.query(sql)
          .then(
            (results) => {
              let totaleContrattiNonPagati = 0;
              if (results && results[0]) {
                totaleContrattiNonPagati = results[0].totaleContrattiNonPagati;
              }
              return Promise.resolve({
                totaleContrattiNonPagati: totaleContrattiNonPagati,
                ...data
              });
            },
            (e) => Promise.reject(e)
          );
      },
      (e) => Promise.reject(e)
    )
    .then(
      (data) => {
        // console.log('addresses', data.addresses);
        const emails = data.addresses.filter((add) => add.indexOf('@') > -1);
        const cellphones = data.addresses.filter((add) => add.indexOf('@') < 0);
        const totalEmails = emails.length;
        const totalCellphones = cellphones.length;

        return Promise.resolve({
          emails,
          cellphones,
          totalEmails,
          totalCellphones,
          ...data
        });
      },
      (e) => Promise.reject(e)
    )
    .then(
      (data) => {
        // console.log('Data', data);
        req.session.stats.dati[req.session.stats.mandato] = data;
        res.render('_stats/overview', {
          title: 'Sommario',
          ...data
        });
      },
      (e) => {
        console.log('Error', e);
        res.redirect('/SerfinStats/');
      }
    )
});

export default router;
