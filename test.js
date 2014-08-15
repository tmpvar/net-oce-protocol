var test = require('tape');
var createClient = require('./net-oce-protocol');
var through = require('through');

var getResponseArray = require('./response');

var inspectResponse = createClient.response.encode({"seq":1,"id":0,"value":[{"type":16,"double_value":0,"float_value":0,"int32_value":0,"int64_value":0,"uint32_value":0,"uint64_value":0,"sint32_value":0,"sint64_value":0,"fixed32_value":0,"fixed64_value":null,"sfixed32_value":0,"sfixed64_value":null,"bool_value":false,"string_value":"","bytes_value":null,"operation":{"id":1,"name":"cube","arguments":"double, double, double, double, double, double"}},{"type":16,"double_value":0,"float_value":0,"int32_value":0,"int64_value":0,"uint32_value":0,"uint64_value":0,"sint32_value":0,"sint64_value":0,"fixed32_value":0,"fixed64_value":null,"sfixed32_value":0,"sfixed64_value":null,"bool_value":false,"string_value":"","bytes_value":null,"operation":{"id":2,"name":"export_stl","arguments":"string, handle.."}},{"type":16,"double_value":0,"float_value":0,"int32_value":0,"int64_value":0,"uint32_value":0,"uint64_value":0,"sint32_value":0,"sint64_value":0,"fixed32_value":0,"fixed64_value":null,"sfixed32_value":0,"sfixed64_value":null,"bool_value":false,"string_value":"","bytes_value":null,"operation":{"id":3,"name":"op_cut","arguments":"handle, handle"}},{"type":16,"double_value":0,"float_value":0,"int32_value":0,"int64_value":0,"uint32_value":0,"uint64_value":0,"sint32_value":0,"sint64_value":0,"fixed32_value":0,"fixed64_value":null,"sfixed32_value":0,"sfixed64_value":null,"bool_value":false,"string_value":"","bytes_value":null,"operation":{"id":4,"name":"op_union","arguments":"handle, handle.."}},{"type":16,"double_value":0,"float_value":0,"int32_value":0,"int64_value":0,"uint32_value":0,"uint64_value":0,"sint32_value":0,"sint64_value":0,"fixed32_value":0,"fixed64_value":null,"sfixed32_value":0,"sfixed64_value":null,"bool_value":false,"string_value":"","bytes_value":null,"operation":{"id":5,"name":"reset","arguments":""}}]});

test('double response', function(t) {
  getResponseArray({
    value : [{
      type: 1, // DOUBLE
      double_value: 0.1
    }]
  }, function(e, response) {
    t.equal(response, 0.1);
    t.end();
  });
});

test('boolean response', function(t) {
  getResponseArray({
    value : [{
      type: 13, // BOOL
      bool_value: 0
    }]
  }, function(e, response) {
    t.equal(!!response, false);
    t.end();
  });
});

test('error response', function(t) {
  getResponseArray({
    value : [{
      type: 17, // ERROR
      string_value: "you did something wrong"
    }]
  }, function(e, response) {
    t.ok(e);
    t.notOk(response);
    t.end();
  });
});

test('shape_handle response', function(t) {
  getResponseArray({
    value : [{
      type: 18, // SHAPE_HANDLE
      uint32_value: 1
    }]
  }, function(e, response) {
    t.deepEqual(response, { id: 1 });
    t.end();
  });
});

test('createClient - inspect', function(t) {

  var requestId = 0;
  var stream = through(function(d) {
    requestId++;

    var req = createClient.request.decode(d);
    if (requestId === 1) {
      t.equal(req.method, 0);
      t.equal(req.seq, 0);
      t.equal(req.id, 0);
      t.equal(req.argument.length, 0);

      this.push(inspectResponse);
    } else {
      this.push(createClient.response.encode({
        seq : req.seq,
        id: req.id,
        value : [{
          type : 18,
          uint32_value: 1
        }]
      }))
    }
  });

  createClient(stream, function(e, methods) {
    t.notOk(e);
    t.deepEqual(Object.keys(methods), ['cube', 'export_stl', 'op_cut', 'op_union', 'reset']);

    methods.cube(1, 1, 1, 1, 1, 1, function(e, cube) {
      t.deepEqual(cube, { id: 1 });
      stream.end();
      t.end();
    });
  });
});
