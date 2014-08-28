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
  'bytes_value'
];

module.exports = getResponseArray;

function copy(src)  {
  var dst = new ArrayBuffer(src.byteLength);
  new Uint8Array(dst).set(new Uint8Array(src));
  return dst;
}

function getResponseArray(obj, fn) {
  var ret = [];

  var l = obj.value.length;
  for (var i=0; i<l; i++) {
    var value = obj.value[i];

    if (value.type < 16) {
      ret.push(value[type_mapping[value.type]]);
    } else {
      switch (value.type) {
        case 16: // OPERATION
        break;

        case 17: // ERROR
          return fn(new Error(value.string_value));
        break;

        case 18: // SHAPE_HANDLE
          ret.push({ id: value.uint32_value });
        break;

        case 19:
          ret.push(new Float32Array(copy(value.bytes_value)));
        break;

        case 20:
          ret.push(new Float64Array(copy(value.bytes_value)));
        break;
      }
    }
  }

  fn(null, (ret.length > 1) ? ret : ret[0]);
}
