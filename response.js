var type_mapping = [
  '',
  'double_value',
  'float_value',
  'int32_value',
  'int64_value',
  'uint32_value',
  'uint64_value',
  'sint32_value',
  'sint64_value',
  'fixed32_value',
  'fixed64_value',
  'sfixed32_value',
  'sfixed64_value',
  'bool_value',
  'string_value',
  'bytes_value',
  ''
];

var primitive_mapping = [
  'line',
  'circle',
  'ellipse',
  'hyperbola',
  'parabola',
  'bezier',
  'bspline',
  'other'
];

module.exports = getResponseArray;

function copy(src)  {
  var dst = new ArrayBuffer((src.byteLength || src.length));
  new Uint8Array(dst).set(new Uint8Array(src));
  return dst;
}

function mapValues(obj, value, ret, fn) {
  ret = ret || [];

  if (value.type < 16) {
      ret.push(value[type_mapping[value.type]]);
  } else {
    switch (value.type) {
      case 16: // OPERATION
      break;

      case 17: // ERROR
        var error = new Error(value.string_value);
        error.responseObject = obj;
        fn(error);
        return null;
      break;

      case 18: // SHAPE_HANDLE
        ret.push({ id: value.uint32_value });
      break;

      case 19: // FLOAT_BUFFER
        ret.push(new Float32Array(copy(value.bytes_value)));
      break;

      case 20: // DOUBLE_BUFFER
        ret.push(new Float64Array(copy(value.bytes_value)));
      break;

      case 21: // OBJECT
        var l = value.item.length;
        var pack = {};

        for (var i=0; i<l; i++) {
          var subvalue = value.item[i];
          var collected = mapValues(obj, subvalue, [], fn);
          if (collected) {
            pack[subvalue.string_value] = collected[0];
          }
        }
        ret.push(pack);

      break;

      case 22: // UINT32_BUFFER
        ret.push(new Uint32Array(copy(value.bytes_value)));
      break;

      case 23: // ARRAY

        var l = value.item.length;
        var pack = [];

        for (var i=0; i<l; i++) {
          var subvalue = value.item[i];
          var collected = mapValues(obj, subvalue, [], fn);
          if (collected) {
            pack.push(collected[0]);
          }
        }
        ret.push(pack);
      break;

      case 24:
        ret.push(primitive_mapping[value.prim_type]);
      break;

      default:
        console.log('unhandled type!', value.type)
      break;
    }
  }
  return ret;
}

function getResponseArray(obj, fn) {
  var ret = [];

  var l = obj.value.length;
  for (var i=0; i<l; i++) {
    if (mapValues(obj, obj.value[i], ret, fn) === null) {
      return;
    }
  }

  fn && fn(null, (ret.length > 1) ? ret : ret[0]);
}
