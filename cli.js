var url = require('url');
var program = require('commander');
var Client = require('./lib/client');

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
    dir = dir || '.';

    initClient(options, function(err, client) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      
      client.sendDirectory(dir, true, function(err) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        client.start(function() {
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

program.parse(process.argv);

if (program.args.length === 0) {
  return program.help();
}
