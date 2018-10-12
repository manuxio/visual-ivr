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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get('/requestfullname', function (req, res, next) {
  var session = req.session;

  if (session.validCode && session.askConfirmed && session.fullnameConfirmed !== true) {
    // res.send("Qui mostro il form");
    //console.log('baseParams', req.baseParams);
    res.render('./requestfullname', Object.assign({}, req.baseParams, {
      title: 'Verifica identit&agrave;',
      viewEngines: req.viewEngines,
      viewRoots: req.viewRoots
    }));
  } else {
    if (session.fullnameConfirmed) {
      res.redirect(302, '/vivr/home');
    } else if (session.askConfirmed !== true && session.validcode) {
      res.redirect(302, '/requestsecret');
    } else {
      res.redirect(302, '/codicenonvalido');
    }
  }
});

router.post('/requestfullname', function (req, res, next) {
  var session = req.session;
  var body = req.body;
  var confirm = body.confirm;

  if (session.validCode && session.askConfirmed && confirm === 'true') {
    (0, _logger2.default)(req, 'Identita\' verificata per record ID ' + req.session.dbRecord.ID, 'audit').then(function (result) {
      session.askConfirmed = true;
      session.fullnameConfirmed = true;
      session.authenticated = true;
      res.redirect(302, '/vivr/home');
    });
  } else {
    (0, _logger2.default)(req, 'Verifica identita\' fallita per il record ' + req.session.dbRecord.ID, 'audit').then(function (result) {
      res.render('./requestfullname', Object.assign({}, req.baseParams, {
        title: 'Verifica identit&agrave;',
        viewEngines: req.viewEngines,
        viewRoots: req.viewRoots
      }));
    });
    //  console.log('BODY: ',req.body);
  }
});

