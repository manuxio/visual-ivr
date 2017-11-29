import express from 'express';
import config from '../config/config.json';
import logger from '../libs/logger';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const makeConcatString = (s, len = 10) => {
  let rS = s.toString();
  return `RPAD(${rS}, ${len}, 0x00)`;
  // CONCAT('VO2JE',CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'))
}

router.get('/:filename', (req, res, next) => {
  const possibleFiles = [];
  if (req.session && req.session.domain && req.session.domain.length > 0) {
    possibleFiles.push(`./smallcontents/${req.session.domain}/${req.params.filename}.html`);
  }
  possibleFiles.push(`./smallcontents/default/${req.params.filename}.html`);
  possibleFiles.forEach((file, pos) => {
    if (typeof process !== 'undefined' && process.platform === 'win32') {
      possibleFiles[pos] = path.normalize(file);
    } else {
      possibleFiles[pos] = path.normalize(file);
    }
  });
  const goodFile = possibleFiles.reduce(function(prev, curr) {
    if (prev) { return prev; }
    if (fs.existsSync(curr)) {
      return curr;
    }
    return prev;
  }, false);

  if (goodFile) {
    fs.readFile(goodFile, (err, smallcontent) => {
      if (err) {
        next(err);
      } else {
        res.render(`smallcontent`, Object.assign({}, req.baseParams, {
          smallcontent,
          title: ''
        }));
      }
    });
  } else {
    next();
  }
});

export default router;
