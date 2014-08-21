var path = require('path');
var fs = require('fs');

var schemaContents = fs.readFileSync(__dirname + '/oce.proto', 'utf8').toString();
var proto = require('protocol-buffers')(schemaContents);
var obj = require('protobuf-schema').parse(schemaContents);

var argumentHintParser = require('./arguments');
var getResponseArray = require('./response');

var response = proto.NetOCE_Response;
var request = proto.NetOCE_Request;

// extract the message type enum
var ENUM = obj.messages.filter(function(msg) {
  return msg.name === 'NetOCE_Value';
})[0].enums[0].values;

module.exports = createClient;
createClient.request =  proto.NetOCE_Request;
createClient.response =  proto.NetOCE_Response;

function decode(buffer) {
  if (buffer.byteLength) {
    buffer = new Buffer(new Uint8Array(buffer));
  }

  return response.decode(buffer);
}

function createClient(stream, cb) {
  stream.once('data', function(first) {
    var r = decode(first);
    var queue = {};
    stream.done = function() {
      return !Object.keys(queue).length;
    };

    stream.on('data', function(data) {
      var obj = decode(data);
      var fn = queue[obj.seq];

      delete queue[obj.seq];
      getResponseArray(obj, fn);
    });

    var methods = {};
    var seq = 1;
    r.value.forEach(function(op) {
      var id = op.operation.id;

      var genfn = methods[op.operation.name] = function(a, fn) {
        var args;

        if (Array.isArray(a)) {
          args = a;
        } else {
          args = [];
          Array.prototype.push.apply(args, arguments);
          fn = args.pop();
        }

        var obj = {
          method : id,
          seq: seq++,
          argument: argumentHintParser(op.operation.arguments, args, ENUM)
        };

        queue[obj.seq] = fn;

        stream.write(request.encode(obj));
      };

      var parts = op.operation.arguments.replace(/ /g, '').split(',');
      var infinite = parts[parts.length-1].indexOf('..') > -1;
      genfn.argc = (infinite) ? Infinity : parts.length;
    });

    cb(null, methods);
  });

  stream.write(request.encode({ method: 0, seq: 0 }));

  return stream;
}
