/**
 * Module dependencies.
 */

var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var utils = require('./utils');
var account = require('./account');
var dbname = require('./config').db_name;
var dbaddr = require('./config').db_addr;

function send_message (req, res) {
    ocs_db.collection('message', function (err, message_coll) {
        var userid = utils.get_userid (req);
        message_coll.insert ({"from": userid, "to": req.body.to, 
            "subject": req.body.subject, "message" : req.body.message,
            "date" : Date(), "status" : "unread"});
        res.send (utils.message (utils.meta ("ok")));
    });
};

exports.send = function (req, res){
    if (!req.body.message || !req.body.subject) {
        /*still, I think we donnot need to have subject */
        res.send (utils.message (utils.meta ("subject or message not found")));
        return;
    }
    if (!req.body.to) {
        res.send (utils.message (utils.meta ("You should name who the receiver is")));
        return;
    }
    account.auth (req, res, function (auth_result) {
        if (auth_result == "ok") {
            var userid = utils.get_userid (req);
            if (userid == req.body.to) {
                res.send(utils.message(utils.meta ("You can not send a message to yourself")));
                return;
            }
            var ocs_db = new db(dbname(), new server(dbaddr(), 27017, {}));
            ocs_db.open(function(err, ocs_db) {
                ocs_db.collection('person', function (err, person_coll) {
                    person_coll.find({"login" : req.body.to}).toArray(function(err, results) {
                        if (results.length == 0) {
                            res.send(utils.message(utils.meta ("user not found")));
                            return;
                        } else {
                            send_message (req, res);
                        }
                    });
                });

            });
        } else {
            res.send (utils.message (utils.meta ("You need to login")));
        }
    });
};

function list_message (req, res) {
    var page = 0;
    var pagesize = 10;
    var query = {};

    if (req.query.page) {
        page = parseInt (req.query.page);
    }
    if (req.query.pagesize) {
        pagesize = parseInt (req.query.pagesize);
    }
    if (req.query.status) {
        query.status = req.query.status;
    }
    var i = 0;
    if (req.query.search) {
        query.$or = new Array();
        query.$or[i++] = {"subject" : {$regex: req.query.search, $options: 'i'}};
        query.$or[i++] = {"message" : {$regex: req.query.search, $options: 'i'}};
    }
    var userid;
    if (req.query.with) {
        userid = req.query.with;
    } else {
        userid = utils.get_userid (req);
    }

    if (!query.$or)
        query.$or = new Array();
    query.$or[i++] = {"from" : userid};
    query.$or[i++] = {"to": userid};
console.log (query);
    var ocs_db = new db(dbname(), new server(dbaddr(), 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('message', function (err, message_coll) {
            message_coll.find(query).count(function(err, count) {
                var meta = {"status" : "ok", "statuscode" : 100, "totalitems": count, "itemsperpage": pagesize};
                if (count == 0) {
                    res.send (utils.message (meta));
                } else {
                    message_coll.find(query).skip(page*pagesize).limit(pagesize).toArray(function(err, results) {
                        if (err) {
                            res.send (utils.message (utils.meta ("Server error")));
                            return;
                        }
                        var msg = {"meta" : meta};
                        if (results.length == 0) {
                            res.send (msg);
                        } else {
                            var data = new Array();
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

exports.list = function (req, res) {
    account.auth (req, res, function (auth_result) {
        if (auth_result == "ok") {
            list_message (req, res);
        } else {
            res.send (utils.message (utils.meta ("You need to login")));
        }
    });
};
