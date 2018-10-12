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

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

var makeConcatString = function makeConcatString(s) {
  var len = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

  var rS = s.toString();
  return 'RPAD(' + rS + ', ' + len + ', 0x00)';
  // CONCAT('VO2JE',CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'),CHAR(X'00'))
};

router.get('/:filename', function (req, res, next) {
  var possibleFiles = [];
  if (req.session && req.session.domain && req.session.domain.length > 0) {
    possibleFiles.push('./smallcontents/' + req.session.domain + '/' + req.params.filename + '.html');
  }
  possibleFiles.push('./smallcontents/default/' + req.params.filename + '.html');
  possibleFiles.forEach(function (file, pos) {
    if (typeof process !== 'undefined' && process.platform === 'win32') {
      possibleFiles[pos] = _path2.default.normalize(file);
    } else {
      possibleFiles[pos] = _path2.default.normalize(file);
    }
  });
  var goodFile = possibleFiles.reduce(function (prev, curr) {
    if (prev) {
      return prev;
    }
    if (_fs2.default.existsSync(curr)) {
      return curr;
    }
    return prev;
  }, false);

  if (goodFile) {
    _fs2.default.readFile(goodFile, function (err, smallcontent) {
      if (err) {
        next(err);
      } else {
        res.render('smallcontent', Object.assign({}, req.baseParams, {
          smallcontent: smallcontent,
          title: '',
          viewEngines: req.viewEngines,
          viewRoots: req.viewRoots
        }));
      }
    });
  } else {
    next();
  }
});

