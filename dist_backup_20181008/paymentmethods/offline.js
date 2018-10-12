'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _basemethod = require('./basemethod');

var _basemethod2 = _interopRequireDefault(_basemethod);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var offlineMethod = function (_baseMethod) {
  _inherits(offlineMethod, _baseMethod);

  function offlineMethod() {
    _classCallCheck(this, offlineMethod);

    return _possibleConstructorReturn(this, (offlineMethod.__proto__ || Object.getPrototypeOf(offlineMethod)).apply(this, arguments));
  }

  _createClass(offlineMethod, [{
    key: 'getIntro',
    value: function getIntro() {
      var _session = this.session,
          dbRecord = _session.dbRecord,
          fullDbRecords = _session.fullDbRecords;

      var numeriFatture = [];
      var fatture = fullDbRecords.fatture;
      if (fatture && fatture.length) {
        numeriFatture = fatture.map(function (f) {
          return f.NumFattura;
        });
      }
      var description = this.description;
      if (numeriFatture.length > 0) {
        // console.log('Replacing!');
        description = description.replace(/#numerifatture#/g, 'numeri delle fatture ' + numeriFatture.join(', '));
      } else {
        // console.log('Not replacing!');
        description = description.replace(/#numerifatture#/g, 'numeri delle fatture - ');
      }
      // console.log('getIntro', description);
      return description;
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      return this.title;
    }
  }, {
    key: 'getForm',
    value: function getForm() {
      return "";
    }
  }], [{
    key: 'getCallBackUrls',
    value: function getCallBackUrls() {
      return [];
    }
  }]);

  return offlineMethod;
}(_basemethod2.default);

exports.default = offlineMethod;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXltZW50bWV0aG9kcy9vZmZsaW5lLmpzIl0sIm5hbWVzIjpbIm9mZmxpbmVNZXRob2QiLCJzZXNzaW9uIiwiZGJSZWNvcmQiLCJmdWxsRGJSZWNvcmRzIiwibnVtZXJpRmF0dHVyZSIsImZhdHR1cmUiLCJsZW5ndGgiLCJtYXAiLCJmIiwiTnVtRmF0dHVyYSIsImRlc2NyaXB0aW9uIiwicmVwbGFjZSIsImpvaW4iLCJ0aXRsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7O0lBRXFCQSxhOzs7Ozs7Ozs7OzsrQkFDUjtBQUFBLHFCQUlMLEtBQUtDLE9BSkE7QUFBQSxVQUVQQyxRQUZPLFlBRVBBLFFBRk87QUFBQSxVQUdQQyxhQUhPLFlBR1BBLGFBSE87O0FBS1QsVUFBSUMsZ0JBQWdCLEVBQXBCO0FBQ0EsVUFBTUMsVUFBVUYsY0FBY0UsT0FBOUI7QUFDQSxVQUFJQSxXQUFXQSxRQUFRQyxNQUF2QixFQUErQjtBQUM3QkYsd0JBQWdCQyxRQUFRRSxHQUFSLENBQVksVUFBQ0MsQ0FBRDtBQUFBLGlCQUFPQSxFQUFFQyxVQUFUO0FBQUEsU0FBWixDQUFoQjtBQUNEO0FBQ0QsVUFBSUMsY0FBYyxLQUFLQSxXQUF2QjtBQUNBLFVBQUlOLGNBQWNFLE1BQWQsR0FBdUIsQ0FBM0IsRUFBOEI7QUFDNUI7QUFDQUksc0JBQWNBLFlBQVlDLE9BQVosQ0FBb0Isa0JBQXBCLDRCQUFnRVAsY0FBY1EsSUFBZCxDQUFtQixJQUFuQixDQUFoRSxDQUFkO0FBQ0QsT0FIRCxNQUdPO0FBQ0w7QUFDQUYsc0JBQWNBLFlBQVlDLE9BQVosQ0FBb0Isa0JBQXBCLDRCQUFkO0FBQ0Q7QUFDRDtBQUNBLGFBQU9ELFdBQVA7QUFDRDs7OytCQUVVO0FBQ1QsYUFBTyxLQUFLRyxLQUFaO0FBQ0Q7Ozs4QkFFUztBQUNSLGFBQU8sRUFBUDtBQUNEOzs7c0NBRXdCO0FBQ3ZCLGFBQU8sRUFBUDtBQUNEOzs7Ozs7a0JBakNrQmIsYSIsImZpbGUiOiJvZmZsaW5lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGJhc2VNZXRob2QgZnJvbSAnLi9iYXNlbWV0aG9kJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIG9mZmxpbmVNZXRob2QgZXh0ZW5kcyBiYXNlTWV0aG9kIHtcclxuICBnZXRJbnRybygpIHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgZGJSZWNvcmQsXHJcbiAgICAgIGZ1bGxEYlJlY29yZHNcclxuICAgIH0gPSB0aGlzLnNlc3Npb247XHJcbiAgICBsZXQgbnVtZXJpRmF0dHVyZSA9IFtdO1xyXG4gICAgY29uc3QgZmF0dHVyZSA9IGZ1bGxEYlJlY29yZHMuZmF0dHVyZTtcclxuICAgIGlmIChmYXR0dXJlICYmIGZhdHR1cmUubGVuZ3RoKSB7XHJcbiAgICAgIG51bWVyaUZhdHR1cmUgPSBmYXR0dXJlLm1hcCgoZikgPT4gZi5OdW1GYXR0dXJhKTtcclxuICAgIH1cclxuICAgIGxldCBkZXNjcmlwdGlvbiA9IHRoaXMuZGVzY3JpcHRpb247XHJcbiAgICBpZiAobnVtZXJpRmF0dHVyZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdSZXBsYWNpbmchJyk7XHJcbiAgICAgIGRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb24ucmVwbGFjZSgvI251bWVyaWZhdHR1cmUjL2csIGBudW1lcmkgZGVsbGUgZmF0dHVyZSAke251bWVyaUZhdHR1cmUuam9pbignLCAnKX1gKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdOb3QgcmVwbGFjaW5nIScpO1xyXG4gICAgICBkZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uLnJlcGxhY2UoLyNudW1lcmlmYXR0dXJlIy9nLCBgbnVtZXJpIGRlbGxlIGZhdHR1cmUgLSBgKTtcclxuICAgIH1cclxuICAgIC8vIGNvbnNvbGUubG9nKCdnZXRJbnRybycsIGRlc2NyaXB0aW9uKTtcclxuICAgIHJldHVybiBkZXNjcmlwdGlvbjtcclxuICB9XHJcblxyXG4gIGdldFRpdGxlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudGl0bGU7XHJcbiAgfVxyXG5cclxuICBnZXRGb3JtKCkge1xyXG4gICAgcmV0dXJuIFwiXCI7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZ2V0Q2FsbEJhY2tVcmxzKCkge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxufVxyXG4iXX0=