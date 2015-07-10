var mdns = require('mdns-js');

// Exclude Bonjour DNS discovery when on MacOS
if (process.platform == 'darwin') {
  mdns.excludeInterface('0.0.0.0');
}

module.exports = function(options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  
  var timeout = options.timeout || 5000;

  var ret = [];
  var browser = new mdns.createBrowser();
  
  var timer = setTimeout(function(){
    browser.stop();
    cb(null, ret);
  }, timeout);

  browser.on('ready', function () {
    browser.discover();
  });

  function filter(data) {
    if (!!data.type) {
      return data.type.some(function(type){
        return type.name === 'xdk-app-daemon';
      });
    } else {
      return false;
    }
  }

  browser.on('update', function (data) {
    if (filter(data)) {
      ret.push(data.addresses[0]);
    }
  });
};


