/**
 * Module dependencies.
 */

var config = require('./service/config');
var fan = require('./service/fan');
var content = require('./service/content');
var comments = require('./service/comments');
var person = require('./service/person');
var images = require('./service/images');
var message = require('./service/message');
var express = require('express');
var form = require('connect-form');

var app = module.exports = express.createServer(
);
// Configuration

app.configure(function(){
   app.use(express.bodyParser()); 
// I remove it as I don't know what happens inside, the upload complete function will not emit..
//    app.use(express.methodOverride());
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

app.get('/config', config.get);

app.post('/person/check', person.check);
app.post('/person/add', person.add);
app.post('/person/remove', person.remove);
app.get('/person/data', person.search);    // 
app.get('/person/data/:personid', person.get);
app.get('/person/self', person.getself);
app.post('/person/self', person.edit);
app.get('/person/balance', person.get_balance);

app.get('/message', message.list);
app.post('/message', message.send);

app.get('/fan/data/:contentid', content.getfan);
app.get('/fan/status/:contentid', content.isfan);
app.post('/fan/add/:contentid', content.addfan);
app.post('/fan/remove/:contentid', content.removefan);

app.post('/content/add', content.add);
app.get('/content/data', content.list);
app.get('/content/categories', content.categories);
app.get('/content/data/:contentid', content.get);
app.get('/content/download/:contentid/:itemid', content.download);
app.post('/content/vote/:contentid', content.vote);

app.get('/comments/get', comments.get);
app.post('/comments/add', comments.add);
app.post('/comments/vote/:commentid', comments.vote);

app.post ('/images/upload', images.upload);
app.get('/images/:imageid', images.get);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
