var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;

var client = new db('test', new server('127.0.0.1', 27017, {}));
client.open(function(err, client) {
    client.collection('comments', function (err, collection) {
        collection.find ({"_id" : ObjectID("4f6fcbb9218babe4d662436c")}).toArray (function (err, results) {
            console.log (results);
        }); 
    });
});

