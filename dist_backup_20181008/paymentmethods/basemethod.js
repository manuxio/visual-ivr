'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var paymentMethod = function () {
  _createClass(paymentMethod, null, [{
    key: 'getCallBackUrls',
    value: function getCallBackUrls() {
      throw new Error('Cannot use getCallBackUrls from base class!');
    }
  }, {
    key: 'leftPad',
    value: function leftPad(str, tolen) {
      var char = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '0';

      var len = str.length;
      var diff = tolen - len;
      var toprepend = diff > 0 ? char.repeat(diff) : '';
      return '' + toprepend + str;
    }
  }, {
    key: 'insertPaymentIntoMainframe',
    value: function insertPaymentIntoMainframe(db, idContratto, amount, type, reference) {
      var nowDate = (0, _moment2.default)().format('YYYY-MM-DD HH:ii:ss');
      var sql = 'INSERT INTO Assegni (\n      CodiceContratto, Importo, TipoPagemento, data, note\n    ) VALUES (\n      ' + db.escape(idContratto) + ', ' + db.escape(amount) + ', ' + db.escape(type) + ', ' + db.escape(nowDate) + ', ' + db.escape(reference) + '\n    )';
      return db.query(sql).then(function (writeResult) {
        // console.log('writeResult', writeResult);
        var lastInsertId = writeResult.insertId;
        return Promise.resolve([lastInsertId, nowDate]);
      }, function (e) {
        return Promise.reject(e);
      }).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            lastInsertId = _ref2[0],
            nowDate = _ref2[1];

        var sql2 = 'INSERT INTO ImportiContratto (IDcontratto, IDImporto, IDassegno, datascadenzapagamento, ValoreR)\n        VALUES (\n          ' + db.escape(idContratto) + ',\n          1,\n          ' + db.escape(lastInsertId) + ',\n          ' + db.escape(nowDate) + ',\n          ' + db.escape(amount) + '\n        )';
        return db.query(sql2);
      }, function (e) {
        return Promise.reject(e);
      }).then(function (result) {
        return Promise.resolve();
      }, function (e) {
        console.log('E', e);
        return Promise.reject(e);
      });
      // INSERT INTO Assegni (CodiceContratto, Importo,TipoPagemento,data)........

      // INSERT INTO ImportiContratto (IDcontratto,IDImporto,IDassegno,datascadenzapagamento,ValoreR)......

    }
  }]);

  function paymentMethod(params) {
    _classCallCheck(this, paymentMethod);

    this.param1 = params.param1;
    this.param2 = params.param2;
    this.param3 = params.param3;
    this.param4 = params.param4;
    this.title = params.title;
    // console.log('params', params.param1);
    this.description = params.description;
    this.commission_type = params.commission_type === 'fixed' ? 'fixed' : 'percentage';
    this.commission = params.commission;
    this.unique = Math.floor(Math.random() * 100000000) + 1;
    this.ID = params.ID;
  }

  _createClass(paymentMethod, [{
    key: 'setDb',
    value: function setDb(db) {
      this.db = db;
    }
  }, {
    key: 'setSession',
    value: function setSession(session) {
      this.session = session;
    }
  }, {
    key: 'setCurrency',
    value: function setCurrency(currency) {
      this.currency = currency;
    }
  }, {
    key: 'setAmount',
    value: function setAmount(amount) {
      this.amount = amount;
    }
  }, {
    key: 'setPaymentId',
    value: function setPaymentId(oid) {
      this.paymentId = oid;
    }
  }, {
    key: 'setIdContratto',
    value: function setIdContratto(oid) {
      this.idContratto = oid;
    }
  }, {
    key: 'setInfo',
    value: function setInfo(info) {
      this.info = info;
    }
  }, {
    key: 'setBaseUrl',
    value: function setBaseUrl(host) {
      this.host = host;
    }
  }, {
    key: 'setSecure',
    value: function setSecure(secure) {
      this.secure = secure;
    }
  }, {
    key: 'getUnique',
    value: function getUnique() {
      return this.unique;
    }
  }, {
    key: 'getIntro',
    value: function getIntro() {
      throw new Error('Cannot use getIntro of base class!');
    }
  }, {
    key: 'getForm',
    value: function getForm() {
      throw new Error('Cannot use getForm of base class!');
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      throw new Error('Cannot use getTitle of base class!');
    }
  }, {
    key: 'getReady',
    value: function getReady() {
      return Promise.resolve();
    }
  }, {
    key: 'setUrlCode',
    value: function setUrlCode(code) {
      this.urlCode = code;
    }
  }]);

  return paymentMethod;
}();

