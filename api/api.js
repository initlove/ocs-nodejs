/**
 * Module dependencies.
 */

var config = require('./config');
var friend = require('./friend');
var fan = require('./fan');
var vote = require('./vote');
var account = require('./account');
var content = require('./content');
var comment = require('./comment');
var person = require('./person');
var image = require('./image');
var message = require('./message');
var express = require('express');
var form = require('connect-form');

var app = express.createServer();
exports.app = app;

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
app.get('/person/data', function(req, res) {
    account.authenticate(req, res, person.search);
});
app.get('/person/data/:personid', function(req, res) {
    account.authenticate(req, res, person.get);
});
app.get('/person/self', function(req, res) {
    account.authenticate(req, res, person.getself);
});
app.post('/person/self', function(req, res) {
    account.authenticate(req, res, person.edit);
});
app.get('/person/balance', function(req, res) {
    account.authenticate(req, res, person.get_balance);
});

app.get('/friend/status/:personid', function(req, res) {
    account.authenticate(req, res, friend.status);
});
app.get('/friend/data/:personid', function(req, res) {
    account.authenticate(req, res, friend.get);
});
app.get('/friend/receivedinvitations', function(req, res) {
    account.authenticate(req, res, friend.rece);
});
app.get('/friend/sentinvitations', function(req, res) {
    account.authenticate(req, res, friend.sent);
});
app.post('/friend/invite/:personid', function(req, res) {
    account.authenticate(req, res, friend.invite);
});
app.post('/friend/approve/:personid', function(req, res) {
    account.authenticate(req, res, friend.approve);
});
app.post('/friend/decline/:personid', function(req, res) {
    account.authenticate(req, res, friend.decline);
});
app.post('/friend/cancel/:personid', function(req, res) {
    account.authenticate(req, res, friend.cancel);
});

app.get('/message', function(req, res) {
    account.authenticate(req, res, message.list);
});
app.post('/message', function(req, res) {
    account.authenticate(req, res, message.send);
});

app.get('/fan/data/:contentid', function(req, res) {
    account.authenticate(req, res, content.getfan);
});
app.get('/fan/status/:contentid', function(req, res) {
    account.authenticate(req, res, content.isfan);
});
app.post('/fan/add/:contentid', function(req, res) {
    account.authenticate(req, res, content.addfan);
});
app.post('/fan/remove/:contentid', function(req, res) {
    account.authenticate(req, res, content.removefan);
});

app.post('/content/add', content.add);
app.get('/content/data', content.list);
app.get('/content/categories', content.categories);
app.get('/content/data/:contentid', content.get);
app.get('/content/download/:contentid/:itemid', content.download);
app.post('/content/vote/:contentid', function(req, res) {
    account.authenticate(req, res, content.vote);
});

app.get('/comments/data/:type/:contentid/:contentid2', content.getcomment);
app.post('/comments/add', function(req, res) {
    account.authenticate(req, res, content.addcomment);
});
app.post('/comments/vote/:commentid', function(req, res) {
    account.authenticate(req, res, comment.vote);
});

//the following were not tested yet 

app.post ('/images/upload', image.upload);
app.get('/images/:imageid', image.get);

/* the following is restful, try to make the service out of the ocs standard */
/* TODO: change to 
 *  fan.localhost/:urlmd5
 *  fan.localhost/:urlmd5/fans
 *  fan.localhost/:personid/follow
 */
app.get('/:urlmd5/fanstatus', function(req, res) {
    account.authenticate(req, res, fan.status);
});
app.post('/:urlmd5/fanstatus', function(req, res) {
    account.authenticate(req, res, fan.add);
});
app.delete('/:urlmd5/fanstatus', function(req, res) {
    account.authenticate(req, res, fan.remove);
});
app.get('/:urlmd5/fans', function(req, res) {
    account.authenticate(req, res, fan.get);
});
//app.get('/:personid/follow', fan.follow);
app.post('/:urlmd5/vote', function(req, res) {
    account.authenticate(req, res, vote.vote);
});

app.post('/:urlmd5/comment', function(req, res) {
    account.authenticate(req, res, comment.add);
});
app.get('/:urlmd5/comment', comment.get);

