import express from 'express';
import config from '../config/config.json';
import logger from '../libs/logger';
const router = express.Router();

router.get('/requestsecret', (req, res, next) => {
  const {
    session
  } = req;
  // console.log('In get, session', session);
  //console.log('Session', session);
  if (session.validCode && session.askConfirmed !== true) {
    // res.send("Qui mostro il form");
    //console.log('baseParams', req.baseParams);
    res.render(`requestsecret`, Object.assign({}, req.baseParams, {
      askLabel: req.session.askLabel,
      title: 'Verifica dati',
      viewEngines: req.viewEngines,
      viewRoots: req.viewRoots
    }));
  } else {
    if (session.askConfirmed) {
      res.redirect(302, '/requestfullname');
    } else {
      res.redirect(302, '/codicenonvalido');
    }
  }
});

router.post('/requestsecret', (req, res, next) => {
  const {
    session
  } = req;
  // console.log('Current session', session);
  if (session.askConfirmed) {
    session.askConfirmed = false;
  }
  if (session.fullnameConfirmed) {
    session.fullnameConfirmed = false;
  }
  if (session.authenticated) {
    session.authenticated = false;
  }
  if (session.validCode) {
    if (typeof req.body.askValue === 'string' && session.askValue.trim().toLowerCase() === req.body.askValue.trim().toLowerCase()){
      logger(req, `Codice verificato per record ID ${req.session.dbRecord.ID}`, 'audit').then(
        (result) => {
          session.askConfirmed = true;
          session.save((saveError) => {
            if (saveError) {
              console.log('Save Error in request secret', saveError);
            }
            res.redirect(302, '/requestfullname');
          });
        }
      );
    } else {
      logger(req, `Verifica fallita per il record ${req.session.dbRecord.ID} (codice inserito: ${req.body.askValue ? req.body.askValue.toString() : '' })`, 'audit').then(
        (result) => {
          res.render(`requestsecret`, Object.assign({}, req.baseParams, {
            askLabel: req.session.askLabel,
            title: 'Verifica dati',
            formError: true,
            viewEngines: req.viewEngines,
            viewRoots: req.viewRoots
          }));
        }
      );
    }
  //  console.log('BODY: ',req.body);
  } else {
    console.log('Session with no validCode!', req.sessionID, session);
    logger(req, `Tentativo di POST senza codice valido`, 'security')
    .then(
      (result) => {
        res.status(500).render(`errors/dbfailure`, Object.assign({}, req.baseParams, {
          title: `Temporary error`,
          domain: session && session.domain ? session.domain : 'default',
          viewEngines: req.viewEngines,
          viewRoots: req.viewRoots
        }));
      }
    );
  }

});

export default router;
