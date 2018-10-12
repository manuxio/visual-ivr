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

var lisMethod = function (_baseMethod) {
  _inherits(lisMethod, _baseMethod);

  function lisMethod() {
    _classCallCheck(this, lisMethod);

    return _possibleConstructorReturn(this, (lisMethod.__proto__ || Object.getPrototypeOf(lisMethod)).apply(this, arguments));
  }

  _createClass(lisMethod, [{
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
            pdfConf.importoOCR = lisMethod.leftPad(importoAsText.replace('.', '+'), 11);
            // 170000000760026335
            var annofattura = new Date(fattura.datafattura).getFullYear();
            var tmpCodiceClienteClienteOcr = annofattura.toString().slice(-2) + '888' + lisMethod.leftPad(nFattura.toString(), 11);
            var remainder = parseInt(tmpCodiceClienteClienteOcr, 10) % 93;
            pdfConf.codiceclienteOCR = '' + tmpCodiceClienteClienteOcr + remainder;
            //18170000000760026335120000142442551000000060913896
            //18 170000000760026335 12 000014244255 10 0000006091 3 896
            pdfConf.barcodeCode = '18' + pdfConf.codiceclienteOCR + '12' + pdfConf.contocorrenteOCR + '10' + lisMethod.leftPad(importoAsText.replace('.', ''), 10) + '3896';
          } else {
            // 00000060+91
            pdfConf.importoOCR = lisMethod.leftPad(importoAsText.replace('.', '+'), 11);
            // 170000000760026335
            var _annofattura = new Date(fattura.datafattura).getFullYear();
            var _tmpCodiceClienteClienteOcr = '' + _annofattura.toString().slice(-2) + lisMethod.leftPad(nFattura.toString(), 14);
            var _remainder = parseInt(_tmpCodiceClienteClienteOcr, 10) % 93;
            pdfConf.codiceclienteOCR = '' + _tmpCodiceClienteClienteOcr + _remainder;
            //18170000000760026335120000142442551000000060913896
            //18 170000000760026335 12 000014244255 10 0000006091 3 896
            pdfConf.barcodeCode = '18' + pdfConf.codiceclienteOCR + '12' + pdfConf.contocorrenteOCR + '10' + lisMethod.leftPad(importoAsText.replace('.', ''), 10) + '3896';
          }
        }
        if (pdfConf.lisCodiceEmittente) {

          var _annofattura2 = new Date(fattura.datafattura).getFullYear();
          var fatturalunga = lisMethod.leftPad(nFattura, 10);
          var annolungo = lisMethod.leftPad(_annofattura2.toString(), 6);
          var codiceContoTmp = '' + annolungo + fatturalunga;
          var codiceContoAsNumber = parseInt(codiceContoTmp, 10);
          var _remainder2 = codiceContoAsNumber % 93;
          var codiceConto = '' + annolungo + fatturalunga + _remainder2;
          pdfConf.lisCodiceConto = codiceConto;
          pdfConf.lisImporto = importoAsText.replace('.', ',');
          pdfConf.lisCode = '415' + pdfConf.lisCodiceEmittente + '8020' + codiceConto + '3902' + lisMethod.leftPad(importoAsText.replace('.', ''), 6);
          pdfConf.lisCodeText = '(415)' + pdfConf.lisCodiceEmittente + '(8020)' + codiceConto + '(3902)' + lisMethod.leftPad(importoAsText.replace('.', ''), 6);
          if (pdfConf.lisCodeFields && pdfConf.lisCodeFields.length > 0) {
            pdfConf.lisCodeText = pdfConf.lisCodeFields.map(function (f) {
              return fattura[f];
            }).join('');
            pdfConf.lisCode = pdfConf.lisCodeText.replace(/\(/g, '').replace(/\)/g, '');
            var parts = /(\(415\))([0-9]*)(\(8020\))([0-9]*)(\(3902\))([0-9]*)/.exec(pdfConf.lisCodeText);
            if (parts && parts.length) {
              pdfConf.lisCodiceEmittente = parts[2];
              pdfConf.lisCodiceConto = parts[4];
              pdfConf.lisImporto = (parseInt(parts[6], 10) / 100).toString().replace('.', ',');
            }
            // console.log('Parts', parts);
          }
        }
        pdfConf.causaleRigaUno = 'N. FATTURA: ' + nFattura;
        pdfConf.causaleRigaDue = 'DATA FATTURA: ' + (0, _moment2.default)(fattura.datafattura).format('DD/MM/YYYY');
        // pdfConf.causaleRigaTre = 'Prova 3';
        // pdfConf.causaleRigaQuattro = 'Prova 4';
        return pdfConf;
      });
      // console.log('configurations', configurations.length);
      return new Promise(function (resolve, reject) {
        _async2.default.mapSeries(configurations, function (pdfConf, cb) {
          // console.log('pdfConf', pdfConf);
          if (pdfConf.importo > 0) {
            var sql = 'INSERT into onlinePaymentTransactions (module, fullConfig, paymentId, idContratto) VALUES (\n            ' + _this2.db.escape('bollettino') + ',\n            ' + _this2.db.escape(JSON.stringify(pdfConf)) + ',\n            ' + _this2.db.escape(_this2.paymentId) + ',\n            ' + _this2.db.escape(_this2.idContratto) + '\n          )';
            // console.log('sql', sql);
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
        if (c) {
          return '<a class="btn btn-success" target="_new" href="/callback/fastweblottomatica_pdf?id=' + c.id + '">' + c.name + '</a>';
        } else {
          return '';
        }
      }).join('<br/>') + '\n    </div>\n    ';
    }
  }], [{
    key: 'getCallBackUrls',
    value: function getCallBackUrls() {
      return [{
        url: 'fastweblottomatica_pdf',
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
                    ctx.drawImage(tmpImg, 0, 20);
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
                  height: 100,
                  margin: 0,
                  fontSize: 25,
                  text: pdfConf.lisCodeText
                });
                var tmpImg = new _canvas2.default.Image();
                tmpImg.src = newCanvas.toBuffer();
                // 3502 : 2600 = IMH : x
                var h = getRealH(325);
                var w = (IMW / 2 - tmpImg.width) / 2 - 100;
                ctx.drawImage(tmpImg, w, h);
                if (pdfConf.lisCodiceEmittente) {
                  ctx.font = getRealH(38) + 'px Arial';
                  ctx.fillText(pdfConf.lisCodiceEmittente, getRealW(350), getRealH(520));
                }
                if (pdfConf.lisCodiceConto) {
                  ctx.font = getRealH(38) + 'px Arial';
                  ctx.fillText(pdfConf.lisCodiceConto, getRealW(350), getRealH(570));
                }
                if (pdfConf.lisImporto) {
                  ctx.font = getRealH(38) + 'px Arial';
                  ctx.fillText(pdfConf.lisImporto, getRealW(350), getRealH(620));
                }
                return Promise.resolve();
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

  return lisMethod;
}(_basemethod2.default);

exports.default = lisMethod;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXltZW50bWV0aG9kcy9mYXN0d2VibGlzLmpzIl0sIm5hbWVzIjpbImxpc01ldGhvZCIsImRlc2NyaXB0aW9uIiwidGl0bGUiLCJyZXEiLCJzZXNzaW9uIiwiZGJSZWNvcmQiLCJmdWxsRGJSZWNvcmRzIiwibWFpbkNvbmYiLCJwYXJhbTEiLCJsZW5ndGgiLCJPYmplY3QiLCJhc3NpZ24iLCJKU09OIiwicGFyc2UiLCJhbmFncmFmaWNhIiwibm9tZURlYml0b3JlIiwiRGViaXRvcmUiLCJyZXNpZGVuemFSaWdhVW5vIiwiSW5kaXJpenpvIiwicmVzaWRlbnphUmlnYUR1ZSIsIkNBUCIsIkNpdHRhIiwidGlwb09DUiIsImNvbmZpZ3VyYXRpb25zIiwiZmF0dHVyZSIsIm1hcCIsImZhdHR1cmEiLCJwb3MiLCJwZGZDb25mIiwiaW1wb3J0byIsIkltcG9ydG9BemlvbmF0byIsImltcG9ydG9Bc1RleHQiLCJ0b0ZpeGVkIiwiaW1wb3J0b0JvbGxldHRpbm8iLCJyZXBsYWNlIiwidW5kZXJzY29yZVBvc2l0aW9uIiwiTnVtRmF0dHVyYSIsImluZGV4T2YiLCJjb2RpY2VGYXR0dXJhIiwic2xpY2UiLCJudW1lcm9GYXR0dXJhIiwibkZhdHR1cmEiLCJyZXNpZGVuemlhbGUiLCJjb250b2NvcnJlbnRlT0NSIiwiaW1wb3J0b09DUiIsImxlZnRQYWQiLCJhbm5vZmF0dHVyYSIsIkRhdGUiLCJkYXRhZmF0dHVyYSIsImdldEZ1bGxZZWFyIiwidG1wQ29kaWNlQ2xpZW50ZUNsaWVudGVPY3IiLCJ0b1N0cmluZyIsInJlbWFpbmRlciIsInBhcnNlSW50IiwiY29kaWNlY2xpZW50ZU9DUiIsImJhcmNvZGVDb2RlIiwibGlzQ29kaWNlRW1pdHRlbnRlIiwiZmF0dHVyYWx1bmdhIiwiYW5ub2x1bmdvIiwiY29kaWNlQ29udG9UbXAiLCJjb2RpY2VDb250b0FzTnVtYmVyIiwiY29kaWNlQ29udG8iLCJsaXNDb2RpY2VDb250byIsImxpc0ltcG9ydG8iLCJsaXNDb2RlIiwibGlzQ29kZVRleHQiLCJsaXNDb2RlRmllbGRzIiwiZiIsImpvaW4iLCJwYXJ0cyIsImV4ZWMiLCJjYXVzYWxlUmlnYVVubyIsImNhdXNhbGVSaWdhRHVlIiwiZm9ybWF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJtYXBTZXJpZXMiLCJjYiIsInNxbCIsImRiIiwiZXNjYXBlIiwic3RyaW5naWZ5IiwicGF5bWVudElkIiwiaWRDb250cmF0dG8iLCJxdWVyeSIsInRoZW4iLCJyZXN1bHQiLCJpZCIsImluc2VydElkIiwibmFtZSIsInR5cGUiLCJlIiwiZXJyIiwicmVzdWx0cyIsImJvbGxldHRpbmkiLCJjIiwidXJsIiwibWV0aG9kIiwiaHR0cE1ldGhvZCIsInJlcyIsIm5leHQiLCJkYkNvbm5lY3Rpb24iLCJwYXJhbXMiLCJyZWNvcmQiLCJmdWxsY29uZmlnIiwicmVnaXN0ZXJGb250IiwiZmFtaWx5IiwicmVhZEZpbGUiLCJiYXNlRmlsZSIsIm9uZURlZyIsIk1hdGgiLCJQSSIsImltZyIsIkltYWdlIiwic3JjIiwiSU1XIiwid2lkdGgiLCJJTUgiLCJoZWlnaHQiLCJnZXRSZWFsSCIsImgiLCJnZXRSZWFsVyIsInciLCJjYW52YXMiLCJjcmVhdGVDYW52YXMiLCJjdHgiLCJnZXRDb250ZXh0IiwiZHJhd0ltYWdlIiwidG9wTGVmdCIsInRtcEltZyIsImJvdHRvbUxlZnQiLCJuZXdDYW52YXMiLCJtYXJnaW4iLCJmb250U2l6ZSIsInRleHQiLCJ0b0J1ZmZlciIsImZvbnQiLCJmaWxsVGV4dCIsInBkZlN0cmVhbSIsInBpcGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7SUFFcUJBLFM7Ozs7Ozs7Ozs7OytCQThKUjtBQUNULGFBQU8sS0FBS0MsV0FBWjtBQUNEOzs7K0JBRVU7QUFDVCxhQUFPLEtBQUtDLEtBQVo7QUFDRDs7OzZC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c3R3ZWJsaXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYmFzZU1ldGhvZCBmcm9tICcuL2Jhc2VtZXRob2QnO1xyXG5pbXBvcnQgYmFyY29kZSBmcm9tICdiYXJjb2RlJztcclxuaW1wb3J0IEpzQmFyY29kZSBmcm9tICdqc2JhcmNvZGUnO1xyXG5pbXBvcnQgQ2FudmFzIGZyb20gJ2NhbnZhcyc7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCB0ZW1wIGZyb20gJ3RlbXAnO1xyXG5pbXBvcnQgY2hpbGRQcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgYXN5bmMgZnJvbSAnYXN5bmMnO1xyXG5pbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBsaXNNZXRob2QgZXh0ZW5kcyBiYXNlTWV0aG9kIHtcclxuXHJcbiAgc3RhdGljIGdldENhbGxCYWNrVXJscygpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgIHtcclxuICAgICAgICB1cmw6ICdmYXN0d2VibG90dG9tYXRpY2FfcGRmJyxcclxuICAgICAgICBtZXRob2Q6ICdjcmVhdGVQZGYnLFxyXG4gICAgICAgIGh0dHBNZXRob2Q6ICdnZXQnXHJcbiAgICAgIH1cclxuICAgIF1cclxuICB9XHJcblxyXG4gIHN0YXRpYyBjcmVhdGVQZGYocmVxLCByZXMsIG5leHQpIHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgc2Vzc2lvblxyXG4gICAgfSA9IHJlcTtcclxuICAgIGNvbnN0IGRiID0gcmVxLmRiQ29ubmVjdGlvbjtcclxuICAgIGNvbnN0IHBhcmFtcyA9IHJlcS5xdWVyeTtcclxuICAgIGNvbnN0IHtcclxuICAgICAgaWRcclxuICAgIH0gPSBwYXJhbXMgfHwge307XHJcbiAgICBkYi5xdWVyeShgU0VMRUNUICogRlJPTSBvbmxpbmVQYXltZW50VHJhbnNhY3Rpb25zIFdIRVJFIGlkID0gJHsgZGIuZXNjYXBlKGlkKX1gKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChyZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgaWYgKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIGNvbnN0IHJlY29yZCA9IHJlc3VsdHNbMF07XHJcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnUmVjb3JkJywgcmVjb3JkKTtcclxuICAgICAgICAgIGNvbnN0IHBkZkNvbmYgPSBKU09OLnBhcnNlKHJlY29yZC5mdWxsY29uZmlnKTtcclxuICAgICAgICAgIENhbnZhcy5yZWdpc3RlckZvbnQoYC4vc3JjL3BheW1lbnRtZXRob2RzL2ZvbnRzL0luY29uc29sYXRhLVJlZ3VsYXIudHRmYCwge2ZhbWlseTogJ0luY29uc29sYXRhJ30pO1xyXG4gICAgICAgICAgQ2FudmFzLnJlZ2lzdGVyRm9udChgLi9zcmMvcGF5bWVudG1ldGhvZHMvZm9udHMvT0NSQUVYVC5UVEZgLCB7ZmFtaWx5OiAnT2NyQSd9KTtcclxuICAgICAgICAgIENhbnZhcy5yZWdpc3RlckZvbnQoYC4vc3JjL3BheW1lbnRtZXRob2RzL2ZvbnRzL29jcmIudHRmYCwge2ZhbWlseTogJ09jckInfSk7XHJcblxyXG4gICAgICAgICAgZnMucmVhZEZpbGUoYC4vc3JjL3BheW1lbnRtZXRob2RzLyR7cGRmQ29uZi5iYXNlRmlsZX1gLCAoZXJyLCBiYXNlRmlsZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XHJcbiAgICAgICAgICAgIGNvbnN0IG9uZURlZyA9IE1hdGguUEkgLyAxODA7XHJcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBDYW52YXMuSW1hZ2U7XHJcbiAgICAgICAgICAgIGltZy5zcmMgPSBiYXNlRmlsZTtcclxuICAgICAgICAgICAgY29uc3QgSU1XID0gaW1nLndpZHRoO1xyXG4gICAgICAgICAgICBjb25zdCBJTUggPSBpbWcuaGVpZ2h0O1xyXG4gICAgICAgICAgICBjb25zdCBnZXRSZWFsSCA9IChoKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIElNSCAqIGggLyAzNTAyO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjb25zdCBnZXRSZWFsVyA9ICh3KSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIElNVyAqIHcgLyAyNDMyO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyBjb25zdCBJbmNvbnNvbGF0YSA9IG5ldyBDYW52YXMuRm9udCgnSW5jb25zb2xhdGEnLCBgLi9zcmMvcGF5bWVudG1ldGhvZHMvSW5jb25zb2xhdGEtUmVndWxhci50dGZgKTtcclxuICAgICAgICAgICAgLy8gSW5jb25zb2xhdGEuYWRkRmFjZShgLi9zcmMvcGF5bWVudG1ldGhvZHMvSW5jb25zb2xhdGEtUmVndWxhci50dGZgLCAnbm9ybWFsJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IENhbnZhcy5jcmVhdGVDYW52YXMoSU1XLCBJTUgsICdwZGYnKTtcclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgICAgIC8vIGN0eC5hZGRGb250KEluY29uc29sYXRhKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChwZGZDb25mLnRvcExlZnQpIHtcclxuICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKGAuL3NyYy9wYXltZW50bWV0aG9kcy8ke3BkZkNvbmYudG9wTGVmdH1gLCAoZXJyLCB0b3BMZWZ0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRtcEltZyA9IG5ldyBDYW52YXMuSW1hZ2U7XHJcbiAgICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSB0b3BMZWZ0O1xyXG4gICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKHRtcEltZywgKChJTVcgLyAyKSAtICh0bXBJbWcud2lkdGgpKSAvIDIsIDApO1xyXG4gICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRoZW4oIC8vIEltbWFnaW5lIGJvdHRvbSBsZWZ0XHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYuYm90dG9tTGVmdCkge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZShgLi9zcmMvcGF5bWVudG1ldGhvZHMvJHtwZGZDb25mLmJvdHRvbUxlZnR9YCwgKGVyciwgYm90dG9tTGVmdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG1wSW1nID0gbmV3IENhbnZhcy5JbWFnZTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSBib3R0b21MZWZ0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSh0bXBJbWcsIDAsIDIwKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbiggLy8gSW1tYWdpbmUgbGlzIGNvZGVcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5saXNDb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbnZhcyA9IENhbnZhcy5jcmVhdGVDYW52YXMoKTtcclxuICAgICAgICAgICAgICAgICAgSnNCYXJjb2RlKG5ld0NhbnZhcywgcGRmQ29uZi5saXNDb2RlLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDMsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAyNSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBwZGZDb25mLmxpc0NvZGVUZXh0XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCB0bXBJbWcgPSBuZXcgQ2FudmFzLkltYWdlO1xyXG4gICAgICAgICAgICAgICAgICB0bXBJbWcuc3JjID0gbmV3Q2FudmFzLnRvQnVmZmVyKCk7XHJcbiAgICAgICAgICAgICAgICAgIC8vIDM1MDIgOiAyNjAwID0gSU1IIDogeFxyXG4gICAgICAgICAgICAgICAgICBjb25zdCBoID0gZ2V0UmVhbEgoMzI1KTtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgdyA9ICgoKElNVy8yKSAtIHRtcEltZy53aWR0aCkgLyAyKSAtIDEwMDtcclxuICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZSh0bXBJbWcsIHcsIGgpO1xyXG4gICAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5saXNDb2RpY2VFbWl0dGVudGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZm9udCA9IGAke2dldFJlYWxIKDM4KX1weCBBcmlhbGA7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHBkZkNvbmYubGlzQ29kaWNlRW1pdHRlbnRlLCBnZXRSZWFsVygzNTApLCBnZXRSZWFsSCg1MjApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBpZiAocGRmQ29uZi5saXNDb2RpY2VDb250bykge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoMzgpfXB4IEFyaWFsYDtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5saXNDb2RpY2VDb250bywgZ2V0UmVhbFcoMzUwKSwgZ2V0UmVhbEgoNTcwKSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgaWYgKHBkZkNvbmYubGlzSW1wb3J0bykge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5mb250ID0gYCR7Z2V0UmVhbEgoMzgpfXB4IEFyaWFsYDtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQocGRmQ29uZi5saXNJbXBvcnRvLCBnZXRSZWFsVygzNTApLCBnZXRSZWFsSCg2MjApKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjYW52YXMucGRmU3RyZWFtKClcclxuICAgICAgICAgICAgICAgIC5waXBlKHJlcyk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBuZXh0KDQwNCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICAoZSkgPT4gUHJvbWlzZS5yZWplY3QoZSlcclxuICAgICk7XHJcbi8qXHJcbiAgICBjb25zdCBwZGZDb25mID0ge1xyXG4gICAgICBiYXNlRmlsZTogJ2ltYWdlcy9iYmlhbmNvLnBuZycsXHJcbiAgICAgIHRvcExlZnQ6ICdpbWFnZXMvZmFzdHdlYl9sZWZ0X3RvcC5wbmcnLFxyXG4gICAgICBib3R0b21MZWZ0OiAnaW1hZ2VzL2Zhc3R3ZWJfbGVmdF9ib3R0b20ucG5nJyxcclxuICAgICAgbGlzQ29kZTogJzQxNTgwOTk5OTkwMDQ1NjY4MDIwMDAyMDE3MDAwNzYwMDI2MzM0MzkwMjAwNjA5MScsXHJcbiAgICAgIGxpc0NvZGVUZXh0OiAnKDQxNSk4MDk5OTk5MDA0NTY2KDgwMikwMDAyMDE3MDAwNzYwMDI2MzM0KDM5MDIpMDA2MDkxJyxcclxuICAgICAgbGlzQ29kaWNlRW1pdHRlbnRlOiAnODA5OTk5OTAwNDU2NicsXHJcbiAgICAgIGxpc0NvZGljZUNvbnRvOiAnMDAwMjAxNzAwMDc2MDAyNjMzNCcsXHJcbiAgICAgIGxpc0ltcG9ydG86ICc2MCw5MScsXHJcbiAgICAgIG5vbWVEZWJpdG9yZTogJ1NjaGlybyBNb25pY2EnLFxyXG4gICAgICByZXNpZGVuemFSaWdhVW5vOiAnTC5nbyBPbGdpYXRhIDE5JyxcclxuICAgICAgcmVzaWRlbnphUmlnYUR1ZTogJ1JvbWEgMDAxMDAgcm0nLFxyXG4gICAgICBub21lQ3JlZGl0b3JlOiAnRkFTVFdFQiBTLlAuQS4nLFxyXG4gICAgICBjb250b0NvcnJlbnRlQ3JlZGl0b3JlOiAnMTQyNDQ1NScsXHJcbiAgICAgIGltcG9ydG9Cb2xsZXR0aW5vOiAnNjAsOTEnLFxyXG4gICAgICBjb2RpY2VjbGllbnRlT0NSOiAnMTcwMDAwMDAwNzYwMDI2MzM1JyxcclxuICAgICAgaW1wb3J0b09DUjogJzAwMDAwMDYwKzkxJyxcclxuICAgICAgY29udG9jb3JyZW50ZU9DUjogJzAwMDAxNDI0NDI1NScsXHJcbiAgICAgIHRpcG9PQ1I6ICc4OTYnLFxyXG4gICAgICBiYXJjb2RlQ29kZTogJzE4MTcwMDAwMDAwNzYwMDI2MzM1MTIwMDAwMTQyNDQyNTUxMDAwMDAwMDYwOTEzODk2J1xyXG5cclxuICAgIH07XHJcbiovXHJcblxyXG4gIH1cclxuXHJcbiAgZ2V0SW50cm8oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kZXNjcmlwdGlvbjtcclxuICB9XHJcblxyXG4gIGdldFRpdGxlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudGl0bGU7XHJcbiAgfVxyXG5cclxuICBnZXRSZWFkeShyZXEpIHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgZGJSZWNvcmQsXHJcbiAgICAgIGZ1bGxEYlJlY29yZHNcclxuICAgIH0gPSB0aGlzLnNlc3Npb247XHJcblxyXG5cclxuXHJcblxyXG4gICAgY29uc3QgbWFpbkNvbmYgPSB7fTtcclxuICAgIGlmICh0aGlzLnBhcmFtMSAmJiB0aGlzLnBhcmFtMS5sZW5ndGggJiYgdHlwZW9mIHRoaXMucGFyYW0xID09PSAnc3RyaW5nJyAmJiB0aGlzLnBhcmFtMVswXSA9PT0gJ3snKSB7XHJcbiAgICAgIE9iamVjdC5hc3NpZ24obWFpbkNvbmYsIEpTT04ucGFyc2UodGhpcy5wYXJhbTEpKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGFuYWdyYWZpY2EgPSBmdWxsRGJSZWNvcmRzLmFuYWdyYWZpY2E7XHJcbiAgICBtYWluQ29uZi5ub21lRGViaXRvcmUgPSBhbmFncmFmaWNhLkRlYml0b3JlO1xyXG4gICAgbWFpbkNvbmYucmVzaWRlbnphUmlnYVVubyA9IGFuYWdyYWZpY2EuSW5kaXJpenpvO1xyXG4gICAgbWFpbkNvbmYucmVzaWRlbnphUmlnYUR1ZSA9IGAke2FuYWdyYWZpY2EuQ0FQID8gYW5hZ3JhZmljYS5DQVAgOiAnJ30gJHthbmFncmFmaWNhLkNpdHRhfWA7XHJcbiAgICBtYWluQ29uZi50aXBvT0NSID0gJzg5Nic7XHJcblxyXG4gICAgY29uc3QgY29uZmlndXJhdGlvbnMgPSBmdWxsRGJSZWNvcmRzLmZhdHR1cmUubWFwKChmYXR0dXJhLCBwb3MpID0+IHtcclxuICAgICAgY29uc3QgcGRmQ29uZiA9IE9iamVjdC5hc3NpZ24oe30sIG1haW5Db25mKTtcclxuICAgICAgY29uc3QgaW1wb3J0byA9IGZhdHR1cmEuSW1wb3J0b0F6aW9uYXRvO1xyXG4gICAgICBjb25zdCBpbXBvcnRvQXNUZXh0ID0gZmF0dHVyYS5JbXBvcnRvQXppb25hdG8udG9GaXhlZCgyKTtcclxuICAgICAgcGRmQ29uZi5pbXBvcnRvID0gaW1wb3J0bztcclxuICAgICAgcGRmQ29uZi5pbXBvcnRvQm9sbGV0dGlubyA9IGltcG9ydG9Bc1RleHQucmVwbGFjZSgnLicsICcsJyk7XHJcblxyXG4gICAgICBjb25zdCB1bmRlcnNjb3JlUG9zaXRpb24gPSBmYXR0dXJhLk51bUZhdHR1cmEuaW5kZXhPZignXycpO1xyXG4gICAgICBjb25zdCBjb2RpY2VGYXR0dXJhID0gZmF0dHVyYS5OdW1GYXR0dXJhLnNsaWNlKChmYXR0dXJhLk51bUZhdHR1cmEubGVuZ3RoIC0gdW5kZXJzY29yZVBvc2l0aW9uIC0gMSkgKiAtMSk7XHJcbiAgICAgIHBkZkNvbmYubnVtZXJvRmF0dHVyYSA9IGNvZGljZUZhdHR1cmE7XHJcbiAgICAgIGNvbnN0IG5GYXR0dXJhID0gY29kaWNlRmF0dHVyYS5yZXBsYWNlKCAvXlxcRCsvZywgJycpO1xyXG4gICAgICBjb25zdCByZXNpZGVuemlhbGUgPSBjb2RpY2VGYXR0dXJhLmluZGV4T2YoJ00nKSA+IC0xO1xyXG4gICAgICBpZiAocGRmQ29uZi5jb250b2NvcnJlbnRlT0NSKSB7XHJcbiAgICAgICAgaWYgKHJlc2lkZW56aWFsZSkge1xyXG4gICAgICAgICAgcGRmQ29uZi5pbXBvcnRvT0NSID0gbGlzTWV0aG9kLmxlZnRQYWQoaW1wb3J0b0FzVGV4dC5yZXBsYWNlKCcuJywgJysnKSwgMTEpO1xyXG4gICAgICAgICAgLy8gMTcwMDAwMDAwNzYwMDI2MzM1XHJcbiAgICAgICAgICBjb25zdCBhbm5vZmF0dHVyYSA9IChuZXcgRGF0ZShmYXR0dXJhLmRhdGFmYXR0dXJhKSkuZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgIGNvbnN0IHRtcENvZGljZUNsaWVudGVDbGllbnRlT2NyID0gYCR7YW5ub2ZhdHR1cmEudG9TdHJpbmcoKS5zbGljZSgtMil9ODg4JHtsaXNNZXRob2QubGVmdFBhZChuRmF0dHVyYS50b1N0cmluZygpLCAxMSl9YDtcclxuICAgICAgICAgIGNvbnN0IHJlbWFpbmRlciA9IHBhcnNlSW50KHRtcENvZGljZUNsaWVudGVDbGllbnRlT2NyLCAxMCkgJSA5MztcclxuICAgICAgICAgIHBkZkNvbmYuY29kaWNlY2xpZW50ZU9DUiA9IGAke3RtcENvZGljZUNsaWVudGVDbGllbnRlT2NyfSR7cmVtYWluZGVyfWA7XHJcbiAgICAgICAgICAvLzE4MTcwMDAwMDAwNzYwMDI2MzM1MTIwMDAwMTQyNDQyNTUxMDAwMDAwMDYwOTEzODk2XHJcbiAgICAgICAgICAvLzE4IDE3MDAwMDAwMDc2MDAyNjMzNSAxMiAwMDAwMTQyNDQyNTUgMTAgMDAwMDAwNjA5MSAzIDg5NlxyXG4gICAgICAgICAgcGRmQ29uZi5iYXJjb2RlQ29kZSA9IGAxOCR7cGRmQ29uZi5jb2RpY2VjbGllbnRlT0NSfTEyJHtwZGZDb25mLmNvbnRvY29ycmVudGVPQ1J9MTAke2xpc01ldGhvZC5sZWZ0UGFkKGltcG9ydG9Bc1RleHQucmVwbGFjZSgnLicsJycpLDEwKX0zODk2YDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gMDAwMDAwNjArOTFcclxuICAgICAgICAgIHBkZkNvbmYuaW1wb3J0b09DUiA9IGxpc01ldGhvZC5sZWZ0UGFkKGltcG9ydG9Bc1RleHQucmVwbGFjZSgnLicsICcrJyksIDExKTtcclxuICAgICAgICAgIC8vIDE3MDAwMDAwMDc2MDAyNjMzNVxyXG4gICAgICAgICAgY29uc3QgYW5ub2ZhdHR1cmEgPSAobmV3IERhdGUoZmF0dHVyYS5kYXRhZmF0dHVyYSkpLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICBjb25zdCB0bXBDb2RpY2VDbGllbnRlQ2xpZW50ZU9jciA9IGAke2Fubm9mYXR0dXJhLnRvU3RyaW5nKCkuc2xpY2UoLTIpfSR7bGlzTWV0aG9kLmxlZnRQYWQobkZhdHR1cmEudG9TdHJpbmcoKSwgMTQpfWA7XHJcbiAgICAgICAgICBjb25zdCByZW1haW5kZXIgPSBwYXJzZUludCh0bXBDb2RpY2VDbGllbnRlQ2xpZW50ZU9jciwgMTApICUgOTM7XHJcbiAgICAgICAgICBwZGZDb25mLmNvZGljZWNsaWVudGVPQ1IgPSBgJHt0bXBDb2RpY2VDbGllbnRlQ2xpZW50ZU9jcn0ke3JlbWFpbmRlcn1gO1xyXG4gICAgICAgICAgLy8xODE3MDAwMDAwMDc2MDAyNjMzNTEyMDAwMDE0MjQ0MjU1MTAwMDAwMDA2MDkxMzg5NlxyXG4gICAgICAgICAgLy8xOCAxNzAwMDAwMDA3NjAwMjYzMzUgMTIgMDAwMDE0MjQ0MjU1IDEwIDAwMDAwMDYwOTEgMyA4OTZcclxuICAgICAgICAgIHBkZkNvbmYuYmFyY29kZUNvZGUgPSBgMTgke3BkZkNvbmYuY29kaWNlY2xpZW50ZU9DUn0xMiR7cGRmQ29uZi5jb250b2NvcnJlbnRlT0NSfTEwJHtsaXNNZXRob2QubGVmdFBhZChpbXBvcnRvQXNUZXh0LnJlcGxhY2UoJy4nLCcnKSwxMCl9Mzg5NmA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChwZGZDb25mLmxpc0NvZGljZUVtaXR0ZW50ZSkge1xyXG5cclxuICAgICAgICAgIGNvbnN0IGFubm9mYXR0dXJhID0gKG5ldyBEYXRlKGZhdHR1cmEuZGF0YWZhdHR1cmEpKS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgY29uc3QgZmF0dHVyYWx1bmdhID0gbGlzTWV0aG9kLmxlZnRQYWQobkZhdHR1cmEsIDEwKTtcclxuICAgICAgICAgIGNvbnN0IGFubm9sdW5nbyA9IGxpc01ldGhvZC5sZWZ0UGFkKGFubm9mYXR0dXJhLnRvU3RyaW5nKCksIDYpO1xyXG4gICAgICAgICAgY29uc3QgY29kaWNlQ29udG9UbXAgPSBgJHthbm5vbHVuZ299JHtmYXR0dXJhbHVuZ2F9YDtcclxuICAgICAgICAgIGNvbnN0IGNvZGljZUNvbnRvQXNOdW1iZXIgPSBwYXJzZUludChjb2RpY2VDb250b1RtcCwgMTApO1xyXG4gICAgICAgICAgY29uc3QgcmVtYWluZGVyID0gY29kaWNlQ29udG9Bc051bWJlciAlIDkzO1xyXG4gICAgICAgICAgY29uc3QgY29kaWNlQ29udG8gPSBgJHthbm5vbHVuZ299JHtmYXR0dXJhbHVuZ2F9JHtyZW1haW5kZXJ9YDtcclxuICAgICAgICAgIHBkZkNvbmYubGlzQ29kaWNlQ29udG8gPSBjb2RpY2VDb250bztcclxuICAgICAgICAgIHBkZkNvbmYubGlzSW1wb3J0byA9IGltcG9ydG9Bc1RleHQucmVwbGFjZSgnLicsICcsJyk7XHJcbiAgICAgICAgICBwZGZDb25mLmxpc0NvZGUgPSBgNDE1JHtwZGZDb25mLmxpc0NvZGljZUVtaXR0ZW50ZX04MDIwJHtjb2RpY2VDb250b30zOTAyJHtsaXNNZXRob2QubGVmdFBhZChpbXBvcnRvQXNUZXh0LnJlcGxhY2UoJy4nLCAnJyksIDYpfWA7XHJcbiAgICAgICAgICBwZGZDb25mLmxpc0NvZGVUZXh0ID0gYCg0MTUpJHtwZGZDb25mLmxpc0NvZGljZUVtaXR0ZW50ZX0oODAyMCkke2NvZGljZUNvbnRvfSgzOTAyKSR7bGlzTWV0aG9kLmxlZnRQYWQoaW1wb3J0b0FzVGV4dC5yZXBsYWNlKCcuJywgJycpLCA2KX1gO1xyXG4gICAgICAgICAgaWYgKHBkZkNvbmYubGlzQ29kZUZpZWxkcyAmJiBwZGZDb25mLmxpc0NvZGVGaWVsZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBwZGZDb25mLmxpc0NvZGVUZXh0ID0gcGRmQ29uZi5saXNDb2RlRmllbGRzLm1hcCgoZikgPT4gZmF0dHVyYVtmXSkuam9pbignJyk7XHJcbiAgICAgICAgICAgIHBkZkNvbmYubGlzQ29kZSA9IHBkZkNvbmYubGlzQ29kZVRleHQucmVwbGFjZSgvXFwoL2csICcnKS5yZXBsYWNlKC9cXCkvZywnJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gLyhcXCg0MTVcXCkpKFswLTldKikoXFwoODAyMFxcKSkoWzAtOV0qKShcXCgzOTAyXFwpKShbMC05XSopLy5leGVjKHBkZkNvbmYubGlzQ29kZVRleHQpO1xyXG4gICAgICAgICAgICBpZiAocGFydHMgJiYgcGFydHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgcGRmQ29uZi5saXNDb2RpY2VFbWl0dGVudGUgPSBwYXJ0c1syXTtcclxuICAgICAgICAgICAgICBwZGZDb25mLmxpc0NvZGljZUNvbnRvID0gcGFydHNbNF07XHJcbiAgICAgICAgICAgICAgcGRmQ29uZi5saXNJbXBvcnRvID0gKHBhcnNlSW50KHBhcnRzWzZdLCAxMCkgLyAxMDApLnRvU3RyaW5nKCkucmVwbGFjZSgnLicsICcsJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ1BhcnRzJywgcGFydHMpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgICBwZGZDb25mLmNhdXNhbGVSaWdhVW5vID0gYE4uIEZBVFRVUkE6ICR7bkZhdHR1cmF9YDtcclxuICAgICAgcGRmQ29uZi5jYXVzYWxlUmlnYUR1ZSA9IGBEQVRBIEZBVFRVUkE6ICR7bW9tZW50KGZhdHR1cmEuZGF0YWZhdHR1cmEpLmZvcm1hdCgnREQvTU0vWVlZWScpfWA7XHJcbiAgICAgIC8vIHBkZkNvbmYuY2F1c2FsZVJpZ2FUcmUgPSAnUHJvdmEgMyc7XHJcbiAgICAgIC8vIHBkZkNvbmYuY2F1c2FsZVJpZ2FRdWF0dHJvID0gJ1Byb3ZhIDQnO1xyXG4gICAgICByZXR1cm4gcGRmQ29uZjtcclxuICAgIH0pO1xyXG4gICAgLy8gY29uc29sZS5sb2coJ2NvbmZpZ3VyYXRpb25zJywgY29uZmlndXJhdGlvbnMubGVuZ3RoKTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGFzeW5jLm1hcFNlcmllcyhjb25maWd1cmF0aW9ucywgKHBkZkNvbmYsIGNiKSA9PiB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3BkZkNvbmYnLCBwZGZDb25mKTtcclxuICAgICAgICBpZiAocGRmQ29uZi5pbXBvcnRvID4gMCkge1xyXG4gICAgICAgICAgY29uc3Qgc3FsID0gYElOU0VSVCBpbnRvIG9ubGluZVBheW1lbnRUcmFuc2FjdGlvbnMgKG1vZHVsZSwgZnVsbENvbmZpZywgcGF5bWVudElkLCBpZENvbnRyYXR0bykgVkFMVUVTIChcclxuICAgICAgICAgICAgJHt0aGlzLmRiLmVzY2FwZSgnYm9sbGV0dGlubycpfSxcclxuICAgICAgICAgICAgJHt0aGlzLmRiLmVzY2FwZShKU09OLnN0cmluZ2lmeShwZGZDb25mKSl9LFxyXG4gICAgICAgICAgICAke3RoaXMuZGIuZXNjYXBlKHRoaXMucGF5bWVudElkKX0sXHJcbiAgICAgICAgICAgICR7dGhpcy5kYi5lc2NhcGUodGhpcy5pZENvbnRyYXR0byl9XHJcbiAgICAgICAgICApYDtcclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdzcWwnLCBzcWwpO1xyXG4gICAgICAgICAgdGhpcy5kYi5xdWVyeShzcWwpXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNiKG51bGwsIHtpZDogcmVzdWx0Lmluc2VydElkLCBuYW1lOiBwZGZDb25mLnR5cGUgIT09ICdsaXMnID8gYE1vc3RyYSBib2xsZXR0aW5vIHBlciBsYSBmYXR0dXJhICR7cGRmQ29uZi5udW1lcm9GYXR0dXJhfWAgOiBgTW9zdHJhIGNvZGljZSBMSVMgcGVyIGxhIGZhdHR1cmEgJHtwZGZDb25mLm51bWVyb0ZhdHR1cmF9YCB9KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGUpID0+IHtcclxuICAgICAgICAgICAgICBjYihlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY2IobnVsbCwgbnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCAoZXJyLCByZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycikgcmVqZWN0KGVycik7XHJcbiAgICAgICAgdGhpcy5ib2xsZXR0aW5pID0gcmVzdWx0cztcclxuICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gY29uc29sZS5sb2cocGRmQ29uZik7XHJcbiAgICAvLyBjb25zb2xlLmxvZygncGFyYW0xIGJvbGxldHRpbm8nLCB0aGlzLnBhcmFtMSk7XHJcbiAgICAvLyBjb25zb2xlLmxvZygncGFyYW0yJywgdGhpcy5wYXJhbTIpO1xyXG4gICAgLy8gY29uc29sZS5sb2coJ3BhcmFtMycsIHRoaXMucGFyYW0zKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKCd0aGlzJywgdGhpcyk7XHJcbiAgICAvL1xyXG4gICAgLy8gY29uc3QgcGRmQ29uZiA9IHtcclxuICAgIC8vICAgYmFzZUZpbGU6ICdiYmlhbmNvLnBuZycsXHJcbiAgICAvLyAgIHRvcExlZnQ6ICdmYXN0d2ViX2xlZnRfdG9wLnBuZycsXHJcbiAgICAvLyAgIGJvdHRvbUxlZnQ6ICdmYXN0d2ViX2xlZnRfYm90dG9tLnBuZycsXHJcblxyXG4gICAgLy8gICBsaXNDb2RlOiBgYCwgLy8gJzQxNTgwOTk5OTkwMDQ1NjY4MDIwMDAyMDE3MDAwNzYwMDI2MzM0MzkwMjAwNjA5MScsXHJcbiAgICAvLyAgIGxpc0NvZGVUZXh0OiAnKDQxNSk4MDk5OTk5MDA0NTY2KDgwMikwMDAyMDE3MDAwNzYwMDI2MzM0KDM5MDIpMDA2MDkxJyxcclxuICAgIC8vICAgbGlzQ29kaWNlRW1pdHRlbnRlOiAnODA5OTk5OTAwNDU2NicsXHJcbiAgICAvLyAgIGxpc0NvZGljZUNvbnRvOiAnMDAwMjAxNzAwMDc2MDAyNjMzNCcsXHJcbiAgICAvLyAgIGxpc0ltcG9ydG86ICc2MCw5MScsXHJcbiAgICAvLyAgIG5vbWVEZWJpdG9yZTogJ1NjaGlybyBNb25pY2EnLFxyXG4gICAgLy8gICByZXNpZGVuemFSaWdhVW5vOiAnTC5nbyBPbGdpYXRhIDE5JyxcclxuICAgIC8vICAgcmVzaWRlbnphUmlnYUR1ZTogJ1JvbWEgMDAxMDAgcm0nLFxyXG4gICAgLy8gICBub21lQ3JlZGl0b3JlOiAnRkFTVFdFQiBTLlAuQS4nLFxyXG4gICAgLy8gICBjb250b0NvcnJlbnRlQ3JlZGl0b3JlOiAnMTQyNDQ1NScsXHJcbiAgICAvLyAgIGltcG9ydG9Cb2xsZXR0aW5vOiAnNjAsOTEnLFxyXG4gICAgLy8gICBjb2RpY2VjbGllbnRlT0NSOiAnMTcwMDAwMDAwNzYwMDI2MzM1JyxcclxuICAgIC8vICAgaW1wb3J0b09DUjogJzAwMDAwMDYwKzkxJyxcclxuICAgIC8vICAgY29udG9jb3JyZW50ZU9DUjogJzAwMDAxNDI0NDI1NScsXHJcbiAgICAvLyAgIHRpcG9PQ1I6ICc4OTYnLFxyXG4gICAgLy8gICBiYXJjb2RlQ29kZTogJzE4MTcwMDAwMDAwNzYwMDI2MzM1MTIwMDAwMTQyNDQyNTUxMDAwMDAwMDYwOTEzODk2J1xyXG4gICAgLy8gfTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHJlc29sdmUoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZ2V0Rm9ybSgpIHtcclxuICAgIHJldHVybiBgXHJcbiAgICA8ZGl2PlxyXG4gICAgICAke3RoaXMuYm9sbGV0dGluaS5tYXAoKGMpID0+IHtcclxuICAgICAgICBpZiAoYykge1xyXG4gICAgICAgICAgcmV0dXJuIGA8YSBjbGFzcz1cImJ0biBidG4tc3VjY2Vzc1wiIHRhcmdldD1cIl9uZXdcIiBocmVmPVwiL2NhbGxiYWNrL2Zhc3R3ZWJsb3R0b21hdGljYV9wZGY/aWQ9JHtjLmlkfVwiPiR7Yy5uYW1lfTwvYT5gO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KS5qb2luKCc8YnIvPicpfVxyXG4gICAgPC9kaXY+XHJcbiAgICBgO1xyXG4gIH1cclxufVxyXG4iXX0=