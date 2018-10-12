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

router.get('/requestsecret', function (req, res, next) {
  var session = req.session;
  // console.log('In get, session', session);
  //console.log('Session', session);

  if (session.validCode && session.askConfirmed !== true) {
    // res.send("Qui mostro il form");
    //console.log('baseParams', req.baseParams);
    res.render('requestsecret', Object.assign({}, req.baseParams, {
      askLabel: req.session.askLabel,
      title: 'Verifica dati',
      viewEngines: req.viewEngines,
      viewRoots: req.viewRoots
    }));
  } else {
    if (session.askConfirmed) {
      res.redirect(302, '/requestfullname');
    } else {
      res.redirect(302, '/codicenonvalido');
    }
  }
});

router.post('/requestsecret', function (req, res, next) {
  var session = req.session;
  // console.log('Current session', session);

  if (session.askConfirmed) {
    session.askConfirmed = false;
  }
  if (session.fullnameConfirmed) {
    session.fullnameConfirmed = false;
  }
  if (session.authenticated) {
    session.authenticated = false;
  }
  if (session.validCode) {
    if (typeof req.body.askValue === 'string' && session.askValue.trim().toLowerCase() === req.body.askValue.trim().toLowerCase()) {
      (0, _logger2.default)(req, 'Codice verificato per record ID ' + req.session.dbRecord.ID, 'audit').then(function (result) {
        session.askConfirmed = true;
        session.save(function (saveError) {
          if (saveError) {
            console.log('Save Error in request secret', saveError);
          }
          res.redirect(302, '/requestfullname');
        });
      });
    } else {
      (0, _logger2.default)(req, 'Verifica fallita per il record ' + req.session.dbRecord.ID + ' (codice inserito: ' + (req.body.askValue ? req.body.askValue.toString() : '') + ')', 'audit').then(function (result) {
        res.render('requestsecret', Object.assign({}, req.baseParams, {
          askLabel: req.session.askLabel,
          title: 'Verifica dati',
          formError: true,
          viewEngines: req.viewEngines,
          viewRoots: req.viewRoots
        }));
      });
    }
    //  console.log('BODY: ',req.body);
  } else {
    console.log('Session with no validCode!', req.sessionID, session);
    (0, _logger2.default)(req, 'Tentativo di POST senza codice valido', 'security').then(function (result) {
      res.status(500).render('errors/dbfailure', Object.assign({}, req.baseParams, {
        title: 'Temporary error',
        domain: session && session.domain ? session.domain : 'default',
        viewEngines: req.viewEngines,
        viewRoots: req.viewRoots
      }));
    });
  }
});

