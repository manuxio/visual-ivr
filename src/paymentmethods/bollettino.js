import baseMethod from './basemethod';
import barcode from 'barcode';
import JsBarcode from 'jsbarcode';
import Canvas from 'canvas';
import fs from 'fs';
import temp from 'temp';
import childProcess from 'child_process';
import async from 'async';
import moment from 'moment';

export default class bollettinoMethod extends baseMethod {

  static getCallBackUrls() {
    return [
      {
        url: 'bollettino_pdf',
        method: 'createPdf',
        httpMethod: 'get'
      }
    ]
  }

  static createPdf(req, res, next) {
    const {
      session
    } = req;
    const db = req.dbConnection;
    const params = req.query;
    const {
      id
    } = params || {};
    db.query(`SELECT * FROM onlinePaymentTransactions WHERE id = ${ db.escape(id)}`)
    .then(
      (results) => {
        if (results && results.length === 1) {
          const record = results[0];
          // console.log('Record', record);
          const pdfConf = JSON.parse(record.fullconfig);
          Canvas.registerFont(`./src/paymentmethods/fonts/Inconsolata-Regular.ttf`, {family: 'Inconsolata'});
          Canvas.registerFont(`./src/paymentmethods/fonts/OCRAEXT.TTF`, {family: 'OcrA'});
          Canvas.registerFont(`./src/paymentmethods/fonts/ocrb.ttf`, {family: 'OcrB'});

          fs.readFile(`./src/paymentmethods/${pdfConf.baseFile}`, (err, baseFile) => {
            if (err) throw err;
            const oneDeg = Math.PI / 180;
            const img = new Canvas.Image;
            img.src = baseFile;
            const IMW = img.width;
            const IMH = img.height;
            const getRealH = (h) => {
              return IMH * h / 3502;
            };
            const getRealW = (w) => {
              return IMW * w / 2432;
            };
            // const Inconsolata = new Canvas.Font('Inconsolata', `./src/paymentmethods/Inconsolata-Regular.ttf`);
            // Inconsolata.addFace(`./src/paymentmethods/Inconsolata-Regular.ttf`, 'normal');
            const canvas = Canvas.createCanvas(IMW, IMH, 'pdf');
            const ctx = canvas.getContext('2d');
            // ctx.addFont(Inconsolata);
            ctx.drawImage(img, 0, 0);

            new Promise((resolve, reject) => {
              if (pdfConf.topLeft) {
                fs.readFile(`./src/paymentmethods/${pdfConf.topLeft}`, (err, topLeft) => {
                  const tmpImg = new Canvas.Image;
                  tmpImg.src = topLeft;
                  ctx.drawImage(tmpImg, ((IMW / 2) - (tmpImg.width)) / 2, 0);
                  resolve();
                });
              } else {
                resolve();
              }
            })
            .then( // Immagine bottom left
              () => {
                if (pdfConf.bottomLeft) {
                  return new Promise((resolve) => {
                    fs.readFile(`./src/paymentmethods/${pdfConf.bottomLeft}`, (err, bottomLeft) => {
                      const tmpImg = new Canvas.Image;
                      tmpImg.src = bottomLeft;
                      ctx.drawImage(tmpImg, ((IMW / 2) - (tmpImg.width)) / 2, IMH - tmpImg.height);
                      resolve();
                    });
                  });
                } else {
                  return Promise.resolve();
                }
              },
              (e) => Promise.reject(e)
            )
            .then( // Immagine lis code
              () => {
                if (pdfConf.lisCode && pdfConf.enableLis) {
                  const newCanvas = Canvas.createCanvas();
                  JsBarcode(newCanvas, pdfConf.lisCode, {
                    width: 3,
                    height: 130,
                    margin: 0,
                    fontSize: 30,
                    text: pdfConf.lisCodeText
                  });
                  const tmpImg = new Canvas.Image;
                  tmpImg.src = newCanvas.toBuffer();
                  // 3502 : 2600 = IMH : x
                  const h = getRealH(2570);
                  const w = ((IMW / 2) - tmpImg.width) / 2;
                  ctx.drawImage(tmpImg, w, h);
                  if (pdfConf.lisCodiceEmittente) {
                    ctx.font = `${getRealH(41)}px Arial`;
                    ctx.fillText(pdfConf.lisCodiceEmittente, getRealW(398), getRealH(2795));
                  }
                  if (pdfConf.lisCodiceConto) {
                    ctx.font = `${getRealH(41)}px Arial`;
                    ctx.fillText(pdfConf.lisCodiceConto, getRealW(398), getRealH(2858));
                  }
                  if (pdfConf.lisImporto) {
                    ctx.font = `${getRealH(41)}px Arial`;
                    ctx.fillText(pdfConf.lisImporto, getRealW(398), getRealH(2918));
                  }
                  return Promise.resolve();
                } else {
                  return Promise.resolve();
                }
              },
              (e) => Promise.reject(e)
            )
            .then( // Nome debitore
              () => {
                if (pdfConf.nomeDebitore && pdfConf.enablePoste) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealW(35)}px Arial`;
                  ctx.translate(getRealW(-3200), getRealH(1686));
                  ctx.fillText(pdfConf.nomeDebitore, 0, 0);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                return Promise.resolve();
              },
              (e) => Promise.reject(e)
            )
            .then( // Indirizzo debitore
              () => {
                if (pdfConf.residenzaRigaUno && pdfConf.enablePoste) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(35)}px Arial`;
                  ctx.translate(getRealW(-3200), getRealH(1725));
                  ctx.fillText(pdfConf.residenzaRigaUno, 0, 0);
                  if (pdfConf.residenzaRigaDue) {
                    ctx.fillText(pdfConf.residenzaRigaDue, 0, getRealH(35 + 35/3));
                  }
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                return Promise.resolve();
              },
              (e) => Promise.reject(e)
            )
            .then( // Nome debitore 2
              () => {
                if (pdfConf.nomeDebitore && pdfConf.enablePoste) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealW(35)}px Arial`;
                  ctx.translate(getRealW(-1023), getRealH(1686));
                  ctx.fillText(pdfConf.nomeDebitore, 0, 0);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                return Promise.resolve();
              },
              (e) => Promise.reject(e)
            )
            .then( // Indirizzo debitore 2
              () => {
                if (pdfConf.residenzaRigaUno && pdfConf.enablePoste) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(35)}px Arial`;
                  ctx.translate(getRealW(-1023), getRealH(1725));
                  ctx.fillText(pdfConf.residenzaRigaUno, 0, 0);
                  if (pdfConf.residenzaRigaDue) {
                    ctx.fillText(pdfConf.residenzaRigaDue, 0, getRealH(35 + 35/3));
                  }
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                return Promise.resolve();
              },
              (e) => Promise.reject(e)
            )
            .then( // Indirizzo debitore 2
              () => {
                if (pdfConf.residenzaRigaUno && pdfConf.enablePoste) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(35)}px Arial`;
                  ctx.translate(getRealW(-1023), getRealH(1725));
                  ctx.fillText(pdfConf.residenzaRigaUno, 0, 0);
                  if (pdfConf.residenzaRigaDue) {
                    ctx.fillText(pdfConf.residenzaRigaDue, 0, getRealH(35 + 35/3));
                  }
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                return Promise.resolve();
              },
              (e) => Promise.reject(e)
            )
            .then( // Causale
              () => {
                if (pdfConf.causaleRigaUno && pdfConf.enablePoste) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(30)}px Arial`;
                  ctx.translate(getRealW(-3383), getRealH(1900));
                  ctx.fillText(pdfConf.causaleRigaUno, 0, 0);
                  if (pdfConf.causaleRigaDue) {
                    ctx.fillText(pdfConf.causaleRigaDue, 0, getRealH(30));
                  }
                  if (pdfConf.causaleRigaTre) {
                    ctx.fillText(pdfConf.causaleRigaTre, 0, getRealH(30 + 30));
                  }
                  if (pdfConf.causaleRigaQuattro) {
                    ctx.fillText(pdfConf.causaleRigaQuattro, 0, getRealH(30 + 30 + 30));
                  }
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                return Promise.resolve();
              },
              (e) => Promise.reject(e)
            )
            .then( // Causale 2
              () => {
                if (pdfConf.causaleRigaUno && pdfConf.enablePoste) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(30)}px Arial`;
                  ctx.translate(getRealW(-1855), getRealH(1900));
                  ctx.fillText(pdfConf.causaleRigaUno, 0, 0);
                  if (pdfConf.causaleRigaDue) {
                    ctx.fillText(pdfConf.causaleRigaDue, 0, getRealH(30));
                  }
                  if (pdfConf.causaleRigaTre) {
                    ctx.fillText(pdfConf.causaleRigaTre, 0, getRealH(30 + 30));
                  }
                  if (pdfConf.causaleRigaQuattro) {
                    ctx.fillText(pdfConf.causaleRigaQuattro, 0, getRealH(30 + 30 + 30));
                  }
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                return Promise.resolve();
              },
              (e) => Promise.reject(e)
            )
            .then( // Nome creditore
              () => {
                if (pdfConf.nomeCreditore && pdfConf.enablePoste) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(35)}px Dejavu Sans`;
                  ctx.translate(getRealW(-3380), getRealH(1550));
                  ctx.fillText(pdfConf.nomeCreditore, 0, 0);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(35)}px Dejavu Sans`;
                  ctx.translate(getRealW(-1855), getRealH(1550));
                  ctx.fillText(pdfConf.nomeCreditore, 0, 0);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                return Promise.resolve();
              },
              (e) => Promise.reject(e)
            )
            .then( // C/C Creditore
              () => {
                if (pdfConf.contoCorrenteCreditore && pdfConf.enablePoste) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(35)}px Dejavu Sans`;
                  ctx.translate(getRealW(-2884), getRealH(1389));
                  ctx.fillText(pdfConf.contoCorrenteCreditore, 0, 0);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(35)}px Dejavu Sans`;
                  ctx.translate(getRealW(-1568), getRealH(1381));
                  ctx.fillText(pdfConf.contoCorrenteCreditore, 0, 0);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                return Promise.resolve();
              },
              (e) => Promise.reject(e)
            )
            .then( // importo Bollettino
              () => {
                if (pdfConf.importoBollettino && pdfConf.enablePoste) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(35)}px Dejavu Sans`;
                  ctx.translate(getRealW(-2400), getRealH(1375));
                  ctx.fillText(pdfConf.importoBollettino, 0, 0);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(35)}px Dejavu Sans`;
                  ctx.translate(getRealW(-628), getRealH(1394));
                  ctx.fillText(pdfConf.importoBollettino, 0, 0);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                return Promise.resolve();
              },
              (e) => Promise.reject(e)
            )
            .then( // importoOCR + contocorrenteOCR + tipoOCR
              () => {
                if (pdfConf.codiceclienteOCR && pdfConf.enablePoste) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(46)}px OcrB`;
                  ctx.translate(getRealW(-1800), getRealH(2366));
                  ctx.fillText(`<${pdfConf.codiceclienteOCR}>     ${pdfConf.importoOCR}>  ${pdfConf.contocorrenteOCR}<  896>`, 0, 0);
                  // ctx.translate(getRealW(-1815), getRealH(2391));
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(46)}px OcrB`;
                  ctx.translate(getRealW(-1800), getRealH(1686));
                  ctx.fillText(`${pdfConf.codiceclienteOCR}`, 0, 0);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);

                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.rotate(-90 * oneDeg);
                  ctx.font = `${getRealH(46)}px OcrB`;
                  ctx.translate(getRealW(-1787), getRealH(1470));
                  ctx.fillText('896', 0, 0);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                return Promise.resolve();
              },
              (e) => Promise.reject(e)
            )
            .then( // Immagine barcode orizzontale
              () => {
                if (pdfConf.barcodeCode && pdfConf.enablePoste) {
                  const newCanvas = Canvas.createCanvas();
                  JsBarcode(newCanvas, pdfConf.barcodeCode, {
                    width: 3,
                    height: 130,
                    margin: 0,
                    fontSize: 30,
                    text: pdfConf.barcodeCode
                  });
                  const tmpImg = new Canvas.Image;
                  tmpImg.src = newCanvas.toBuffer();
                  ctx.rotate(-90 * oneDeg);
                  ctx.translate(getRealW(-150 -tmpImg.width), getRealH(1880));
                  ctx.drawImage(tmpImg, 0, 100);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  return Promise.resolve();
                } else {
                  return Promise.resolve();
                }
              },
              (e) => Promise.reject(e)
            )
            .then( // Immagine data matrix
              () => {
                if (pdfConf.barcodeCode && pdfConf.enablePoste) {
                  return new Promise((resolve) => {
                    temp.open('myprefix', (err, newfile) => {
                      if (!err) {
                        fs.write(newfile.fd, pdfConf.barcodeCode);
                        fs.close(newfile.fd, () => {
                          const cmd = `/bin/dmtxwrite ${newfile.path} -s 16x48 -d 11 -m 1 -o ${newfile.path}.png`;
                          childProcess.exec(`${cmd}`, (xErr) => {
                            if (xErr) {
                              console.error(xErr);
                              resolve();
                            } else {
                              fs.readFile(`${newfile.path}.png`, (err, newFileContent) => {
                                const tmpImg = new Canvas.Image;
                                tmpImg.src = newFileContent;
                                ctx.rotate(-90 * oneDeg);
                                ctx.translate(getRealW(-2533), getRealH(2238));
                                ctx.drawImage(tmpImg, 0, 0);
                                ctx.setTransform(1, 0, 0, 1, 0, 0);
                                fs.unlink(`${newfile.name}.png`, () => {
                                  fs.unlink(`${newfile.name}`, () => {
                                    resolve();
                                  });
                                });
                              });
                            }
                          });
                        });
                      } else {
                        console.error(err);
                        resolve();
                      }
                    });
                  })
                } else {
                  return Promise.resolve();
                }
              },
              (e) => Promise.reject(e)
            )
            .then(
              () => {
                canvas.pdfStream()
                .pipe(res);
              },
              (e) => Promise.reject(e)
            );
          });
        } else {
          next(404);
        }
      },
      (e) => Promise.reject(e)
    );
/*
    const pdfConf = {
      baseFile: 'images/bbianco.png',
      topLeft: 'images/fastweb_left_top.png',
      bottomLeft: 'images/fastweb_left_bottom.png',
      lisCode: '415809999900456680200020170007600263343902006091',
      lisCodeText: '(415)8099999004566(802)0002017000760026334(3902)006091',
      lisCodiceEmittente: '8099999004566',
      lisCodiceConto: '0002017000760026334',
      lisImporto: '60,91',
      nomeDebitore: 'Schiro Monica',
      residenzaRigaUno: 'L.go Olgiata 19',
      residenzaRigaDue: 'Roma 00100 rm',
      nomeCreditore: 'FASTWEB S.P.A.',
      contoCorrenteCreditore: '1424455',
      importoBollettino: '60,91',
      codiceclienteOCR: '170000000760026335',
      importoOCR: '00000060+91',
      contocorrenteOCR: '000014244255',
      tipoOCR: '896',
      barcodeCode: '18170000000760026335120000142442551000000060913896'

    };
*/

  }

  getIntro() {
    return this.description;
  }

  getTitle() {
    return this.title;
  }

  getReady(req) {
    const {
      dbRecord,
      fullDbRecords
    } = this.session;

    /*
    console.log('fullDbRecords', fullDbRecords.fatture);
    */

    const mainConf = {};
    if (this.param1 && this.param1.length && typeof this.param1 === 'string' && this.param1[0] === '{') {
      Object.assign(mainConf, JSON.parse(this.param1));
    }
    const anagrafica = fullDbRecords.anagrafica;
    mainConf.nomeDebitore = anagrafica.Debitore;
    mainConf.residenzaRigaUno = anagrafica.Indirizzo;
    mainConf.residenzaRigaDue = `${anagrafica.CAP ? anagrafica.CAP : ''} ${anagrafica.Citta}`;
    mainConf.tipoOCR = '896';

    const configurations = fullDbRecords.fatture.map((fattura, pos) => {
      const pdfConf = Object.assign({}, mainConf);
      const importo = fattura.ImportoAzionato;
      pdfConf.importo = fattura.ImportoAzionato;
      const importoAsText = fattura.ImportoAzionato.toFixed(2);
      pdfConf.importoBollettino = importoAsText.replace('.', ',');

      const underscorePosition = fattura.NumFattura.indexOf('_');
      const codiceFattura = fattura.NumFattura.slice((fattura.NumFattura.length - underscorePosition - 1) * -1);
      pdfConf.numeroFattura = codiceFattura;
      const nFattura = codiceFattura.replace( /^\D+/g, '');
      const residenziale = codiceFattura.indexOf('M') > -1;
      if (pdfConf.contocorrenteOCR) {
        if (residenziale) {
          pdfConf.importoOCR = bollettinoMethod.leftPad(importoAsText.replace('.', '+'), 11);
          // 170000000760026335
          const annofattura = (new Date(fattura.datafattura)).getFullYear();
          const tmpCodiceClienteClienteOcr = `${annofattura.toString().slice(-2)}888${bollettinoMethod.leftPad(nFattura.toString(), 11)}`;
          const remainder = parseInt(tmpCodiceClienteClienteOcr, 10) % 93;
          pdfConf.codiceclienteOCR = `${tmpCodiceClienteClienteOcr}${remainder}`;
          //18170000000760026335120000142442551000000060913896
          //18 170000000760026335 12 000014244255 10 0000006091 3 896
          pdfConf.barcodeCode = `18${pdfConf.codiceclienteOCR}12${pdfConf.contocorrenteOCR}10${bollettinoMethod.leftPad(importoAsText.replace('.',''),10)}3896`;
        } else {
          // 00000060+91
          pdfConf.importoOCR = bollettinoMethod.leftPad(importoAsText.replace('.', '+'), 11);
          // 170000000760026335
          const annofattura = (new Date(fattura.datafattura)).getFullYear();
          const tmpCodiceClienteClienteOcr = `${annofattura.toString().slice(-2)}${bollettinoMethod.leftPad(nFattura.toString(), 14)}`;
          const remainder = parseInt(tmpCodiceClienteClienteOcr, 10) % 93;
          pdfConf.codiceclienteOCR = `${tmpCodiceClienteClienteOcr}${remainder}`;
          //18170000000760026335120000142442551000000060913896
          //18 170000000760026335 12 000014244255 10 0000006091 3 896
          pdfConf.barcodeCode = `18${pdfConf.codiceclienteOCR}12${pdfConf.contocorrenteOCR}10${bollettinoMethod.leftPad(importoAsText.replace('.',''),10)}3896`;
        }
      }
      if (pdfConf.lisCodiceEmittente) {
        if (residenziale) {

        } else {
          const annofattura = (new Date(fattura.datafattura)).getFullYear();
          const fatturalunga = bollettinoMethod.leftPad(nFattura, 10);
          const annolungo = bollettinoMethod.leftPad(annofattura.toString(), 6);
          const codiceContoTmp = `${annolungo}${fatturalunga}`;
          const codiceContoAsNumber = parseInt(codiceContoTmp, 10);
          const remainder = codiceContoAsNumber % 93;
          const codiceConto = `${annolungo}${fatturalunga}${remainder}`;
          pdfConf.lisCodiceConto = codiceConto;
          pdfConf.lisImporto = importoAsText.replace('.', ',');
          pdfConf.lisCode = `415${pdfConf.lisCodiceEmittente}8020${codiceConto}3902${bollettinoMethod.leftPad(importoAsText.replace('.', ''), 6)}`;
          pdfConf.lisCodeText = `(415)${pdfConf.lisCodiceEmittente}(8020)${codiceConto}(3902)${bollettinoMethod.leftPad(importoAsText.replace('.', ''), 6)}`;
        }
      }
      pdfConf.causaleRigaUno = `N. FATTURA: ${nFattura}`;
      pdfConf.causaleRigaDue = `DATA FATTURA: ${moment(fattura.datafattura).format('DD/MM/YYYY')}`;
      // pdfConf.causaleRigaTre = 'Prova 3';
      // pdfConf.causaleRigaQuattro = 'Prova 4';
      pdfConf.idContratto = this.idContratto;
      pdfConf.paymentId = this.paymentId;
      return pdfConf;
    });
    return new Promise((resolve, reject) => {
      async.mapSeries(configurations, (pdfConf, cb) => {
        if (pdfConf.importo > 0) {
          const sql = `INSERT into onlinePaymentTransactions (module, fullConfig, paymentId, idContratto) VALUES (
            ${this.db.escape('bollettino')},
            ${this.db.escape(JSON.stringify(pdfConf))},
            ${this.db.escape(this.paymentId)},
            ${this.db.escape(this.idContratto)}
          )`;
          // console.log(`${pdfConf.title} ${pdfConf.numeroFattura}`);
          this.db.query(sql)
          .then(
            (result) => {
              cb(null, {id: result.insertId, name: `${pdfConf.title} ${pdfConf.numeroFattura}` });
            },
            (e) => {
              cb(e);
            }
          );
        } else {
          cb(null, null);
        }
      }, (err, results) => {
        if (err) reject(err);
        this.bollettini = results;
        resolve();
      });
    });

    // console.log(pdfConf);
    // console.log('param1 bollettino', this.param1);
    // console.log('param2', this.param2);
    // console.log('param3', this.param3);
    // console.log('this', this);
    //
    // const pdfConf = {
    //   baseFile: 'bbianco.png',
    //   topLeft: 'fastweb_left_top.png',
    //   bottomLeft: 'fastweb_left_bottom.png',

    //   lisCode: ``, // '415809999900456680200020170007600263343902006091',
    //   lisCodeText: '(415)8099999004566(802)0002017000760026334(3902)006091',
    //   lisCodiceEmittente: '8099999004566',
    //   lisCodiceConto: '0002017000760026334',
    //   lisImporto: '60,91',
    //   nomeDebitore: 'Schiro Monica',
    //   residenzaRigaUno: 'L.go Olgiata 19',
    //   residenzaRigaDue: 'Roma 00100 rm',
    //   nomeCreditore: 'FASTWEB S.P.A.',
    //   contoCorrenteCreditore: '1424455',
    //   importoBollettino: '60,91',
    //   codiceclienteOCR: '170000000760026335',
    //   importoOCR: '00000060+91',
    //   contocorrenteOCR: '000014244255',
    //   tipoOCR: '896',
    //   barcodeCode: '18170000000760026335120000142442551000000060913896'
    // };
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  getForm() {
    return `
    <div>
      ${this.bollettini.map((c) => {
        if (c) {
          return `<a class="btn btn-success" target="_new" href="/callback/bollettino_pdf?id=${c.id}">${c.name}</a>`;
        }
        return '';
      }).join('<br/>')}
    </div>
    `;
  }
}
