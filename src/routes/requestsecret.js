import express from 'express';
import config from '../config/config.json';
import logger from '../libs/logger';
const router = express.Router();

router.get('/requestsecret', (req, res, next) => {
  const {
    session
  } = req;
  //console.log('Session', session);
  if (session.validCode && session.askConfirmed !== true) {
    // res.send("Qui mostro il form");
    //console.log('baseParams', req.baseParams);
    res.render(`requestsecret`, Object.assign({}, req.baseParams, {
      askLabel: req.session.askLabel,
      title: 'Verifica dati'
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
  if (session.validCode && session.askConfirmed !== true) {
    if (typeof req.body.askValue === 'string' && session.askValue.toLowerCase() === req.body.askValue.toLowerCase()){
      logger(req, `Codice verificato per record ID ${req.session.dbRecord.ID}`, 'audit').then(
        (result) => {
          session.askConfirmed = true;
          res.redirect(302, '/requestfullname');
        }
      );
    } else {
      logger(req, `Verifica fallita per il record ${req.session.dbRecord.ID} (codice inserito: ${req.body.askValue ? req.body.askValue.toString() : '' })`, 'audit').then(
        (result) => {
          res.render(`requestsecret`, Object.assign({}, req.baseParams, {
            askLabel: req.session.askLabel,
            title: 'Verifica dati',
            formError: true
          }));
        }
      );
    }
  //  console.log('BODY: ',req.body);
  } else {
    logger(req, `Tentativo di POST senza codice valido`, 'security')
    .then(
      (result) => {
        res.status(500).send('Your action has been logged!');
      }
    );
  }

});

export default router;
