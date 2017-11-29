import express from 'express';
import config from '../config/config.json';
import logger from '../libs/logger';
const router = express.Router();

router.get('/requestfullname', (req, res, next) => {
  const {
    session
  } = req;
  if (session.validCode && session.askConfirmed && session.fullnameConfirmed !== true) {
    // res.send("Qui mostro il form");
    //console.log('baseParams', req.baseParams);
    res.render(`./requestfullname`, Object.assign({}, req.baseParams, {
      title: 'Verifica identit&agrave;',
    }));
  } else {
    if (session.fullnameConfirmed) {
      res.redirect(302, '/vivr/home');
    } else if (session.askConfirmed !== true && session.validcode) {
      res.redirect(302, '/requestsecret');
    } else {
      res.redirect(302, '/codicenonvalido');
    }
  }
});

router.post('/requestfullname', (req, res, next) => {
  const {
    session
  } = req;
  const {
    body
  } = req;
  const {
    confirm
  } = body;
  if (session.validCode && session.askConfirmed && session.fullnameConfirmed !== true && confirm === 'true') {
    logger(req, `Identita' verificata per record ID ${req.session.dbRecord.ID}`, 'audit').then(
      (result) => {
        session.askConfirmed = true;
        session.fullnameConfirmed = true;
        session.authenticated = true;
        res.redirect(302, '/vivr/home');
      }
    );
  } else {
    logger(req, `Verifica identita' fallita per il record ${req.session.dbRecord.ID}`, 'audit').then(
      (result) => {
        res.render(`./requestfullname`, Object.assign({}, req.baseParams, {
          title: 'Verifica identit&agrave;',
        }));
      }
    );
  //  console.log('BODY: ',req.body);
  }

});

export default router;
