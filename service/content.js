var utils = require('./utils');
var db = require('mongodb').Db;
var server = require('mongodb').Server;


var client = new db('test', new server('127.0.0.1', 27017, {}));

exports.list = function (req, res) {
    var page = 0;
    var pagesize = 10;

    if (req.query.page != undefined)
        page = req.query.page;
    if (req.query.pagesize != undefined)
        pagesize = req.query.pagesize;

    var query = {};
    if (req.query.search != undefined) {
        query.$or = new Array();
        query.$or[0] = {"name" : {$regex: req.query.search, $options: 'i'}};
        query.$or[1] = {"summary" : {$regex: req.query.search, $options: 'i'}};
    }
    if (req.query.categories != undefined) {
        var category_array = req.query.categories.split ("x");
        query.appcategories = {$in: category_array};
    }

    var sort = {};
    if (req.query.sort != undefined) {
        if (req.query.sort == "new") {
            sort.date = -1;
        } else if (req.query.sort == "alpha") {
            sort.id = -1;
        } else if (req.query.sort == "high") {
            sort.score = -1;
        } else if (req.query.sort == "down") {
            sort.downloads = -1;
        }
    } else {
        sort.date = -1;
    }
    var client = new db('test', new server('127.0.0.1', 27017, {}));
    client.open(function(err, client) {
        client.collection('content',
            function (err, collection) {
                collection.find(query).count(function(err, count) {
                    if (err) {
                        res.send (utils.message(utils.meta(110, "System error, should fix in server")));
                    } else if (count == 0) {
                        var meta = {"status" : "ok", "statuscode" : 100, "totalitems": count, "itemsperpage": pagesize};
                        var msg = {"meta" : meta};
                        res.send (msg);
                    } else {
                        collection.find(query).sort(sort).skip(page*pagesize).limit(pagesize).toArray(function(err, results) {
                            var meta = {"status" : "ok", "statuscode" : 100, "totalitems": results.length, "itemsperpage": pagesize};
                            var msg = {"meta" : meta};
                            var data = new Array();
                            if (results.length == 0) {
                                res.send (msg);
                            } else {
                                for (var i = 0; (i < results.length) && (i < pagesize); i++) {
                                    /*TODO: get the useful attr */
                                    data [i] = results [i];
                                }
                                msg.data = data;
                                res.send (msg);
                            }
                        });
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