exports.default = router;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvc21hbGxDb250ZW50LmpzIl0sIm5hbWVzIjpbInJvdXRlciIsIlJvdXRlciIsIm1ha2VDb25jYXRTdHJpbmciLCJzIiwibGVuIiwiclMiLCJ0b1N0cmluZyIsImdldCIsInJlcSIsInJlcyIsIm5leHQiLCJwb3NzaWJsZUZpbGVzIiwic2Vzc2lvbiIsImRvbWFpbiIsImxlbmd0aCIsInB1c2giLCJwYXJhbXMiLCJmaWxlbmFtZSIsImZvckVhY2giLCJmaWxlIiwicG9zIiwicHJvY2VzcyIsInBsYXRmb3JtIiwibm9ybWFsaXplIiwiZ29vZEZpbGUiLCJyZWR1Y2UiLCJwcmV2IiwiY3VyciIsImV4aXN0c1N5bmMiLCJyZWFkRmlsZSIsImVyciIsInNtYWxsY29udGVudCIsInJlbmRlciIsIk9iamVjdCIsImFzc2lnbiIsImJhc2VQYXJhbXMiLCJ0aXRsZSIsInZpZXdFbmdpbmVzIiwidmlld1Jvb3RzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQSxJQUFNQSxTQUFTLGtCQUFRQyxNQUFSLEVBQWY7O0FBRUEsSUFBTUMsbUJBQW1CLFNBQW5CQSxnQkFBbUIsQ0FBQ0MsQ0FBRCxFQUFpQjtBQUFBLE1BQWJDLEdBQWEsdUVBQVAsRUFBTzs7QUFDeEMsTUFBSUMsS0FBS0YsRUFBRUcsUUFBRixFQUFUO0FBQ0EsbUJBQWVELEVBQWYsVUFBc0JELEdBQXRCO0FBQ0E7QUFDRCxDQUpEOztBQU1BSixPQUFPTyxHQUFQLENBQVcsWUFBWCxFQUF5QixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBV0MsSUFBWCxFQUFvQjtBQUMzQyxNQUFNQyxnQkFBZ0IsRUFBdEI7QUFDQSxNQUFJSCxJQUFJSSxPQUFKLElBQWVKLElBQUlJLE9BQUosQ0FBWUMsTUFBM0IsSUFBcUNMLElBQUlJLE9BQUosQ0FBWUMsTUFBWixDQUFtQkMsTUFBbkIsR0FBNEIsQ0FBckUsRUFBd0U7QUFDdEVILGtCQUFjSSxJQUFkLHNCQUFzQ1AsSUFBSUksT0FBSixDQUFZQyxNQUFsRCxTQUE0REwsSUFBSVEsTUFBSixDQUFXQyxRQUF2RTtBQUNEO0FBQ0ROLGdCQUFjSSxJQUFkLDhCQUE4Q1AsSUFBSVEsTUFBSixDQUFXQyxRQUF6RDtBQUNBTixnQkFBY08sT0FBZCxDQUFzQixVQUFDQyxJQUFELEVBQU9DLEdBQVAsRUFBZTtBQUNuQyxRQUFJLE9BQU9DLE9BQVAsS0FBbUIsV0FBbkIsSUFBa0NBLFFBQVFDLFFBQVIsS0FBcUIsT0FBM0QsRUFBb0U7QUFDbEVYLG9CQUFjUyxHQUFkLElBQXFCLGVBQUtHLFNBQUwsQ0FBZUosSUFBZixDQUFyQjtBQUNELEtBRkQsTUFFTztBQUNMUixvQkFBY1MsR0FBZCxJQUFxQixlQUFLRyxTQUFMLENBQWVKLElBQWYsQ0FBckI7QUFDRDtBQUNGLEdBTkQ7QUFPQSxNQUFNSyxXQUFXYixjQUFjYyxNQUFkLENBQXFCLFVBQVNDLElBQVQsRUFBZUMsSUFBZixFQUFxQjtBQUN6RCxRQUFJRCxJQUFKLEVBQVU7QUFBRSxhQUFPQSxJQUFQO0FBQWM7QUFDMUIsUUFBSSxhQUFHRSxVQUFILENBQWNELElBQWQsQ0FBSixFQUF5QjtBQUN2QixhQUFPQSxJQUFQO0FBQ0Q7QUFDRCxXQUFPRCxJQUFQO0FBQ0QsR0FOZ0IsRUFNZCxLQU5jLENBQWpCOztBQVFBLE1BQUlGLFFBQUosRUFBYztBQUNaLGlCQUFHSyxRQUFILENBQVlMLFFBQVosRUFBc0IsVUFBQ00sR0FBRCxFQUFNQyxZQUFOLEVBQXVCO0FBQzNDLFVBQUlELEdBQUosRUFBUztBQUNQcEIsYUFBS29CLEdBQUw7QUFDRCxPQUZELE1BRU87QUFDTHJCLFlBQUl1QixNQUFKLGlCQUEyQkMsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0IxQixJQUFJMkIsVUFBdEIsRUFBa0M7QUFDM0RKLG9DQUQyRDtBQUUzREssaUJBQU8sRUFGb0Q7QUFHM0RDLHVCQUFhN0IsSUFBSTZCLFdBSDBDO0FBSTNEQyxxQkFBVzlCLElBQUk4QjtBQUo0QyxTQUFsQyxDQUEzQjtBQU1EO0FBQ0YsS0FYRDtBQVlELEdBYkQsTUFhTztBQUNMNUI7QUFDRDtBQUNGLENBckNEOztrQkF1Q2VWLE0iLCJmaWxlIjoic21hbGxDb250ZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XHJcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnL2NvbmZpZy5qc29uJztcclxuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi9saWJzL2xvZ2dlcic7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuY29uc3Qgcm91dGVyID0gZXhwcmVzcy5Sb3V0ZXIoKTtcclxuXHJcbmNvbnN0IG1ha2VDb25jYXRTdHJpbmcgPSAocywgbGVuID0gMTApID0+IHtcclxuICBsZXQgclMgPSBzLnRvU3RyaW5nKCk7XHJcbiAgcmV0dXJuIGBSUEFEKCR7clN9LCAke2xlbn0sIDB4MDApYDtcclxuICAvLyBDT05DQVQoJ1ZPMkpFJyxDSEFSKFgnMDAnKSxDSEFSKFgnMDAnKSxDSEFSKFgnMDAnKSxDSEFSKFgnMDAnKSxDSEFSKFgnMDAnKSlcclxufVxyXG5cclxucm91dGVyLmdldCgnLzpmaWxlbmFtZScsIChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gIGNvbnN0IHBvc3NpYmxlRmlsZXMgPSBbXTtcclxuICBpZiAocmVxLnNlc3Npb24gJiYgcmVxLnNlc3Npb24uZG9tYWluICYmIHJlcS5zZXNzaW9uLmRvbWFpbi5sZW5ndGggPiAwKSB7XHJcbiAgICBwb3NzaWJsZUZpbGVzLnB1c2goYC4vc21hbGxjb250ZW50cy8ke3JlcS5zZXNzaW9uLmRvbWFpbn0vJHtyZXEucGFyYW1zLmZpbGVuYW1lfS5odG1sYCk7XHJcbiAgfVxyXG4gIHBvc3NpYmxlRmlsZXMucHVzaChgLi9zbWFsbGNvbnRlbnRzL2RlZmF1bHQvJHtyZXEucGFyYW1zLmZpbGVuYW1lfS5odG1sYCk7XHJcbiAgcG9zc2libGVGaWxlcy5mb3JFYWNoKChmaWxlLCBwb3MpID0+IHtcclxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xyXG4gICAgICBwb3NzaWJsZUZpbGVzW3Bvc10gPSBwYXRoLm5vcm1hbGl6ZShmaWxlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHBvc3NpYmxlRmlsZXNbcG9zXSA9IHBhdGgubm9ybWFsaXplKGZpbGUpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIGNvbnN0IGdvb2RGaWxlID0gcG9zc2libGVGaWxlcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3Vycikge1xyXG4gICAgaWYgKHByZXYpIHsgcmV0dXJuIHByZXY7IH1cclxuICAgIGlmIChmcy5leGlzdHNTeW5jKGN1cnIpKSB7XHJcbiAgICAgIHJldHVybiBjdXJyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByZXY7XHJcbiAgfSwgZmFsc2UpO1xyXG5cclxuICBpZiAoZ29vZEZpbGUpIHtcclxuICAgIGZzLnJlYWRGaWxlKGdvb2RGaWxlLCAoZXJyLCBzbWFsbGNvbnRlbnQpID0+IHtcclxuICAgICAgaWYgKGVycikge1xyXG4gICAgICAgIG5leHQoZXJyKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXMucmVuZGVyKGBzbWFsbGNvbnRlbnRgLCBPYmplY3QuYXNzaWduKHt9LCByZXEuYmFzZVBhcmFtcywge1xyXG4gICAgICAgICAgc21hbGxjb250ZW50LFxyXG4gICAgICAgICAgdGl0bGU6ICcnLFxyXG4gICAgICAgICAgdmlld0VuZ2luZXM6IHJlcS52aWV3RW5naW5lcyxcclxuICAgICAgICAgIHZpZXdSb290czogcmVxLnZpZXdSb290c1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIG5leHQoKTtcclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgcm91dGVyO1xyXG4iXX0=