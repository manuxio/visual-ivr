'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDate = exports.createResponseHash = exports.createHash = undefined;

var _sha = require('sha1');

var _sha2 = _interopRequireDefault(_sha);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var bin2hex = function bin2hex(s) {
  var i = void 0;
  var l = void 0;
  var o = '';
  var n = void 0;
  s += '';
  for (i = 0, l = s.length; i < l; i += 1) {
    n = s.charCodeAt(i).toString(16);
    o += n.length < 2 ? '0' + n : n;
  }
  return o;
};

var createHash = function createHash(storeId, dateTime, chargeTotal, currency, signature) {
  if (!storeId || typeof storeId === 'undefined') {
    throw new Error('Cannot leave storeId empty!');
  }
  if (!dateTime || typeof dateTime === 'undefined') {
    throw new Error('Cannot leave dateTime empty!');
  }
  if (!chargeTotal || typeof chargeTotal === 'undefined') {
    throw new Error('Cannot leave chargeTotal empty!');
  }
  if (!currency || typeof currency === 'undefined') {
    throw new Error('Cannot leave currency empty!');
  }
  if (!signature || typeof signature === 'undefined') {
    throw new Error('Cannot leave signature empty!');
  }
  var ascii = bin2hex('' + storeId + dateTime + chargeTotal + currency + signature);
  return (0, _sha2.default)(ascii);
};

var createResponseHash = function createResponseHash(arrayOfStrings) {
  var fullString = arrayOfStrings.reduce(function (prev, curr) {
    return '' + prev + curr;
  }, '');
  var ascii = bin2hex(fullString);
  return (0, _sha2.default)(ascii);
};

var getDate = function getDate() {
  return (0, _moment2.default)().format('YYYY:MM:DD-HH:mm:ss');
};

exports.createHash = createHash;
exports.createResponseHash = createResponseHash;
exports.getDate = getDate;

