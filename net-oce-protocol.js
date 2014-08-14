var path = require('path');
var fs = require('fs');

var schemaContents = fs.readFileSync(path.join(__dirname, 'oce.proto'));
var proto = require('protocol-buffers')(schemaContents);
var obj = require('protobuf-schema').parse(schemaContents);
console.log(proto);
module.exports.schema = schema;

obj.messages.forEach(function(message) {
  var enums = {}
  if (message.enums && message.enums.length) {
    message.enums.forEach(function(e) {
      enums[e.name] = function(str) {
        return e.values[str];
      };
    });
  }

  var fields = {};
  message.fields.forEach(function(field) {
    if (enums[field.type]) {
      fields[field.name] = enums[field.type];
    } else {
      fields[field.name] = field;
    }
  });

  schema[message.name] = fields;

});
