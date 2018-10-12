'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _basemethod = require('./basemethod');

var _basemethod2 = _interopRequireDefault(_basemethod);

var _barcode = require('barcode');

var _barcode2 = _interopRequireDefault(_barcode);

var _jsbarcode = require('jsbarcode');

var _jsbarcode2 = _interopRequireDefault(_jsbarcode);

var _canvas = require('canvas');

var _canvas2 = _interopRequireDefault(_canvas);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _temp = require('temp');

var _temp2 = _interopRequireDefault(_temp);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var bollettinoMethod = function (_baseMethod) {
  _inherits(bollettinoMethod, _baseMethod);

  function bollettinoMethod() {
    _classCallCheck(this, bollettinoMethod);

    return _possibleConstructorReturn(this, (bollettinoMethod.__proto__ || Object.getPrototypeOf(bollettinoMethod)).apply(this, arguments));
  }

  _createClass(bollettinoMethod, [{
    key: 'getIntro',
    value: function getIntro() {
      return this.description;
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      return this.title;
    }
  }, {
    key: 'getReady',
    value: function getReady(req) {
      var _this2 = this;

      var _session = this.session,
          dbRecord = _session.dbRecord,
          fullDbRecords = _session.fullDbRecords;

      /*
      console.log('fullDbRecords', fullDbRecords.fatture);
      */

      var mainConf = {};
      if (this.param1 && this.param1.length && typeof this.param1 === 'string' && this.param1[0] === '{') {
        Object.assign(mainConf, JSON.parse(this.param1));
      }
      var anagrafica = fullDbRecords.anagrafica;
      mainConf.nomeDebitore = anagrafica.Debitore;
      mainConf.residenzaRigaUno = anagrafica.Indirizzo;
      mainConf.residenzaRigaDue = (anagrafica.CAP ? anagrafica.CAP : '') + ' ' + anagrafica.Citta;
      mainConf.tipoOCR = '896';

      var configurations = fullDbRecords.fatture.map(function (fattura, pos) {
        var pdfConf = Object.assign({}, mainConf);
        var importo = fattura.ImportoAzionato;
        pdfConf.importo = fattura.ImportoAzionato;
        var importoAsText = fattura.ImportoAzionato.toFixed(2);
        pdfConf.importoBollettino = importoAsText.replace('.', ',');

        var underscorePosition = fattura.NumFattura.indexOf('_');
        var codiceFattura = fattura.NumFattura.slice((fattura.NumFattura.length - underscorePosition - 1) * -1);
        pdfConf.numeroFattura = codiceFattura;
        var nFattura = codiceFattura.replace(/^\D+/g, '');
        var residenziale = codiceFattura.indexOf('M') > -1;
        if (pdfConf.contocorrenteOCR) {
          if (residenziale) {
            pdfConf.importoOCR = bollettinoMethod.leftPad(importoAsText.replace('.', '+'), 11);
            // 170000000760026335
            var annofattura = new Date(fattura.datafattura).getFullYear();
            var tmpCodiceClienteClienteOcr = annofattura.toString().slice(-2) + '000' + bollettinoMethod.leftPad(nFattura.toString(), 11);
            var remainder = parseInt(tmpCodiceClienteClienteOcr, 10) % 93;
            pdfConf.codiceclienteOCR = '' + tmpCodiceClienteClienteOcr + remainder;
            //18170000000760026335120000142442551000000060913896
            //18 170000000760026335 12 000014244255 10 0000006091 3 896
            pdfConf.barcodeCode = '18' + pdfConf.codiceclienteOCR + '12' + pdfConf.contocorrenteOCR + '10' + bollettinoMethod.leftPad(importoAsText.replace('.', ''), 10) + '3896';
          } else {
            // 00000060+91
            pdfConf.importoOCR = bollettinoMethod.leftPad(importoAsText.replace('.', '+'), 11);
            // 170000000760026335
            var _annofattura = new Date(fattura.datafattura).getFullYear();
            var _tmpCodiceClienteClienteOcr = _annofattura.toString().slice(-2) + '000' + bollettinoMethod.leftPad(nFattura.toString(), 14);
            var _remainder = parseInt(_tmpCodiceClienteClienteOcr, 10) % 93;
            pdfConf.codiceclienteOCR = '' + _tmpCodiceClienteClienteOcr + _remainder;
            //18170000000760026335120000142442551000000060913896
            //18 170000000760026335 12 000014244255 10 0000006091 3 896
            pdfConf.barcodeCode = '18' + pdfConf.codiceclienteOCR + '12' + pdfConf.contocorrenteOCR + '10' + bollettinoMethod.leftPad(importoAsText.replace('.', ''), 10) + '3896';
          }
        }
        if (pdfConf.lisCodiceEmittente) {
          if (residenziale) {
            var _annofattura2 = new Date(fattura.datafattura).getFullYear();
            var fatturalunga = bollettinoMethod.leftPad(nFattura, 10);
            var annolungo = bollettinoMethod.leftPad(_annofattura2.toString(), 6);
            var codiceContoTmp = '' + annolungo + fatturalunga;
            var codiceContoAsNumber = parseInt(codiceContoTmp, 10);
            var _remainder2 = codiceContoAsNumber % 93;
            var codiceConto = '' + annolungo + fatturalunga + _remainder2;
            pdfConf.lisCodiceConto = codiceConto;
            pdfConf.lisImporto = importoAsText.replace('.', ',');
            pdfConf.lisCode = '415' + pdfConf.lisCodiceEmittente + '8020' + codiceConto + '3902' + bollettinoMethod.leftPad(importoAsText.replace('.', ''), 6);
            pdfConf.lisCodeText = '(415)' + pdfConf.lisCodiceEmittente + '(8020)' + codiceConto + '(3902)' + bollettinoMethod.leftPad(importoAsText.replace('.', ''), 6);
          } else {
            var _annofattura3 = new Date(fattura.datafattura).getFullYear();
            var _fatturalunga = bollettinoMethod.leftPad(nFattura, 10);
            var _annolungo = bollettinoMethod.leftPad(_annofattura3.toString(), 6);
            var _codiceContoTmp = '' + _annolungo + _fatturalunga;
            var _codiceContoAsNumber = parseInt(_codiceContoTmp, 10);
            var _remainder3 = _codiceContoAsNumber % 93;
            var _codiceConto = '' + _annolungo + _fatturalunga + _remainder3;
            pdfConf.lisCodiceConto = _codiceConto;
            pdfConf.lisImporto = importoAsText.replace('.', ',');
            pdfConf.lisCode = '415' + pdfConf.lisCodiceEmittente + '8020' + _codiceConto + '3902' + bollettinoMethod.leftPad(importoAsText.replace('.', ''), 6);
            pdfConf.lisCodeText = '(415)' + pdfConf.lisCodiceEmittente + '(8020)' + _codiceConto + '(3902)' + bollettinoMethod.leftPad(importoAsText.replace('.', ''), 6);
          }
        }
        pdfConf.causaleRigaUno = 'N. FATTURA: ' + nFattura;
        pdfConf.causaleRigaDue = 'DATA FATTURA: ' + (0, _moment2.default)(fattura.datafattura).format('DD/MM/YYYY');
        // pdfConf.causaleRigaTre = 'Prova 3';
        // pdfConf.causaleRigaQuattro = 'Prova 4';
        pdfConf.idContratto = _this2.idContratto;
        pdfConf.paymentId = _this2.paymentId;
        return pdfConf;
      });
      return new Promise(function (resolve, reject) {
        _async2.default.mapSeries(configurations, function (pdfConf, cb) {
          if (pdfConf.importo > 0) {
            var sql = 'INSERT into onlinePaymentTransactions (module, fullConfig, paymentId, idContratto) VALUES (\n            ' + _this2.db.escape('bollettino') + ',\n            ' + _this2.db.escape(JSON.stringify(pdfConf)) + ',\n            ' + _this2.db.escape(_this2.paymentId) + ',\n            ' + _this2.db.escape(_this2.idContratto) + '\n          )';
            // console.log(`${pdfConf.title} ${pdfConf.numeroFattura}`);
            _this2.db.query(sql).then(function (result) {
              cb(null, { id: result.insertId, name: pdfConf.title + ' ' + pdfConf.numeroFattura });
            }, function (e) {
              cb(e);
            });
          } else {
            cb(null, null);
          }
        }, function (err, results) {
          if (err) reject(err);
          _this2.bollettini = results;
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
      return new Promise(function (resolve, reject) {
        resolve();
      });
    }
  }, {
    key: 'getForm',
    value: function getForm() {
      return '\n    <div>\n      ' + this.bollettini.map(function (c) {
        if (c) {
          return '<a class="btn btn-success" target="_new" href="/callback/bollettino_pdf?id=' + c.id + '">' + c.name + '</a>';
        }
        return '';
      }).join('<br/>') + '\n    </div>\n    ';
    }
  }], [{
    key: 'getCallBackUrls',
    value: function getCallBackUrls() {
      return [{
        url: 'bollettino_pdf',
        method: 'createPdf',
        httpMethod: 'get'
      }];
    }
  }, {
    key: 'createPdf',
    value: function createPdf(req, res, next) {
      var session = req.session;

      var db = req.dbConnection;
      var params = req.query;

      var _ref = params || {},
          id = _ref.id;

      db.query('SELECT * FROM onlinePaymentTransactions WHERE id = ' + db.escape(id)).then(function (results) {
        if (results && results.length === 1) {
          var record = results[0];
          // console.log('Record', record);
          var pdfConf = JSON.parse(record.fullconfig);
          _canvas2.default.registerFont('./src/paymentmethods/fonts/Inconsolata-Regular.ttf', { family: 'Inconsolata' });
          _canvas2.default.registerFont('./src/paymentmethods/fonts/OCRAEXT.TTF', { family: 'OcrA' });
          _canvas2.default.registerFont('./src/paymentmethods/fonts/ocrb.ttf', { family: 'OcrB' });

          _fs2.default.readFile('./src/paymentmethods/' + pdfConf.baseFile, function (err, baseFile) {
            if (err) throw err;
            var oneDeg = Math.PI / 180;
            var img = new _canvas2.default.Image();
            img.src = baseFile;
            var IMW = img.width;
            var IMH = img.height;
            var getRealH = function getRealH(h) {
              return IMH * h / 3502;
            };
            var getRealW = function getRealW(w) {
              return IMW * w / 2432;
            };
            // const Inconsolata = new Canvas.Font('Inconsolata', `./src/paymentmethods/Inconsolata-Regular.ttf`);
            // Inconsolata.addFace(`./src/paymentmethods/Inconsolata-Regular.ttf`, 'normal');
            var canvas = _canvas2.default.createCanvas(IMW, IMH, 'pdf');
            var ctx = canvas.getContext('2d');
            // ctx.addFont(Inconsolata);
            ctx.drawImage(img, 0, 0);

            new Promise(function (resolve, reject) {
              if (pdfConf.topLeft) {
                _fs2.default.readFile('./src/paymentmethods/' + pdfConf.topLeft, function (err, topLeft) {
                  var tmpImg = new _canvas2.default.Image();
                  tmpImg.src = topLeft;
                  ctx.drawImage(tmpImg, (IMW / 2 - tmpImg.width) / 2, 0);
                  resolve();
                });
              } else {
                resolve();
              }
            }).then( // Immagine bottom left
            function () {
              if (pdfConf.bottomLeft) {
                return new Promise(function (resolve) {
                  _fs2.default.readFile('./src/paymentmethods/' + pdfConf.bottomLeft, function (err, bottomLeft) {
                    var tmpImg = new _canvas2.default.Image();
                    tmpImg.src = bottomLeft;
                    ctx.drawImage(tmpImg, (IMW / 2 - tmpImg.width) / 2, IMH - tmpImg.height);
                    resolve();
                  });
                });
              } else {
                return Promise.resolve();
              }
            }, function (e) {
              return Promise.reject(e);
            }).then( // Immagine lis code
            function () {
              if (pdfConf.lisCode && pdfConf.enableLis) {
                var newCanvas = _canvas2.default.createCanvas();
                (0, _jsbarcode2.default)(newCanvas, pdfConf.lisCode, {
                  width: 3,
                  height: 130,
                  margin: 0,
                  fontSize: 30,
                  text: pdfConf.lisCodeText
                });
                var tmpImg = new _canvas2.default.Image();
                tmpImg.src = newCanvas.toBuffer();
                // 3502 : 2600 = IMH : x
                var h = getRealH(2570);
                var w = (IMW / 2 - tmpImg.width) / 2;
                ctx.drawImage(tmpImg, w, h);
                if (pdfConf.lisCodiceEmittente) {
                  ctx.font = getRealH(41) + 'px Arial';
                  ctx.fillText(pdfConf.lisCodiceEmittente, getRealW(398), getRealH(2795));
                }
                if (pdfConf.lisCodiceConto) {
                  ctx.font = getRealH(41) + 'px Arial';
                  ctx.fillText(pdfConf.lisCodiceConto, getRealW(398), getRealH(2858));
                }
                if (pdfConf.lisImporto) {
                  ctx.font = getRealH(41) + 'px Arial';
                  ctx.fillText(pdfConf.lisImporto, getRealW(398), getRealH(2918));
                }
                return Promise.resolve();
              } else {
                return Promise.resolve();
              }
            }, function (e) {
              return Promise.reject(e);
            }).then( // Nome debitore
            function () {
              if (pdfConf.nomeDebitore && pdfConf.enablePoste) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealW(35) + 'px Arial';
                ctx.translate(getRealW(-3200), getRealH(1686));
                ctx.fillText(pdfConf.nomeDebitore, 0, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
              return Promise.resolve();
            }, function (e) {
              return Promise.reject(e);
            }).then( // Indirizzo debitore
            function () {
              if (pdfConf.residenzaRigaUno && pdfConf.enablePoste) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(35) + 'px Arial';
                ctx.translate(getRealW(-3200), getRealH(1725));
                ctx.fillText(pdfConf.residenzaRigaUno, 0, 0);
                if (pdfConf.residenzaRigaDue) {
                  ctx.fillText(pdfConf.residenzaRigaDue, 0, getRealH(35 + 35 / 3));
                }
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
              return Promise.resolve();
            }, function (e) {
              return Promise.reject(e);
            }).then( // Nome debitore 2
            function () {
              if (pdfConf.nomeDebitore && pdfConf.enablePoste) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealW(35) + 'px Arial';
                ctx.translate(getRealW(-1023), getRealH(1686));
                ctx.fillText(pdfConf.nomeDebitore, 0, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
              return Promise.resolve();
            }, function (e) {
              return Promise.reject(e);
            }).then( // Indirizzo debitore 2
            function () {
              if (pdfConf.residenzaRigaUno && pdfConf.enablePoste) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(35) + 'px Arial';
                ctx.translate(getRealW(-1023), getRealH(1725));
                ctx.fillText(pdfConf.residenzaRigaUno, 0, 0);
                if (pdfConf.residenzaRigaDue) {
                  ctx.fillText(pdfConf.residenzaRigaDue, 0, getRealH(35 + 35 / 3));
                }
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
              return Promise.resolve();
            }, function (e) {
              return Promise.reject(e);
            }).then( // Indirizzo debitore 2
            function () {
              if (pdfConf.residenzaRigaUno && pdfConf.enablePoste) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(35) + 'px Arial';
                ctx.translate(getRealW(-1023), getRealH(1725));
                ctx.fillText(pdfConf.residenzaRigaUno, 0, 0);
                if (pdfConf.residenzaRigaDue) {
                  ctx.fillText(pdfConf.residenzaRigaDue, 0, getRealH(35 + 35 / 3));
                }
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
              return Promise.resolve();
            }, function (e) {
              return Promise.reject(e);
            }).then( // Causale
            function () {
              if (pdfConf.causaleRigaUno && pdfConf.enablePoste) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(30) + 'px Arial';
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
            }, function (e) {
              return Promise.reject(e);
            }).then( // Causale 2
            function () {
              if (pdfConf.causaleRigaUno && pdfConf.enablePoste) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(30) + 'px Arial';
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
            }, function (e) {
              return Promise.reject(e);
            }).then( // Nome creditore
            function () {
              if (pdfConf.nomeCreditore && pdfConf.enablePoste) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(35) + 'px Dejavu Sans';
                ctx.translate(getRealW(-3380), getRealH(1550));
                ctx.fillText(pdfConf.nomeCreditore, 0, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(35) + 'px Dejavu Sans';
                ctx.translate(getRealW(-1855), getRealH(1550));
                ctx.fillText(pdfConf.nomeCreditore, 0, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
              return Promise.resolve();
            }, function (e) {
              return Promise.reject(e);
            }).then( // C/C Creditore
            function () {
              if (pdfConf.contoCorrenteCreditore && pdfConf.enablePoste) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(35) + 'px Dejavu Sans';
                ctx.translate(getRealW(-2884), getRealH(1389));
                ctx.fillText(pdfConf.contoCorrenteCreditore, 0, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(35) + 'px Dejavu Sans';
                ctx.translate(getRealW(-1568), getRealH(1381));
                ctx.fillText(pdfConf.contoCorrenteCreditore, 0, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
              return Promise.resolve();
            }, function (e) {
              return Promise.reject(e);
            }).then( // importo Bollettino
            function () {
              if (pdfConf.importoBollettino && pdfConf.enablePoste) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(35) + 'px Dejavu Sans';
                ctx.translate(getRealW(-2400), getRealH(1375));
                ctx.fillText(pdfConf.importoBollettino, 0, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(35) + 'px Dejavu Sans';
                ctx.translate(getRealW(-628), getRealH(1394));
                ctx.fillText(pdfConf.importoBollettino, 0, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
              return Promise.resolve();
            }, function (e) {
              return Promise.reject(e);
            }).then( // importoOCR + contocorrenteOCR + tipoOCR
            function () {
              if (pdfConf.codiceclienteOCR && pdfConf.enablePoste) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(46) + 'px OcrB';
                ctx.translate(getRealW(-1800), getRealH(2366));
                ctx.fillText('<' + pdfConf.codiceclienteOCR + '>     ' + pdfConf.importoOCR + '>  ' + pdfConf.contocorrenteOCR + '<  896>', 0, 0);
                // ctx.translate(getRealW(-1815), getRealH(2391));
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(46) + 'px OcrB';
                ctx.translate(getRealW(-1800), getRealH(1686));
                ctx.fillText('' + pdfConf.codiceclienteOCR, 0, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0);

                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.rotate(-90 * oneDeg);
                ctx.font = getRealH(46) + 'px OcrB';
                ctx.translate(getRealW(-1787), getRealH(1470));
                ctx.fillText('896', 0, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
              return Promise.resolve();
            }, function (e) {
              return Promise.reject(e);
            }).then( // Immagine barcode orizzontale
            function () {
              if (pdfConf.barcodeCode && pdfConf.enablePoste) {
                var newCanvas = _canvas2.default.createCanvas();
                (0, _jsbarcode2.default)(newCanvas, pdfConf.barcodeCode, {
                  width: 3,
                  height: 130,
                  margin: 0,
                  fontSize: 30,
                  text: pdfConf.barcodeCode
                });
                var tmpImg = new _canvas2.default.Image();
                tmpImg.src = newCanvas.toBuffer();
                ctx.rotate(-90 * oneDeg);
                ctx.translate(getRealW(-150 - tmpImg.width), getRealH(1880));
                ctx.drawImage(tmpImg, 0, 100);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                return Promise.resolve();
              } else {
                return Promise.resolve();
              }
            }, function (e) {
              return Promise.reject(e);
            }).then( // Immagine data matrix
            function () {
              if (pdfConf.barcodeCode && pdfConf.enablePoste) {
                return new Promise(function (resolve) {
                  _temp2.default.open('myprefix', function (err, newfile) {
                    if (!err) {
                      _fs2.default.write(newfile.fd, pdfConf.barcodeCode);
                      _fs2.default.close(newfile.fd, function () {
                        var cmd = '/bin/dmtxwrite ' + newfile.path + ' -s 16x48 -d 11 -m 1 -o ' + newfile.path + '.png';
                        _child_process2.default.exec('' + cmd, function (xErr) {
                          if (xErr) {
                            console.error(xErr);
                            resolve();
                          } else {
                            _fs2.default.readFile(newfile.path + '.png', function (err, newFileContent) {
                              var tmpImg = new _canvas2.default.Image();
                              tmpImg.src = newFileContent;
                              ctx.rotate(-90 * oneDeg);
                              ctx.translate(getRealW(-2533), getRealH(2238));
                              ctx.drawImage(tmpImg, 0, 0);
                              ctx.setTransform(1, 0, 0, 1, 0, 0);
                              _fs2.default.unlink(newfile.name + '.png', function () {
                                _fs2.default.unlink('' + newfile.name, function () {
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
                });
              } else {
                return Promise.resolve();
              }
            }, function (e) {
              return Promise.reject(e);
            }).then(function () {
              canvas.pdfStream().pipe(res);
            }, function (e) {
              return Promise.reject(e);
            });
          });
        } else {
          next(404);
        }
      }, function (e) {
        return Promise.reject(e);
      });
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
  }]);

  return bollettinoMethod;
}(_basemethod2.default);

exports.default = bollettinoMethod;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXltZW50bWV0aG9kcy9ib2xsZXR0aW5vLmpzIl0sIm5hbWVzIjpbImJvbGxldHRpbm9NZXRob2QiLCJkZXNjcmlwdGlvbiIsInRpdGxlIiwicmVxIiwic2Vzc2lvbiIsImRiUmVjb3JkIiwiZnVsbERiUmVjb3JkcyIsIm1haW5Db25mIiwicGFyYW0xIiwibGVuZ3RoIiwiT2JqZWN0IiwiYXNzaWduIiwiSlNPTiIsInBhcnNlIiwiYW5hZ3JhZmljYSIsIm5vbWVEZWJpdG9yZSIsIkRlYml0b3JlIiwicmVzaWRlbnphUmlnYVVubyIsIkluZGlyaXp6byIsInJlc2lkZW56YVJpZ2FEdWUiLCJDQVAiLCJDaXR0YSIsInRpcG9PQ1IiLCJjb25maWd1cmF0aW9ucyIsImZhdHR1cmUiLCJtYXAiLCJmYXR0dXJhIiwicG9zIiwicGRmQ29uZiIsImltcG9ydG8iLCJJbXBvcnRvQXppb25hdG8iLCJpbXBvcnRvQXNUZXh0IiwidG9GaXhlZCIsImltcG9ydG9Cb2xsZXR0aW5vIiwicmVwbGFjZSIsInVuZGVyc2NvcmVQb3NpdGlvbiIsIk51bUZhdHR1cmEiLCJpbmRleE9mIiwiY29kaWNlRmF0dHVyYSIsInNsaWNlIiwibnVtZXJvRmF0dHVyYSIsIm5GYXR0dXJhIiwicmVzaWRlbnppYWxlIiwiY29udG9jb3JyZW50ZU9DUiIsImltcG9ydG9PQ1IiLCJsZWZ0UGFkIiwiYW5ub2ZhdHR1cmEiLCJEYXRlIiwiZGF0YWZhdHR1cmEiLCJnZXRGdWxsWWVhciIsInRtcENvZGljZUNsaWVudGVDbGllbnRlT2NyIiwidG9TdHJpbmciLCJyZW1haW5kZXIiLCJwYXJzZUludCIsImNvZGljZWNsaWVudGVPQ1IiLCJiYXJjb2RlQ29kZSIsImxpc0NvZGljZUVtaXR0ZW50ZSIsImZhdHR1cmFsdW5nYSIsImFubm9sdW5nbyIsImNvZGljZUNvbnRvVG1wIiwiY29kaWNlQ29udG9Bc051bWJlciIsImNvZGljZUNvbnRvIiwibGlzQ29kaWNlQ29udG8iLCJsaXNJbXBvcnRvIiwibGlzQ29kZSIsImxpc0NvZGVUZXh0IiwiY2F1c2FsZVJpZ2FVbm8iLCJjYXVzYWxlUmlnYUR1ZSIsImZvcm1hdCIsImlkQ29udHJhdHRvIiwicGF5bWVudElkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJtYXBTZXJpZXMiLCJjYiIsInNxbCIsImRiIiwiZXNjYXBlIiwic3RyaW5naWZ5IiwicXVlcnkiLCJ0aGVuIiwicmVzdWx0IiwiaWQiLCJpbnNlcnRJZCIsIm5hbWUiLCJlIiwiZXJyIiwicmVzdWx0cyIsImJvbGxldHRpbmkiLCJjIiwiam9pbiIsInVybCIsIm1ldGhvZCIsImh0dHBNZXRob2QiLCJyZXMiLCJuZXh0IiwiZGJDb25uZWN0aW9uIiwicGFyYW1zIiwicmVjb3JkIiwiZnVsbGNvbmZpZyIsInJlZ2lzdGVyRm9udCIsImZhbWlseSIsInJlYWRGaWxlIiwiYmFzZUZpbGUiLCJvbmVEZWciLCJNYXRoIiwiUEkiLCJpbWciLCJJbWFnZSIsInNyYyIsIklNVyIsIndpZHRoIiwiSU1IIiwiaGVpZ2h0IiwiZ2V0UmVhbEgiLCJoIiwiZ2V0UmVhbFciLCJ3IiwiY2FudmFzIiwiY3JlYXRlQ2FudmFzIiwiY3R4IiwiZ2V0Q29udGV4dCIsImRyYXdJbWFnZSIsInRvcExlZnQiLCJ0bXBJbWciLCJib3R0b21MZWZ0IiwiZW5hYmxlTGlzIiwibmV3Q2FudmFzIiwibWFyZ2luIiwiZm9udFNpemUiLCJ0ZXh0IiwidG9CdWZmZXIiLCJmb250IiwiZmlsbFRleHQiLCJlbmFibGVQb3N0ZSIsInNldFRyYW5zZm9ybSIsInJvdGF0ZSIsInRyYW5zbGF0ZSIsImNhdXNhbGVSaWdhVHJlIiwiY2F1c2FsZVJpZ2FRdWF0dHJvIiwibm9tZUNyZWRpdG9yZSIsImNvbnRvQ29ycmVudGVDcmVkaXRvcmUiLCJvcGVuIiwibmV3ZmlsZSIsIndyaXRlIiwiZmQiLCJjbG9zZSIsImNtZCIsInBhdGgiLCJleGVjIiwieEVyciIsImNvbnNvbGUiLCJlcnJvciIsIm5ld0ZpbGVDb250ZW50IiwidW5s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eFhELE1Bd1hPO0FBQ0xVLGVBQUssR0FBTDtBQUNEO0FBQ0YsT0E5WEgsRUErWEUsVUFBQ1YsQ0FBRDtBQUFBLGVBQU9mLFFBQVFFLE1BQVIsQ0FBZWEsQ0FBZixDQUFQO0FBQUEsT0EvWEY7QUFpWUo7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlCRzs7Ozs7O2tCQS9ha0J0RixnQiIsImZpbGUiOiJib2xsZXR0aW5vLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGJhc2VNZXRob2QgZnJvbSAnLi9iYXNlbWV0aG9kJztcclxuaW1wb3J0IGJhcmNvZGUgZnJvbSAnYmFyY29kZSc7XHJcbmltcG9ydCBKc0JhcmNvZGUgZnJvbSAnanNiYXJjb2RlJztcclxuaW1wb3J0IENhbnZhcyBmcm9tICdjYW52YXMnO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgdGVtcCBmcm9tICd0ZW1wJztcclxuaW1wb3J0IGNoaWxkUHJvY2VzcyBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuaW1wb3J0IGFzeW5jIGZyb20gJ2FzeW5jJztcclxuaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgYm9sbGV0dGlub01ldGhvZCBleHRlbmRzIGJhc2VNZXRob2Qge1xyXG5cclxuICBzdGF0aWMgZ2V0Q2FsbEJhY2tVcmxzKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAge1xyXG4gICAgICAgIHVybDogJ2JvbGxldHRpbm9fcGRmJyxcclxuICAgICAgICBtZXRob2Q6ICdjcmVhdGVQZGYnLFxyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdnZXQnXHJcbiAgICAgIH1cclxuICAgIF1cclxuICB9XHJcblxyXG4gIHN0YXRpYyBjcmVhdGVQZGYocmVxLCByZXMsIG5leHQpIHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgc2Vzc2lvblxyXG4gICAgfSA9IHJlcTtcclxuICAgIGNvbnN0IGRiID0gcmVxLmRiQ29ubmVjdGlvbjtcclxuICAgIGNvbnN0IHBhcmFtcyA9IHJlcS5xdWVyeTtcclxuICAgIGNvbnN0IHtcclxuICAgICAgaWRcclxuICAgIH0gPSBwYXJhbXMgfHwge307XHJcbiAgICBkYi5xdWVyeShgU0VMRUNUICogRlJPTSBvbmxpbmVQYXltZW50VHJhbnNhY3Rpb25zIFdIRVJFIGlkID0gJHsgZGIuZXNjYXBlKGlkKX1gKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChyZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IHJlY29yZCA9IHJlc3VsdHNbMF07XHJcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnUmVjb3JkJywgcmVjb3JkKTtcclxuICAgICAgICAgIGNvbnN0IHBkZkNvbmYgPSBKU09OLnBhcnNlKHJlY29yZC5mdWxsY29uZmlnKTtcclxuICAgICAgICAgIENhbnZhcy5yZWdpc3RlckZvbnQoYC4vc3JjL3BheW1lbnRtZXRob2RzL2ZvbnRzL0luY29uc29sYXRhLVJlZ3VsYXIudHRmYCwge2ZhbWlseTogJ0luY29uc29sYXRhJ30pO1xyXG4gICAgICAgICAgQ2FudmFzLnJlZ2lzdGVyRm9udChgLi9zcmMvcGF5bWVudG1ldGhvZHMvZm9udHMvT0NSQUVYVC5UVEZgLCB7ZmFtaWx5OiAnT2NyQSd9KTtcclxuICAgICAgICAgIENhbnZhcy5yZWdpc3RlckZvbnQoYC4vc3JjL3BheW1lbnRtZXRob2RzL2ZvbnRzL29jcmIudHRmYCwge2ZhbWlseTogJ09jckInfSk7XHJcblxyXG4gICAgICAgICAgZnMucmVhZEZpbGUoYC4vc3JjL3BheW1lbnRtZXRob2RzLyR7cGRmQ29uZi5iYXNlRmlsZX1gLCAoZXJyLCBiYXNlRmlsZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XHJcbiAgICAgICAgICAgIGNvbnN0IG9uZURlZyA9IE1hdGguUEkgLyAxODA7XHJcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBDYW52YXMuSW1hZ2U7XHJcbiAgICAgICAgICAgIGltZy5zcmMgPSBiYXNlRmlsZTtcclxuICAgICAgICAgICAgY29uc3QgSU1XID0gaW1nLndpZHRoO1xyXG4gICAgICAgICAgICBjb25zdCBJTUggPSBpbWcuaGVpZ2h0O1xyXG4gICAgICAgICAgICBjb25zdCBnZXRSZWFsSCA9IChoKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIElNSCAqIGggLyAzNTAyO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjb25zdCBnZXRSZWFsVyA9ICh3KSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIElNVyAqIHcgLyAyNDMyO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyBjb25zdCBJbmNvbnNvbGF0YSA9IG5ldyBDYW52YXMuRm9udCgnSW5jb25zb2xhdGEnLCBgLi9zcmMvcGF5bWVudG1ldGhvZHMvSW5jb25zb2xhdGEtUmVndWxhci50dGZgKTtcclxuICAgICAgICAgICAgLy8gSW5jb25zb2xhdGEuYWRkRmFjZShgLi9zcmMvcGF5bWVudG1ldGhvZHMvSW5jb25zb2xhdGEtUmVndWxhci50dGZgLCAnbm9ybWFsJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IENhbnZhcy5jcmVhdGVDYW52YXMoSU1XLCBJTUgsICdwZGYnKTtcclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgICAgIC8vIGN0eC5hZGRGb250KEluY29uc29sYXRhKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChwZGZDb25mLnRvcExlZnQpIHtcclxuICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKGAuL3NyYy9wYXltZW50bWV0aG9kcy8ke3BkZkNvbmYudG9wTGVmdH1gLCAoZXJyLCB0b3BMZWZ0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRtcEltZyA9IG5ldyBDYW52YXMuSW1hZ2U7XHJcbiAgICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSB0b3BMZWZ0O1xyXG4gICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKHRtcEltZywgKChJTVcgLyAyKSAtICh0bXBJbWcud2lkdGgpKSAvIDIsIDApO1xyXG4gICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRoZW4oIC8vIEltbWFnaW5lIGJvdHRvbSBsZWZ0XHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuYm90dG9tTGVmdCkge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZShgLi9zcmMvcGF5bWVudG1ldGhvZHMvJHtwZGZDb25mLmJvdHRvbUxlZnR9YCwgKGVyciwgYm90dG9tTGVmdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG1wSW1nID0gbmV3IENhbnZhcy5JbWFnZTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSBib3R0b21MZWZ0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSh0bXBJbWcsICgoSU1XIC8gMikgLSAodG1wSW1nLndpZHRoKSkgLyAyLCBJTUggLSB0bXBJbWcuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gSW1tYWdpbmUgbGlzIGNvZGVcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5saXNDb2RlICYmIHBkZkNvbmYuZW5hYmxlTGlzKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbnZhcyA9IENhbnZhcy5jcmVhdGVDYW52YXMoKTtcclxuICAgICAgICAgICAgICAgICAgSnNCYXJjb2RlKG5ld0NhbnZhcywgcGRmQ29uZi5saXNDb2RlLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDMsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxMzAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAzMCxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBwZGZDb25mLmxpc0NvZGVUZXh0XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCB0bXBJbWcgPSBuZXcgQ2FudmFzLkltYWdlO1xyXG4gICAgICAgICAgICAgICAgICB0bXBJbWcuc3JjID0gbmV3Q2FudmFzLnRvQnVmZmVyKCk7XHJcbiAgICAgICAgICAgICAgICAgIC8vIDM1MDIgOiAyNjAwID0gSU1IIDogeFxyXG4gICAgICAgICAgICAgICAgICBjb25zdCBoID0gZ2V0UmVhbEgoMjU3MCk7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHcgPSAoKElNVyAvIDIpIC0gdG1wSW1nLndpZHRoKSAvIDI7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodG1wSW1nLCB3LCBoKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYubGlzQ29kaWNlRW1pdHRlbnRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCg0MSl9cHggQXJpYWxgO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmxpc0NvZGljZUVtaXR0ZW50ZSwgZ2V0UmVhbFcoMzk4KSwgZ2V0UmVhbEgoMjc5NSkpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLmxpc0NvZGljZUNvbnRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCg0MSl9cHggQXJpYWxgO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmxpc0NvZGljZUNvbnRvLCBnZXRSZWFsVygzOTgpLCBnZXRSZWFsSCgyODU4KSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYubGlzSW1wb3J0bykge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoNDEpfXB4IEFyaWFsYDtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5saXNJbXBvcnRvLCBnZXRSZWFsVygzOTgpLCBnZXRSZWFsSCgyOTE4KSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oIC8vIE5vbWUgZGViaXRvcmVcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5ub21lRGViaXRvcmUgJiYgcGRmQ29uZi5lbmFibGVQb3N0ZSkge1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbFcoMzUpfXB4IEFyaWFsYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMzIwMCksIGdldFJlYWxIKDE2ODYpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYubm9tZURlYml0b3JlLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC50aGVuKCAvLyBJbmRpcml6em8gZGViaXRvcmVcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5yZXNpZGVuemFSaWdhVW5vICYmIHBkZkNvbmYuZW5hYmxlUG9zdGUpIHtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDM1KX1weCBBcmlhbGA7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTMyMDApLCBnZXRSZWFsSCgxNzI1KSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLnJlc2lkZW56YVJpZ2FVbm8sIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5yZXNpZGVuemFSaWdhRHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYucmVzaWRlbnphUmlnYUR1ZSwgMCwgZ2V0UmVhbEgoMzUgKyAzNS8zKSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC50aGVuKCAvLyBOb21lIGRlYml0b3JlIDJcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5ub21lRGViaXRvcmUgJiYgcGRmQ29uZi5lbmFibGVQb3N0ZSkge1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbFcoMzUpfXB4IEFyaWFsYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTAyMyksIGdldFJlYWxIKDE2ODYpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYubm9tZURlYml0b3JlLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC50aGVuKCAvLyBJbmRpcml6em8gZGViaXRvcmUgMlxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLnJlc2lkZW56YVJpZ2FVbm8gJiYgcGRmQ29uZi5lbmFibGVQb3N0ZSkge1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoMzUpfXB4IEFyaWFsYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTAyMyksIGdldFJlYWxIKDE3MjUpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYucmVzaWRlbnphUmlnYVVubywgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLnJlc2lkZW56YVJpZ2FEdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5yZXNpZGVuemFSaWdhRHVlLCAwLCBnZXRSZWFsSCgzNSArIDM1LzMpKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oIC8vIEluZGlyaXp6byBkZWJpdG9yZSAyXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYucmVzaWRlbnphUmlnYVVubyAmJiBwZGZDb25mLmVuYWJsZVBvc3RlKSB7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoLTkwICogb25lRGVnKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCgzNSl9cHggQXJpYWxgO1xyXG4gICAgICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKGdldFJlYWxXKC0xMDIzKSwgZ2V0UmVhbEgoMTcyNSkpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5yZXNpZGVuemFSaWdhVW5vLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYucmVzaWRlbnphUmlnYUR1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLnJlc2lkZW56YVJpZ2FEdWUsIDAsIGdldFJlYWxIKDM1ICsgMzUvMykpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gQ2F1c2FsZVxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLmNhdXNhbGVSaWdhVW5vICYmIHBkZkNvbmYuZW5hYmxlUG9zdGUpIHtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDMwKX1weCBBcmlhbGA7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTMzODMpLCBnZXRSZWFsSCgxOTAwKSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmNhdXNhbGVSaWdhVW5vLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuY2F1c2FsZVJpZ2FEdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5jYXVzYWxlUmlnYUR1ZSwgMCwgZ2V0UmVhbEgoMzApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5jYXVzYWxlUmlnYVRyZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmNhdXNhbGVSaWdhVHJlLCAwLCBnZXRSZWFsSCgzMCArIDMwKSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuY2F1c2FsZVJpZ2FRdWF0dHJvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYuY2F1c2FsZVJpZ2FRdWF0dHJvLCAwLCBnZXRSZWFsSCgzMCArIDMwICsgMzApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oIC8vIENhdXNhbGUgMlxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLmNhdXNhbGVSaWdhVW5vICYmIHBkZkNvbmYuZW5hYmxlUG9zdGUpIHtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDMwKX1weCBBcmlhbGA7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTE4NTUpLCBnZXRSZWFsSCgxOTAwKSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmNhdXNhbGVSaWdhVW5vLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuY2F1c2FsZVJpZ2FEdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5jYXVzYWxlUmlnYUR1ZSwgMCwgZ2V0UmVhbEgoMzApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5jYXVzYWxlUmlnYVRyZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmNhdXNhbGVSaWdhVHJlLCAwLCBnZXRSZWFsSCgzMCArIDMwKSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuY2F1c2FsZVJpZ2FRdWF0dHJvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYuY2F1c2FsZVJpZ2FRdWF0dHJvLCAwLCBnZXRSZWFsSCgzMCArIDMwICsgMzApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oIC8vIE5vbWUgY3JlZGl0b3JlXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYubm9tZUNyZWRpdG9yZSAmJiBwZGZDb25mLmVuYWJsZVBvc3RlKSB7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoLTkwICogb25lRGVnKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCgzNSl9cHggRGVqYXZ1IFNhbnNgO1xyXG4gICAgICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKGdldFJlYWxXKC0zMzgwKSwgZ2V0UmVhbEgoMTU1MCkpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5ub21lQ3JlZGl0b3JlLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDM1KX1weCBEZWphdnUgU2Fuc2A7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTE4NTUpLCBnZXRSZWFsSCgxNTUwKSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLm5vbWVDcmVkaXRvcmUsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oIC8vIEMvQyBDcmVkaXRvcmVcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5jb250b0NvcnJlbnRlQ3JlZGl0b3JlICYmIHBkZkNvbmYuZW5hYmxlUG9zdGUpIHtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDM1KX1weCBEZWphdnUgU2Fuc2A7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTI4ODQpLCBnZXRSZWFsSCgxMzg5KSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmNvbnRvQ29ycmVudGVDcmVkaXRvcmUsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoMzUpfXB4IERlamF2dSBTYW5zYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTU2OCksIGdldFJlYWxIKDEzODEpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYuY29udG9Db3JyZW50ZUNyZWRpdG9yZSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gaW1wb3J0byBCb2xsZXR0aW5vXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuaW1wb3J0b0JvbGxldHRpbm8gJiYgcGRmQ29uZi5lbmFibGVQb3N0ZSkge1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoMzUpfXB4IERlamF2dSBTYW5zYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMjQwMCksIGdldFJlYWxIKDEzNzUpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYuaW1wb3J0b0JvbGxldHRpbm8sIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoMzUpfXB4IERlamF2dSBTYW5zYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtNjI4KSwgZ2V0UmVhbEgoMTM5NCkpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5pbXBvcnRvQm9sbGV0dGlubywgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gaW1wb3J0b09DUiArIGNvbnRvY29ycmVudGVPQ1IgKyB0aXBvT0NSXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuY29kaWNlY2xpZW50ZU9DUiAmJiBwZGZDb25mLmVuYWJsZVBvc3RlKSB7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoLTkwICogb25lRGVnKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCg0Nil9cHggT2NyQmA7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTE4MDApLCBnZXRSZWFsSCgyMzY2KSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChgPCR7cGRmQ29uZi5jb2RpY2VjbGllbnRlT0NSfT4gICAgICR7cGRmQ29uZi5pbXBvcnRvT0NSfT4gICR7cGRmQ29uZi5jb250b2NvcnJlbnRlT0NSfTwgIDg5Nj5gLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgLy8gY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTgxNSksIGdldFJlYWxIKDIzOTEpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDQ2KX1weCBPY3JCYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTgwMCksIGdldFJlYWxIKDE2ODYpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KGAke3BkZkNvbmYuY29kaWNlY2xpZW50ZU9DUn1gLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoLTkwICogb25lRGVnKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCg0Nil9cHggT2NyQmA7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTE3ODcpLCBnZXRSZWFsSCgxNDcwKSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dCgnODk2JywgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gSW1tYWdpbmUgYmFyY29kZSBvcml6em9udGFsZVxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLmJhcmNvZGVDb2RlICYmIHBkZkNvbmYuZW5hYmxlUG9zdGUpIHtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgbmV3Q2FudmFzID0gQ2FudmFzLmNyZWF0ZUNhbnZhcygpO1xyXG4gICAgICAgICAgICAgICAgICBKc0JhcmNvZGUobmV3Q2FudmFzLCBwZGZDb25mLmJhcmNvZGVDb2RlLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDMsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxMzAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAzMCxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBwZGZDb25mLmJhcmNvZGVDb2RlXHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCB0bXBJbWcgPSBuZXcgQ2FudmFzLkltYWdlO1xyXG4gICAgICAgICAgICAgICAgICB0bXBJbWcuc3JjID0gbmV3Q2FudmFzLnRvQnVmZmVyKCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoLTkwICogb25lRGVnKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTUwIC10bXBJbWcud2lkdGgpLCBnZXRSZWFsSCgxODgwKSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodG1wSW1nLCAwLCAxMDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gSW1tYWdpbmUgZGF0YSBtYXRyaXhcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5iYXJjb2RlQ29kZSAmJiBwZGZDb25mLmVuYWJsZVBvc3RlKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRlbXAub3BlbignbXlwcmVmaXgnLCAoZXJyLCBuZXdmaWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcy53cml0ZShuZXdmaWxlLmZkLCBwZGZDb25mLmJhcmNvZGVDb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnMuY2xvc2UobmV3ZmlsZS5mZCwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNtZCA9IGAvYmluL2RtdHh3cml0ZSAke25ld2ZpbGUucGF0aH0gLXMgMTZ4NDggLWQgMTEgLW0gMSAtbyAke25ld2ZpbGUucGF0aH0ucG5nYDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZFByb2Nlc3MuZXhlYyhgJHtjbWR9YCwgKHhFcnIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh4RXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoeEVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKGAke25ld2ZpbGUucGF0aH0ucG5nYCwgKGVyciwgbmV3RmlsZUNvbnRlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bXBJbWcgPSBuZXcgQ2FudmFzLkltYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSBuZXdGaWxlQ29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMjUzMyksIGdldFJlYWxIKDIyMzgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKHRtcEltZywgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmsoYCR7bmV3ZmlsZS5uYW1lfS5wbmdgLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmsoYCR7bmV3ZmlsZS5uYW1lfWAsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FudmFzLnBkZlN0cmVhbSgpXHJcbiAgICAgICAgICAgICAgICAucGlwZShyZXMpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbmV4dCg0MDQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICApO1xyXG4vKlxyXG4gICAgY29uc3QgcGRmQ29uZiA9IHtcclxuICAgICAgYmFzZUZpbGU6ICdpbWFnZXMvYmJpYW5jby5wbmcnLFxyXG4gICAgICB0b3BMZWZ0OiAnaW1hZ2VzL2Zhc3R3ZWJfbGVmdF90b3AucG5nJyxcclxuICAgICAgYm90dG9tTGVmdDogJ2ltYWdlcy9mYXN0d2ViX2xlZnRfYm90dG9tLnBuZycsXHJcbiAgICAgIGxpc0NvZGU6ICc0MTU4MDk5OTk5MDA0NTY2ODAyMDAwMjAxNzAwMDc2MDAyNjMzNDM5MDIwMDYwOTEnLFxyXG4gICAgICBsaXNDb2RlVGV4dDogJyg0MTUpODA5OTk5OTAwNDU2Nig4MDIpMDAwMjAxNzAwMDc2MDAyNjMzNCgzOTAyKTAwNjA5MScsXHJcbiAgICAgIGxpc0NvZGljZUVtaXR0ZW50ZTogJzgwOTk5OTkwMDQ1NjYnLFxyXG4gICAgICBsaXNDb2RpY2VDb250bzogJzAwMDIwMTcwMDA3NjAwMjYzMzQnLFxyXG4gICAgICBsaXNJbXBvcnRvOiAnNjAsOTEnLFxyXG4gICAgICBub21lRGViaXRvcmU6ICdTY2hpcm8gTW9uaWNhJyxcclxuICAgICAgcmVzaWRlbnphUmlnYVVubzogJ0wuZ28gT2xnaWF0YSAxOScsXHJcbiAgICAgIHJlc2lkZW56YVJpZ2FEdWU6ICdSb21hIDAwMTAwIHJtJyxcclxuICAgICAgbm9tZUNyZWRpdG9yZTogJ0ZBU1RXRUIgUy5QLkEuJyxcclxuICAgICAgY29udG9Db3JyZW50ZUNyZWRpdG9yZTogJzE0MjQ0NTUnLFxyXG4gICAgICBpbXBvcnRvQm9sbGV0dGlubzogJzYwLDkxJyxcclxuICAgICAgY29kaWNlY2xpZW50ZU9DUjogJzE3MDAwMDAwMDc2MDAyNjMzNScsXHJcbiAgICAgIGltcG9ydG9PQ1I6ICcwMDAwMDA2MCs5MScsXHJcbiAgICAgIGNvbnRvY29ycmVudGVPQ1I6ICcwMDAwMTQyNDQyNTUnLFxyXG4gICAgICB0aXBvT0NSOiAnODk2JyxcclxuICAgICAgYmFyY29kZUNvZGU6ICcxODE3MDAwMDAwMDc2MDAyNjMzNTEyMDAwMDE0MjQ0MjU1MTAwMDAwMDA2MDkxMzg5NidcclxuXHJcbiAgICB9O1xyXG4qL1xyXG5cclxuICB9XHJcblxyXG4gIGdldEludHJvKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZGVzY3JpcHRpb247XHJcbiAgfVxyXG5cclxuICBnZXRUaXRsZSgpIHtcclxuICAgIHJldHVybiB0aGlzLnRpdGxlO1xyXG4gIH1cclxuXHJcbiAgZ2V0UmVhZHkocmVxKSB7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgIGRiUmVjb3JkLFxyXG4gICAgICBmdWxsRGJSZWNvcmRzXHJcbiAgICB9ID0gdGhpcy5zZXNzaW9uO1xyXG5cclxuICAgIC8qXHJcbiAgICBjb25zb2xlLmxvZygnZnVsbERiUmVjb3JkcycsIGZ1bGxEYlJlY29yZHMuZmF0dHVyZSk7XHJcbiAgICAqL1xyXG5cclxuICAgIGNvbnN0IG1haW5Db25mID0ge307XHJcbiAgICBpZiAodGhpcy5wYXJhbTEgJiYgdGhpcy5wYXJhbTEubGVuZ3RoICYmIHR5cGVvZiB0aGlzLnBhcmFtMSA9PT0gJ3N0cmluZycgJiYgdGhpcy5wYXJhbTFbMF0gPT09ICd7Jykge1xyXG4gICAgICBPYmplY3QuYXNzaWduKG1haW5Db25mLCBKU09OLnBhcnNlKHRoaXMucGFyYW0xKSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBhbmFncmFmaWNhID0gZnVsbERiUmVjb3Jkcy5hbmFncmFmaWNhO1xyXG4gICAgbWFpbkNvbmYubm9tZURlYml0b3JlID0gYW5hZ3JhZmljYS5EZWJpdG9yZTtcclxuICAgIG1haW5Db25mLnJlc2lkZW56YVJpZ2FVbm8gPSBhbmFncmFmaWNhLkluZGlyaXp6bztcclxuICAgIG1haW5Db25mLnJlc2lkZW56YVJpZ2FEdWUgPSBgJHthbmFncmFmaWNhLkNBUCA/IGFuYWdyYWZpY2EuQ0FQIDogJyd9ICR7YW5hZ3JhZmljYS5DaXR0YX1gO1xyXG4gICAgbWFpbkNvbmYudGlwb09DUiA9ICc4OTYnO1xyXG5cclxuICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25zID0gZnVsbERiUmVjb3Jkcy5mYXR0dXJlLm1hcCgoZmF0dHVyYSwgcG9zKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBkZkNvbmYgPSBPYmplY3QuYXNzaWduKHt9LCBtYWluQ29uZik7XHJcbiAgICAgIGNvbnN0IGltcG9ydG8gPSBmYXR0dXJhLkltcG9ydG9BemlvbmF0bztcclxuICAgICAgcGRmQ29uZi5pbXBvcnRvID0gZmF0dHVyYS5JbXBvcnRvQXppb25hdG87XHJcbiAgICAgIGNvbnN0IGltcG9ydG9Bc1RleHQgPSBmYXR0dXJhLkltcG9ydG9BemlvbmF0by50b0ZpeGVkKDIpO1xyXG4gICAgICBwZGZDb25mLmltcG9ydG9Cb2xsZXR0aW5vID0gaW1wb3J0b0FzVGV4dC5yZXBsYWNlKCcuJywgJywnKTtcclxuXHJcbiAgICAgIGNvbnN0IHVuZGVyc2NvcmVQb3NpdGlvbiA9IGZhdHR1cmEuTnVtRmF0dHVyYS5pbmRleE9mKCdfJyk7XHJcbiAgICAgIGNvbnN0IGNvZGljZUZhdHR1cmEgPSBmYXR0dXJhLk51bUZhdHR1cmEuc2xpY2UoKGZhdHR1cmEuTnVtRmF0dHVyYS5sZW5ndGggLSB1bmRlcnNjb3JlUG9zaXRpb24gLSAxKSAqIC0xKTtcclxuICAgICAgcGRmQ29uZi5udW1lcm9GYXR0dXJhID0gY29kaWNlRmF0dHVyYTtcclxuICAgICAgY29uc3QgbkZhdHR1cmEgPSBjb2RpY2VGYXR0dXJhLnJlcGxhY2UoIC9eXFxEKy9nLCAnJyk7XHJcbiAgICAgIGNvbnN0IHJlc2lkZW56aWFsZSA9IGNvZGljZUZhdHR1cmEuaW5kZXhPZignTScpID4gLTE7XHJcbiAgICAgIGlmIChwZGZDb25mLmNvbnRvY29ycmVudGVPQ1IpIHtcclxuICAgICAgICBpZiAocmVzaWRlbnppYWxlKSB7XHJcbiAgICAgICAgICBwZGZDb25mLmltcG9ydG9PQ1IgPSBib2xsZXR0aW5vTWV0aG9kLmxlZnRQYWQoaW1wb3J0b0FzVGV4dC5yZXBsYWNlKCcuJywgJysnKSwgMTEpO1xyXG4gICAgICAgICAgLy8gMTcwMDAwMDAwNzYwMDI2MzM1XHJcbiAgICAgICAgICBjb25zdCBhbm5vZmF0dHVyYSA9IChuZXcgRGF0ZShmYXR0dXJhLmRhdGFmYXR0dXJhKSkuZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgIGNvbnN0IHRtcENvZGljZUNsaWVudGVDbGllbnRlT2NyID0gYCR7YW5ub2ZhdHR1cmEudG9TdHJpbmcoKS5zbGljZSgtMil9MDAwJHtib2xsZXR0aW5vTWV0aG9kLmxlZnRQYWQobkZhdHR1cmEudG9TdHJpbmcoKSwgMTEpfWA7XHJcbiAgICAgICAgICBjb25zdCByZW1haW5kZXIgPSBwYXJzZUludCh0bXBDb2RpY2VDbGllbnRlQ2xpZW50ZU9jciwgMTApICUgOTM7XHJcbiAgICAgICAgICBwZGZDb25mLmNvZGljZWNsaWVudGVPQ1IgPSBgJHt0bXBDb2RpY2VDbGllbnRlQ2xpZW50ZU9jcn0ke3JlbWFpbmRlcn1gO1xyXG4gICAgICAgICAgLy8xODE3MDAwMDAwMDc2MDAyNjMzNTEyMDAwMDE0MjQ0MjU1MTAwMDAwMDA2MDkxMzg5NlxyXG4gICAgICAgICAgLy8xOCAxNzAwMDAwMDA3NjAwMjYzMzUgMTIgMDAwMDE0MjQ0MjU1IDEwIDAwMDAwMDYwOTEgMyA4OTZcclxuICAgICAgICAgIHBkZkNvbmYuYmFyY29kZUNvZGUgPSBgMTgke3BkZkNvbmYuY29kaWNlY2xpZW50ZU9DUn0xMiR7cGRmQ29uZi5jb250b2NvcnJlbnRlT0NSfTEwJHtib2xsZXR0aW5vTWV0aG9kLmxlZnRQYWQoaW1wb3J0b0FzVGV4dC5yZXBsYWNlKCcuJywnJyksMTApfTM4OTZgO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyAwMDAwMDA2MCs5MVxyXG4gICAgICAgICAgcGRmQ29uZi5pbXBvcnRvT0NSID0gYm9sbGV0dGlub01ldGhvZC5sZWZ0UGFkKGltcG9ydG9Bc1RleHQucmVwbGFjZSgnLicsICcrJyksIDExKTtcclxuICAgICAgICAgIC8vIDE3MDAwMDAwMDc2MDAyNjMzNVxyXG4gICAgICAgICAgY29uc3QgYW5ub2ZhdHR1cmEgPSAobmV3IERhdGUoZmF0dHVyYS5kYXRhZmF0dHVyYSkpLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICBjb25zdCB0bXBDb2RpY2VDbGllbnRlQ2xpZW50ZU9jciA9IGAke2Fubm9mYXR0dXJhLnRvU3RyaW5nKCkuc2xpY2UoLTIpfTAwMCR7Ym9sbGV0dGlub01ldGhvZC5sZWZ0UGFkKG5GYXR0dXJhLnRvU3RyaW5nKCksIDE0KX1gO1xyXG4gICAgICAgICAgY29uc3QgcmVtYWluZGVyID0gcGFyc2VJbnQodG1wQ29kaWNlQ2xpZW50ZUNsaWVudGVPY3IsIDEwKSAlIDkzO1xyXG4gICAgICAgICAgcGRmQ29uZi5jb2RpY2VjbGllbnRlT0NSID0gYCR7dG1wQ29kaWNlQ2xpZW50ZUNsaWVudGVPY3J9JHtyZW1haW5kZXJ9YDtcclxuICAgICAgICAgIC8vMTgxNzAwMDAwMDA3NjAwMjYzMzUxMjAwMDAxNDI0NDI1NTEwMDAwMDAwNjA5MTM4OTZcclxuICAgICAgICAgIC8vMTggMTcwMDAwMDAwNzYwMDI2MzM1IDEyIDAwMDAxNDI0NDI1NSAxMCAwMDAwMDA2MDkxIDMgODk2XHJcbiAgICAgICAgICBwZGZDb25mLmJhcmNvZGVDb2RlID0gYDE4JHtwZGZDb25mLmNvZGljZWNsaWVudGVPQ1J9MTIke3BkZkNvbmYuY29udG9jb3JyZW50ZU9DUn0xMCR7Ym9sbGV0dGlub01ldGhvZC5sZWZ0UGFkKGltcG9ydG9Bc1RleHQucmVwbGFjZSgnLicsJycpLDEwKX0zODk2YDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHBkZkNvbmYubGlzQ29kaWNlRW1pdHRlbnRlKSB7XHJcbiAgICAgICAgaWYgKHJlc2lkZW56aWFsZSkge1xyXG4gICAgICAgICAgY29uc3QgYW5ub2ZhdHR1cmEgPSAobmV3IERhdGUoZmF0dHVyYS5kYXRhZmF0dHVyYSkpLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICBjb25zdCBmYXR0dXJhbHVuZ2EgPSBib2xsZXR0aW5vTWV0aG9kLmxlZnRQYWQobkZhdHR1cmEsIDEwKTtcclxuICAgICAgICAgIGNvbnN0IGFubm9sdW5nbyA9IGJvbGxldHRpbm9NZXRob2QubGVmdFBhZChhbm5vZmF0dHVyYS50b1N0cmluZygpLCA2KTtcclxuICAgICAgICAgIGNvbnN0IGNvZGljZUNvbnRvVG1wID0gYCR7YW5ub2x1bmdvfSR7ZmF0dHVyYWx1bmdhfWA7XHJcbiAgICAgICAgICBjb25zdCBjb2RpY2VDb250b0FzTnVtYmVyID0gcGFyc2VJbnQoY29kaWNlQ29udG9UbXAsIDEwKTtcclxuICAgICAgICAgIGNvbnN0IHJlbWFpbmRlciA9IGNvZGljZUNvbnRvQXNOdW1iZXIgJSA5MztcclxuICAgICAgICAgIGNvbnN0IGNvZGljZUNvbnRvID0gYCR7YW5ub2x1bmdvfSR7ZmF0dHVyYWx1bmdhfSR7cmVtYWluZGVyfWA7XHJcbiAgICAgICAgICBwZGZDb25mLmxpc0NvZGljZUNvbnRvID0gY29kaWNlQ29udG87XHJcbiAgICAgICAgICBwZGZDb25mLmxpc0ltcG9ydG8gPSBpbXBvcnRvQXNUZXh0LnJlcGxhY2UoJy4nLCAnLCcpO1xyXG4gICAgICAgICAgcGRmQ29uZi5saXNDb2RlID0gYDQxNSR7cGRmQ29uZi5saXNDb2RpY2VFbWl0dGVudGV9ODAyMCR7Y29kaWNlQ29udG99MzkwMiR7Ym9sbGV0dGlub01ldGhvZC5sZWZ0UGFkKGltcG9ydG9Bc1RleHQucmVwbGFjZSgnLicsICcnKSwgNil9YDtcclxuICAgICAgICAgIHBkZkNvbmYubGlzQ29kZVRleHQgPSBgKDQxNSkke3BkZkNvbmYubGlzQ29kaWNlRW1pdHRlbnRlfSg4MDIwKSR7Y29kaWNlQ29udG99KDM5MDIpJHtib2xsZXR0aW5vTWV0aG9kLmxlZnRQYWQoaW1wb3J0b0FzVGV4dC5yZXBsYWNlKCcuJywgJycpLCA2KX1gO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBhbm5vZmF0dHVyYSA9IChuZXcgRGF0ZShmYXR0dXJhLmRhdGFmYXR0dXJhKSkuZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgIGNvbnN0IGZhdHR1cmFsdW5nYSA9IGJvbGxldHRpbm9NZXRob2QubGVmdFBhZChuRmF0dHVyYSwgMTApO1xyXG4gICAgICAgICAgY29uc3QgYW5ub2x1bmdvID0gYm9sbGV0dGlub01ldGhvZC5sZWZ0UGFkKGFubm9mYXR0dXJhLnRvU3RyaW5nKCksIDYpO1xyXG4gICAgICAgICAgY29uc3QgY29kaWNlQ29udG9UbXAgPSBgJHthbm5vbHVuZ299JHtmYXR0dXJhbHVuZ2F9YDtcclxuICAgICAgICAgIGNvbnN0IGNvZGljZUNvbnRvQXNOdW1iZXIgPSBwYXJzZUludChjb2RpY2VDb250b1RtcCwgMTApO1xyXG4gICAgICAgICAgY29uc3QgcmVtYWluZGVyID0gY29kaWNlQ29udG9Bc051bWJlciAlIDkzO1xyXG4gICAgICAgICAgY29uc3QgY29kaWNlQ29udG8gPSBgJHthbm5vbHVuZ299JHtmYXR0dXJhbHVuZ2F9JHtyZW1haW5kZXJ9YDtcclxuICAgICAgICAgIHBkZkNvbmYubGlzQ29kaWNlQ29udG8gPSBjb2RpY2VDb250bztcclxuICAgICAgICAgIHBkZkNvbmYubGlzSW1wb3J0byA9IGltcG9ydG9Bc1RleHQucmVwbGFjZSgnLicsICcsJyk7XHJcbiAgICAgICAgICBwZGZDb25mLmxpc0NvZGUgPSBgNDE1JHtwZGZDb25mLmxpc0NvZGljZUVtaXR0ZW50ZX04MDIwJHtjb2RpY2VDb250b30zOTAyJHtib2xsZXR0aW5vTWV0aG9kLmxlZnRQYWQoaW1wb3J0b0FzVGV4dC5yZXBsYWNlKCcuJywgJycpLCA2KX1gO1xyXG4gICAgICAgICAgcGRmQ29uZi5saXNDb2RlVGV4dCA9IGAoNDE1KSR7cGRmQ29uZi5saXNDb2RpY2VFbWl0dGVudGV9KDgwMjApJHtjb2RpY2VDb250b30oMzkwMikke2JvbGxldHRpbm9NZXRob2QubGVmdFBhZChpbXBvcnRvQXNUZXh0LnJlcGxhY2UoJy4nLCAnJyksIDYpfWA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHBkZkNvbmYuY2F1c2FsZVJpZ2FVbm8gPSBgTi4gRkFUVFVSQTogJHtuRmF0dHVyYX1gO1xyXG4gICAgICBwZGZDb25mLmNhdXNhbGVSaWdhRHVlID0gYERBVEEgRkFUVFVSQTogJHttb21lbnQoZmF0dHVyYS5kYXRhZmF0dHVyYSkuZm9ybWF0KCdERC9NTS9ZWVlZJyl9YDtcclxuICAgICAgLy8gcGRmQ29uZi5jYXVzYWxlUmlnYVRyZSA9ICdQcm92YSAzJztcclxuICAgICAgLy8gcGRmQ29uZi5jYXVzYWxlUmlnYVF1YXR0cm8gPSAnUHJvdmEgNCc7XHJcbiAgICAgIHBkZkNvbmYuaWRDb250cmF0dG8gPSB0aGlzLmlkQ29udHJhdHRvO1xyXG4gICAgICBwZGZDb25mLnBheW1lbnRJZCA9IHRoaXMucGF5bWVudElkO1xyXG4gICAgICByZXR1cm4gcGRmQ29uZjtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgYXN5bmMubWFwU2VyaWVzKGNvbmZpZ3VyYXRpb25zLCAocGRmQ29uZiwgY2IpID0+IHtcclxuICAgICAgICBpZiAocGRmQ29uZi5pbXBvcnRvID4gMCkge1xyXG4gICAgICAgICAgY29uc3Qgc3FsID0gYElOU0VSVCBpbnRvIG9ubGluZVBheW1lbnRUcmFuc2FjdGlvbnMgKG1vZHVsZSwgZnVsbENvbmZpZywgcGF5bWVudElkLCBpZENvbnRyYXR0bykgVkFMVUVTIChcclxuICAgICAgICAgICAgJHt0aGlzLmRiLmVzY2FwZSgnYm9sbGV0dGlubycpfSxcclxuICAgICAgICAgICAgJHt0aGlzLmRiLmVzY2FwZShKU09OLnN0cmluZ2lmeShwZGZDb25mKSl9LFxyXG4gICAgICAgICAgICAke3RoaXMuZGIuZXNjYXBlKHRoaXMucGF5bWVudElkKX0sXHJcbiAgICAgICAgICAgICR7dGhpcy5kYi5lc2NhcGUodGhpcy5pZENvbnRyYXR0byl9XHJcbiAgICAgICAgICApYDtcclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke3BkZkNvbmYudGl0bGV9ICR7cGRmQ29uZi5udW1lcm9GYXR0dXJhfWApO1xyXG4gICAgICAgICAgdGhpcy5kYi5xdWVyeShzcWwpXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNiKG51bGwsIHtpZDogcmVzdWx0Lmluc2VydElkLCBuYW1lOiBgJHtwZGZDb25mLnRpdGxlfSAke3BkZkNvbmYubnVtZXJvRmF0dHVyYX1gIH0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgIGNiKGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjYihudWxsLCBudWxsKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sIChlcnIsIHJlc3VsdHMpID0+IHtcclxuICAgICAgICBpZiAoZXJyKSByZWplY3QoZXJyKTtcclxuICAgICAgICB0aGlzLmJvbGxldHRpbmkgPSByZXN1bHRzO1xyXG4gICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBjb25zb2xlLmxvZyhwZGZDb25mKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKCdwYXJhbTEgYm9sbGV0dGlubycsIHRoaXMucGFyYW0xKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKCdwYXJhbTInLCB0aGlzLnBhcmFtMik7XHJcbiAgICAvLyBjb25zb2xlLmxvZygncGFyYW0zJywgdGhpcy5wYXJhbTMpO1xyXG4gICAgLy8gY29uc29sZS5sb2coJ3RoaXMnLCB0aGlzKTtcclxuICAgIC8vXHJcbiAgICAvLyBjb25zdCBwZGZDb25mID0ge1xyXG4gICAgLy8gICBiYXNlRmlsZTogJ2JiaWFuY28ucG5nJyxcclxuICAgIC8vICAgdG9wTGVmdDogJ2Zhc3R3ZWJfbGVmdF90b3AucG5nJyxcclxuICAgIC8vICAgYm90dG9tTGVmdDogJ2Zhc3R3ZWJfbGVmdF9ib3R0b20ucG5nJyxcclxuXHJcbiAgICAvLyAgIGxpc0NvZGU6IGBgLCAvLyAnNDE1ODA5OTk5OTAwNDU2NjgwMjAwMDIwMTcwMDA3NjAwMjYzMzQzOTAyMDA2MDkxJyxcclxuICAgIC8vICAgbGlzQ29kZVRleHQ6ICcoNDE1KTgwOTk5OTkwMDQ1NjYoODAyKTAwMDIwMTcwMDA3NjAwMjYzMzQoMzkwMikwMDYwOTEnLFxyXG4gICAgLy8gICBsaXNDb2RpY2VFbWl0dGVudGU6ICc4MDk5OTk5MDA0NTY2JyxcclxuICAgIC8vICAgbGlzQ29kaWNlQ29udG86ICcwMDAyMDE3MDAwNzYwMDI2MzM0JyxcclxuICAgIC8vICAgbGlzSW1wb3J0bzogJzYwLDkxJyxcclxuICAgIC8vICAgbm9tZURlYml0b3JlOiAnU2NoaXJvIE1vbmljYScsXHJcbiAgICAvLyAgIHJlc2lkZW56YVJpZ2FVbm86ICdMLmdvIE9sZ2lhdGEgMTknLFxyXG4gICAgLy8gICByZXNpZGVuemFSaWdhRHVlOiAnUm9tYSAwMDEwMCBybScsXHJcbiAgICAvLyAgIG5vbWVDcmVkaXRvcmU6ICdGQVNUV0VCIFMuUC5BLicsXHJcbiAgICAvLyAgIGNvbnRvQ29ycmVudGVDcmVkaXRvcmU6ICcxNDI0NDU1JyxcclxuICAgIC8vICAgaW1wb3J0b0JvbGxldHRpbm86ICc2MCw5MScsXHJcbiAgICAvLyAgIGNvZGljZWNsaWVudGVPQ1I6ICcxNzAwMDAwMDA3NjAwMjYzMzUnLFxyXG4gICAgLy8gICBpbXBvcnRvT0NSOiAnMDAwMDAwNjArOTEnLFxyXG4gICAgLy8gICBjb250b2NvcnJlbnRlT0NSOiAnMDAwMDE0MjQ0MjU1JyxcclxuICAgIC8vICAgdGlwb09DUjogJzg5NicsXHJcbiAgICAvLyAgIGJhcmNvZGVDb2RlOiAnMTgxNzAwMDAwMDA3NjAwMjYzMzUxMjAwMDAxNDI0NDI1NTEwMDAwMDAwNjA5MTM4OTYnXHJcbiAgICAvLyB9O1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBnZXRGb3JtKCkge1xyXG4gICAgcmV0dXJuIGBcclxuICAgIDxkaXY+XHJcbiAgICAgICR7dGhpcy5ib2xsZXR0aW5pLm1hcCgoYykgPT4ge1xyXG4gICAgICAgIGlmIChjKSB7XHJcbiAgICAgICAgICByZXR1cm4gYDxhIGNsYXNzPVwiYnRuIGJ0bi1zdWNjZXNzXCIgdGFyZ2V0PVwiX25ld1wiIGhyZWY9XCIvY2FsbGJhY2svYm9sbGV0dGlub19wZGY/aWQ9JHtjLmlkfVwiPiR7Yy5uYW1lfTwvYT5gO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgIH0pLmpvaW4oJzxici8+Jyl9XHJcbiAgICA8L2Rpdj5cclxuICAgIGA7XHJcbiAgfVxyXG59XHJcbiJdfQ==