// //$storeId = "08000888_S";
//     $storeId = $identificativo_iban_serfin;
//     $ksig = "SERsiSb55fs5BQmt5Yhq5Ub55E5=";//PRODUZIONE
//     //$ksig = "xHosiSb08fs8BQmt9Yhq3Ub99E8=";//TEST
//     $stringToHash = $storeId . $dataInseritaNelFieldtxndatetime . $chargetotal . $currency . $ksig;
//     $ascii = bin2hex($stringToHash);
//     return sha1($ascii);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWJzL2JubFBvc2l0aXZpdHkuanMiXSwibmFtZXMiOlsiYmluMmhleCIsInMiLCJpIiwibCIsIm8iLCJuIiwibGVuZ3RoIiwiY2hhckNvZGVBdCIsInRvU3RyaW5nIiwiY3JlYXRlSGFzaCIsInN0b3JlSWQiLCJkYXRlVGltZSIsImNoYXJnZVRvdGFsIiwiY3VycmVuY3kiLCJzaWduYXR1cmUiLCJFcnJvciIsImFzY2lpIiwiY3JlYXRlUmVzcG9uc2VIYXNoIiwiYXJyYXlPZlN0cmluZ3MiLCJmdWxsU3RyaW5nIiwicmVkdWNlIiwicHJldiIsImN1cnIiLCJnZXREYXRlIiwiZm9ybWF0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7QUFDQTs7Ozs7O0FBRUEsSUFBTUEsVUFBVSxTQUFWQSxPQUFVLENBQUNDLENBQUQsRUFBTztBQUNyQixNQUFJQyxVQUFKO0FBQ0EsTUFBSUMsVUFBSjtBQUNBLE1BQUlDLElBQUksRUFBUjtBQUNBLE1BQUlDLFVBQUo7QUFDQUosT0FBSyxFQUFMO0FBQ0EsT0FBS0MsSUFBSSxDQUFKLEVBQU9DLElBQUlGLEVBQUVLLE1BQWxCLEVBQTBCSixJQUFJQyxDQUE5QixFQUFpQ0QsS0FBSyxDQUF0QyxFQUF5QztBQUN2Q0csUUFBSUosRUFBRU0sVUFBRixDQUFhTCxDQUFiLEVBQWdCTSxRQUFoQixDQUF5QixFQUF6QixDQUFKO0FBQ0FKLFNBQUtDLEVBQUVDLE1BQUYsR0FBVyxDQUFYLEdBQWUsTUFBTUQsQ0FBckIsR0FBeUJBLENBQTlCO0FBQ0Q7QUFDRCxTQUFPRCxDQUFQO0FBQ0QsQ0FYRDs7QUFhQSxJQUFNSyxhQUFhLFNBQWJBLFVBQWEsQ0FBQ0MsT0FBRCxFQUFVQyxRQUFWLEVBQW9CQyxXQUFwQixFQUFpQ0MsUUFBakMsRUFBMkNDLFNBQTNDLEVBQXlEO0FBQzFFLE1BQUksQ0FBQ0osT0FBRCxJQUFXLE9BQU9BLE9BQVAsS0FBbUIsV0FBbEMsRUFBK0M7QUFDN0MsVUFBTSxJQUFJSyxLQUFKLENBQVUsNkJBQVYsQ0FBTjtBQUNEO0FBQ0QsTUFBSSxDQUFDSixRQUFELElBQVksT0FBT0EsUUFBUCxLQUFvQixXQUFwQyxFQUFpRDtBQUMvQyxVQUFNLElBQUlJLEtBQUosQ0FBVSw4QkFBVixDQUFOO0FBQ0Q7QUFDRCxNQUFJLENBQUNILFdBQUQsSUFBZSxPQUFPQSxXQUFQLEtBQXVCLFdBQTFDLEVBQXVEO0FBQ3JELFVBQU0sSUFBSUcsS0FBSixDQUFVLGlDQUFWLENBQU47QUFDRDtBQUNELE1BQUksQ0FBQ0YsUUFBRCxJQUFZLE9BQU9BLFFBQVAsS0FBb0IsV0FBcEMsRUFBaUQ7QUFDL0MsVUFBTSxJQUFJRSxLQUFKLENBQVUsOEJBQVYsQ0FBTjtBQUNEO0FBQ0QsTUFBSSxDQUFDRCxTQUFELElBQWEsT0FBT0EsU0FBUCxLQUFxQixXQUF0QyxFQUFtRDtBQUNqRCxVQUFNLElBQUlDLEtBQUosQ0FBVSwrQkFBVixDQUFOO0FBQ0Q7QUFDRCxNQUFNQyxRQUFRaEIsYUFBV1UsT0FBWCxHQUFxQkMsUUFBckIsR0FBZ0NDLFdBQWhDLEdBQThDQyxRQUE5QyxHQUF5REMsU0FBekQsQ0FBZDtBQUNBLFNBQU8sbUJBQUtFLEtBQUwsQ0FBUDtBQUNELENBbEJEOztBQW9CQSxJQUFNQyxxQkFBcUIsU0FBckJBLGtCQUFxQixDQUFDQyxjQUFELEVBQW9CO0FBQzdDLE1BQU1DLGFBQWFELGVBQWVFLE1BQWYsQ0FBc0IsVUFBQ0MsSUFBRCxFQUFPQyxJQUFQLEVBQWdCO0FBQ3ZELGdCQUFVRCxJQUFWLEdBQWlCQyxJQUFqQjtBQUNELEdBRmtCLEVBRWhCLEVBRmdCLENBQW5CO0FBR0EsTUFBTU4sUUFBUWhCLFFBQVFtQixVQUFSLENBQWQ7QUFDQSxTQUFPLG1CQUFLSCxLQUFMLENBQVA7QUFDRCxDQU5EOztBQVFBLElBQU1PLFVBQVUsU0FBVkEsT0FBVSxHQUFNO0FBQ3BCLFNBQU8sd0JBQVNDLE1BQVQsQ0FBZ0IscUJBQWhCLENBQVA7QUFDRCxDQUZEOztRQUtFZixVLEdBQUFBLFU7UUFDQVEsa0IsR0FBQUEsa0I7UUFDQU0sTyxHQUFBQSxPOztBQUdGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImJubFBvc2l0aXZpdHkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc2hhMSBmcm9tICdzaGExJztcclxuaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xyXG5cclxuY29uc3QgYmluMmhleCA9IChzKSA9PiB7XHJcbiAgbGV0IGk7XHJcbiAgbGV0IGw7XHJcbiAgbGV0IG8gPSAnJztcclxuICBsZXQgbjtcclxuICBzICs9ICcnO1xyXG4gIGZvciAoaSA9IDAsIGwgPSBzLmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkge1xyXG4gICAgbiA9IHMuY2hhckNvZGVBdChpKS50b1N0cmluZygxNik7XHJcbiAgICBvICs9IG4ubGVuZ3RoIDwgMiA/ICcwJyArIG4gOiBuO1xyXG4gIH1cclxuICByZXR1cm4gbztcclxufVxyXG5cclxuY29uc3QgY3JlYXRlSGFzaCA9IChzdG9yZUlkLCBkYXRlVGltZSwgY2hhcmdlVG90YWwsIGN1cnJlbmN5LCBzaWduYXR1cmUpID0+IHtcclxuICBpZiAoIXN0b3JlSWR8fCB0eXBlb2Ygc3RvcmVJZCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGxlYXZlIHN0b3JlSWQgZW1wdHkhJyk7XHJcbiAgfVxyXG4gIGlmICghZGF0ZVRpbWV8fCB0eXBlb2YgZGF0ZVRpbWUgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBsZWF2ZSBkYXRlVGltZSBlbXB0eSEnKTtcclxuICB9XHJcbiAgaWYgKCFjaGFyZ2VUb3RhbHx8IHR5cGVvZiBjaGFyZ2VUb3RhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGxlYXZlIGNoYXJnZVRvdGFsIGVtcHR5IScpO1xyXG4gIH1cclxuICBpZiAoIWN1cnJlbmN5fHwgdHlwZW9mIGN1cnJlbmN5ID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbGVhdmUgY3VycmVuY3kgZW1wdHkhJyk7XHJcbiAgfVxyXG4gIGlmICghc2lnbmF0dXJlfHwgdHlwZW9mIHNpZ25hdHVyZSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGxlYXZlIHNpZ25hdHVyZSBlbXB0eSEnKTtcclxuICB9XHJcbiAgY29uc3QgYXNjaWkgPSBiaW4yaGV4KGAke3N0b3JlSWR9JHtkYXRlVGltZX0ke2NoYXJnZVRvdGFsfSR7Y3VycmVuY3l9JHtzaWduYXR1cmV9YCk7XHJcbiAgcmV0dXJuIHNoYTEoYXNjaWkpO1xyXG59XHJcblxyXG5jb25zdCBjcmVhdGVSZXNwb25zZUhhc2ggPSAoYXJyYXlPZlN0cmluZ3MpID0+IHtcclxuICBjb25zdCBmdWxsU3RyaW5nID0gYXJyYXlPZlN0cmluZ3MucmVkdWNlKChwcmV2LCBjdXJyKSA9PiB7XHJcbiAgICByZXR1cm4gYCR7cHJldn0ke2N1cnJ9YDtcclxuICB9LCAnJyk7XHJcbiAgY29uc3QgYXNjaWkgPSBiaW4yaGV4KGZ1bGxTdHJpbmcpO1xyXG4gIHJldHVybiBzaGExKGFzY2lpKTtcclxufVxyXG5cclxuY29uc3QgZ2V0RGF0ZSA9ICgpID0+IHtcclxuICByZXR1cm4gbW9tZW50KCkuZm9ybWF0KCdZWVlZOk1NOkRELUhIOm1tOnNzJyk7XHJcbn1cclxuXHJcbmV4cG9ydCB7XHJcbiAgY3JlYXRlSGFzaCxcclxuICBjcmVhdGVSZXNwb25zZUhhc2gsXHJcbiAgZ2V0RGF0ZVxyXG59XHJcblxyXG4vLyAvLyRzdG9yZUlkID0gXCIwODAwMDg4OF9TXCI7XHJcbi8vICAgICAkc3RvcmVJZCA9ICRpZGVudGlmaWNhdGl2b19pYmFuX3NlcmZpbjtcclxuLy8gICAgICRrc2lnID0gXCJTRVJzaVNiNTVmczVCUW10NVlocTVVYjU1RTU9XCI7Ly9QUk9EVVpJT05FXHJcbi8vICAgICAvLyRrc2lnID0gXCJ4SG9zaVNiMDhmczhCUW10OVlocTNVYjk5RTg9XCI7Ly9URVNUXHJcbi8vICAgICAkc3RyaW5nVG9IYXNoID0gJHN0b3JlSWQgLiAkZGF0YUluc2VyaXRhTmVsRmllbGR0eG5kYXRldGltZSAuICRjaGFyZ2V0b3RhbCAuICRjdXJyZW5jeSAuICRrc2lnO1xyXG4vLyAgICAgJGFzY2lpID0gYmluMmhleCgkc3RyaW5nVG9IYXNoKTtcclxuLy8gICAgIHJldHVybiBzaGExKCRhc2NpaSk7XHJcbiJdfQ==