import express from 'express';
import logger from '../libs/logger';
import fs from 'fs';
import ect from 'ect';

const router = express.Router();
router.get('/codicenonvalido', (req, res, next) => {
  const {
    session
  } = req;
  // session.regenerate(() => {
    req.session.dbRecord = null;
    req.session.code = null;
    req.session.validCode = false;
    req.session.askConfirmed = false;
    req.session.fullnameConfirmed = false;
    req.session.authenticated = false;
    console.log('Closing session for address', req.ip, req.sessionID, req.originalUrl);
    req.session.domain = 'default';
    const domainfromurl = req.get('host').split(':')[0];
    fs.readFile(`./domainsToCustomer/${domainfromurl}`, (err, value) => {
      // console.log('Stats', err, stats);
      let domain = 'default';
      if (!err && value.toString().length > 0) {
        req.session.domain = value.toString().trim();
        domain = req.session.domain;
      } else {
        console.warn(`[invalid domain from url] In nocode, unable to validate domain for from domain ${domainfromurl}`);
      }
      let roots = [`./views/default`];
      if (req.session && req.session.domain) {
        roots = [
          `./views/${req.session.domain}`,
          `./views/default`
        ];
        // console.log('roots', roots);
        const ectRenderer = ect({ watch: true, cache: false, root: roots });
        req.viewEngines = { '.ect': ectRenderer.render, 'default': false };
      } else {
        const ectRenderer = ect({ watch: true, cache: false, root: `views/default` });
        req.viewEngines = { '.ect': ectRenderer.render, 'default': true };
      }
      req.viewRoots = roots;
      // console.log('req.viewEngines', req.viewEngines);
      req.session.save((saveError) => {
        res.render(`nocode`, Object.assign({}, req.baseParams, {
          title: `Nessun codice valido`,
          domain,
          viewEngines: req.viewEngines,
          viewRoots: req.viewRoots
        }));
      });
    });
  // });
});

export default router;
