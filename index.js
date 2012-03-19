
/**
 * Module dependencies.
 */

var content = require('./service/content');
var comments = require('./service/comments');
var account = require('./service/account');
var express = require('express')

var app = module.exports = express.createServer();
// Configuration

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.post('/person/check', account.check);
app.get('/content/data', content.list);
app.get('/content/categories', content.categories);
app.get('/content/data/:contentid', content.get);
app.get('/comments/get', comments.get);
app.post('/comments/add', comments.add);
app.post('/comments/vote', comments.vote);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
