var mdns = require('mdns-js');

module.exports = function(cb) {
  var browser = new mdns.createBrowser();
  function finish(err, ret) {
    browser.stop();
    cb(err, ret);
  }
  
  var timer = setTimeout(finish, 5000);
  browser.on('ready', function () {
    browser.discover(); 
  });

  function filter(data) {
    return data.type.some(function(type){
      return type.name === 'xdk-app-daemon';
    });
  }

  browser.on('update', function (data) {
    if (filter(data)) {
      finish(null, data.addresses[0]);
    }
  });
};


