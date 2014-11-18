var fs = require('fs');
var zlib = require('zlib');
var fstream = require('fstream');
var tar = require('tar-edison');
var path = require('path');

module.exports = function(dir, dest, cb) {
  var r = fstream.Reader({
    path: dir,
    type: 'Directory'
  });

  var gzip = zlib.createGzip({
    level: 6,
    memLevel: 6
  });

  var props = {
    noProprietary: false,
    pathFilter: function(p) {
      return p.replace(dir+path.sep, '');
    }
  };

  var s = fstream.Writer({ path: dest});
  s.on('error', cb)
  s.on('close', cb);

  r.pipe(tar.Pack(props)).pipe(gzip).pipe(s);
};
