'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _config = require('../config/config.json');

var _config2 = _interopRequireDefault(_config);

var _logger = require('../libs/logger');

var _logger2 = _interopRequireDefault(_logger);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get('/mail/image/:tracking', function (req, res, next) {
  var tracking = req.params.tracking || '';
  var pos = tracking.indexOf('.gif');
  var realTrack = tracking.substring(0, pos);
  var sql = 'UPDATE incoming_mails set seendate = NOW() where tracker = ' + req.dbConnection.escape(realTrack) + ' and seendate is null';
  // console.log('sql', sql);
  req.dbConnection.query(sql).then(function () {
    var buf = new Buffer(35);
    buf.write("R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=", "base64");
    res.send(buf, { 'Content-Type': 'image/gif' }, 200);
  }, function (e) {
    console.log('Tracking', e);
    var buf = new Buffer(35);
    buf.write("R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=", "base64");
    res.send(buf, { 'Content-Type': 'image/gif' }, 200);
  });
});

exports.default = router;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvbWFpbHRyYWNrLmpzIl0sIm5hbWVzIjpbInJvdXRlciIsIlJvdXRlciIsImdldCIsInJlcSIsInJlcyIsIm5leHQiLCJ0cmFja2luZyIsInBhcmFtcyIsInBvcyIsImluZGV4T2YiLCJyZWFsVHJhY2siLCJzdWJzdHJpbmciLCJzcWwiLCJkYkNvbm5lY3Rpb24iLCJlc2NhcGUiLCJxdWVyeSIsInRoZW4iLCJidWYiLCJCdWZmZXIiLCJ3cml0ZSIsInNlbmQiLCJlIiwiY29uc29sZSIsImxvZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQU1BLFNBQVMsa0JBQVFDLE1BQVIsRUFBZjs7QUFFQUQsT0FBT0UsR0FBUCxDQUFXLHVCQUFYLEVBQW9DLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFXQyxJQUFYLEVBQW9CO0FBQ3RELE1BQU1DLFdBQVdILElBQUlJLE1BQUosQ0FBV0QsUUFBWCxJQUF1QixFQUF4QztBQUNBLE1BQU1FLE1BQU1GLFNBQVNHLE9BQVQsQ0FBaUIsTUFBakIsQ0FBWjtBQUNBLE1BQU1DLFlBQVlKLFNBQVNLLFNBQVQsQ0FBbUIsQ0FBbkIsRUFBc0JILEdBQXRCLENBQWxCO0FBQ0EsTUFBTUksc0VBQW9FVCxJQUFJVSxZQUFKLENBQWlCQyxNQUFqQixDQUF3QkosU0FBeEIsQ0FBcEUsMEJBQU47QUFDQTtBQUNBUCxNQUFJVSxZQUFKLENBQWlCRSxLQUFqQixDQUF1QkgsR0FBdkIsRUFDR0ksSUFESCxDQUVJLFlBQU07QUFDSixRQUFNQyxNQUFNLElBQUlDLE1BQUosQ0FBVyxFQUFYLENBQVo7QUFDQUQsUUFBSUUsS0FBSixDQUFVLGtEQUFWLEVBQThELFFBQTlEO0FBQ0FmLFFBQUlnQixJQUFKLENBQVNILEdBQVQsRUFBYyxFQUFFLGdCQUFnQixXQUFsQixFQUFkLEVBQStDLEdBQS9DO0FBQ0QsR0FOTCxFQU9JLFVBQUNJLENBQUQsRUFBTztBQUNMQyxZQUFRQyxHQUFSLENBQVksVUFBWixFQUF3QkYsQ0FBeEI7QUFDQSxRQUFNSixNQUFNLElBQUlDLE1BQUosQ0FBVyxFQUFYLENBQVo7QUFDQUQsUUFBSUUsS0FBSixDQUFVLGtEQUFWLEVBQThELFFBQTlEO0FBQ0FmLFFBQUlnQixJQUFKLENBQVNILEdBQVQsRUFBYyxFQUFFLGdCQUFnQixXQUFsQixFQUFkLEVBQStDLEdBQS9DO0FBQ0QsR0FaTDtBQWVELENBckJEOztrQkF1QmVqQixNIiwiZmlsZSI6Im1haWx0cmFjay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xyXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uL2NvbmZpZy9jb25maWcuanNvbic7XHJcbmltcG9ydCBsb2dnZXIgZnJvbSAnLi4vbGlicy9sb2dnZXInO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5cclxuY29uc3Qgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcclxuXHJcbnJvdXRlci5nZXQoJy9tYWlsL2ltYWdlLzp0cmFja2luZycsIChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gIGNvbnN0IHRyYWNraW5nID0gcmVxLnBhcmFtcy50cmFja2luZyB8fCAnJztcclxuICBjb25zdCBwb3MgPSB0cmFja2luZy5pbmRleE9mKCcuZ2lmJyk7XHJcbiAgY29uc3QgcmVhbFRyYWNrID0gdHJhY2tpbmcuc3Vic3RyaW5nKDAsIHBvcyk7XHJcbiAgY29uc3Qgc3FsID0gYFVQREFURSBpbmNvbWluZ19tYWlscyBzZXQgc2VlbmRhdGUgPSBOT1coKSB3aGVyZSB0cmFja2VyID0gJHtyZXEuZGJDb25uZWN0aW9uLmVzY2FwZShyZWFsVHJhY2spfSBhbmQgc2VlbmRhdGUgaXMgbnVsbGA7XHJcbiAgLy8gY29uc29sZS5sb2coJ3NxbCcsIHNxbCk7XHJcbiAgcmVxLmRiQ29ubmVjdGlvbi5xdWVyeShzcWwpXHJcbiAgICAudGhlbihcclxuICAgICAgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoMzUpO1xyXG4gICAgICAgIGJ1Zi53cml0ZShcIlIwbEdPRGxoQVFBQkFJQUFBUC8vL3dBQUFDd0FBQUFBQVFBQkFBQUNBa1FCQURzPVwiLCBcImJhc2U2NFwiKTtcclxuICAgICAgICByZXMuc2VuZChidWYsIHsgJ0NvbnRlbnQtVHlwZSc6ICdpbWFnZS9naWYnIH0sIDIwMCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIChlKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1RyYWNraW5nJywgZSk7XHJcbiAgICAgICAgY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigzNSk7XHJcbiAgICAgICAgYnVmLndyaXRlKFwiUjBsR09EbGhBUUFCQUlBQUFQLy8vd0FBQUN3QUFBQUFBUUFCQUFBQ0FrUUJBRHM9XCIsIFwiYmFzZTY0XCIpO1xyXG4gICAgICAgIHJlcy5zZW5kKGJ1ZiwgeyAnQ29udGVudC1UeXBlJzogJ2ltYWdlL2dpZicgfSwgMjAwKTtcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgcm91dGVyO1xyXG4iXX0=