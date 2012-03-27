var utils = require('./utils');
var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var account = require('./account');

/* "ok"
 * "content not found"
 * "invalid content id"
 * "Server error"
 */
exports.exist = function (id, callback) {
    if (!utils.check_id (id))
        return callback ("invalid content id");

    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('content', function (err, content_coll) {
            content_coll.find({"_id": ObjectID (id)}).count(function(err, count) {
                if (err) {
                    return callback ("Server error");
                } else if (count == 0) {
                    return callback ("content not found");
                } else {
                    return callback ("ok");
                }
            });
        });
    });
};


exports.list = function (req, res) {
    var page = 0;
    var pagesize = 10;

    if (req.query.page)
        page = parseInt (req.query.page);
    if (req.query.pagesize)
        pagesize = parseInt (req.query.pagesize);

    var query = {};
    if (req.query.search) {
        query.$or = new Array();
        query.$or[0] = {"name" : {$regex: req.query.search, $options: 'i'}};
        query.$or[1] = {"summary" : {$regex: req.query.search, $options: 'i'}};
    }
    if (req.query.categories) {
        var category_array = req.query.categories.split ("x");
        query.appcategories = {$in: category_array};
    }

    var sort = {};
    if (req.query.sort) {
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
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('content', function (err, content_coll) {
            content_coll.find(query).count(function(err, count) {
                if (err) {
                    res.send (utils.message(utils.meta("Server error")));
                } else if (count == 0) {
                    var meta = {"status" : "ok", "statuscode" : 100, "totalitems": count, "itemsperpage": pagesize};
                    res.send (utils.message (meta));
                } else {
                    content_coll.find(query).sort(sort).skip(page*pagesize).limit(pagesize).toArray(function(err, results) {
                        if (err) {
                            res.send (utils.message (utils.meta ("Server error")));
                            return;
                        }
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

exports.get = function(req, res) {
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    var id = req.params.contentid;
    if (!utils.check_id (id)) {
        res.send (utils.message (utils.meta ("invalid content id")));
        return;
    }
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('content', function(err, content_coll) {
            content_coll.find({"_id" : ObjectID(id)}).toArray(function (err, results) {
                if (err) {
                    console.log ("System error in get content");
                    res.send (utils.message (utils.meta ("Server error")));
                } else if (results.length == 0) {
                    res.send (utils.message (utils.meta ("content not found")));
                } else {
                    var data = new Array();
                    data[0]= results[0];
                    res.send (utils.message (utils.meta ("ok"), data));
                }
            }); 
        });
    });
};

exports.categories = function (req, res) {
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('category', function (err, category_coll) {
            category_coll.find().toArray(function(err, results) {
                var len = results.length;
                var meta = utils.meta ("ok");
                meta.totalitems = len;
                var data = new Array ();
                for (var i = 0; i < len; i++) {
                    /*TODO: add id */
                    data[i].id = results[i].name;
                    data[i].name = results[i].name;
                }
                res.send (utils.message (meta, data));
            }); 
        });
    });
};

exports.download = function (req, res) {
    var id = req.params.contentid;
    if (!utils.check_id (id)) {
        res.send (utils.message (utils.meta ("invalid content id")));
        return;
    }

    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('content', function (err, content_coll) {
            content_coll.find({"_id" : ObjectID (id)}).toArray(function(err, results) {
                if (err) {
                    console.log ("System error in get content");
                    res.send (utils.message (utils.meta ("Server error")));
                } else if (results.length == 0) {
                    res.send (utils.message (utils.meta ("content not found")));
                } else {
                    for (var i = 0; results[0].downloadinfos [i]; i++) {
                        if (results[0].downloadinfos [i].way == req.params.itemid) {
                            var data = new Array ();
                            data [0] = results[0].downloadinfos [i];
                            content_coll.update({"_id" : ObjectID (id)}, {$inc: {"downloads" :1}}, true, true);
                            res.send (utils.message (utils.meta ("ok"), data));
                            return;
                        }
                    }
                    res.send (utils.message (utils.meta ("content item not found")));
                }
            });
        });
    });
};

vote_content = function (req, res) {
    var id = req.params.contentid;
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        if (err) {
            res.send (utils.message (utils.meta ("Server error")));
            console.log ("System error in vote comment");
            return;
        } else {
            res.send (utils.message (utils.meta ("ok")));
        }

        /* add to votes table */
        ocs_db.collection('votes', function (err, votes_coll) {
            var personid = utils.get_username (req);
            var date = Date();
            votes_coll.insert (
                {"contentid" :id,
                "score" :req.body.score,
                "personid" :personid,
                "date" : date}
                );
        });
    
        /* update the 'summary' table and the 'content' table */
        ocs_db.collection('summary', function (err, summary_coll) {
            summary_coll.find({"vote_contentid" : id}).toArray(function(err, r) {
                if (r.length == 1) {
                    var score = parseInt (r[0].score);
                    var count = parseInt (r[0].count);
                    var total = count * score + parseInt (req.body.score);
                    count ++;
                    score = total / count;
                    summary_coll.update({"vote_contentid": id},
                        {$set : {"count":count,"score":score}}, true, true);
                    ocs_db.collection('content', function (err, content_coll) {
                        content_coll.update({"_id": ObjectID(id)}, {$set: {"score" : score}});
                    });
                } else {
                    var score = parseInt (req.body.score);
                    summary_coll.insert(
                        {"vote_contentid" : id,
                        "count": 1,
                        "score": score}
                        );
                    ocs_db.collection('content', function (err, content_coll) {
                        content_coll.update({"_id": ObjectID(id)}, {$set: {"score" : score}});
                    });
                }
            });
        });
    });
};

exports.vote = function (req, res) {
    if (req.body.score) {
        var score = parseInt (req.body.score);
        if ((score < 0) || (score > 100)) {
            res.send (utils.message (utils.meta ("vote with score between 0 and 100")));
            return;
        }
    } else {
        res.send (utils.message (utils.meta ("vote with score between 0 and 100")));
        return;
    }

    var id = req.params.contentid;
    account.auth (req, res, function (auth_result) {
        if (auth_result == 0) {           /* success, only auth user can vote, guest cannot */
            exports.exist (id, function (exist_result) {
                if (exist_result == "ok") {
                    var personid = utils.get_username(req);
                    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
                    ocs_db.open(function(err, ocs_db) {
                        ocs_db.collection('votes', function (err, votes_coll) {
                            votes_coll.find({"contentid": id, "personid": personid}).toArray(function(err, results) {
                                if (results.length != 0) {
                                    res.send (utils.message (utils.meta ("you have already voted on this content")));
                                } else
                                    vote_content (req, res);
                            });
                        });
                    });
                } else {
                        res.send (utils.message (utils.meta (exist_result)));
                }
            });
        } else {
            res.send (utils.message (utils.meta ("no permission to vote")));
        }
    });
};
