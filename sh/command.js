var http = require('http');
var service = require('./service');
var readline = require('readline'),
    rl = readline.createInterface(process.stdin, process.stdout),
    prefix = 'ocs> ';

rl.on('line', function(line) {
    var input = line.trim();
    if (input == 'help') {
        console.log(service.support());
        rl.setPrompt(prefix, prefix.length);
        rl.prompt();
    } else {
        var option = service.get_option(input);
        if (option) {
            var req = http.request(option, function(res) {
                res.on('data', function(chunk) {
                    console.log(''+chunk+'\n');
                    rl.setPrompt(prefix, prefix.length);
                    rl.prompt();
                }); 
            }); 
            var data = service.get_data(input);
            if (data)
                req.write(data);
            req.end();
        } else {
            console.log('use \'help\' to show the supported service\n');
        }

    }
    rl.setPrompt(prefix, prefix.length);
    rl.prompt();
}).on('close', function() {
    process.exit(0);
});

rl.setPrompt(prefix, prefix.length);
rl.prompt();
