var utils = require('./utils');
var db = require('mongodb').Db;
var server = require('mongodb').Server;


var client = new db('test', new server('127.0.0.1', 27017, {}));

exports.get = function (req, res) {
    client.open(function(err, client) {
        client.collection('content', 
            function (err, collection) {
                collection.find({"id" : req.params.contentid}).toArray(function(err, results) {
                if (results.length == 0) {
                    res.send (utils.message (utils.meta(101, "content not found")));
                } else {
                    res.send (utils.message (utils.meta (100), JSON.stringify(results[0])));
                }
            }); 
        });
    });
};

exports.categories = function (req, res) {
    client.open(function(err, client) {
        client.collection('category', 
            function (err, collection) {
                collection.find().toArray(function(err, results) {
                var len = results.length;
                var meta_object = {"status" : "ok", "statuscode" : 100, "totalitems" : len};
                var data = "";
                var prev = false;
                for (var i = 0; i < len; i++) {
                    if (prev == true)
                        data += ",";
                    else
                        prev = true;
                /*TODO: id? */
                    data += "[ \"id\" : 001, \"name\" : \"" + results[i].name + "\"]";
                }
                res.send (utils.message (JSON.stringify (meta_object), data));
            }); 
        });
    });
};