exports.default = router;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvcmVxdWVzdGZ1bGxuYW1lLmpzIl0sIm5hbWVzIjpbInJvdXRlciIsIlJvdXRlciIsImdldCIsInJlcSIsInJlcyIsIm5leHQiLCJzZXNzaW9uIiwidmFsaWRDb2RlIiwiYXNrQ29uZmlybWVkIiwiZnVsbG5hbWVDb25maXJtZWQiLCJyZW5kZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJiYXNlUGFyYW1zIiwidGl0bGUiLCJ2aWV3RW5naW5lcyIsInZpZXdSb290cyIsInJlZGlyZWN0IiwidmFsaWRjb2RlIiwicG9zdCIsImJvZHkiLCJjb25maXJtIiwiZGJSZWNvcmQiLCJJRCIsInRoZW4iLCJyZXN1bHQiLCJhdXRoZW50aWNhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUNBLElBQU1BLFNBQVMsa0JBQVFDLE1BQVIsRUFBZjs7QUFFQUQsT0FBT0UsR0FBUCxDQUFXLGtCQUFYLEVBQStCLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFXQyxJQUFYLEVBQW9CO0FBQUEsTUFFL0NDLE9BRitDLEdBRzdDSCxHQUg2QyxDQUUvQ0csT0FGK0M7O0FBSWpELE1BQUlBLFFBQVFDLFNBQVIsSUFBcUJELFFBQVFFLFlBQTdCLElBQTZDRixRQUFRRyxpQkFBUixLQUE4QixJQUEvRSxFQUFxRjtBQUNuRjtBQUNBO0FBQ0FMLFFBQUlNLE1BQUosc0JBQWdDQyxPQUFPQyxNQUFQLENBQWMsRUFBZCxFQUFrQlQsSUFBSVUsVUFBdEIsRUFBa0M7QUFDaEVDLGFBQU8sMEJBRHlEO0FBRWhFQyxtQkFBYVosSUFBSVksV0FGK0M7QUFHaEVDLGlCQUFXYixJQUFJYTtBQUhpRCxLQUFsQyxDQUFoQztBQUtELEdBUkQsTUFRTztBQUNMLFFBQUlWLFFBQVFHLGlCQUFaLEVBQStCO0FBQzdCTCxVQUFJYSxRQUFKLENBQWEsR0FBYixFQUFrQixZQUFsQjtBQUNELEtBRkQsTUFFTyxJQUFJWCxRQUFRRSxZQUFSLEtBQXlCLElBQXpCLElBQWlDRixRQUFRWSxTQUE3QyxFQUF3RDtBQUM3RGQsVUFBSWEsUUFBSixDQUFhLEdBQWIsRUFBa0IsZ0JBQWxCO0FBQ0QsS0FGTSxNQUVBO0FBQ0xiLFVBQUlhLFFBQUosQ0FBYSxHQUFiLEVBQWtCLGtCQUFsQjtBQUNEO0FBQ0Y7QUFDRixDQXJCRDs7QUF1QkFqQixPQUFPbUIsSUFBUCxDQUFZLGtCQUFaLEVBQWdDLFVBQUNoQixHQUFELEVBQU1DLEdBQU4sRUFBV0MsSUFBWCxFQUFvQjtBQUFBLE1BRWhEQyxPQUZnRCxHQUc5Q0gsR0FIOEMsQ0FFaERHLE9BRmdEO0FBQUEsTUFLaERjLElBTGdELEdBTTlDakIsR0FOOEMsQ0FLaERpQixJQUxnRDtBQUFBLE1BUWhEQyxPQVJnRCxHQVM5Q0QsSUFUOEMsQ0FRaERDLE9BUmdEOztBQVVsRCxNQUFJZixRQUFRQyxTQUFSLElBQXFCRCxRQUFRRSxZQUE3QixJQUE2Q2EsWUFBWSxNQUE3RCxFQUFxRTtBQUNuRSwwQkFBT2xCLEdBQVAsMkNBQWtEQSxJQUFJRyxPQUFKLENBQVlnQixRQUFaLENBQXFCQyxFQUF2RSxFQUE2RSxPQUE3RSxFQUFzRkMsSUFBdEYsQ0FDRSxVQUFDQyxNQUFELEVBQVk7QUFDVm5CLGNBQVFFLFlBQVIsR0FBdUIsSUFBdkI7QUFDQUYsY0FBUUcsaUJBQVIsR0FBNEIsSUFBNUI7QUFDQUgsY0FBUW9CLGFBQVIsR0FBd0IsSUFBeEI7QUFDQXRCLFVBQUlhLFFBQUosQ0FBYSxHQUFiLEVBQWtCLFlBQWxCO0FBQ0QsS0FOSDtBQVFELEdBVEQsTUFTTztBQUNMLDBCQUFPZCxHQUFQLGlEQUF3REEsSUFBSUcsT0FBSixDQUFZZ0IsUUFBWixDQUFxQkMsRUFBN0UsRUFBbUYsT0FBbkYsRUFBNEZDLElBQTVGLENBQ0UsVUFBQ0MsTUFBRCxFQUFZO0FBQ1ZyQixVQUFJTSxNQUFKLHNCQUFnQ0MsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0JULElBQUlVLFVBQXRCLEVBQWtDO0FBQ2hFQyxlQUFPLDBCQUR5RDtBQUVoRUMscUJBQWFaLElBQUlZLFdBRitDO0FBR2hFQyxtQkFBV2IsSUFBSWE7QUFIaUQsT0FBbEMsQ0FBaEM7QUFLRCxLQVBIO0FBU0Y7QUFDQztBQUVGLENBaENEOztrQkFrQ2VoQixNIiwiZmlsZSI6InJlcXVlc3RmdWxsbmFtZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xyXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uL2NvbmZpZy9jb25maWcuanNvbic7XHJcbmltcG9ydCBsb2dnZXIgZnJvbSAnLi4vbGlicy9sb2dnZXInO1xyXG5jb25zdCByb3V0ZXIgPSBleHByZXNzLlJvdXRlcigpO1xyXG5cclxucm91dGVyLmdldCgnL3JlcXVlc3RmdWxsbmFtZScsIChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gIGNvbnN0IHtcclxuICAgIHNlc3Npb25cclxuICB9ID0gcmVxO1xyXG4gIGlmIChzZXNzaW9uLnZhbGlkQ29kZSAmJiBzZXNzaW9uLmFza0NvbmZpcm1lZCAmJiBzZXNzaW9uLmZ1bGxuYW1lQ29uZmlybWVkICE9PSB0cnVlKSB7XHJcbiAgICAvLyByZXMuc2VuZChcIlF1aSBtb3N0cm8gaWwgZm9ybVwiKTtcclxuICAgIC8vY29uc29sZS5sb2coJ2Jhc2VQYXJhbXMnLCByZXEuYmFzZVBhcmFtcyk7XHJcbiAgICByZXMucmVuZGVyKGAuL3JlcXVlc3RmdWxsbmFtZWAsIE9iamVjdC5hc3NpZ24oe30sIHJlcS5iYXNlUGFyYW1zLCB7XHJcbiAgICAgIHRpdGxlOiAnVmVyaWZpY2EgaWRlbnRpdCZhZ3JhdmU7JyxcclxuICAgICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcclxuICAgICAgdmlld1Jvb3RzOiByZXEudmlld1Jvb3RzXHJcbiAgICB9KSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChzZXNzaW9uLmZ1bGxuYW1lQ29uZmlybWVkKSB7XHJcbiAgICAgIHJlcy5yZWRpcmVjdCgzMDIsICcvdml2ci9ob21lJyk7XHJcbiAgICB9IGVsc2UgaWYgKHNlc3Npb24uYXNrQ29uZmlybWVkICE9PSB0cnVlICYmIHNlc3Npb24udmFsaWRjb2RlKSB7XHJcbiAgICAgIHJlcy5yZWRpcmVjdCgzMDIsICcvcmVxdWVzdHNlY3JldCcpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVzLnJlZGlyZWN0KDMwMiwgJy9jb2RpY2Vub252YWxpZG8nKTtcclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG5cclxucm91dGVyLnBvc3QoJy9yZXF1ZXN0ZnVsbG5hbWUnLCAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICBjb25zdCB7XHJcbiAgICBzZXNzaW9uXHJcbiAgfSA9IHJlcTtcclxuICBjb25zdCB7XHJcbiAgICBib2R5XHJcbiAgfSA9IHJlcTtcclxuICBjb25zdCB7XHJcbiAgICBjb25maXJtXHJcbiAgfSA9IGJvZHk7XHJcbiAgaWYgKHNlc3Npb24udmFsaWRDb2RlICYmIHNlc3Npb24uYXNrQ29uZmlybWVkICYmIGNvbmZpcm0gPT09ICd0cnVlJykge1xyXG4gICAgbG9nZ2VyKHJlcSwgYElkZW50aXRhJyB2ZXJpZmljYXRhIHBlciByZWNvcmQgSUQgJHtyZXEuc2Vzc2lvbi5kYlJlY29yZC5JRH1gLCAnYXVkaXQnKS50aGVuKFxyXG4gICAgICAocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgc2Vzc2lvbi5hc2tDb25maXJtZWQgPSB0cnVlO1xyXG4gICAgICAgIHNlc3Npb24uZnVsbG5hbWVDb25maXJtZWQgPSB0cnVlO1xyXG4gICAgICAgIHNlc3Npb24uYXV0aGVudGljYXRlZCA9IHRydWU7XHJcbiAgICAgICAgcmVzLnJlZGlyZWN0KDMwMiwgJy92aXZyL2hvbWUnKTtcclxuICAgICAgfVxyXG4gICAgKTtcclxuICB9IGVsc2Uge1xyXG4gICAgbG9nZ2VyKHJlcSwgYFZlcmlmaWNhIGlkZW50aXRhJyBmYWxsaXRhIHBlciBpbCByZWNvcmQgJHtyZXEuc2Vzc2lvbi5kYlJlY29yZC5JRH1gLCAnYXVkaXQnKS50aGVuKFxyXG4gICAgICAocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgcmVzLnJlbmRlcihgLi9yZXF1ZXN0ZnVsbG5hbWVgLCBPYmplY3QuYXNzaWduKHt9LCByZXEuYmFzZVBhcmFtcywge1xyXG4gICAgICAgICAgdGl0bGU6ICdWZXJpZmljYSBpZGVudGl0JmFncmF2ZTsnLFxyXG4gICAgICAgICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcclxuICAgICAgICAgIHZpZXdSb290czogcmVxLnZpZXdSb290c1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgfVxyXG4gICAgKTtcclxuICAvLyAgY29uc29sZS5sb2coJ0JPRFk6ICcscmVxLmJvZHkpO1xyXG4gIH1cclxuXHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgcm91dGVyO1xyXG4iXX0=