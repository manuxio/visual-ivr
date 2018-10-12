'use strict';

module.exports = function stripslashes(str) {
  //       discuss at: http://locutus.io/php/stripslashes/
  //      original by: Kevin van Zonneveld (http://kvz.io)
  //      improved by: Ates Goral (http://magnetiq.com)
  //      improved by: marrtins
  //      improved by: rezna
  //         fixed by: Mick@el
  //      bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
  //      bugfixed by: Brett Zamir (http://brett-zamir.me)
  //         input by: Rick Waldron
  //         input by: Brant Messenger (http://www.brantmessenger.com/)
  // reimplemented by: Brett Zamir (http://brett-zamir.me)
  //        example 1: stripslashes('Kevin\'s code')
  //        returns 1: "Kevin's code"
  //        example 2: stripslashes('Kevin\\\'s code')
  //        returns 2: "Kevin\'s code"
  if (!str) {
    return str;
  }
  return (str + '').replace(/\\(.?)/g, function (s, n1) {
    switch (n1) {
      case '\\':
        return '\\';
      case '0':
        return '\0';
      case '':
        return '';
      default:
        return n1;
    }
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWJzL3N0cmlwc2xhc2hlcy5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwic3RyaXBzbGFzaGVzIiwic3RyIiwicmVwbGFjZSIsInMiLCJuMSJdLCJtYXBwaW5ncyI6Ijs7QUFBQUEsT0FBT0MsT0FBUCxHQUFpQixTQUFTQyxZQUFULENBQXVCQyxHQUF2QixFQUE0QjtBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFJLENBQUNBLEdBQUwsRUFBVTtBQUNSLFdBQU9BLEdBQVA7QUFDRDtBQUNELFNBQU8sQ0FBQ0EsTUFBTSxFQUFQLEVBQ0pDLE9BREksQ0FDSSxTQURKLEVBQ2UsVUFBVUMsQ0FBVixFQUFhQyxFQUFiLEVBQWlCO0FBQ25DLFlBQVFBLEVBQVI7QUFDRSxXQUFLLElBQUw7QUFDRSxlQUFPLElBQVA7QUFDRixXQUFLLEdBQUw7QUFDRSxlQUFPLElBQVA7QUFDRixXQUFLLEVBQUw7QUFDRSxlQUFPLEVBQVA7QUFDRjtBQUNFLGVBQU9BLEVBQVA7QUFSSjtBQVVELEdBWkksQ0FBUDtBQWFELENBaENEIiwiZmlsZSI6InN0cmlwc2xhc2hlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RyaXBzbGFzaGVzIChzdHIpIHtcclxuICAvLyAgICAgICBkaXNjdXNzIGF0OiBodHRwOi8vbG9jdXR1cy5pby9waHAvc3RyaXBzbGFzaGVzL1xyXG4gIC8vICAgICAgb3JpZ2luYWwgYnk6IEtldmluIHZhbiBab25uZXZlbGQgKGh0dHA6Ly9rdnouaW8pXHJcbiAgLy8gICAgICBpbXByb3ZlZCBieTogQXRlcyBHb3JhbCAoaHR0cDovL21hZ25ldGlxLmNvbSlcclxuICAvLyAgICAgIGltcHJvdmVkIGJ5OiBtYXJydGluc1xyXG4gIC8vICAgICAgaW1wcm92ZWQgYnk6IHJlem5hXHJcbiAgLy8gICAgICAgICBmaXhlZCBieTogTWlja0BlbFxyXG4gIC8vICAgICAgYnVnZml4ZWQgYnk6IE9ubm8gTWFyc21hbiAoaHR0cHM6Ly90d2l0dGVyLmNvbS9vbm5vbWFyc21hbilcclxuICAvLyAgICAgIGJ1Z2ZpeGVkIGJ5OiBCcmV0dCBaYW1pciAoaHR0cDovL2JyZXR0LXphbWlyLm1lKVxyXG4gIC8vICAgICAgICAgaW5wdXQgYnk6IFJpY2sgV2FsZHJvblxyXG4gIC8vICAgICAgICAgaW5wdXQgYnk6IEJyYW50IE1lc3NlbmdlciAoaHR0cDovL3d3dy5icmFudG1lc3Nlbmdlci5jb20vKVxyXG4gIC8vIHJlaW1wbGVtZW50ZWQgYnk6IEJyZXR0IFphbWlyIChodHRwOi8vYnJldHQtemFtaXIubWUpXHJcbiAgLy8gICAgICAgIGV4YW1wbGUgMTogc3RyaXBzbGFzaGVzKCdLZXZpblxcJ3MgY29kZScpXHJcbiAgLy8gICAgICAgIHJldHVybnMgMTogXCJLZXZpbidzIGNvZGVcIlxyXG4gIC8vICAgICAgICBleGFtcGxlIDI6IHN0cmlwc2xhc2hlcygnS2V2aW5cXFxcXFwncyBjb2RlJylcclxuICAvLyAgICAgICAgcmV0dXJucyAyOiBcIktldmluXFwncyBjb2RlXCJcclxuICBpZiAoIXN0cikge1xyXG4gICAgcmV0dXJuIHN0cjtcclxuICB9XHJcbiAgcmV0dXJuIChzdHIgKyAnJylcclxuICAgIC5yZXBsYWNlKC9cXFxcKC4/KS9nLCBmdW5jdGlvbiAocywgbjEpIHtcclxuICAgICAgc3dpdGNoIChuMSkge1xyXG4gICAgICAgIGNhc2UgJ1xcXFwnOlxyXG4gICAgICAgICAgcmV0dXJuICdcXFxcJ1xyXG4gICAgICAgIGNhc2UgJzAnOlxyXG4gICAgICAgICAgcmV0dXJuICdcXHUwMDAwJ1xyXG4gICAgICAgIGNhc2UgJyc6XHJcbiAgICAgICAgICByZXR1cm4gJydcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgcmV0dXJuIG4xXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuIl19