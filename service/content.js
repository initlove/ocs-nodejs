var utils = require('./utils');
var db = require('mongodb').Db;
var server = require('mongodb').Server;
var account = require('./account');

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
        client.collection('content', function (err, collection) {
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
    var client = new db('test', new server('127.0.0.1', 27017, {}));
    var contentid = parseInt (req.params.contentid);
    client.open(function(err, client) {
        client.collection('content', function (err, collection) {
            collection.find({"id" : contentid}).toArray(function(err, results) {
                if (err) {
                    console.log ("System error in get content");
                    res.send (utils.message (utils.meta (110, "System error, should fix in the server")));
                } else if (results.length == 0) {
                    res.send (utils.message (utils.meta (101, "content not found")));
                } else {
                    var data = new Array();
                    data[0]= results[0];
                    res.send (utils.message (utils.meta (100), data));
                }
            }); 
        });
    });
};

exports.categories = function (req, res) {
    var client = new db('test', new server('127.0.0.1', 27017, {}));
    client.open(function(err, client) {
        client.collection('category', function (err, collection) {
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

exports.download = function (req, res) {
    var client = new db('test', new server('127.0.0.1', 27017, {}));
    var contentid = parseInt (req.params.contentid);

    client.open(function(err, client) {
        client.collection('content', function (err, collection) {
            collection.find({"id" : contentid}).toArray(function(err, results) {
                if (err) {
                    console.log ("System error in get content");
                    res.send (utils.message (utils.meta (110, "System error, should fix in the server")));
                } else if (results.length == 0) {
                    res.send (utils.message (utils.meta (101, "content not found")));
                } else {
                    for (var i = 0; results[0].downloadinfos [i] != undefined; i++) {
                        if (results[0].downloadinfos [i].way == req.params.itemid) {
                            var data = new Array ();
                            data [0] = results[0].downloadinfos [i];
                            collection.update({"id" : contentid}, {$inc: {"downloads" :1}}, true, true);
                            res.send (utils.message (utils.meta (100), data));
                            return;
                        }
                    }
                    res.send (utils.message (utils.meta (103, "content item not found")));
                }
            });
        });
    });
};

vote_content = function (req, res) {
    var contentid = parseInt (req.params.contentid);
    var client = new db('test', new server('127.0.0.1', 27017, {}));
    client.open(function(err, client) {
        if (err) {
            res.send (utils.message (utils.meta (110, "System error, should fix in the server")));
            console.log ("System error in vote comment");
            return;
        } else {
            res.send (utils.message (utils.meta (100)));
        }

        /* add to votes table */
        client.collection('votes', function (err, collection) {
            var personid = utils.get_username (req);
            var date = Date();
            collection.insert (
                {"contentid" :contentid,
                "score" :req.body["score"],
                "personid" :personid,
                "date" : date}
                );
        });
    
        /* update the 'summary' table and the 'content' table */
        client.collection('summary', function (err, collection) {
            collection.find({"vote_contentid" : contentid}).toArray(function(err, r) {
                if (r.length == 1) {
                    var score = parseInt (r[0].score);
                    var count = parseInt (r[0].count);
                    var total = count * score + parseInt (req.body["score"]);
                    count ++;
                    score = total / count;
                    collection.update({"vote_contentid": contentid},
                        {$set : {"count":count,"score":score}}, true, true);
                    client.collection('content', function (err, collection) {
                        collection.update({"id": contentid}, {$set: {"score" : score}});
                    });
                } else {
                    var score = parseInt (req.body["score"]);
                    collection.insert(
                        {"vote_contentid" : contentid,
                        "count": 1,
                        "score": score}
                        );
                    client.collection('content', function (err, collection) {
                        collection.update({"id": contentid}, {$set: {"score" : score}});
                    });
                }
            });
        });
    });
};

exports.vote = function (req, res) {
    var score = parseInt (req.body["score"]);
    var score_valid = false;
    if (score != undefined) {
        if ((score >= 0) && (score <= 100)) {
            score_valid = true;
        }
    }
    if (score_valid == false) {
        res.send (utils.message (utils.meta (102, "score is invalid")));
        return;
    }

    var contentid = parseInt (req.params.contentid);
    account.auth (req, res, function (r) {
        if (r == 0) {           /* success, only auth user can vote, guest cannot */
            var personid = utils.get_username(req);
            var client = new db('test', new server('127.0.0.1', 27017, {}));
            client.open(function(err, client) {
                client.collection('content', function (err, collection) {
                    collection.find({"id": contentid}).toArray(function(err, results) {
                        if (results.length == 0) {
                            res.send (utils.message (utils.meta (101, "content not found")));
                        } else {
                            client.collection('votes', function (err, collection) {
                                collection.find({"contentid": contentid, "personid": personid}).toArray(function(err, results) {
                                    if (results.length != 0) {
                                        res.send (utils.message (utils.meta (105, "you have already voted on this content")));
                                    } else
                                        vote_content (req, res);
                                });
                            });
                        }
                    });
                });
            });
        } else {
            res.send (utils.message (utils.meta (104, "no permission to vote")));
        }
    });
};
