var path = require('path');
var fs = require('fs');
var varargs = require('varargs');

var schemaContents = fs.readFileSync(__dirname + '/oce.proto', 'utf8').toString();
var proto = require('protocol-buffers')(schemaContents);
var obj = require('protobuf-schema').parse(schemaContents);

var BufferList = require('bl');

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

createClient.encodeRequest = encode;

var phase = 0, decode_message_length = 0;
function decode(buffer) {

  if (phase === 0) {
    if (buffer.length < 4) {
      return false;
    }

    decode_message_length = buffer.readUInt32LE(0);
    buffer.consume(4);
    phase = 1;
  }


  if (buffer.length && buffer.length >= decode_message_length) {

    var result = response.decode(buffer.slice(0, decode_message_length));
    buffer.consume(decode_message_length);
    decode_message_length = 0;
    phase = 0;

    return result;
  }

  return false
}

function encode(obj) {
  var messageLength = request.encodingLength(obj);
  var outgoingLength = messageLength + 4;
  var buf = new Buffer(outgoingLength);
  request.encode(obj, buf.slice(4));
  buf.writeUInt32LE(messageLength, 0);

  return buf;
}

var buffer = new BufferList();
function processOceOutput(data) {

  // Work around protocol-buffers and typed arrays.
  if (data.byteLength) {
    data = new Buffer(new Uint8Array(data));
  }
  buffer.append(data);

  var result = [];
  while(true) {

    var obj = decode(buffer);
    if (!obj) {
      break;
    }
    result.push(obj);
  }
  return result;
}


function createClient(stream, cb) {
  var seq = 1;

  stream.once('data', function(first) {
    var r = processOceOutput(first)[0];
    if (!r) {
      return cb(new Error('could not get methods from net-oce'))
    }
    var queue = {};
    stream.done = function() {
      return !Object.keys(queue).length;
    };

    stream.on('data', function(data) {
      var responses = processOceOutput(data);

      responses.forEach(function(res) {
        var fn = queue[res.seq];
        delete queue[res.seq];
        getResponseArray(res, fn);
      });
    });

    var methods = {};

    r.value.forEach(function(op) {
      var id = op.operation.id;

      var genfn = methods[op.operation.name] = function(a, fn) {
        var args;

        if (Array.isArray(a)) {
          args = a;
        } else {
          args = varargs(arguments);
          fn = args.pop();
        }

        var obj = {
          method : id,
          seq: seq++,
          argument: argumentHintParser(op.operation.arguments, args, ENUM)
        };

        if (fn._shapeId) {
          obj.shape_id = fn._shapeId;
        }

        queue[obj.seq] = fn;

        stream.write(encode(obj));
      };

      var parts = op.operation.arguments.replace(/ /g, '').split(',');
      var infinite = parts[parts.length-1].indexOf('..') > -1;
      genfn.argc = (infinite) ? Infinity : parts.length;
    });

    cb(null, methods);
  });

  stream.write(encode({ method: 0, seq: seq++ }));

  return stream;
}
