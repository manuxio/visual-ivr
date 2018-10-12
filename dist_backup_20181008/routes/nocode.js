'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _logger = require('../libs/logger');

var _logger2 = _interopRequireDefault(_logger);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _ect = require('ect');

var _ect2 = _interopRequireDefault(_ect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();
router.get('/codicenonvalido', function (req, res, next) {
  var session = req.session;
  // session.regenerate(() => {

  req.session.dbRecord = null;
  req.session.code = null;
  req.session.validCode = false;
  req.session.askConfirmed = false;
  req.session.fullnameConfirmed = false;
  req.session.authenticated = false;
  console.log('Closing session for address', req.ip, req.sessionID, req.originalUrl);
  req.session.domain = 'default';
  var domainfromurl = req.get('host').split(':')[0];
  _fs2.default.readFile('./domainsToCustomer/' + domainfromurl, function (err, value) {
    // console.log('Stats', err, stats);
    var domain = 'default';
    if (!err && value.toString().length > 0) {
      req.session.domain = value.toString().trim();
      domain = req.session.domain;
    } else {
      console.warn('[invalid domain from url] In nocode, unable to validate domain for from domain ' + domainfromurl);
    }
    var roots = ['./views/default'];
    if (req.session && req.session.domain) {
      roots = ['./views/' + req.session.domain, './views/default'];
      // console.log('roots', roots);
      var ectRenderer = (0, _ect2.default)({ watch: true, cache: false, root: roots });
      req.viewEngines = { '.ect': ectRenderer.render, 'default': false };
    } else {
      var _ectRenderer = (0, _ect2.default)({ watch: true, cache: false, root: 'views/default' });
      req.viewEngines = { '.ect': _ectRenderer.render, 'default': true };
    }
    req.viewRoots = roots;
    // console.log('req.viewEngines', req.viewEngines);
    req.session.save(function (saveError) {
      res.render('nocode', Object.assign({}, req.baseParams, {
        title: 'Nessun codice valido',
        domain: domain,
        viewEngines: req.viewEngines,
        viewRoots: req.viewRoots
      }));
    });
  });
  // });
});

exports.default = router;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvbm9jb2RlLmpzIl0sIm5hbWVzIjpbInJvdXRlciIsIlJvdXRlciIsImdldCIsInJlcSIsInJlcyIsIm5leHQiLCJzZXNzaW9uIiwiZGJSZWNvcmQiLCJjb2RlIiwidmFsaWRDb2RlIiwiYXNrQ29uZmlybWVkIiwiZnVsbG5hbWVDb25maXJtZWQiLCJhdXRoZW50aWNhdGVkIiwiY29uc29sZSIsImxvZyIsImlwIiwic2Vzc2lvbklEIiwib3JpZ2luYWxVcmwiLCJkb21haW4iLCJkb21haW5mcm9tdXJsIiwic3BsaXQiLCJyZWFkRmlsZSIsImVyciIsInZhbHVlIiwidG9TdHJpbmciLCJsZW5ndGgiLCJ0cmltIiwid2FybiIsInJvb3RzIiwiZWN0UmVuZGVyZXIiLCJ3YXRjaCIsImNhY2hlIiwicm9vdCIsInZpZXdFbmdpbmVzIiwicmVuZGVyIiwidmlld1Jvb3RzIiwic2F2ZSIsInNhdmVFcnJvciIsIk9iamVjdCIsImFzc2lnbiIsImJhc2VQYXJhbXMiLCJ0aXRsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQU1BLFNBQVMsa0JBQVFDLE1BQVIsRUFBZjtBQUNBRCxPQUFPRSxHQUFQLENBQVcsa0JBQVgsRUFBK0IsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQVdDLElBQVgsRUFBb0I7QUFBQSxNQUUvQ0MsT0FGK0MsR0FHN0NILEdBSDZDLENBRS9DRyxPQUYrQztBQUlqRDs7QUFDRUgsTUFBSUcsT0FBSixDQUFZQyxRQUFaLEdBQXVCLElBQXZCO0FBQ0FKLE1BQUlHLE9BQUosQ0FBWUUsSUFBWixHQUFtQixJQUFuQjtBQUNBTCxNQUFJRyxPQUFKLENBQVlHLFNBQVosR0FBd0IsS0FBeEI7QUFDQU4sTUFBSUcsT0FBSixDQUFZSSxZQUFaLEdBQTJCLEtBQTNCO0FBQ0FQLE1BQUlHLE9BQUosQ0FBWUssaUJBQVosR0FBZ0MsS0FBaEM7QUFDQVIsTUFBSUcsT0FBSixDQUFZTSxhQUFaLEdBQTRCLEtBQTVCO0FBQ0FDLFVBQVFDLEdBQVIsQ0FBWSw2QkFBWixFQUEyQ1gsSUFBSVksRUFBL0MsRUFBbURaLElBQUlhLFNBQXZELEVBQWtFYixJQUFJYyxXQUF0RTtBQUNBZCxNQUFJRyxPQUFKLENBQVlZLE1BQVosR0FBcUIsU0FBckI7QUFDQSxNQUFNQyxnQkFBZ0JoQixJQUFJRCxHQUFKLENBQVEsTUFBUixFQUFnQmtCLEtBQWhCLENBQXNCLEdBQXRCLEVBQTJCLENBQTNCLENBQXRCO0FBQ0EsZUFBR0MsUUFBSCwwQkFBbUNGLGFBQW5DLEVBQW9ELFVBQUNHLEdBQUQsRUFBTUMsS0FBTixFQUFnQjtBQUNsRTtBQUNBLFFBQUlMLFNBQVMsU0FBYjtBQUNBLFFBQUksQ0FBQ0ksR0FBRCxJQUFRQyxNQUFNQyxRQUFOLEdBQWlCQyxNQUFqQixHQUEwQixDQUF0QyxFQUF5QztBQUN2Q3RCLFVBQUlHLE9BQUosQ0FBWVksTUFBWixHQUFxQkssTUFBTUMsUUFBTixHQUFpQkUsSUFBakIsRUFBckI7QUFDQVIsZUFBU2YsSUFBSUcsT0FBSixDQUFZWSxNQUFyQjtBQUNELEtBSEQsTUFHTztBQUNMTCxjQUFRYyxJQUFSLHFGQUErRlIsYUFBL0Y7QUFDRDtBQUNELFFBQUlTLFFBQVEsbUJBQVo7QUFDQSxRQUFJekIsSUFBSUcsT0FBSixJQUFlSCxJQUFJRyxPQUFKLENBQVlZLE1BQS9CLEVBQXVDO0FBQ3JDVSxjQUFRLGNBQ0t6QixJQUFJRyxPQUFKLENBQVlZLE1BRGpCLG9CQUFSO0FBSUE7QUFDQSxVQUFNVyxjQUFjLG1CQUFJLEVBQUVDLE9BQU8sSUFBVCxFQUFlQyxPQUFPLEtBQXRCLEVBQTZCQyxNQUFNSixLQUFuQyxFQUFKLENBQXBCO0FBQ0F6QixVQUFJOEIsV0FBSixHQUFrQixFQUFFLFFBQVFKLFlBQVlLLE1BQXRCLEVBQThCLFdBQVcsS0FBekMsRUFBbEI7QUFDRCxLQVJELE1BUU87QUFDTCxVQUFNTCxlQUFjLG1CQUFJLEVBQUVDLE9BQU8sSUFBVCxFQUFlQyxPQUFPLEtBQXRCLEVBQTZCQyxxQkFBN0IsRUFBSixDQUFwQjtBQUNBN0IsVUFBSThCLFdBQUosR0FBa0IsRUFBRSxRQUFRSixhQUFZSyxNQUF0QixFQUE4QixXQUFXLElBQXpDLEVBQWxCO0FBQ0Q7QUFDRC9CLFFBQUlnQyxTQUFKLEdBQWdCUCxLQUFoQjtBQUNBO0FBQ0F6QixRQUFJRyxPQUFKLENBQVk4QixJQUFaLENBQWlCLFVBQUNDLFNBQUQsRUFBZTtBQUM5QmpDLFVBQUk4QixNQUFKLFdBQXFCSSxPQUFPQyxNQUFQLENBQWMsRUFBZCxFQUFrQnBDLElBQUlxQyxVQUF0QixFQUFrQztBQUNyREMscUNBRHFEO0FBRXJEdkIsc0JBRnFEO0FBR3JEZSxxQkFBYTlCLElBQUk4QixXQUhvQztBQUlyREUsbUJBQVdoQyxJQUFJZ0M7QUFKc0MsT0FBbEMsQ0FBckI7QUFNRCxLQVBEO0FBUUQsR0FoQ0Q7QUFpQ0Y7QUFDRCxDQWhERDs7a0JBa0RlbkMsTSIsImZpbGUiOiJub2NvZGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcclxuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi9saWJzL2xvZ2dlcic7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBlY3QgZnJvbSAnZWN0JztcclxuXHJcbmNvbnN0IHJvdXRlciA9IGV4cHJlc3MuUm91dGVyKCk7XHJcbnJvdXRlci5nZXQoJy9jb2RpY2Vub252YWxpZG8nLCAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICBjb25zdCB7XHJcbiAgICBzZXNzaW9uXHJcbiAgfSA9IHJlcTtcclxuICAvLyBzZXNzaW9uLnJlZ2VuZXJhdGUoKCkgPT4ge1xyXG4gICAgcmVxLnNlc3Npb24uZGJSZWNvcmQgPSBudWxsO1xyXG4gICAgcmVxLnNlc3Npb24uY29kZSA9IG51bGw7XHJcbiAgICByZXEuc2Vzc2lvbi52YWxpZENvZGUgPSBmYWxzZTtcclxuICAgIHJlcS5zZXNzaW9uLmFza0NvbmZpcm1lZCA9IGZhbHNlO1xyXG4gICAgcmVxLnNlc3Npb24uZnVsbG5hbWVDb25maXJtZWQgPSBmYWxzZTtcclxuICAgIHJlcS5zZXNzaW9uLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcclxuICAgIGNvbnNvbGUubG9nKCdDbG9zaW5nIHNlc3Npb24gZm9yIGFkZHJlc3MnLCByZXEuaXAsIHJlcS5zZXNzaW9uSUQsIHJlcS5vcmlnaW5hbFVybCk7XHJcbiAgICByZXEuc2Vzc2lvbi5kb21haW4gPSAnZGVmYXVsdCc7XHJcbiAgICBjb25zdCBkb21haW5mcm9tdXJsID0gcmVxLmdldCgnaG9zdCcpLnNwbGl0KCc6JylbMF07XHJcbiAgICBmcy5yZWFkRmlsZShgLi9kb21haW5zVG9DdXN0b21lci8ke2RvbWFpbmZyb211cmx9YCwgKGVyciwgdmFsdWUpID0+IHtcclxuICAgICAgLy8gY29uc29sZS5sb2coJ1N0YXRzJywgZXJyLCBzdGF0cyk7XHJcbiAgICAgIGxldCBkb21haW4gPSAnZGVmYXVsdCc7XHJcbiAgICAgIGlmICghZXJyICYmIHZhbHVlLnRvU3RyaW5nKCkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHJlcS5zZXNzaW9uLmRvbWFpbiA9IHZhbHVlLnRvU3RyaW5nKCkudHJpbSgpO1xyXG4gICAgICAgIGRvbWFpbiA9IHJlcS5zZXNzaW9uLmRvbWFpbjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oYFtpbnZhbGlkIGRvbWFpbiBmcm9tIHVybF0gSW4gbm9jb2RlLCB1bmFibGUgdG8gdmFsaWRhdGUgZG9tYWluIGZvciBmcm9tIGRvbWFpbiAke2RvbWFpbmZyb211cmx9YCk7XHJcbiAgICAgIH1cclxuICAgICAgbGV0IHJvb3RzID0gW2AuL3ZpZXdzL2RlZmF1bHRgXTtcclxuICAgICAgaWYgKHJlcS5zZXNzaW9uICYmIHJlcS5zZXNzaW9uLmRvbWFpbikge1xyXG4gICAgICAgIHJvb3RzID0gW1xyXG4gICAgICAgICAgYC4vdmlld3MvJHtyZXEuc2Vzc2lvbi5kb21haW59YCxcclxuICAgICAgICAgIGAuL3ZpZXdzL2RlZmF1bHRgXHJcbiAgICAgICAgXTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygncm9vdHMnLCByb290cyk7XHJcbiAgICAgICAgY29uc3QgZWN0UmVuZGVyZXIgPSBlY3QoeyB3YXRjaDogdHJ1ZSwgY2FjaGU6IGZhbHNlLCByb290OiByb290cyB9KTtcclxuICAgICAgICByZXEudmlld0VuZ2luZXMgPSB7ICcuZWN0JzogZWN0UmVuZGVyZXIucmVuZGVyLCAnZGVmYXVsdCc6IGZhbHNlIH07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgZWN0UmVuZGVyZXIgPSBlY3QoeyB3YXRjaDogdHJ1ZSwgY2FjaGU6IGZhbHNlLCByb290OiBgdmlld3MvZGVmYXVsdGAgfSk7XHJcbiAgICAgICAgcmVxLnZpZXdFbmdpbmVzID0geyAnLmVjdCc6IGVjdFJlbmRlcmVyLnJlbmRlciwgJ2RlZmF1bHQnOiB0cnVlIH07XHJcbiAgICAgIH1cclxuICAgICAgcmVxLnZpZXdSb290cyA9IHJvb3RzO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZygncmVxLnZpZXdFbmdpbmVzJywgcmVxLnZpZXdFbmdpbmVzKTtcclxuICAgICAgcmVxLnNlc3Npb24uc2F2ZSgoc2F2ZUVycm9yKSA9PiB7XHJcbiAgICAgICAgcmVzLnJlbmRlcihgbm9jb2RlYCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgICAgICAgIHRpdGxlOiBgTmVzc3VuIGNvZGljZSB2YWxpZG9gLFxyXG4gICAgICAgICAgZG9tYWluLFxyXG4gICAgICAgICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcclxuICAgICAgICAgIHZpZXdSb290czogcmVxLnZpZXdSb290c1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAvLyB9KTtcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7XHJcbiJdfQ==