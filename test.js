var test = require('tape');
var protocol = require('./net-oce-protocol');

var Response = protocol.NetOCE_Response;
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

// TODO: consider adding a ShapeHandle class to wrap up serialization

function getResponseArray(obj) {
  var ret = [];

  var l = obj.values.length;
  for (var i=0; i<l; i++) {
    var value = obj.values[i];

    if (value.type < 16) {
      ret.push(value[type_mapping[value.type]]);
    } else {
      switch (value.type) {
        case 16: // OPERATION
        break;

        case 17: // ERROR
          ret.push(new Error(value.string_value));
        break;

        case 18: // SHAPE_HANDLE
          ret.push({ id: value.uint32_value });
        break;
      }
    }
  }

  return ret;
}

test('double response', function(t) {
  var response = getResponseArray({
    values : [{
      type: 1, // DOUBLE
      double_value: 0.1
    }]
  });

  t.equal(response.length, 1);
  t.equal(response[0], 0.1);

  t.end();
});

test('boolean response', function(t) {
  var response = getResponseArray({
    values : [{
      type: 13, // BOOL
      bool_value: 0
    }]
  });

  t.equal(response.length, 1);
  t.equal(!!response[0], false);

  t.end();
});

test('error response', function(t) {
  var response = getResponseArray({
    values : [{
      type: 17, // ERROR
      string_value: "you did something wrong"
    }]
  });

  t.equal(response.length, 1);
  t.ok(response[0] instanceof Error);

  t.end();
});

test('shape_handle response', function(t) {
  var response = getResponseArray({
    values : [{
      type: 18, // SHAPE_HANDLE
      uint32_value: 1
    }]
  });

  t.equal(response.length, 1);
  t.equal(response[0].id, 1)

  t.end();
});