exports.default = router;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvcmVxdWVzdHNlY3JldC5qcyJdLCJuYW1lcyI6WyJyb3V0ZXIiLCJSb3V0ZXIiLCJnZXQiLCJyZXEiLCJyZXMiLCJuZXh0Iiwic2Vzc2lvbiIsInZhbGlkQ29kZSIsImFza0NvbmZpcm1lZCIsInJlbmRlciIsIk9iamVjdCIsImFzc2lnbiIsImJhc2VQYXJhbXMiLCJhc2tMYWJlbCIsInRpdGxlIiwidmlld0VuZ2luZXMiLCJ2aWV3Um9vdHMiLCJyZWRpcmVjdCIsInBvc3QiLCJmdWxsbmFtZUNvbmZpcm1lZCIsImF1dGhlbnRpY2F0ZWQiLCJib2R5IiwiYXNrVmFsdWUiLCJ0cmltIiwidG9Mb3dlckNhc2UiLCJkYlJlY29yZCIsIklEIiwidGhlbiIsInJlc3VsdCIsInNhdmUiLCJzYXZlRXJyb3IiLCJjb25zb2xlIiwibG9nIiwidG9TdHJpbmciLCJmb3JtRXJyb3IiLCJzZXNzaW9uSUQiLCJzdGF0dXMiLCJkb21haW4iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBQ0EsSUFBTUEsU0FBUyxrQkFBUUMsTUFBUixFQUFmOztBQUVBRCxPQUFPRSxHQUFQLENBQVcsZ0JBQVgsRUFBNkIsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQVdDLElBQVgsRUFBb0I7QUFBQSxNQUU3Q0MsT0FGNkMsR0FHM0NILEdBSDJDLENBRTdDRyxPQUY2QztBQUkvQztBQUNBOztBQUNBLE1BQUlBLFFBQVFDLFNBQVIsSUFBcUJELFFBQVFFLFlBQVIsS0FBeUIsSUFBbEQsRUFBd0Q7QUFDdEQ7QUFDQTtBQUNBSixRQUFJSyxNQUFKLGtCQUE0QkMsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0JSLElBQUlTLFVBQXRCLEVBQWtDO0FBQzVEQyxnQkFBVVYsSUFBSUcsT0FBSixDQUFZTyxRQURzQztBQUU1REMsYUFBTyxlQUZxRDtBQUc1REMsbUJBQWFaLElBQUlZLFdBSDJDO0FBSTVEQyxpQkFBV2IsSUFBSWE7QUFK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STNFQyxtQkFBV2IsSUFBSWE7QUFKNEQsT0FBbEMsQ0FBM0M7QUFNRCxLQVRIO0FBV0Q7QUFFRixDQXhERDs7a0JBMERlaEIsTSIsImZpbGUiOiJyZXF1ZXN0c2VjcmV0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XHJcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnL2NvbmZpZy5qc29uJztcclxuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi9saWJzL2xvZ2dlcic7XHJcbmNvbnN0IHJvdXRlciA9IGV4cHJlc3MuUm91dGVyKCk7XHJcblxyXG5yb3V0ZXIuZ2V0KCcvcmVxdWVzdHNlY3JldCcsIChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gIGNvbnN0IHtcclxuICAgIHNlc3Npb25cclxuICB9ID0gcmVxO1xyXG4gIC8vIGNvbnNvbGUubG9nKCdJbiBnZXQsIHNlc3Npb24nLCBzZXNzaW9uKTtcclxuICAvL2NvbnNvbGUubG9nKCdTZXNzaW9uJywgc2Vzc2lvbik7XHJcbiAgaWYgKHNlc3Npb24udmFsaWRDb2RlICYmIHNlc3Npb24uYXNrQ29uZmlybWVkICE9PSB0cnVlKSB7XHJcbiAgICAvLyByZXMuc2VuZChcIlF1aSBtb3N0cm8gaWwgZm9ybVwiKTtcclxuICAgIC8vY29uc29sZS5sb2coJ2Jhc2VQYXJhbXMnLCByZXEuYmFzZVBhcmFtcyk7XHJcbiAgICByZXMucmVuZGVyKGByZXF1ZXN0c2VjcmV0YCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgICAgYXNrTGFiZWw6IHJlcS5zZXNzaW9uLmFza0xhYmVsLFxyXG4gICAgICB0aXRsZTogJ1ZlcmlmaWNhIGRhdGknLFxyXG4gICAgICB2aWV3RW5naW5lczogcmVxLnZpZXdFbmdpbmVzLFxyXG4gICAgICB2aWV3Um9vdHM6IHJlcS52aWV3Um9vdHNcclxuICAgIH0pKTtcclxuICB9IGVsc2Uge1xyXG4gICAgaWYgKHNlc3Npb24uYXNrQ29uZmlybWVkKSB7XHJcbiAgICAgIHJlcy5yZWRpcmVjdCgzMDIsICcvcmVxdWVzdGZ1bGxuYW1lJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXMucmVkaXJlY3QoMzAyLCAnL2NvZGljZW5vbnZhbGlkbycpO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcblxyXG5yb3V0ZXIucG9zdCgnL3JlcXVlc3RzZWNyZXQnLCAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICBjb25zdCB7XHJcbiAgICBzZXNzaW9uXHJcbiAgfSA9IHJlcTtcclxuICAvLyBjb25zb2xlLmxvZygnQ3VycmVudCBzZXNzaW9uJywgc2Vzc2lvbik7XHJcbiAgaWYgKHNlc3Npb24uYXNrQ29uZmlybWVkKSB7XHJcbiAgICBzZXNzaW9uLmFza0NvbmZpcm1lZCA9IGZhbHNlO1xyXG4gIH1cclxuICBpZiAoc2Vzc2lvbi5mdWxsbmFtZUNvbmZpcm1lZCkge1xyXG4gICAgc2Vzc2lvbi5mdWxsbmFtZUNvbmZpcm1lZCA9IGZhbHNlO1xyXG4gIH1cclxuICBpZiAoc2Vzc2lvbi5hdXRoZW50aWNhdGVkKSB7XHJcbiAgICBzZXNzaW9uLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcclxuICB9XHJcbiAgaWYgKHNlc3Npb24udmFsaWRDb2RlKSB7XHJcbiAgICBpZiAodHlwZW9mIHJlcS5ib2R5LmFza1ZhbHVlID09PSAnc3RyaW5nJyAmJiBzZXNzaW9uLmFza1ZhbHVlLnRyaW0oKS50b0xvd2VyQ2FzZSgpID09PSByZXEuYm9keS5hc2tWYWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKSl7XHJcbiAgICAgIGxvZ2dlcihyZXEsIGBDb2RpY2UgdmVyaWZpY2F0byBwZXIgcmVjb3JkIElEICR7cmVxLnNlc3Npb24uZGJSZWNvcmQuSUR9YCwgJ2F1ZGl0JykudGhlbihcclxuICAgICAgICAocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICBzZXNzaW9uLmFza0NvbmZpcm1lZCA9IHRydWU7XHJcbiAgICAgICAgICBzZXNzaW9uLnNhdmUoKHNhdmVFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICBpZiAoc2F2ZUVycm9yKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1NhdmUgRXJyb3IgaW4gcmVxdWVzdCBzZWNyZXQnLCBzYXZlRXJyb3IpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlcy5yZWRpcmVjdCgzMDIsICcvcmVxdWVzdGZ1bGxuYW1lJyk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsb2dnZXIocmVxLCBgVmVyaWZpY2EgZmFsbGl0YSBwZXIgaWwgcmVjb3JkICR7cmVxLnNlc3Npb24uZGJSZWNvcmQuSUR9IChjb2RpY2UgaW5zZXJpdG86ICR7cmVxLmJvZHkuYXNrVmFsdWUgPyByZXEuYm9keS5hc2tWYWx1ZS50b1N0cmluZygpIDogJycgfSlgLCAnYXVkaXQnKS50aGVuKFxyXG4gICAgICAgIChyZXN1bHQpID0+IHtcclxuICAgICAgICAgIHJlcy5yZW5kZXIoYHJlcXVlc3RzZWNyZXRgLCBPYmplY3QuYXNzaWduKHt9LCByZXEuYmFzZVBhcmFtcywge1xyXG4gICAgICAgICAgICBhc2tMYWJlbDogcmVxLnNlc3Npb24uYXNrTGFiZWwsXHJcbiAgICAgICAgICAgIHRpdGxlOiAnVmVyaWZpY2EgZGF0aScsXHJcbiAgICAgICAgICAgIGZvcm1FcnJvcjogdHJ1ZSxcclxuICAgICAgICAgICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcclxuICAgICAgICAgICAgdmlld1Jvb3RzOiByZXEudmlld1Jvb3RzXHJcbiAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIC8vICBjb25zb2xlLmxvZygnQk9EWTogJyxyZXEuYm9keSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnNvbGUubG9nKCdTZXNzaW9uIHdpdGggbm8gdmFsaWRDb2RlIScsIHJlcS5zZXNzaW9uSUQsIHNlc3Npb24pO1xyXG4gICAgbG9nZ2VyKHJlcSwgYFRlbnRhdGl2byBkaSBQT1NUIHNlbnphIGNvZGljZSB2YWxpZG9gLCAnc2VjdXJpdHknKVxyXG4gICAgLnRoZW4oXHJcbiAgICAgIChyZXN1bHQpID0+IHtcclxuICAgICAgICByZXMuc3RhdHVzKDUwMCkucmVuZGVyKGBlcnJvcnMvZGJmYWlsdXJlYCwgT2JqZWN0LmFzc2lnbih7fSwgcmVxLmJhc2VQYXJhbXMsIHtcclxuICAgICAgICAgIHRpdGxlOiBgVGVtcG9yYXJ5IGVycm9yYCxcclxuICAgICAgICAgIGRvbWFpbjogc2Vzc2lvbiAmJiBzZXNzaW9uLmRvbWFpbiA/IHNlc3Npb24uZG9tYWluIDogJ2RlZmF1bHQnLFxyXG4gICAgICAgICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcclxuICAgICAgICAgIHZpZXdSb290czogcmVxLnZpZXdSb290c1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgfVxyXG4gICAgKTtcclxuICB9XHJcblxyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjtcclxuIl19