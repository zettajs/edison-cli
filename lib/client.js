var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require('fs');
var path = require('path');
var WebSocket = require('ws');
var tmp = require('temporary');
var pack = require('./pack');

var XdkClient = module.exports = function(url) {
  EventEmitter.call(this);
  this.url = url;
  
  var self = this;
  this._ws = new WebSocket(this.url);
  this._ws.on('open', this.emit.bind(this, 'open'));
  this._ws.on('error', this.emit.bind(this, 'error'));
  this._ws.on('message', function(msg) {
    msg = JSON.parse(msg);
    self.emit('message', msg);
  });
};
util.inherits(XdkClient, EventEmitter);

XdkClient.prototype.close = function() {
  this._ws.close();
};

XdkClient.prototype.start = function(cb) {
  var data = { channel: 'command', message: 'run' };

  var self = this;
  var waitFunc = function(msg) {
    if (msg.channel === 'status' && msg.message.isRunning) {
      self._ws.removeListener('message', waitFunc);
      cb();      
    }
  };

  this._ws.send(JSON.stringify(data), function(err) {
    if (err) {
      return cb(err);
    }

    self.on('message', waitFunc);
  });
};

XdkClient.prototype.stop = function(cb) {
  var data = { channel: 'command', message: 'stop' };

  var self = this;
  var waitFunc = function(msg) {
    if (msg.channel === 'status' && !msg.message.isRunning) {
      self._ws.removeListener('message', waitFunc);
      cb();      
    }
  };

  this._ws.send(JSON.stringify(data), function(err) {
    if (err) {
      return cb(err);
    }

    self.on('message', waitFunc);
  });
};

XdkClient.prototype.sendDirectory = function(dir, rebuild, cb) {
  var channel = (rebuild) ? 'clean' : 'sync';

  var self = this;
  fs.lstat(dir, function(err, stats) {
    if (err) {
      return cb(err);
    }

    if (!stats.isDirectory()) {
      return cb(new Error('Must be a directory'));
    }
    
    var bundle = new tmp.File();
    var done = function(err) {
      bundle.unlink();
      cb(err);
    };
    

    pack(dir, bundle.path, function(err){
      if (err) {
        return done(err);
      }

      fs.lstat(bundle.path, function(err, stats) {
        if (err) {
          return done(err);
        }

        var data = { channel: channel, message: { type: 'fileInfo', data: { name: path.basename(dir), size: stats.size, type: 'bundle' }}};
        self._ws.send(JSON.stringify(data), function(err) {
          if (err) {
            return done(err);
          }
          
          fs.readFile(bundle.path, function(err ,data) {
            if (err) {
              return done(err);
            }
            
            self._ws.send(data, function(err) {
              if (err) {
                return done(err);
              }
              
              var waitFunc = function(msg) {
                if(msg.message === '[ Upload Complete ]' || msg.message.indexOf('NPM REBUILD COMPLETE') > -1) {
                  self.removeListener('message', waitFunc);
                  return done();
                }
              };
              self.on('message', waitFunc);
            });
          });
        });
      });
    });
  });
};

XdkClient.prototype.status = function(cb) {
  var self = this;
  var data = { channel: 'status' };
  var waitFunc = function(msg) {
    if (msg.channel === 'status') {
      self._ws.removeListener('message', waitFunc);
      cb(null, msg.message);
    }
  };
  this._ws.send(JSON.stringify(data), function(err) {
    if (err) {
      return cb(err);
    }

    self.on('message', waitFunc);
  });
};


