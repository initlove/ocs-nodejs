/**
 * Module dependencies.
 */

var $ = require("mongous").Mongous; /* seems hung the server, donnot know why */
var express = require('express')
var db = require('mongodb').Db;
var server = require('mongodb').Server;
var utils = require('./utils');
var account = require('./account');

exports.get = function (req, res){
    var page = 0;
    var pagesize = 10;

    if (!check_type (req.query.type, res))
        return;
    if (!check_content (req.query.content, res))
        return;

    if (req.query.page != undefined)
        page = parseInt(req.query.page);
    if (req.query.pagesize != undefined)
        pagesize = parseInt(req.query.pagesize);

    var query = {"type" : parseInt(req.query.type), "content" : parseInt(req.query.content)};
    if (req.query.content2)
        query.content2 = parseInt(req.query.content2);
    if (req.query.parent)
        query.parent = parseInt(req.query.parent);
    else
        query.parent = parseInt(0);
console.log (query);
    var client = new db('test', new server('127.0.0.1', 27017, {}));
    client.open(function(err, client) {
        client.collection('comments',
            function (err, collection) {
                collection.find(query).skip (page*pagesize).limit (pagesize).toArray(function(err, results) {
                    var meta = {"status" : "ok", "statuscode" : 100};
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
          });
       });
};

function check_type (type, res) {
	var types = [1, 4, 7, 8];
	var valid;
	valid = false;
	if (type != undefined) {
		for (var i = 0; i < 4; i++) {
			if (type == types[i]) {
				valid = true;
				break;
			}
		}
	}
	if (valid == false) {
		res.send (utils.message (utils.meta (104, "wrong type")));
		return false;
	}
    return true;
}

function check_message (message, res) {
    if (message == undefined || message.length == 0) {
		res.send (utils.message (utils.meta (102, "message or subject must not be empty")));
        return false;
    }
    return true;
}

function check_content (content, res) {
	var valid;
	if ((content == undefined) || (content.length == 0)) {
			res.send (utils.message (utils.meta (101, "content must not be empty")));
			return false;
	}
    return true;
}

function add_comment (req, res) {
    var client = new db('test', new server('127.0.0.1', 27017, {}));
    var contentid = parseInt (req.body["content"]);
    var parentid = parseInt (req.body["parent"]);
    var type = parseInt (req.body["type"]);

    client.open(function(err, client) {
        client.collection('content', function (err, content_collection) {
            content_collection.find({"id" : contentid}).toArray(function(err, results) {
                if (results.length == 0) {
                    res.send (utils.message (utils.meta(105, "content id invalid")));
                } else {
                    utils.generate_id ('comment', function (id) {
                        if (id == -1) {
                            res.send (utils.message (utils.meta (110, "System err, should fix in the server")));
                            return;
                        }
                            
                        var obj = {"id" : id,
                           "type" : type,
                            "content" :contentid,
	                 		"parent"  :parentid,
		    		        "subject" :req.body["subject"],
        	           		"message" :req.body["message"]};
                        if (req.body["content2"])
                            obj.content2 = parseInt (req.body["content2"]);
                        var user = utils.get_username (req);
                        if (user != undefined) {
                            obj.user = user;
                        } else {
                            obj.guestname = req.body["guestname"];
                            obj.guestemail = req.body["guestemail"];
                        }
                        obj.date = Date();
                        client.collection('comments', function (err, comment_collection) {
                            if (err) {
                                console.log ("System error in add comment ");
                            } else {
                                content_collection.update({"id" : contentid}, {$inc: {"comments" :1}}, true, true);
                                comment_collection.find ({"parent" : parentid}).toArray(function(err, results) {
                                    if (results.length == 0) {
                                        obj.parentid = 0;
                                        comment_collection.insert (obj); 
                                    } else {
                                        comment_collection.insert (obj);
                                        comment_collection.update ({"id" : parentid}, {$inc: {"childcount" : 1}}, true, true);
                                    }
                                });
                                res.send (utils.message (utils.meta(100)));
                            }
                        });
                    });
                }
            });
        });
    });
};

exports.add = function (req, res) {
    if (!req.body) {
        console.log ("System error, cannot get the req body");
        return;
    }
    if (!check_type (req.body["type"], res))
        return;
    /* Donnot check the subject */
    if (!check_message (req.body["message"], res))
        return;
    if (!check_content (req.body["content"], res))
        return;

    account.auth (req, res, function (r) {
        if (r == 0) {           /* success */
            add_comment (req, res);
        } else if (r == 1) {    /* no user and password */
            if ((req.body["guestname"] == undefined) || (req.body["guestemail"] == undefined)) {
                res.send (utils.message (utils.meta(103, "no permission to add a comment")));
            } else {
                add_comment (req, res);
            }
        } else if (r == 2) {    /* we have user:password, but failed */
            res.send (utils.message (utils.meta(103, "no permission to add a comment")));
        } else {    /*TODO: ? maybe the apis limitation  */
            console.log (r);
        }
    });

    return;
};

vote_comment = function (req, res) {
    var commentid = parseInt (req.params.commentid);
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
                {"commentid" :commentid,
                "score" :req.body["score"],
                "personid" :personid,
                "date" : date}
            );
        });

        /* update the 'summary' table and the 'comment' table */
        client.collection('summary', function (err, collection) {
            collection.find({"vote_commentid" : commentid}).toArray(function(err, r) {
                if (r.length == 1) {
                    var score = parseInt (r[0].score);
                    var count = parseInt (r[0].count);
                    var total = count * score + parseInt (req.body["score"]);
                    count ++;
                    score = total / count;
                    collection.update({"vote_commentid": commentid},
                        {$set : {"count":count,"score":score}}, true, true);
                    client.collection('comments', function (err, collection) {
                        collection.update({"id": commentid}, {$set: {"score" : score}});
                    });
                } else {
                    var score = parseInt (req.body["score"]);
                    collection.insert(
                        {"vote_commentid": commentid,
                        "count": 1,
                        "score": score}
                    );
                    client.collection('comments', function (err, collection) {
                        collection.update({"id": commentid}, {$set: {"score" : score}});
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

    var commentid = parseInt (req.params.commentid);   
    account.auth (req, res, function (r) {
        if (r == 0) {           /* success, only auth user can vote, guest cannot */
            var personid = utils.get_username(req);
            var client = new db('test', new server('127.0.0.1', 27017, {}));
            client.open(function(err, client) {
                client.collection('comments', function (err, collection) {
                    collection.find({"id": commentid}).toArray(function(err, results) {
                        if (results.length == 0) {
                            res.send (utils.message (utils.meta (101, "comment not found")));
                        } else {
                            client.collection('votes', function (err, collection) {
                                collection.find({"commentid": commentid, "personid": personid}).toArray(function(err, results) {
                                    if (results.length != 0) {
                                        res.send (utils.message (utils.meta (105, "you have already voted on this comment")));
                                    } else
                                        vote_comment (req, res);
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
