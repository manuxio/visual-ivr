"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (req) {
  if (req.session && req.session.authenticated) {
    return true;
  } else {
    return false;
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWJzL2Z1bmN0aW9uYWxDaGVja0F1dGguanMiXSwibmFtZXMiOlsicmVxIiwic2Vzc2lvbiIsImF1dGhlbnRpY2F0ZWQiXSwibWFwcGluZ3MiOiI7Ozs7OztrQkFBZSxVQUFDQSxHQUFELEVBQVM7QUFDdEIsTUFBSUEsSUFBSUMsT0FBSixJQUFlRCxJQUFJQyxPQUFKLENBQVlDLGFBQS9CLEVBQThDO0FBQzVDLFdBQU8sSUFBUDtBQUNELEdBRkQsTUFFTztBQUNMLFdBQU8sS0FBUDtBQUNEO0FBQ0YsQyIsImZpbGUiOiJmdW5jdGlvbmFsQ2hlY2tBdXRoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgKHJlcSkgPT4ge1xyXG4gIGlmIChyZXEuc2Vzc2lvbiAmJiByZXEuc2Vzc2lvbi5hdXRoZW50aWNhdGVkKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuIl19