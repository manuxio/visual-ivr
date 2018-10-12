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
        var importoAsText = fattura.ImportoAzionato.toFixed(2);
        pdfConf.importo = importo;
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
            var tmpCodiceClienteClienteOcr = annofattura.toString().slice(-2) + '888' + bollettinoMethod.leftPad(nFattura.toString(), 11);
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
            var _tmpCodiceClienteClienteOcr = '' + _annofattura.toString().slice(-2) + bollettinoMethod.leftPad(nFattura.toString(), 14);
            var _remainder = parseInt(_tmpCodiceClienteClienteOcr, 10) % 93;
            pdfConf.codiceclienteOCR = '' + _tmpCodiceClienteClienteOcr + _remainder;
            //18170000000760026335120000142442551000000060913896
            //18 170000000760026335 12 000014244255 10 0000006091 3 896
            pdfConf.barcodeCode = '18' + pdfConf.codiceclienteOCR + '12' + pdfConf.contocorrenteOCR + '10' + bollettinoMethod.leftPad(importoAsText.replace('.', ''), 10) + '3896';
          }
        }
        if (pdfConf.lisCodiceEmittente) {
          if (residenziale) {} else {
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
          }
        }
        pdfConf.causaleRigaUno = 'N. FATTURA: ' + nFattura;
        pdfConf.causaleRigaDue = 'DATA FATTURA: ' + (0, _moment2.default)(fattura.datafattura).format('DD/MM/YYYY');
        // pdfConf.causaleRigaTre = 'Prova 3';
        // pdfConf.causaleRigaQuattro = 'Prova 4';
        return pdfConf;
      });
      return new Promise(function (resolve, reject) {
        _async2.default.mapSeries(configurations, function (pdfConf, cb) {
          if (pdfConf.importo > 0) {
            var sql = 'INSERT into onlinePaymentTransactions (module, fullConfig, paymentId, idContratto) VALUES (\n            ' + _this2.db.escape('bollettino') + ',\n            ' + _this2.db.escape(JSON.stringify(pdfConf)) + ',\n            ' + _this2.db.escape(_this2.paymentId) + ',\n            ' + _this2.db.escape(_this2.idcontratto) + '\n          )';
            _this2.db.query(sql).then(function (result) {
              cb(null, { id: result.insertId, name: pdfConf.type !== 'lis' ? 'Mostra bollettino per la fattura ' + pdfConf.numeroFattura : 'Mostra codice LIS per la fattura ' + pdfConf.numeroFattura });
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
        return '<a class="btn btn-success" target="_new" href="/callback/lottomatica_pdf?id=' + c.id + '">' + c.name + '</a>';
      }).join('<br/>') + '\n    </div>\n    ';
    }
  }], [{
    key: 'getCallBackUrls',
    value: function getCallBackUrls() {
      return [{
        url: 'lottomatica_pdf',
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
              if (pdfConf.lisCode) {
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
              if (pdfConf.nomeDebitore && pdfConf.type !== 'lis') {
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
              if (pdfConf.residenzaRigaUno && pdfConf.type !== 'lis') {
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
              if (pdfConf.nomeDebitore && pdfConf.type !== 'lis') {
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
              if (pdfConf.residenzaRigaUno && pdfConf.type !== 'lis') {
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
              if (pdfConf.residenzaRigaUno && pdfConf.type !== 'lis') {
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
              if (pdfConf.causaleRigaUno && pdfConf.type !== 'lis') {
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
              if (pdfConf.causaleRigaUno && pdfConf.type !== 'lis') {
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
              if (pdfConf.nomeCreditore && pdfConf.type !== 'lis') {
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
              if (pdfConf.contoCorrenteCreditore && pdfConf.type !== 'lis') {
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
              if (pdfConf.importoBollettino && pdfConf.type !== 'lis') {
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
              if (pdfConf.codiceclienteOCR && pdfConf.type !== 'lis') {
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
              if (pdfConf.barcodeCode && pdfConf.type !== 'lis') {
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
              if (pdfConf.barcodeCode && pdfConf.type !== 'lis') {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXltZW50bWV0aG9kcy9sb3R0b21hdGljYS5qcyJdLCJuYW1lcyI6WyJib2xsZXR0aW5vTWV0aG9kIiwiZGVzY3JpcHRpb24iLCJ0aXRsZSIsInJlcSIsInNlc3Npb24iLCJkYlJlY29yZCIsImZ1bGxEYlJlY29yZHMiLCJtYWluQ29uZiIsInBhcmFtMSIsImxlbmd0aCIsIk9iamVjdCIsImFzc2lnbiIsIkpTT04iLCJwYXJzZSIsImFuYWdyYWZpY2EiLCJub21lRGViaXRvcmUiLCJEZWJpdG9yZSIsInJlc2lkZW56YVJpZ2FVbm8iLCJJbmRpcml6em8iLCJyZXNpZGVuemFSaWdhRHVlIiwiQ0FQIiwiQ2l0dGEiLCJ0aXBvT0NSIiwiY29uZmlndXJhdGlvbnMiLCJmYXR0dXJlIiwibWFwIiwiZmF0dHVyYSIsInBvcyIsInBkZkNvbmYiLCJpbXBvcnRvIiwiSW1wb3J0b0F6aW9uYXRvIiwiaW1wb3J0b0FzVGV4dCIsInRvRml4ZWQiLCJpbXBvcnRvQm9sbGV0dGlubyIsInJlcGxhY2UiLCJ1bmRlcnNjb3JlUG9zaXRpb24iLCJOdW1GYXR0dXJhIiwiaW5kZXhPZiIsImNvZGljZUZhdHR1cmEiLCJzbGljZSIsIm51bWVyb0ZhdHR1cmEiLCJuRmF0dHVyYSIsInJlc2lkZW56aWFsZSIsImNvbnRvY29ycmVudGVPQ1IiLCJpbXBvcnRvT0NSIiwibGVmdFBhZCIsImFubm9mYXR0dXJhIiwiRGF0ZSIsImRhdGFmYXR0dXJhIiwiZ2V0RnVsbFllYXIiLCJ0bXBDb2RpY2VDbGllbnRlQ2xpZW50ZU9jciIsInRvU3RyaW5nIiwicmVtYWluZGVyIiwicGFyc2VJbnQiLCJjb2RpY2VjbGllbnRlT0NSIiwiYmFyY29kZUNvZGUiLCJsaXNDb2RpY2VFbWl0dGVudGUiLCJmYXR0dXJhbHVuZ2EiLCJhbm5vbHVuZ28iLCJjb2RpY2VDb250b1RtcCIsImNvZGljZUNvbnRvQXNOdW1iZXIiLCJjb2RpY2VDb250byIsImxpc0NvZGljZUNvbnRvIiwibGlzSW1wb3J0byIsImxpc0NvZGUiLCJsaXNDb2RlVGV4dCIsImNhdXNhbGVSaWdhVW5vIiwiY2F1c2FsZVJpZ2FEdWUiLCJmb3JtYXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIm1hcFNlcmllcyIsImNiIiwic3FsIiwiZGIiLCJlc2NhcGUiLCJzdHJpbmdpZnkiLCJwYXltZW50SWQiLCJpZGNvbnRyYXR0byIsInF1ZXJ5IiwidGhlbiIsInJlc3VsdCIsImlkIiwiaW5zZXJ0SWQiLCJuYW1lIiwidHlwZSIsImUiLCJlcnIiLCJyZXN1bHRzIiwiYm9sbGV0dGluaSIsImMiLCJqb2luIiwidXJsIiwibWV0aG9kIiwiaHR0cE1ldGhvZCIsInJlcyIsIm5leHQiLCJkYkNvbm5lY3Rpb24iLCJwYXJhbXMiLCJyZWNvcmQiLCJmdWxsY29uZmlnIiwicmVnaXN0ZXJGb250IiwiZmFtaWx5IiwicmVhZEZpbGUiLCJiYXNlRmlsZSIsIm9uZURlZyIsIk1hdGgiLCJQSSIsImltZyIsIkltYWdlIiwic3JjIiwiSU1XIiwid2lkdGgiLCJJTUgiLCJoZWlnaHQiLCJnZXRSZWFsSCIsImgiLCJnZXRSZWFsVyIsInciLCJjYW52YXMiLCJjcmVhdGVDYW52YXMiLCJjdHgiLCJnZXRDb250ZXh0IiwiZHJhd0ltYWdlIiwidG9wTGVmdCIsInRtcEltZyIsImJvdHRvbUxlZnQiLCJuZXdDYW52YXMiLCJtYXJnaW4iLCJmb250U2l6ZSIsInRleHQiLCJ0b0J1ZmZlciIsImZvbnQiLCJmaWxsVGV4dCIsInNldFRyYW5zZm9ybSIsInJvdGF0ZSIsInRyYW5zbGF0ZSIsImNhdXNhbGVSaWdhVHJlIiwiY2F1c2FsZVJpZ2FRdWF0dHJvIiwibm9tZUNyZWRpdG9yZSIsImNvbnRvQ29ycmVudGVDcmVkaXRvcmUiLCJvcGVuIiwibmV3ZmlsZSIsIndyaXRlIiwiZmQiLCJjbG9zZSIsImNtZCIsInBhdGgiLCJleGVjIiwieEVyciIsImNvbnNvbGUiLCJlcnJvciIsIm5ld0ZpbGVDb250ZW50IiwidW5saW5rIiwicGRmU3RyZWFtIiwi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cFZELENBcVZFLFlBQU07QUFDSnVDLHFCQUFPbUMsU0FBUCxHQUNDQyxJQURELENBQ001RCxHQUROO0FBRUQsYUF4VkgsRUF5VkUsVUFBQ1QsQ0FBRDtBQUFBLHFCQUFPbEIsUUFBUUUsTUFBUixDQUFlZ0IsQ0FBZixDQUFQO0FBQUEsYUF6VkY7QUEyVkQsV0EvV0Q7QUFnWEQsU0F4WEQsTUF3WE87QUFDTFUsZUFBSyxHQUFMO0FBQ0Q7QUFDRixPQTlYSCxFQStYRSxVQUFDVixDQUFEO0FBQUEsZUFBT2xCLFFBQVFFLE1BQVIsQ0FBZWdCLENBQWYsQ0FBUDtBQUFBLE9BL1hGO0FBaVlKOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5Qkc7Ozs7OztrQkEvYWtCdkYsZ0IiLCJmaWxlIjoibG90dG9tYXRpY2EuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYmFzZU1ldGhvZCBmcm9tICcuL2Jhc2VtZXRob2QnO1xyXG5pbXBvcnQgYmFyY29kZSBmcm9tICdiYXJjb2RlJztcclxuaW1wb3J0IEpzQmFyY29kZSBmcm9tICdqc2JhcmNvZGUnO1xyXG5pbXBvcnQgQ2FudmFzIGZyb20gJ2NhbnZhcyc7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCB0ZW1wIGZyb20gJ3RlbXAnO1xyXG5pbXBvcnQgY2hpbGRQcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgYXN5bmMgZnJvbSAnYXN5bmMnO1xyXG5pbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBib2xsZXR0aW5vTWV0aG9kIGV4dGVuZHMgYmFzZU1ldGhvZCB7XHJcblxyXG4gIHN0YXRpYyBnZXRDYWxsQmFja1VybHMoKSB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICB7XHJcbiAgICAgICAgdXJsOiAnbG90dG9tYXRpY2FfcGRmJyxcclxuICAgICAgICBtZXRob2Q6ICdjcmVhdGVQZGYnLFxyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdnZXQnXHJcbiAgICAgIH1cclxuICAgIF1cclxuICB9XHJcblxyXG4gIHN0YXRpYyBjcmVhdGVQZGYocmVxLCByZXMsIG5leHQpIHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgc2Vzc2lvblxyXG4gICAgfSA9IHJlcTtcclxuICAgIGNvbnN0IGRiID0gcmVxLmRiQ29ubmVjdGlvbjtcclxuICAgIGNvbnN0IHBhcmFtcyA9IHJlcS5xdWVyeTtcclxuICAgIGNvbnN0IHtcclxuICAgICAgaWRcclxuICAgIH0gPSBwYXJhbXMgfHwge307XHJcbiAgICBkYi5xdWVyeShgU0VMRUNUICogRlJPTSBvbmxpbmVQYXltZW50VHJhbnNhY3Rpb25zIFdIRVJFIGlkID0gJHsgZGIuZXNjYXBlKGlkKX1gKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChyZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IHJlY29yZCA9IHJlc3VsdHNbMF07XHJcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnUmVjb3JkJywgcmVjb3JkKTtcclxuICAgICAgICAgIGNvbnN0IHBkZkNvbmYgPSBKU09OLnBhcnNlKHJlY29yZC5mdWxsY29uZmlnKTtcclxuICAgICAgICAgIENhbnZhcy5yZWdpc3RlckZvbnQoYC4vc3JjL3BheW1lbnRtZXRob2RzL2ZvbnRzL0luY29uc29sYXRhLVJlZ3VsYXIudHRmYCwge2ZhbWlseTogJ0luY29uc29sYXRhJ30pO1xyXG4gICAgICAgICAgQ2FudmFzLnJlZ2lzdGVyRm9udChgLi9zcmMvcGF5bWVudG1ldGhvZHMvZm9udHMvT0NSQUVYVC5UVEZgLCB7ZmFtaWx5OiAnT2NyQSd9KTtcclxuICAgICAgICAgIENhbnZhcy5yZWdpc3RlckZvbnQoYC4vc3JjL3BheW1lbnRtZXRob2RzL2ZvbnRzL29jcmIudHRmYCwge2ZhbWlseTogJ09jckInfSk7XHJcblxyXG4gICAgICAgICAgZnMucmVhZEZpbGUoYC4vc3JjL3BheW1lbnRtZXRob2RzLyR7cGRmQ29uZi5iYXNlRmlsZX1gLCAoZXJyLCBiYXNlRmlsZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XHJcbiAgICAgICAgICAgIGNvbnN0IG9uZURlZyA9IE1hdGguUEkgLyAxODA7XHJcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBDYW52YXMuSW1hZ2U7XHJcbiAgICAgICAgICAgIGltZy5zcmMgPSBiYXNlRmlsZTtcclxuICAgICAgICAgICAgY29uc3QgSU1XID0gaW1nLndpZHRoO1xyXG4gICAgICAgICAgICBjb25zdCBJTUggPSBpbWcuaGVpZ2h0O1xyXG4gICAgICAgICAgICBjb25zdCBnZXRSZWFsSCA9IChoKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIElNSCAqIGggLyAzNTAyO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjb25zdCBnZXRSZWFsVyA9ICh3KSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIElNVyAqIHcgLyAyNDMyO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyBjb25zdCBJbmNvbnNvbGF0YSA9IG5ldyBDYW52YXMuRm9udCgnSW5jb25zb2xhdGEnLCBgLi9zcmMvcGF5bWVudG1ldGhvZHMvSW5jb25zb2xhdGEtUmVndWxhci50dGZgKTtcclxuICAgICAgICAgICAgLy8gSW5jb25zb2xhdGEuYWRkRmFjZShgLi9zcmMvcGF5bWVudG1ldGhvZHMvSW5jb25zb2xhdGEtUmVndWxhci50dGZgLCAnbm9ybWFsJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IENhbnZhcy5jcmVhdGVDYW52YXMoSU1XLCBJTUgsICdwZGYnKTtcclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgICAgIC8vIGN0eC5hZGRGb250KEluY29uc29sYXRhKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChwZGZDb25mLnRvcExlZnQpIHtcclxuICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKGAuL3NyYy9wYXltZW50bWV0aG9kcy8ke3BkZkNvbmYudG9wTGVmdH1gLCAoZXJyLCB0b3BMZWZ0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRtcEltZyA9IG5ldyBDYW52YXMuSW1hZ2U7XHJcbiAgICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSB0b3BMZWZ0O1xyXG4gICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKHRtcEltZywgKChJTVcgLyAyKSAtICh0bXBJbWcud2lkdGgpKSAvIDIsIDApO1xyXG4gICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRoZW4oIC8vIEltbWFnaW5lIGJvdHRvbSBsZWZ0XHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuYm90dG9tTGVmdCkge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZShgLi9zcmMvcGF5bWVudG1ldGhvZHMvJHtwZGZDb25mLmJvdHRvbUxlZnR9YCwgKGVyciwgYm90dG9tTGVmdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG1wSW1nID0gbmV3IENhbnZhcy5JbWFnZTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSBib3R0b21MZWZ0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSh0bXBJbWcsICgoSU1XIC8gMikgLSAodG1wSW1nLndpZHRoKSkgLyAyLCBJTUggLSB0bXBJbWcuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gSW1tYWdpbmUgbGlzIGNvZGVcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5saXNDb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbnZhcyA9IENhbnZhcy5jcmVhdGVDYW52YXMoKTtcclxuICAgICAgICAgICAgICAgICAgSnNCYXJjb2RlKG5ld0NhbnZhcywgcGRmQ29uZi5saXNDb2RlLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDMsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxMzAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAzMCxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBwZGZDb25mLmxpc0NvZGVUZXh0XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCB0bXBJbWcgPSBuZXcgQ2FudmFzLkltYWdlO1xyXG4gICAgICAgICAgICAgICAgICB0bXBJbWcuc3JjID0gbmV3Q2FudmFzLnRvQnVmZmVyKCk7XHJcbiAgICAgICAgICAgICAgICAgIC8vIDM1MDIgOiAyNjAwID0gSU1IIDogeFxyXG4gICAgICAgICAgICAgICAgICBjb25zdCBoID0gZ2V0UmVhbEgoMjU3MCk7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHcgPSAoKElNVyAvIDIpIC0gdG1wSW1nLndpZHRoKSAvIDI7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodG1wSW1nLCB3LCBoKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYubGlzQ29kaWNlRW1pdHRlbnRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCg0MSl9cHggQXJpYWxgO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmxpc0NvZGljZUVtaXR0ZW50ZSwgZ2V0UmVhbFcoMzk4KSwgZ2V0UmVhbEgoMjc5NSkpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLmxpc0NvZGljZUNvbnRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCg0MSl9cHggQXJpYWxgO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmxpc0NvZGljZUNvbnRvLCBnZXRSZWFsVygzOTgpLCBnZXRSZWFsSCgyODU4KSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYubGlzSW1wb3J0bykge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoNDEpfXB4IEFyaWFsYDtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5saXNJbXBvcnRvLCBnZXRSZWFsVygzOTgpLCBnZXRSZWFsSCgyOTE4KSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oIC8vIE5vbWUgZGViaXRvcmVcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5ub21lRGViaXRvcmUgJiYgcGRmQ29uZi50eXBlICE9PSAnbGlzJykge1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbFcoMzUpfXB4IEFyaWFsYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMzIwMCksIGdldFJlYWxIKDE2ODYpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYubm9tZURlYml0b3JlLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC50aGVuKCAvLyBJbmRpcml6em8gZGViaXRvcmVcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5yZXNpZGVuemFSaWdhVW5vICYmIHBkZkNvbmYudHlwZSAhPT0gJ2xpcycpIHtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDM1KX1weCBBcmlhbGA7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTMyMDApLCBnZXRSZWFsSCgxNzI1KSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLnJlc2lkZW56YVJpZ2FVbm8sIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5yZXNpZGVuemFSaWdhRHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYucmVzaWRlbnphUmlnYUR1ZSwgMCwgZ2V0UmVhbEgoMzUgKyAzNS8zKSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC50aGVuKCAvLyBOb21lIGRlYml0b3JlIDJcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5ub21lRGViaXRvcmUgJiYgcGRmQ29uZi50eXBlICE9PSAnbGlzJykge1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbFcoMzUpfXB4IEFyaWFsYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTAyMyksIGdldFJlYWxIKDE2ODYpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYubm9tZURlYml0b3JlLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC50aGVuKCAvLyBJbmRpcml6em8gZGViaXRvcmUgMlxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLnJlc2lkZW56YVJpZ2FVbm8gJiYgcGRmQ29uZi50eXBlICE9PSAnbGlzJykge1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoMzUpfXB4IEFyaWFsYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTAyMyksIGdldFJlYWxIKDE3MjUpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYucmVzaWRlbnphUmlnYVVubywgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLnJlc2lkZW56YVJpZ2FEdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5yZXNpZGVuemFSaWdhRHVlLCAwLCBnZXRSZWFsSCgzNSArIDM1LzMpKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oIC8vIEluZGlyaXp6byBkZWJpdG9yZSAyXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYucmVzaWRlbnphUmlnYVVubyAmJiBwZGZDb25mLnR5cGUgIT09ICdsaXMnKSB7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoLTkwICogb25lRGVnKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCgzNSl9cHggQXJpYWxgO1xyXG4gICAgICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKGdldFJlYWxXKC0xMDIzKSwgZ2V0UmVhbEgoMTcyNSkpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5yZXNpZGVuemFSaWdhVW5vLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYucmVzaWRlbnphUmlnYUR1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLnJlc2lkZW56YVJpZ2FEdWUsIDAsIGdldFJlYWxIKDM1ICsgMzUvMykpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gQ2F1c2FsZVxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLmNhdXNhbGVSaWdhVW5vICYmIHBkZkNvbmYudHlwZSAhPT0gJ2xpcycpIHtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDMwKX1weCBBcmlhbGA7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTMzODMpLCBnZXRSZWFsSCgxOTAwKSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmNhdXNhbGVSaWdhVW5vLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuY2F1c2FsZVJpZ2FEdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5jYXVzYWxlUmlnYUR1ZSwgMCwgZ2V0UmVhbEgoMzApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5jYXVzYWxlUmlnYVRyZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmNhdXNhbGVSaWdhVHJlLCAwLCBnZXRSZWFsSCgzMCArIDMwKSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuY2F1c2FsZVJpZ2FRdWF0dHJvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYuY2F1c2FsZVJpZ2FRdWF0dHJvLCAwLCBnZXRSZWFsSCgzMCArIDMwICsgMzApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oIC8vIENhdXNhbGUgMlxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLmNhdXNhbGVSaWdhVW5vICYmIHBkZkNvbmYudHlwZSAhPT0gJ2xpcycpIHtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDMwKX1weCBBcmlhbGA7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTE4NTUpLCBnZXRSZWFsSCgxOTAwKSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmNhdXNhbGVSaWdhVW5vLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuY2F1c2FsZVJpZ2FEdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5jYXVzYWxlUmlnYUR1ZSwgMCwgZ2V0UmVhbEgoMzApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5jYXVzYWxlUmlnYVRyZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmNhdXNhbGVSaWdhVHJlLCAwLCBnZXRSZWFsSCgzMCArIDMwKSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuY2F1c2FsZVJpZ2FRdWF0dHJvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYuY2F1c2FsZVJpZ2FRdWF0dHJvLCAwLCBnZXRSZWFsSCgzMCArIDMwICsgMzApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oIC8vIE5vbWUgY3JlZGl0b3JlXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYubm9tZUNyZWRpdG9yZSAmJiBwZGZDb25mLnR5cGUgIT09ICdsaXMnKSB7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoLTkwICogb25lRGVnKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCgzNSl9cHggRGVqYXZ1IFNhbnNgO1xyXG4gICAgICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKGdldFJlYWxXKC0zMzgwKSwgZ2V0UmVhbEgoMTU1MCkpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5ub21lQ3JlZGl0b3JlLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDM1KX1weCBEZWphdnUgU2Fuc2A7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTE4NTUpLCBnZXRSZWFsSCgxNTUwKSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLm5vbWVDcmVkaXRvcmUsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oIC8vIEMvQyBDcmVkaXRvcmVcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5jb250b0NvcnJlbnRlQ3JlZGl0b3JlICYmIHBkZkNvbmYudHlwZSAhPT0gJ2xpcycpIHtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDM1KX1weCBEZWphdnUgU2Fuc2A7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTI4ODQpLCBnZXRSZWFsSCgxMzg5KSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChwZGZDb25mLmNvbnRvQ29ycmVudGVDcmVkaXRvcmUsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoMzUpfXB4IERlamF2dSBTYW5zYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTU2OCksIGdldFJlYWxIKDEzODEpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYuY29udG9Db3JyZW50ZUNyZWRpdG9yZSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gaW1wb3J0byBCb2xsZXR0aW5vXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuaW1wb3J0b0JvbGxldHRpbm8gJiYgcGRmQ29uZi50eXBlICE9PSAnbGlzJykge1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoMzUpfXB4IERlamF2dSBTYW5zYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMjQwMCksIGdldFJlYWxIKDEzNzUpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYuaW1wb3J0b0JvbGxldHRpbm8sIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoMzUpfXB4IERlamF2dSBTYW5zYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtNjI4KSwgZ2V0UmVhbEgoMTM5NCkpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5pbXBvcnRvQm9sbGV0dGlubywgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gaW1wb3J0b09DUiArIGNvbnRvY29ycmVudGVPQ1IgKyB0aXBvT0NSXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuY29kaWNlY2xpZW50ZU9DUiAmJiBwZGZDb25mLnR5cGUgIT09ICdsaXMnKSB7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoLTkwICogb25lRGVnKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCg0Nil9cHggT2NyQmA7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTE4MDApLCBnZXRSZWFsSCgyMzY2KSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChgPCR7cGRmQ29uZi5jb2RpY2VjbGllbnRlT0NSfT4gICAgICR7cGRmQ29uZi5pbXBvcnRvT0NSfT4gICR7cGRmQ29uZi5jb250b2NvcnJlbnRlT0NSfTwgIDg5Nj5gLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgLy8gY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTgxNSksIGdldFJlYWxIKDIzOTEpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnJvdGF0ZSgtOTAgKiBvbmVEZWcpO1xyXG4gICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDQ2KX1weCBPY3JCYDtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTgwMCksIGdldFJlYWxIKDE2ODYpKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KGAke3BkZkNvbmYuY29kaWNlY2xpZW50ZU9DUn1gLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoLTkwICogb25lRGVnKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LmZvbnQgPSBgJHtnZXRSZWFsSCg0Nil9cHggT2NyQmA7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoZ2V0UmVhbFcoLTE3ODcpLCBnZXRSZWFsSCgxNDcwKSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dCgnODk2JywgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gSW1tYWdpbmUgYmFyY29kZSBvcml6em9udGFsZVxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwZGZDb25mLmJhcmNvZGVDb2RlICYmIHBkZkNvbmYudHlwZSAhPT0gJ2xpcycpIHtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgbmV3Q2FudmFzID0gQ2FudmFzLmNyZWF0ZUNhbnZhcygpO1xyXG4gICAgICAgICAgICAgICAgICBKc0JhcmNvZGUobmV3Q2FudmFzLCBwZGZDb25mLmJhcmNvZGVDb2RlLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDMsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxMzAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAzMCxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBwZGZDb25mLmJhcmNvZGVDb2RlXHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCB0bXBJbWcgPSBuZXcgQ2FudmFzLkltYWdlO1xyXG4gICAgICAgICAgICAgICAgICB0bXBJbWcuc3JjID0gbmV3Q2FudmFzLnRvQnVmZmVyKCk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5yb3RhdGUoLTkwICogb25lRGVnKTtcclxuICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMTUwIC10bXBJbWcud2lkdGgpLCBnZXRSZWFsSCgxODgwKSk7XHJcbiAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodG1wSW1nLCAwLCAxMDApO1xyXG4gICAgICAgICAgICAgICAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gSW1tYWdpbmUgZGF0YSBtYXRyaXhcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5iYXJjb2RlQ29kZSAmJiBwZGZDb25mLnR5cGUgIT09ICdsaXMnKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRlbXAub3BlbignbXlwcmVmaXgnLCAoZXJyLCBuZXdmaWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcy53cml0ZShuZXdmaWxlLmZkLCBwZGZDb25mLmJhcmNvZGVDb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnMuY2xvc2UobmV3ZmlsZS5mZCwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNtZCA9IGAvYmluL2RtdHh3cml0ZSAke25ld2ZpbGUucGF0aH0gLXMgMTZ4NDggLWQgMTEgLW0gMSAtbyAke25ld2ZpbGUucGF0aH0ucG5nYDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZFByb2Nlc3MuZXhlYyhgJHtjbWR9YCwgKHhFcnIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh4RXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoeEVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKGAke25ld2ZpbGUucGF0aH0ucG5nYCwgKGVyciwgbmV3RmlsZUNvbnRlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0bXBJbWcgPSBuZXcgQ2FudmFzLkltYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSBuZXdGaWxlQ29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHgucm90YXRlKC05MCAqIG9uZURlZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShnZXRSZWFsVygtMjUzMyksIGdldFJlYWxIKDIyMzgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKHRtcEltZywgMCwgMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmsoYCR7bmV3ZmlsZS5uYW1lfS5wbmdgLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmsoYCR7bmV3ZmlsZS5uYW1lfWAsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FudmFzLnBkZlN0cmVhbSgpXHJcbiAgICAgICAgICAgICAgICAucGlwZShyZXMpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbmV4dCg0MDQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgKGUpID0+IFByb21pc2UucmVqZWN0KGUpXHJcbiAgICApO1xyXG4vKlxyXG4gICAgY29uc3QgcGRmQ29uZiA9IHtcclxuICAgICAgYmFzZUZpbGU6ICdpbWFnZXMvYmJpYW5jby5wbmcnLFxyXG4gICAgICB0b3BMZWZ0OiAnaW1hZ2VzL2Zhc3R3ZWJfbGVmdF90b3AucG5nJyxcclxuICAgICAgYm90dG9tTGVmdDogJ2ltYWdlcy9mYXN0d2ViX2xlZnRfYm90dG9tLnBuZycsXHJcbiAgICAgIGxpc0NvZGU6ICc0MTU4MDk5OTk5MDA0NTY2ODAyMDAwMjAxNzAwMDc2MDAyNjMzNDM5MDIwMDYwOTEnLFxyXG4gICAgICBsaXNDb2RlVGV4dDogJyg0MTUpODA5OTk5OTAwNDU2Nig4MDIpMDAwMjAxNzAwMDc2MDAyNjMzNCgzOTAyKTAwNjA5MScsXHJcbiAgICAgIGxpc0NvZGljZUVtaXR0ZW50ZTogJzgwOTk5OTkwMDQ1NjYnLFxyXG4gICAgICBsaXNDb2RpY2VDb250bzogJzAwMDIwMTcwMDA3NjAwMjYzMzQnLFxyXG4gICAgICBsaXNJbXBvcnRvOiAnNjAsOTEnLFxyXG4gICAgICBub21lRGViaXRvcmU6ICdTY2hpcm8gTW9uaWNhJyxcclxuICAgICAgcmVzaWRlbnphUmlnYVVubzogJ0wuZ28gT2xnaWF0YSAxOScsXHJcbiAgICAgIHJlc2lkZW56YVJpZ2FEdWU6ICdSb21hIDAwMTAwIHJtJyxcclxuICAgICAgbm9tZUNyZWRpdG9yZTogJ0ZBU1RXRUIgUy5QLkEuJyxcclxuICAgICAgY29udG9Db3JyZW50ZUNyZWRpdG9yZTogJzE0MjQ0NTUnLFxyXG4gICAgICBpbXBvcnRvQm9sbGV0dGlubzogJzYwLDkxJyxcclxuICAgICAgY29kaWNlY2xpZW50ZU9DUjogJzE3MDAwMDAwMDc2MDAyNjMzNScsXHJcbiAgICAgIGltcG9ydG9PQ1I6ICcwMDAwMDA2MCs5MScsXHJcbiAgICAgIGNvbnRvY29ycmVudGVPQ1I6ICcwMDAwMTQyNDQyNTUnLFxyXG4gICAgICB0aXBvT0NSOiAnODk2JyxcclxuICAgICAgYmFyY29kZUNvZGU6ICcxODE3MDAwMDAwMDc2MDAyNjMzNTEyMDAwMDE0MjQ0MjU1MTAwMDAwMDA2MDkxMzg5NidcclxuXHJcbiAgICB9O1xyXG4qL1xyXG5cclxuICB9XHJcblxyXG4gIGdldEludHJvKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZGVzY3JpcHRpb247XHJcbiAgfVxyXG5cclxuICBnZXRUaXRsZSgpIHtcclxuICAgIHJldHVybiB0aGlzLnRpdGxlO1xyXG4gIH1cclxuXHJcbiAgZ2V0UmVhZHkocmVxKSB7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgIGRiUmVjb3JkLFxyXG4gICAgICBmdWxsRGJSZWNvcmRzXHJcbiAgICB9ID0gdGhpcy5zZXNzaW9uO1xyXG5cclxuICAgIC8qXHJcbiAgICBjb25zb2xlLmxvZygnZnVsbERiUmVjb3JkcycsIGZ1bGxEYlJlY29yZHMuZmF0dHVyZSk7XHJcbiAgICAqL1xyXG5cclxuICAgIGNvbnN0IG1haW5Db25mID0ge307XHJcbiAgICBpZiAodGhpcy5wYXJhbTEgJiYgdGhpcy5wYXJhbTEubGVuZ3RoICYmIHR5cGVvZiB0aGlzLnBhcmFtMSA9PT0gJ3N0cmluZycgJiYgdGhpcy5wYXJhbTFbMF0gPT09ICd7Jykge1xyXG4gICAgICBPYmplY3QuYXNzaWduKG1haW5Db25mLCBKU09OLnBhcnNlKHRoaXMucGFyYW0xKSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBhbmFncmFmaWNhID0gZnVsbERiUmVjb3Jkcy5hbmFncmFmaWNhO1xyXG4gICAgbWFpbkNvbmYubm9tZURlYml0b3JlID0gYW5hZ3JhZmljYS5EZWJpdG9yZTtcclxuICAgIG1haW5Db25mLnJlc2lkZW56YVJpZ2FVbm8gPSBhbmFncmFmaWNhLkluZGlyaXp6bztcclxuICAgIG1haW5Db25mLnJlc2lkZW56YVJpZ2FEdWUgPSBgJHthbmFncmFmaWNhLkNBUCA/IGFuYWdyYWZpY2EuQ0FQIDogJyd9ICR7YW5hZ3JhZmljYS5DaXR0YX1gO1xyXG4gICAgbWFpbkNvbmYudGlwb09DUiA9ICc4OTYnO1xyXG5cclxuICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25zID0gZnVsbERiUmVjb3Jkcy5mYXR0dXJlLm1hcCgoZmF0dHVyYSwgcG9zKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBkZkNvbmYgPSBPYmplY3QuYXNzaWduKHt9LCBtYWluQ29uZik7XHJcbiAgICAgIGNvbnN0IGltcG9ydG8gPSBmYXR0dXJhLkltcG9ydG9BemlvbmF0bztcclxuICAgICAgY29uc3QgaW1wb3J0b0FzVGV4dCA9IGZhdHR1cmEuSW1wb3J0b0F6aW9uYXRvLnRvRml4ZWQoMik7XHJcbiAgICAgIHBkZkNvbmYuaW1wb3J0byA9IGltcG9ydG87XHJcbiAgICAgIHBkZkNvbmYuaW1wb3J0b0JvbGxldHRpbm8gPSBpbXBvcnRvQXNUZXh0LnJlcGxhY2UoJy4nLCAnLCcpO1xyXG5cclxuICAgICAgY29uc3QgdW5kZXJzY29yZVBvc2l0aW9uID0gZmF0dHVyYS5OdW1GYXR0dXJhLmluZGV4T2YoJ18nKTtcclxuICAgICAgY29uc3QgY29kaWNlRmF0dHVyYSA9IGZhdHR1cmEuTnVtRmF0dHVyYS5zbGljZSgoZmF0dHVyYS5OdW1GYXR0dXJhLmxlbmd0aCAtIHVuZGVyc2NvcmVQb3NpdGlvbiAtIDEpICogLTEpO1xyXG4gICAgICBwZGZDb25mLm51bWVyb0ZhdHR1cmEgPSBjb2RpY2VGYXR0dXJhO1xyXG4gICAgICBjb25zdCBuRmF0dHVyYSA9IGNvZGljZUZhdHR1cmEucmVwbGFjZSggL15cXEQrL2csICcnKTtcclxuICAgICAgY29uc3QgcmVzaWRlbnppYWxlID0gY29kaWNlRmF0dHVyYS5pbmRleE9mKCdNJykgPiAtMTtcclxuICAgICAgaWYgKHBkZkNvbmYuY29udG9jb3JyZW50ZU9DUikge1xyXG4gICAgICAgIGlmIChyZXNpZGVuemlhbGUpIHtcclxuICAgICAgICAgIHBkZkNvbmYuaW1wb3J0b09DUiA9IGJvbGxldHRpbm9NZXRob2QubGVmdFBhZChpbXBvcnRvQXNUZXh0LnJlcGxhY2UoJy4nLCAnKycpLCAxMSk7XHJcbiAgICAgICAgICAvLyAxNzAwMDAwMDA3NjAwMjYzMzVcclxuICAgICAgICAgIGNvbnN0IGFubm9mYXR0dXJhID0gKG5ldyBEYXRlKGZhdHR1cmEuZGF0YWZhdHR1cmEpKS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgY29uc3QgdG1wQ29kaWNlQ2xpZW50ZUNsaWVudGVPY3IgPSBgJHthbm5vZmF0dHVyYS50b1N0cmluZygpLnNsaWNlKC0yKX04ODgke2JvbGxldHRpbm9NZXRob2QubGVmdFBhZChuRmF0dHVyYS50b1N0cmluZygpLCAxMSl9YDtcclxuICAgICAgICAgIGNvbnN0IHJlbWFpbmRlciA9IHBhcnNlSW50KHRtcENvZGljZUNsaWVudGVDbGllbnRlT2NyLCAxMCkgJSA5MztcclxuICAgICAgICAgIHBkZkNvbmYuY29kaWNlY2xpZW50ZU9DUiA9IGAke3RtcENvZGljZUNsaWVudGVDbGllbnRlT2NyfSR7cmVtYWluZGVyfWA7XHJcbiAgICAgICAgICAvLzE4MTcwMDAwMDAwNzYwMDI2MzM1MTIwMDAwMTQyNDQyNTUxMDAwMDAwMDYwOTEzODk2XHJcbiAgICAgICAgICAvLzE4IDE3MDAwMDAwMDc2MDAyNjMzNSAxMiAwMDAwMTQyNDQyNTUgMTAgMDAwMDAwNjA5MSAzIDg5NlxyXG4gICAgICAgICAgcGRmQ29uZi5iYXJjb2RlQ29kZSA9IGAxOCR7cGRmQ29uZi5jb2RpY2VjbGllbnRlT0NSfTEyJHtwZGZDb25mLmNvbnRvY29ycmVudGVPQ1J9MTAke2JvbGxldHRpbm9NZXRob2QubGVmdFBhZChpbXBvcnRvQXNUZXh0LnJlcGxhY2UoJy4nLCcnKSwxMCl9Mzg5NmA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIDAwMDAwMDYwKzkxXHJcbiAgICAgICAgICBwZGZDb25mLmltcG9ydG9PQ1IgPSBib2xsZXR0aW5vTWV0aG9kLmxlZnRQYWQoaW1wb3J0b0FzVGV4dC5yZXBsYWNlKCcuJywgJysnKSwgMTEpO1xyXG4gICAgICAgICAgLy8gMTcwMDAwMDAwNzYwMDI2MzM1XHJcbiAgICAgICAgICBjb25zdCBhbm5vZmF0dHVyYSA9IChuZXcgRGF0ZShmYXR0dXJhLmRhdGFmYXR0dXJhKSkuZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgIGNvbnN0IHRtcENvZGljZUNsaWVudGVDbGllbnRlT2NyID0gYCR7YW5ub2ZhdHR1cmEudG9TdHJpbmcoKS5zbGljZSgtMil9JHtib2xsZXR0aW5vTWV0aG9kLmxlZnRQYWQobkZhdHR1cmEudG9TdHJpbmcoKSwgMTQpfWA7XHJcbiAgICAgICAgICBjb25zdCByZW1haW5kZXIgPSBwYXJzZUludCh0bXBDb2RpY2VDbGllbnRlQ2xpZW50ZU9jciwgMTApICUgOTM7XHJcbiAgICAgICAgICBwZGZDb25mLmNvZGljZWNsaWVudGVPQ1IgPSBgJHt0bXBDb2RpY2VDbGllbnRlQ2xpZW50ZU9jcn0ke3JlbWFpbmRlcn1gO1xyXG4gICAgICAgICAgLy8xODE3MDAwMDAwMDc2MDAyNjMzNTEyMDAwMDE0MjQ0MjU1MTAwMDAwMDA2MDkxMzg5NlxyXG4gICAgICAgICAgLy8xOCAxNzAwMDAwMDA3NjAwMjYzMzUgMTIgMDAwMDE0MjQ0MjU1IDEwIDAwMDAwMDYwOTEgMyA4OTZcclxuICAgICAgICAgIHBkZkNvbmYuYmFyY29kZUNvZGUgPSBgMTgke3BkZkNvbmYuY29kaWNlY2xpZW50ZU9DUn0xMiR7cGRmQ29uZi5jb250b2NvcnJlbnRlT0NSfTEwJHtib2xsZXR0aW5vTWV0aG9kLmxlZnRQYWQoaW1wb3J0b0FzVGV4dC5yZXBsYWNlKCcuJywnJyksMTApfTM4OTZgO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAocGRmQ29uZi5saXNDb2RpY2VFbWl0dGVudGUpIHtcclxuICAgICAgICBpZiAocmVzaWRlbnppYWxlKSB7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBhbm5vZmF0dHVyYSA9IChuZXcgRGF0ZShmYXR0dXJhLmRhdGFmYXR0dXJhKSkuZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgIGNvbnN0IGZhdHR1cmFsdW5nYSA9IGJvbGxldHRpbm9NZXRob2QubGVmdFBhZChuRmF0dHVyYSwgMTApO1xyXG4gICAgICAgICAgY29uc3QgYW5ub2x1bmdvID0gYm9sbGV0dGlub01ldGhvZC5sZWZ0UGFkKGFubm9mYXR0dXJhLnRvU3RyaW5nKCksIDYpO1xyXG4gICAgICAgICAgY29uc3QgY29kaWNlQ29udG9UbXAgPSBgJHthbm5vbHVuZ299JHtmYXR0dXJhbHVuZ2F9YDtcclxuICAgICAgICAgIGNvbnN0IGNvZGljZUNvbnRvQXNOdW1iZXIgPSBwYXJzZUludChjb2RpY2VDb250b1RtcCwgMTApO1xyXG4gICAgICAgICAgY29uc3QgcmVtYWluZGVyID0gY29kaWNlQ29udG9Bc051bWJlciAlIDkzO1xyXG4gICAgICAgICAgY29uc3QgY29kaWNlQ29udG8gPSBgJHthbm5vbHVuZ299JHtmYXR0dXJhbHVuZ2F9JHtyZW1haW5kZXJ9YDtcclxuICAgICAgICAgIHBkZkNvbmYubGlzQ29kaWNlQ29udG8gPSBjb2RpY2VDb250bztcclxuICAgICAgICAgIHBkZkNvbmYubGlzSW1wb3J0byA9IGltcG9ydG9Bc1RleHQucmVwbGFjZSgnLicsICcsJyk7XHJcbiAgICAgICAgICBwZGZDb25mLmxpc0NvZGUgPSBgNDE1JHtwZGZDb25mLmxpc0NvZGljZUVtaXR0ZW50ZX04MDIwJHtjb2RpY2VDb250b30zOTAyJHtib2xsZXR0aW5vTWV0aG9kLmxlZnRQYWQoaW1wb3J0b0FzVGV4dC5yZXBsYWNlKCcuJywgJycpLCA2KX1gO1xyXG4gICAgICAgICAgcGRmQ29uZi5saXNDb2RlVGV4dCA9IGAoNDE1KSR7cGRmQ29uZi5saXNDb2RpY2VFbWl0dGVudGV9KDgwMjApJHtjb2RpY2VDb250b30oMzkwMikke2JvbGxldHRpbm9NZXRob2QubGVmdFBhZChpbXBvcnRvQXNUZXh0LnJlcGxhY2UoJy4nLCAnJyksIDYpfWA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHBkZkNvbmYuY2F1c2FsZVJpZ2FVbm8gPSBgTi4gRkFUVFVSQTogJHtuRmF0dHVyYX1gO1xyXG4gICAgICBwZGZDb25mLmNhdXNhbGVSaWdhRHVlID0gYERBVEEgRkFUVFVSQTogJHttb21lbnQoZmF0dHVyYS5kYXRhZmF0dHVyYSkuZm9ybWF0KCdERC9NTS9ZWVlZJyl9YDtcclxuICAgICAgLy8gcGRmQ29uZi5jYXVzYWxlUmlnYVRyZSA9ICdQcm92YSAzJztcclxuICAgICAgLy8gcGRmQ29uZi5jYXVzYWxlUmlnYVF1YXR0cm8gPSAnUHJvdmEgNCc7XHJcbiAgICAgIHJldHVybiBwZGZDb25mO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBhc3luYy5tYXBTZXJpZXMoY29uZmlndXJhdGlvbnMsIChwZGZDb25mLCBjYikgPT4ge1xyXG4gICAgICAgIGlmIChwZGZDb25mLmltcG9ydG8gPiAwKSB7XHJcbiAgICAgICAgICBjb25zdCBzcWwgPSBgSU5TRVJUIGludG8gb25saW5lUGF5bWVudFRyYW5zYWN0aW9ucyAobW9kdWxlLCBmdWxsQ29uZmlnLCBwYXltZW50SWQsIGlkQ29udHJhdHRvKSBWQUxVRVMgKFxyXG4gICAgICAgICAgICAke3RoaXMuZGIuZXNjYXBlKCdib2xsZXR0aW5vJyl9LFxyXG4gICAgICAgICAgICAke3RoaXMuZGIuZXNjYXBlKEpTT04uc3RyaW5naWZ5KHBkZkNvbmYpKX0sXHJcbiAgICAgICAgICAgICR7dGhpcy5kYi5lc2NhcGUodGhpcy5wYXltZW50SWQpfSxcclxuICAgICAgICAgICAgJHt0aGlzLmRiLmVzY2FwZSh0aGlzLmlkY29udHJhdHRvKX1cclxuICAgICAgICAgIClgO1xyXG4gICAgICAgICAgdGhpcy5kYi5xdWVyeShzcWwpXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNiKG51bGwsIHtpZDogcmVzdWx0Lmluc2VydElkLCBuYW1lOiBwZGZDb25mLnR5cGUgIT09ICdsaXMnID8gYE1vc3RyYSBib2xsZXR0aW5vIHBlciBsYSBmYXR0dXJhICR7cGRmQ29uZi5udW1lcm9GYXR0dXJhfWAgOiBgTW9zdHJhIGNvZGljZSBMSVMgcGVyIGxhIGZhdHR1cmEgJHtwZGZDb25mLm51bWVyb0ZhdHR1cmF9YCB9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGUpID0+IHtcclxuICAgICAgICAgICAgICBjYihlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY2IobnVsbCwgbnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCAoZXJyLCByZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycikgcmVqZWN0KGVycik7XHJcbiAgICAgICAgdGhpcy5ib2xsZXR0aW5pID0gcmVzdWx0cztcclxuICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gY29uc29sZS5sb2cocGRmQ29uZik7XHJcbiAgICAvLyBjb25zb2xlLmxvZygncGFyYW0xIGJvbGxldHRpbm8nLCB0aGlzLnBhcmFtMSk7XHJcbiAgICAvLyBjb25zb2xlLmxvZygncGFyYW0yJywgdGhpcy5wYXJhbTIpO1xyXG4gICAgLy8gY29uc29sZS5sb2coJ3BhcmFtMycsIHRoaXMucGFyYW0zKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKCd0aGlzJywgdGhpcyk7XHJcbiAgICAvL1xyXG4gICAgLy8gY29uc3QgcGRmQ29uZiA9IHtcclxuICAgIC8vICAgYmFzZUZpbGU6ICdiYmlhbmNvLnBuZycsXHJcbiAgICAvLyAgIHRvcExlZnQ6ICdmYXN0d2ViX2xlZnRfdG9wLnBuZycsXHJcbiAgICAvLyAgIGJvdHRvbUxlZnQ6ICdmYXN0d2ViX2xlZnRfYm90dG9tLnBuZycsXHJcblxyXG4gICAgLy8gICBsaXNDb2RlOiBgYCwgLy8gJzQxNTgwOTk5OTkwMDQ1NjY4MDIwMDAyMDE3MDAwNzYwMDI2MzM0MzkwMjAwNjA5MScsXHJcbiAgICAvLyAgIGxpc0NvZGVUZXh0OiAnKDQxNSk4MDk5OTk5MDA0NTY2KDgwMikwMDAyMDE3MDAwNzYwMDI2MzM0KDM5MDIpMDA2MDkxJyxcclxuICAgIC8vICAgbGlzQ29kaWNlRW1pdHRlbnRlOiAnODA5OTk5OTAwNDU2NicsXHJcbiAgICAvLyAgIGxpc0NvZGljZUNvbnRvOiAnMDAwMjAxNzAwMDc2MDAyNjMzNCcsXHJcbiAgICAvLyAgIGxpc0ltcG9ydG86ICc2MCw5MScsXHJcbiAgICAvLyAgIG5vbWVEZWJpdG9yZTogJ1NjaGlybyBNb25pY2EnLFxyXG4gICAgLy8gICByZXNpZGVuemFSaWdhVW5vOiAnTC5nbyBPbGdpYXRhIDE5JyxcclxuICAgIC8vICAgcmVzaWRlbnphUmlnYUR1ZTogJ1JvbWEgMDAxMDAgcm0nLFxyXG4gICAgLy8gICBub21lQ3JlZGl0b3JlOiAnRkFTVFdFQiBTLlAuQS4nLFxyXG4gICAgLy8gICBjb250b0NvcnJlbnRlQ3JlZGl0b3JlOiAnMTQyNDQ1NScsXHJcbiAgICAvLyAgIGltcG9ydG9Cb2xsZXR0aW5vOiAnNjAsOTEnLFxyXG4gICAgLy8gICBjb2RpY2VjbGllbnRlT0NSOiAnMTcwMDAwMDAwNzYwMDI2MzM1JyxcclxuICAgIC8vICAgaW1wb3J0b09DUjogJzAwMDAwMDYwKzkxJyxcclxuICAgIC8vICAgY29udG9jb3JyZW50ZU9DUjogJzAwMDAxNDI0NDI1NScsXHJcbiAgICAvLyAgIHRpcG9PQ1I6ICc4OTYnLFxyXG4gICAgLy8gICBiYXJjb2RlQ29kZTogJzE4MTcwMDAwMDAwNzYwMDI2MzM1MTIwMDAwMTQyNDQyNTUxMDAwMDAwMDYwOTEzODk2J1xyXG4gICAgLy8gfTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHJlc29sdmUoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZ2V0Rm9ybSgpIHtcclxuICAgIHJldHVybiBgXHJcbiAgICA8ZGl2PlxyXG4gICAgICAke3RoaXMuYm9sbGV0dGluaS5tYXAoKGMpID0+IHtcclxuICAgICAgICByZXR1cm4gYDxhIGNsYXNzPVwiYnRuIGJ0bi1zdWNjZXNzXCIgdGFyZ2V0PVwiX25ld1wiIGhyZWY9XCIvY2FsbGJhY2svbG90dG9tYXRpY2FfcGRmP2lkPSR7Yy5pZH1cIj4ke2MubmFtZX08L2E+YDtcclxuICAgICAgfSkuam9pbignPGJyLz4nKX1cclxuICAgIDwvZGl2PlxyXG4gICAgYDtcclxuICB9XHJcbn1cclxuIl19