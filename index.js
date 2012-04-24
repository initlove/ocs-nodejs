/**
 * Module dependencies.
 */
var express = require('express');

var app = express.createServer()
    .use(express.vhost('localhost', require('./api/api').app));

app.configure(function(){
   app.use(express.bodyParser()); 
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
