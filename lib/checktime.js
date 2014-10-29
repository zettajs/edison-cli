var fs = require('fs');
var path = require('path');

var FILE = '.edison-cli-time';

function modifiedTime(dir) {
  return fs.lstatSync(dir).mtime;
}

function getMark(file) {
  if (!fs.existsSync(file)) {
    return new Date(0);
  }

  var buf = fs.readFileSync(file).toString();
  var d = new Date(Number(buf));
  return d;
}

module.exports.test = function(dir) {
  var d1 = modifiedTime(dir);
  var d2 = getMark(path.join(dir, '..', FILE));
  return d1 > d2;
};

module.exports.mark = function(dir) {
  var t = new Date().getTime();
  fs.writeFileSync(path.join(dir, '..', FILE), t);
};