exports.default = paymentMethod;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXltZW50bWV0aG9kcy9iYXNlbWV0aG9kLmpzIl0sIm5hbWVzIjpbInBheW1lbnRNZXRob2QiLCJFcnJvciIsInN0ciIsInRvbGVuIiwiY2hhciIsImxlbiIsImxlbmd0aCIsImRpZmYiLCJ0b3ByZXBlbmQiLCJyZXBlYXQiLCJkYiIsImlkQ29udHJhdHRvIiwiYW1vdW50IiwidHlwZSIsInJlZmVyZW5jZSIsIm5vd0RhdGUiLCJmb3JtYXQiLCJzcWwiLCJlc2NhcGUiLCJxdWVyeSIsInRoZW4iLCJ3cml0ZVJlc3VsdCIsImxhc3RJbnNlcnRJZCIsImluc2VydElkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJlIiwicmVqZWN0Iiwic3FsMiIsInJlc3VsdCIsImNvbnNvbGUiLCJsb2ciLCJwYXJhbXMiLCJwYXJhbTEiLCJwYXJhbTIiLCJwYXJhbTMiLCJwYXJhbTQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiY29tbWlzc2lvbl90eXBlIiwiY29tbWlzc2lvbiIsInVuaXF1ZSIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsIklEIiwic2Vzc2lvbiIsImN1cnJlbmN5Iiwib2lkIiwicGF5bWVudElkIiwiaW5mbyIsImhvc3QiLCJzZWN1cmUiLCJjb2RlIiwidXJsQ29kZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBOzs7Ozs7OztJQUVxQkEsYTs7O3NDQUVNO0FBQ3ZCLFlBQU0sSUFBSUMsS0FBSixDQUFVLDZDQUFWLENBQU47QUFDRDs7OzRCQUVjQyxHLEVBQUtDLEssRUFBbUI7QUFBQSxVQUFaQyxJQUFZLHVFQUFMLEdBQUs7O0FBQ3JDLFVBQU1DLE1BQU1ILElBQUlJLE1BQWhCO0FBQ0EsVUFBTUMsT0FBT0osUUFBUUUsR0FBckI7QUFDQSxVQUFNRyxZQUFZRCxPQUFPLENBQVAsR0FBV0gsS0FBS0ssTUFBTCxDQUFZRixJQUFaLENBQVgsR0FBK0IsRUFBakQ7QUFDQSxrQkFBVUMsU0FBVixHQUFzQk4sR0FBdEI7QUFDRDs7OytDQUVp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ckMsV0FBTCxHQUFtQnFDLEdBQW5CO0FBQ0Q7Ozs0QkFFT0UsSSxFQUFNO0FBQ1osV0FBS0EsSUFBTCxHQUFZQSxJQUFaO0FBQ0Q7OzsrQkFFVUMsSSxFQUFNO0FBQ2YsV0FBS0EsSUFBTCxHQUFZQSxJQUFaO0FBQ0Q7Ozs4QkFFU0MsTSxFQUFRO0FBQ2hCLFdBQUtBLE1BQUwsR0FBY0EsTUFBZDtBQUNEOzs7Z0NBRVc7QUFDVixhQUFPLEtBQUtYLE1BQVo7QUFDRDs7OytCQUVVO0FBQ1QsWUFBTSxJQUFJeEMsS0FBSixDQUFVLG9DQUFWLENBQU47QUFDRDs7OzhCQUVTO0FBQ1IsWUFBTSxJQUFJQSxLQUFKLENBQVUsbUNBQVYsQ0FBTjtBQUNEOzs7K0JBRVU7QUFDVCxZQUFNLElBQUlBLEtBQUosQ0FBVSxvQ0FBVixDQUFOO0FBQ0Q7OzsrQkFFVTtBQUNULGFBQU91QixRQUFRQyxPQUFSLEVBQVA7QUFDRDs7OytCQUVVNEIsSSxFQUFNO0FBQ2YsV0FBS0MsT0FBTCxHQUFlRCxJQUFmO0FBQ0Q7Ozs7OztrQkFySWtCckQsYSIsImZpbGUiOiJiYXNlbWV0aG9kLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgcGF5bWVudE1ldGhvZCB7XHJcblxyXG4gIHN0YXRpYyBnZXRDYWxsQmFja1VybHMoKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB1c2UgZ2V0Q2FsbEJhY2tVcmxzIGZyb20gYmFzZSBjbGFzcyEnKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBsZWZ0UGFkKHN0ciwgdG9sZW4sIGNoYXIgPSAnMCcpIHtcclxuICAgIGNvbnN0IGxlbiA9IHN0ci5sZW5ndGg7XHJcbiAgICBjb25zdCBkaWZmID0gdG9sZW4gLSBsZW47XHJcbiAgICBjb25zdCB0b3ByZXBlbmQgPSBkaWZmID4gMCA/IGNoYXIucmVwZWF0KGRpZmYpIDogJyc7XHJcbiAgICByZXR1cm4gYCR7dG9wcmVwZW5kfSR7c3RyfWA7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgaW5zZXJ0UGF5bWVudEludG9NYWluZnJhbWUoZGIsIGlkQ29udHJhdHRvLCBhbW91bnQsIHR5cGUsIHJlZmVyZW5jZSkge1xyXG4gICAgY29uc3Qgbm93RGF0ZSA9IG1vbWVudCgpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDppaTpzcycpO1xyXG4gICAgY29uc3Qgc3FsID0gYElOU0VSVCBJTlRPIEFzc2VnbmkgKFxyXG4gICAgICBDb2RpY2VDb250cmF0dG8sIEltcG9ydG8sIFRpcG9QYWdlbWVudG8sIGRhdGEsIG5vdGVcclxuICAgICkgVkFMVUVTIChcclxuICAgICAgJHtkYi5lc2NhcGUoaWRDb250cmF0dG8pfSwgJHtkYi5lc2NhcGUoYW1vdW50KX0sICR7ZGIuZXNjYXBlKHR5cGUpfSwgJHtkYi5lc2NhcGUobm93RGF0ZSl9LCAke2RiLmVzY2FwZShyZWZlcmVuY2UpfVxyXG4gICAgKWA7XHJcbiAgICByZXR1cm4gZGIucXVlcnkoc3FsKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgICh3cml0ZVJlc3VsdCkgPT4ge1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCd3cml0ZVJlc3VsdCcsIHdyaXRlUmVzdWx0KTtcclxuICAgICAgICBjb25zdCBsYXN0SW5zZXJ0SWQgPSB3cml0ZVJlc3VsdC5pbnNlcnRJZDtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtsYXN0SW5zZXJ0SWQsIG5vd0RhdGVdKTtcclxuICAgICAgfSxcclxuICAgICAgKGUpID0+IHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XHJcbiAgICAgIH1cclxuICAgIClcclxuICAgIC50aGVuKFxyXG4gICAgICAoW2xhc3RJbnNlcnRJZCwgbm93RGF0ZV0pID0+IHtcclxuICAgICAgICBjb25zdCBzcWwyID0gYElOU0VSVCBJTlRPIEltcG9ydGlDb250cmF0dG8gKElEY29udHJhdHRvLCBJREltcG9ydG8sIElEYXNzZWdubywgZGF0YXNjYWRlbnphcGFnYW1lbnRvLCBWYWxvcmVSKVxyXG4gICAgICAgIFZBTFVFUyAoXHJcbiAgICAgICAgICAke2RiLmVzY2FwZShpZENvbnRyYXR0byl9LFxyXG4gICAgICAgICAgMSxcclxuICAgICAgICAgICR7ZGIuZXNjYXBlKGxhc3RJbnNlcnRJZCl9LFxyXG4gICAgICAgICAgJHtkYi5lc2NhcGUobm93RGF0ZSl9LFxyXG4gICAgICAgICAgJHtkYi5lc2NhcGUoYW1vdW50KX1cclxuICAgICAgICApYDtcclxuICAgICAgICByZXR1cm4gZGIucXVlcnkoc3FsMik7XHJcbiAgICAgIH0sXHJcbiAgICAgIChlKSA9PiBQcm9taXNlLnJlamVjdChlKVxyXG4gICAgKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChyZXN1bHQpID0+IHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIChlKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0UnLCBlKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XHJcbiAgICAgIH1cclxuICAgICk7XHJcbiAgICAvLyBJTlNFUlQgSU5UTyBBc3NlZ25pIChDb2RpY2VDb250cmF0dG8sIEltcG9ydG8sVGlwb1BhZ2VtZW50byxkYXRhKS4uLi4uLi4uXHJcblxyXG4gICAgLy8gSU5TRVJUIElOVE8gSW1wb3J0aUNvbnRyYXR0byAoSURjb250cmF0dG8sSURJbXBvcnRvLElEYXNzZWdubyxkYXRhc2NhZGVuemFwYWdhbWVudG8sVmFsb3JlUikuLi4uLi5cclxuXHJcblxyXG4gIH1cclxuXHJcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XHJcbiAgICB0aGlzLnBhcmFtMSA9IHBhcmFtcy5wYXJhbTE7XHJcbiAgICB0aGlzLnBhcmFtMiA9IHBhcmFtcy5wYXJhbTI7XHJcbiAgICB0aGlzLnBhcmFtMyA9IHBhcmFtcy5wYXJhbTM7XHJcbiAgICB0aGlzLnBhcmFtNCA9IHBhcmFtcy5wYXJhbTQ7XHJcbiAgICB0aGlzLnRpdGxlID0gcGFyYW1zLnRpdGxlO1xyXG4gICAgLy8gY29uc29sZS5sb2coJ3BhcmFtcycsIHBhcmFtcy5wYXJhbTEpO1xyXG4gICAgdGhpcy5kZXNjcmlwdGlvbiA9IHBhcmFtcy5kZXNjcmlwdGlvbjtcclxuICAgIHRoaXMuY29tbWlzc2lvbl90eXBlID0gcGFyYW1zLmNvbW1pc3Npb25fdHlwZSA9PT0gJ2ZpeGVkJyA/ICdmaXhlZCcgOiAncGVyY2VudGFnZSc7XHJcbiAgICB0aGlzLmNvbW1pc3Npb24gPSBwYXJhbXMuY29tbWlzc2lvbjtcclxuICAgIHRoaXMudW5pcXVlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwMDAwKSArIDE7XHJcbiAgICB0aGlzLklEID0gcGFyYW1zLklEO1xyXG4gIH1cclxuXHJcbiAgc2V0RGIoZGIpIHtcclxuICAgIHRoaXMuZGIgPSBkYjtcclxuICB9XHJcblxyXG4gIHNldFNlc3Npb24oc2Vzc2lvbikge1xyXG4gICAgdGhpcy5zZXNzaW9uID0gc2Vzc2lvbjtcclxuICB9XHJcblxyXG4gIHNldEN1cnJlbmN5KGN1cnJlbmN5KSB7XHJcbiAgICB0aGlzLmN1cnJlbmN5ID0gY3VycmVuY3k7XHJcbiAgfVxyXG5cclxuICBzZXRBbW91bnQoYW1vdW50KSB7XHJcbiAgICB0aGlzLmFtb3VudCA9IGFtb3VudDtcclxuICB9XHJcblxyXG4gIHNldFBheW1lbnRJZChvaWQpIHtcclxuICAgIHRoaXMucGF5bWVudElkID0gb2lkO1xyXG4gIH1cclxuXHJcbiAgc2V0SWRDb250cmF0dG8ob2lkKSB7XHJcbiAgICB0aGlzLmlkQ29udHJhdHRvID0gb2lkO1xyXG4gIH1cclxuXHJcbiAgc2V0SW5mbyhpbmZvKSB7XHJcbiAgICB0aGlzLmluZm8gPSBpbmZvO1xyXG4gIH1cclxuXHJcbiAgc2V0QmFzZVVybChob3N0KSB7XHJcbiAgICB0aGlzLmhvc3QgPSBob3N0O1xyXG4gIH1cclxuXHJcbiAgc2V0U2VjdXJlKHNlY3VyZSkge1xyXG4gICAgdGhpcy5zZWN1cmUgPSBzZWN1cmU7XHJcbiAgfVxyXG5cclxuICBnZXRVbmlxdWUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy51bmlxdWU7XHJcbiAgfVxyXG5cclxuICBnZXRJbnRybygpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHVzZSBnZXRJbnRybyBvZiBiYXNlIGNsYXNzIScpO1xyXG4gIH1cclxuXHJcbiAgZ2V0Rm9ybSgpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHVzZSBnZXRGb3JtIG9mIGJhc2UgY2xhc3MhJyk7XHJcbiAgfVxyXG5cclxuICBnZXRUaXRsZSgpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHVzZSBnZXRUaXRsZSBvZiBiYXNlIGNsYXNzIScpO1xyXG4gIH1cclxuXHJcbiAgZ2V0UmVhZHkoKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBzZXRVcmxDb2RlKGNvZGUpIHtcclxuICAgIHRoaXMudXJsQ29kZSA9IGNvZGU7XHJcbiAgfVxyXG5cclxuXHJcbn1cclxuIl19