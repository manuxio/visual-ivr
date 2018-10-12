import express from 'express';
import async from 'async';
import config from '../config/config.json';
import logger from '../libs/logger';
import checkauth from '../libs/checkauth';
import paymentMethods from '../paymentmethods/';
import {getDate, createHash, createResponseHash} from '../libs/bnlPositivity';

const router = express.Router();

router.get('/home', checkauth, (req, res, next) => {
  const {
    session
  } = req;
  // console.log('fullDbRecords', req.session.fullDbRecords);
  res.render(`vivr/home`, Object.assign({}, req.baseParams, {
    title: `Benvenuto ${session.fullDbRecords.anagrafica.Debitore}`,
    anagraficaEnabled: true,
    informazioniMandatoEnabled: true,
    payNowEnabled: true,
    contactEnabled: true,
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots
  }));
});

router.get('/closesession', (req, res, next) => {
  const {
    session
  } = req;
  // console.log('fullDbRecords', req.session.fullDbRecords);
  const domain = typeof session.domain !== 'undefined' ? session.domain : 'default';
  // req.session.regenerate(() => {
    req.session.dbRecord = null;
    req.session.code = null;
    req.session.validCode = false;
    req.session.askConfirmed = false;
    req.session.fullnameConfirmed = false;
    req.session.authenticated = false;
    console.log('Closing session for address', req.ip, req.sessionID, req.originalUrl);
    req.session.domain = domain;
    req.session.save((saveError) => {
      res.render(`vivr/logout`, Object.assign({}, req.baseParams, {
        title: `Uscita`,
        domain,
        viewEngines: req.viewEngines,
        viewRoots: req.viewRoots
      }));
    });
  // });
});

router.get('/anagrafica', checkauth, (req, res, next) => {
  const {
    session
  } = req;
  // console.log('fullDbRecords', req.session.fullDbRecords);
  logger(req, `Accesso pagina anagrafica`, 'web', req.session.code);
  res.render(`vivr/anagrafica`, Object.assign({}, req.baseParams, {
    title: `Dati anagrafici`,
    informazioniMandatoEnabled: true,
    payNowEnabled: true,
    contactEnabled: true,
    homeEnabled: true,
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots
  }));
});

router.get('/informazionimandato', checkauth, (req, res, next) => {
  const {
    session
  } = req;
  logger(req, `Accesso pagina mandato`, 'web', req.session.code);
  res.render(`vivr/informazionimandato`, Object.assign({}, req.baseParams, {
    title: `POSIZIONE DEBITORIA`,
    // informazioniMandatoEnabled: true,
    payNowEnabled: true,
    contactEnabled: true,
    homeEnabled: true,
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots
  }));
});

