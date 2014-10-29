var url = require('url');
var program = require('commander');
var Client = require('./lib/client');
var find = require('./lib/find');

program
  .version('0.0.1')
  .option('-H, --host <host>', 'hostname of edison')
  .option('-q, --quite', 'supress logging');

function initClient(options, cb) {
  if (!options.parent.host) {
    console.log('no host')
    return cb(new Error('err'));
  }

  var host = options.parent.host;
  var u = url.parse(host);
  if (!u.protocol) host = 'ws://' + host;
  if (!u.port) host = host + ':58888';

  var c = new Client(host);

  c.on('message', function (msg) {
    if (msg.channel === 'console' && !options.parent.quite) {
      process.stdout.write(msg.message);
    } else if(msg.channel === 'error') {
      process.stderr.write(msg.message);
    }   
  });

  c.on('open', function() {
    cb(null, c);
  });
}

program
  .command('deploy [dir]')
  .description('deploy node app directory to edison')
  .option("-f, --force", "force rebuild on edison")
  .action(function(dir, options){
    dir = dir || process.cwd();

    initClient(options, function(err, client) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      
      client.sendDirectory(dir, options.force, function(err) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        client.start(function() {
          console.log('Application restarted')
          process.exit(0);
        });
      });
    });
  });

program
  .command('start')
  .description('start node app on edison')
  .action(function(options){
    initClient(options, function(err, client) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      client.start(function(err) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
      });
    });
  });

program
  .command('stop')
  .description('stop node app on edison')
  .action(function(options){
    initClient(options, function(err, client) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      client.stop(function(err) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        console.log('App stoped');
        process.exit(0);
      });
    });
  });

program
  .command('list [timeout]')
  .description('find edisons on your network and list them.')
  .action(function(timeout, options){
    if (!timeout) {
      timeout = 5000;
    }
    
    find({timeout: timeout}, function(err, devices) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      
      console.log('Devices Found:', devices.length);
      devices.forEach(function(ip, i) {
        console.log(i+1 + ' - ' +  ip);
      });
    });
  });


program.parse(process.argv);

if (program.args.length === 0) {
  return program.help();
}
