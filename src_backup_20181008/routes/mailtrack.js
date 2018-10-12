import express from 'express';
import config from '../config/config.json';
import logger from '../libs/logger';
import fs from 'fs';

const router = express.Router();

router.get('/mail/image/:tracking', (req, res, next) => {
  const tracking = req.params.tracking || '';
  const pos = tracking.indexOf('.gif');
  const realTrack = tracking.substring(0, pos);
  const sql = `UPDATE incoming_mails set seendate = NOW() where tracker = ${req.dbConnection.escape(realTrack)} and seendate is null`;
  // console.log('sql', sql);
  req.dbConnection.query(sql)
    .then(
      () => {
        const buf = new Buffer(35);
        buf.write("R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=", "base64");
        res.send(buf, { 'Content-Type': 'image/gif' }, 200);
      },
      (e) => {
        console.log('Tracking', e);
        const buf = new Buffer(35);
        buf.write("R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=", "base64");
        res.send(buf, { 'Content-Type': 'image/gif' }, 200);
      }
    );

});

export default router;
