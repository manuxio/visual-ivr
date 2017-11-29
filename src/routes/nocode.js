import express from 'express';
import logger from '../libs/logger';

const router = express.Router();
router.get('/codicenonvalido', (req, res, next) => {
  const {
    session
  } = req;
  session.regenerate(() => {
    req.session.domain = 'default';
    const domain = 'default';
    res.render(`nocode`, Object.assign({}, req.baseParams, {
      title: `Nessun codice valido`,
      domain
    }));
  });
});

export default router;