router.get('/pagaora', checkauth, (req, res, next) => {
  const {
    session
  } = req;
  const {
    dbRecord,
    fullDbRecords
  } = session;
  const {
    paymentMethods: enabledPaymentMethods
  } = fullDbRecords;

  const totaleDaPagare = fullDbRecords.importi.reduce((prev, curr) => {
    return prev + curr.importoResiduo;
  }, 0);
  session.pendingChecks = 0;

  // console.log('enabledPaymentMethods', enabledPaymentMethods);

  const realPaymentMethods = enabledPaymentMethods.map((c) => {
    if (!session.paymentMethodsConfigurations) {
      session.paymentMethodsConfigurations = {};
    }
    session.paymentMethodsConfigurations[c.module] = c;
    const theClass = paymentMethods[c.module];
    if (!theClass) {
      throw new Error(`Cannot find a module with name: ${c.module}`);
    }
    const m = new theClass(c);
    m.setAmount(totaleDaPagare);
    m.setCurrency('EUR');
    m.setPaymentId(dbRecord.id_pagamento_online);
    m.setIdContratto(dbRecord.idcontratto);
    m.setBaseUrl(req.get('host'));
    m.setInfo(`Pagamento online per id: ${dbRecord.id_pagamento_online}`);
    m.setDb(req.dbConnection);
    m.setSession(req.session);
    m.setUrlCode(req.session.code);
    return m;
  });

  // console.log('realPaymentMethods', realPaymentMethods);


  req.dbConnection.query(`SELECT * FROM onlinePaymentTransactions WHERE paymentId = ${req.dbConnection.escape(dbRecord.id_pagamento_online)} AND completed = 1 AND (status = 'PENDING' OR status = 'APPROVED')`)
  .then(
    (results) => {
      if (results && results.length) {
        res.render(`vivr/paymentalreadymade`, Object.assign({}, req.baseParams, {
          title: `Pagamento gi&agrave; eseguito`,
          paymentMethods: realPaymentMethods,
          anagraficaEnabled: true,
          informazioniMandatoEnabled: true,
          contactEnabled: true,
          homeEnabled: true,
          viewEngines: req.viewEngines,
          viewRoots: req.viewRoots
        }));
      } else {
        const getReady = realPaymentMethods.map((pm) => {
          return function(pm) {
            return function() {
              return pm.getReady();
            }
          }(pm);
        });
        //console.log('paymentMethods', session.domain, paymentMethods);
        async.mapSeries(realPaymentMethods, (pm, cb) => {
          pm.getReady()
          .then(
            () => {
              cb(null);
            },
            (e) => {
              console.log('E', e);
              cb(true);
            }
          );
        }, (err) => {
          if (!err) {
            logger(req, `Accesso pagina pagamento`, 'web', req.session.code);
            res.render(`vivr/choosepaymentmethod`, Object.assign({}, req.baseParams, {
              title: `Scegli il metodo di pagamento`,
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
    },
    (e) => Promise.reject(e)
  );


});

router.get('/waittransactionresult', checkauth, (req, res, next) => {
  const {
    session
  } = req;
  session.pendingChecks = session.pendingChecks > -1 ? session.pendingChecks += 1 : session.pendingChecks = 0;
  if (!session.pendingTransaction) {
    next('/home');
    return;
  }
  // console.log('waittransactionresult');
  req.dbConnection.query(`SELECT completed, status, remotestatus FROM onlinePaymentTransactions WHERE id = ${req.dbConnection.escape(session.pendingTransaction)}`)
  .then(
    (results) => {
      if (!results || results.length !== 1) {
        next('/home');
        return;
      } else {
        const transactionResult = results[0];
        if (!transactionResult.completed) {
          res.render(`vivr/pleasewait`, Object.assign({}, req.baseParams, {
            title: `Attendere...`,
            reloadTimeout: 5000,
            pendingChecks: session.pendingChecks,
            listTransactionsUrl: '/vivr/showtransactions',
            viewEngines: req.viewEngines,
            viewRoots: req.viewRoots
          }));
        } else {
          // console.log('transactionResult', transactionResult);
          res.render(`vivr/transactioncompleted`, Object.assign({}, req.baseParams, {
            title: `Transazione completa`,
            transactionResult,
            listTransactionsUrl: '/vivr/showtransactions',
            anagraficaEnabled: true,
            informazioniMandatoEnabled: true,
            payNowEnabled: true,
            viewEngines: req.viewEngines,
            viewRoots: req.viewRoots
          }));
        }
      }
    },
    (e) => Promise.reject(e)
  )
});

router.get('/showtransactions', checkauth, (req, res, next) => {
  const {
    session
  } = req;
  const {
    dbRecord
  } = session;
  req.dbConnection.query(`SELECT fullConfig, status, remotestatus, datacreazione FROM onlinePaymentTransactions WHERE idContratto = ${req.dbConnection.escape(dbRecord.idcontratto)} AND completed = 1 ORDER BY datacreazione DESC`)
  .then(
    (results) => {
      const myTransactions = results.map((result) => {
        const fullConfig = JSON.parse(result.fullConfig);
        return {
          fullConfig,
          type: fullConfig.title,
          amount: fullConfig.chargetotal,
          status: result.status,
          remotestatus: result.remotestatus,
          date: result.datacreazione
        };
      });
      res.render(`vivr/showtransactions`, Object.assign({}, req.baseParams, {
        title: `Lista transazioni`,
        transactions: myTransactions,
        anagraficaEnabled: true,
        informazioniMandatoEnabled: true,
        contactEnabled: true,
        homeEnabled: true,
        viewEngines: req.viewEngines,
        viewRoots: req.viewRoots
      }));
    },
    (e) => {
      next(500);
    }
  );

});

router.get('/sendmessage', checkauth, (req, res, next) => {
  const {
    session
  } = req;
  res.render(`vivr/sendmessage`, Object.assign({}, req.baseParams, {
    title: `Invia messaggio`,
    anagraficaEnabled: true,
    informazioniMandatoEnabled: true,
    payNowEnabled: true,
    homeEnabled: true,
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots
  }));
});

router.post('/sendmessage', checkauth, (req, res, next) => {
  const {
    session
  } = req;
  const {
    fullDbRecords
  } = session;
  const {
    contratto
  } = fullDbRecords;
  const {
    body
  } = req;
  const {
    contactReason,
    contactMessage
  } = body;
  const {
    files
  } = req;
  const testfile = files && files.contactAttachment ? files.contactAttachment : null;
  if (!contactReason || !contactMessage || (testfile && testfile.data.byteLength === 512000)) {
    let formError = '<ul>';
    if (testfile && testfile.data.byteLength === 512000) {
      formError += '<li>L\'allegato &egrave; troppo grande!</li>';
    }
    if (!contactReason) {
      formError += '<li>L\'oggetto &egrave; vuoto!</li>';
    }
    if (!contactMessage) {
      formError += '<li>Il messaggio &egrave; vuoto!</li>';
    }
    res.render(`vivr/sendmessage`, Object.assign({}, req.baseParams, {
      title: `Invia messaggio`,
      contactMessage,
      contactReason,
      formError,
      viewEngines: req.viewEngines,
      viewRoots: req.viewRoots
    }));
  } else {
    const file = files && files.contactAttachment ? files.contactAttachment : null;
    const filename = file ? file.name : null;
    const filemime = file ? file.mimetype : null;
    const filedata = file ? file.data : null;

    req.dbConnection
    .query(`INSERT into onlineMessages (idcontratto, oggetto, messaggio, attachment, attachment_name, attachment_mimetype, tracking)
    VALUES (
      ${req.dbConnection.escape(contratto.IDContratto)},
      ${req.dbConnection.escape(contactReason)},
      ${req.dbConnection.escape(contactMessage)},
      ${req.dbConnection.escape(filedata)},
      ${req.dbConnection.escape(filename)},
      ${req.dbConnection.escape(filemime)},
      ${req.dbConnection.escape(req.session.code)}
    )`)
    .then(
      (result) => {
        res.render(`vivr/messagesent`, Object.assign({}, req.baseParams, {
          title: `Messaggio inviato correttamente`,
          viewEngines: req.viewEngines,
          viewRoots: req.viewRoots
        }));
      },
      (e) => Promise.reject(e)
    )

  }
});

router.get('/splitpayment', checkauth, (req, res, next) => {
  const {
    session
  } = req;
  res.render(`vivr/splitpayment`, Object.assign({}, req.baseParams, {
    title: `Rateizzazione`,
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots
  }));
});

router.post('/splitpayment', checkauth, (req, res, next) => {
  const {
    session
  } = req;
  session.splitpayments = parseInt(req.body.splits);
  if (isNaN(session.splitpayments)) {
    session.splitpayments = 3;
  }
  session.splits = [];
  const records = req.session.fullDbRecords;
  const totalDue = records.importi.reduce((prev, curr) => {
    return prev + curr.importoResiduo;
  }, 0);
  console.log('0totalDue', totalDue);
  let total = 0;
  for (let i = 0; i < session.splitpayments; i += 1) {
    if (i === session.splitpayments - 1) {
      session.splits.push(Math.ceil((totalDue-total)*100)/100);
    } else {
      total = total + Math.floor(totalDue/req.session.splitpayments);
      session.splits.push(Math.floor(totalDue/req.session.splitpayments));
    }
  }

  // console.log(session.splits);

  res.render(`vivr/splitpaymentconfirm`, Object.assign({}, req.baseParams, {
    title: `Conferma rateizzazione`,
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots,
    splits: session.splits
  }));
});

router.get('/splitpaymentconfirmed', checkauth, (req, res, next) => {
  const {
    session
  } = req;
  res.render(`vivr/splitpaymentconfirmed`, Object.assign({}, req.baseParams, {
    title: `Conferma richiesta rateizzazione`,
    viewEngines: req.viewEngines,
    viewRoots: req.viewRoots
  }));
});

export default router;
