
module.exports = argumentHintParser;

function argumentHintParser(hint, args, ENUM) {
  var hintMap = {
    double : function(val) {
      return { type : ENUM['DOUBLE'], double_value: val };
    },
    handle: function (val) {
      return { type : ENUM['SHAPE_HANDLE'], uint32_value: val.id };
    },
    string: function(val) {
      return { type : ENUM['STRING'], string_value: val }
    }
  }

  var parts = hint.replace(/ /g, '').split(',');

  var lastHint = null;
  var repeating = false;

  if (args) {
    return args.map(function (arg, i) {

      var hint = parts[i];
      if (typeof parts[i] === 'undefined') {
        if (repeating) {
          hint = lastHint;
        }
      } else {

        if (hint.indexOf('..') > -1) {
          repeating = true;
          hint = hint.replace('..', '');
        }

        lastHint = hint;
      }

      return hintMap[hint] && hintMap[hint](args[i]);

    }).filter(Boolean);
  } else {
    return [];
  }
}
