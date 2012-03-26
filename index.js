/**
 * Module dependencies.
 */

var content = require('./service/content');
var comments = require('./service/comments');
var account = require('./service/account');
var images = require('./service/images');
var express = require('express');
var form = require('connect-form');

var app = module.exports = express.createServer(
        form ()
);
// Configuration

app.configure(function(){   
// I remove it as I don't know what happens inside, the upload complete function will not emit..
//    app.use(express.methodOverride());
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

app.post('/person/check', account.check);
app.post('/person/add', account.add);
app.post('/person/remove', account.remove);
app.get('/person/data/:personid', account.get);
app.get('/fan/data/:contentid', fan.get);
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
