import baseMethod from './basemethod';
import barcode from 'barcode';
import JsBarcode from 'jsbarcode';
import Canvas from 'canvas';
import fs from 'fs';
import temp from 'temp';
import childProcess from 'child_process';
import async from 'async';
import moment from 'moment';

export default class lisMethod extends baseMethod {

  static getCallBackUrls() {
    return [
      {
        url: 'fastweblottomatica_pdf',
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
                      ctx.drawImage(tmpImg, 0, 20);
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
                if (pdfConf.lisCode) {
                  const newCanvas = Canvas.createCanvas();
                  JsBarcode(newCanvas, pdfConf.lisCode, {
                    width: 3,
                    height: 100,
                    margin: 0,
                    fontSize: 25,
                    text: pdfConf.lisCodeText
                  });
                  const tmpImg = new Canvas.Image;
                  tmpImg.src = newCanvas.toBuffer();
                  // 3502 : 2600 = IMH : x
                  const h = getRealH(325);
                  const w = (((IMW/2) - tmpImg.width) / 2) - 100;
                  ctx.drawImage(tmpImg, w, h);
                  if (pdfConf.lisCodiceEmittente) {
                    ctx.font = `${getRealH(38)}px Arial`;
                    ctx.fillText(pdfConf.lisCodiceEmittente, getRealW(350), getRealH(520));
                  }
                  if (pdfConf.lisCodiceConto) {
                    ctx.font = `${getRealH(38)}px Arial`;
                    ctx.fillText(pdfConf.lisCodiceConto, getRealW(350), getRealH(570));
                  }
                  if (pdfConf.lisImporto) {
                    ctx.font = `${getRealH(38)}px Arial`;
                    ctx.fillText(pdfConf.lisImporto, getRealW(350), getRealH(620));
                  }
                  return Promise.resolve();
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
      const importoAsText = fattura.ImportoAzionato.toFixed(2);
      pdfConf.importo = importo;
      pdfConf.importoBollettino = importoAsText.replace('.', ',');

      const underscorePosition = fattura.NumFattura.indexOf('_');
      const codiceFattura = fattura.NumFattura.slice((fattura.NumFattura.length - underscorePosition - 1) * -1);
      pdfConf.numeroFattura = codiceFattura;
      const nFattura = codiceFattura.replace( /^\D+/g, '');
      const residenziale = codiceFattura.indexOf('M') > -1;
      if (pdfConf.contocorrenteOCR) {
        if (residenziale) {
          pdfConf.importoOCR = lisMethod.leftPad(importoAsText.replace('.', '+'), 11);
          // 170000000760026335
          const annofattura = (new Date(fattura.datafattura)).getFullYear();
          const tmpCodiceClienteClienteOcr = `${annofattura.toString().slice(-2)}888${lisMethod.leftPad(nFattura.toString(), 11)}`;
          const remainder = parseInt(tmpCodiceClienteClienteOcr, 10) % 93;
          pdfConf.codiceclienteOCR = `${tmpCodiceClienteClienteOcr}${remainder}`;
          //18170000000760026335120000142442551000000060913896
          //18 170000000760026335 12 000014244255 10 0000006091 3 896
          pdfConf.barcodeCode = `18${pdfConf.codiceclienteOCR}12${pdfConf.contocorrenteOCR}10${lisMethod.leftPad(importoAsText.replace('.',''),10)}3896`;
        } else {
          // 00000060+91
          pdfConf.importoOCR = lisMethod.leftPad(importoAsText.replace('.', '+'), 11);
          // 170000000760026335
          const annofattura = (new Date(fattura.datafattura)).getFullYear();
          const tmpCodiceClienteClienteOcr = `${annofattura.toString().slice(-2)}${lisMethod.leftPad(nFattura.toString(), 14)}`;
          const remainder = parseInt(tmpCodiceClienteClienteOcr, 10) % 93;
          pdfConf.codiceclienteOCR = `${tmpCodiceClienteClienteOcr}${remainder}`;
          //18170000000760026335120000142442551000000060913896
          //18 170000000760026335 12 000014244255 10 0000006091 3 896
          pdfConf.barcodeCode = `18${pdfConf.codiceclienteOCR}12${pdfConf.contocorrenteOCR}10${lisMethod.leftPad(importoAsText.replace('.',''),10)}3896`;
        }
      }
      if (pdfConf.lisCodiceEmittente) {

          const annofattura = (new Date(fattura.datafattura)).getFullYear();
          const fatturalunga = lisMethod.leftPad(nFattura, 10);
          const annolungo = lisMethod.leftPad(annofattura.toString(), 6);
          const codiceContoTmp = `${annolungo}${fatturalunga}`;
          const codiceContoAsNumber = parseInt(codiceContoTmp, 10);
          const remainder = codiceContoAsNumber % 93;
          const codiceConto = `${annolungo}${fatturalunga}${remainder}`;
          pdfConf.lisCodiceConto = codiceConto;
          pdfConf.lisImporto = importoAsText.replace('.', ',');
          pdfConf.lisCode = `415${pdfConf.lisCodiceEmittente}8020${codiceConto}3902${lisMethod.leftPad(importoAsText.replace('.', ''), 6)}`;
          pdfConf.lisCodeText = `(415)${pdfConf.lisCodiceEmittente}(8020)${codiceConto}(3902)${lisMethod.leftPad(importoAsText.replace('.', ''), 6)}`;
          if (pdfConf.lisCodeFields && pdfConf.lisCodeFields.length > 0) {
            pdfConf.lisCodeText = pdfConf.lisCodeFields.map((f) => fattura[f]).join('');
            pdfConf.lisCode = pdfConf.lisCodeText.replace(/\(/g, '').replace(/\)/g,'');
            const parts = /(\(415\))([0-9]*)(\(8020\))([0-9]*)(\(3902\))([0-9]*)/.exec(pdfConf.lisCodeText);
            if (parts && parts.length) {
              pdfConf.lisCodiceEmittente = parts[2];
              pdfConf.lisCodiceConto = parts[4];
              pdfConf.lisImporto = (parseInt(parts[6], 10) / 100).toString().replace('.', ',');
            }
            // console.log('Parts', parts);
          }

      }
      pdfConf.causaleRigaUno = `N. FATTURA: ${nFattura}`;
      pdfConf.causaleRigaDue = `DATA FATTURA: ${moment(fattura.datafattura).format('DD/MM/YYYY')}`;
      // pdfConf.causaleRigaTre = 'Prova 3';
      // pdfConf.causaleRigaQuattro = 'Prova 4';
      return pdfConf;
    });
    // console.log('configurations', configurations.length);
    return new Promise((resolve, reject) => {
      async.mapSeries(configurations, (pdfConf, cb) => {
        // console.log('pdfConf', pdfConf);
        if (pdfConf.importo > 0) {
          const sql = `INSERT into onlinePaymentTransactions (module, fullConfig, paymentId, idContratto) VALUES (
            ${this.db.escape('bollettino')},
            ${this.db.escape(JSON.stringify(pdfConf))},
            ${this.db.escape(this.paymentId)},
            ${this.db.escape(this.idContratto)}
          )`;
          // console.log('sql', sql);
          this.db.query(sql)
          .then(
            (result) => {
              cb(null, {id: result.insertId, name: pdfConf.type !== 'lis' ? `Mostra bollettino per la fattura ${pdfConf.numeroFattura}` : `Mostra codice LIS per la fattura ${pdfConf.numeroFattura}` });
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
          return `<a class="btn btn-success" target="_new" href="/callback/fastweblottomatica_pdf?id=${c.id}">${c.name}</a>`;
        } else {
          return '';
        }
      }).join('<br/>')}
    </div>
    `;
  }
}
