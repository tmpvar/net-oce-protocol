# net-oce-protocol

protobuf definitions and javascript client for livecad and net-oce

## install

```npm install --save net-oce-protocol```

## use

```javascript

var createClient = require('net-oce-protocol')

// create a stream to a net-oce instance
var stream = ...

createClient(stream, function(e, methods) {
 // methods contain all of the methods that
 // the connected net-oce instance supports
 
 methods.cube(10, function(e, cube) {
   // cube is a handle to a BREP cube living in
   // opencascade land.  Future operations can use
   // this handle...
   
   methods.translate(cube, 10, 0, 0);
 });
});
```

## license

[MIT](LICENSE.txt)