var utils = require('./utils');
var url = require('url');
var db = require('mongodb').Db;
var server = require('mongodb').Server;


var client = new db('test', new server('127.0.0.1', 27017, {}));

exports.list = function (req, res) {
    var part = url.parse(req.url,true);
    var params = part.query;
    var page = 0;
    var pagesize = 10;

    if (params.page != undefined)
        page = params.page;
    if (params.pagesize != undefined)
        pagesize = params.pagesize;

    var query = {};
    if (params.search != undefined) {
        query.$or = new Array();
        query.$or[0] = {"name" : {$regex: params.search, $options: 'i'}};
        query.$or[1] = {"summary" : {$regex: params.search, $options: 'i'}};
    }
    if (params.categories != undefined) {
        var category_array = params.categories.split ("x");
        query.appcategories = {$in: category_array};
    }
    var client = new db('test', new server('127.0.0.1', 27017, {}));
    client.open(function(err, client) {
        client.collection('content',
            function (err, collection) {
                /* TODO: I think we can make it better, get the total item in another call */
                /*In fact we can get the page in a fast way, but, we need the totalitems.. 
                collection.find(query).skip(page*pagesize).limit(pagesize).toArray(function(err, results) {
                */
                collection.find(query).toArray(function(err, results) {
                    var meta = {"status" : "ok", "statuscode" : 100, "totalitems": results.length, "itemsperpage": pagesize};
                    var msg = {"meta" : meta};
                    var data = new Array();
                    if (results.length == 0) {
                        res.send (msg);
                    } else {
                        var skip = page *pagesize;
                        for (var i = 0; (i < results.length) && (i < pagesize); i++) {
                            /*TODO: get the useful attr */
                            data [i] = results [i + skip];
                        }
                        msg.data = data;
                        res.send (msg);
                    }
                });
            });
    });
};

exports.get = function (req, res) {
    client.open(function(err, client) {
        client.collection('content', 
            function (err, collection) {
                collection.find({"id" : req.params.contentid}).toArray(function(err, results) {
                if (results.length == 0) {
                    var meta ={"status": "fail", "statuscode":101, "message" :"content not found"};
                    var msg = {"meta" : meta};
                    res.send (msg);
                } else {
                    var meta ={"status": "ok", "statuscode":100};
                    var data = new Array();
                    data[0]= results[0];
                    var msg = {"meta" : meta, "data":data};
                    res.send (msg);
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
                    var meta = {"status" : "ok", "statuscode" : 100, "totalitems" : len};
                    var data = new Array ();
                    for (var i = 0; i < len; i++) {
                        /*TODO: add id */
                        data[i].id = results[i].name;
                        data[i].name = results[i].name;
                    }
                    var msg = {"meta" : meta, "data" : data};
                    res.send (msg);
            }); 
        });
    });
};

