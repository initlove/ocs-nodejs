var db = require('mongodb').Db;
var server = require('mongodb').Server;
var everyauth = require ('everyauth');
var connect = require ('connect');

var client = new db('test', new server('127.0.0.1', 27017, {}));
client.open(function(err, client) {
});

var app = connect (
        connect.bodyParser (),
        connect.cookieParser (),
        connect.session({secret: 'mr ripley'}),
        everyauth.middleware()
);

