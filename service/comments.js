/**
 * Module dependencies.
 */

var $ = require("mongous").Mongous; /* seems hung the server, donnot know why */
var express = require('express')
var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var utils = require('./utils');
var account = require('./account');

exports.get = function (req, res){
    var page = 0;
    var pagesize = 10;

    if (!check_type (req.query.type, res))
        return;
    if (!check_content (req.query.content, res))
        return;

    if (req.query.page)
        page = parseInt(req.query.page);
    if (req.query.pagesize)
        pagesize = parseInt(req.query.pagesize);

    var query = {"type" : parseInt(req.query.type), "content" : req.query.content};
    if (req.query.content2)
        query.content2 = req.query.content2;
    if (req.query.parent)
        query.parent = req.query.parent;
    else
        query.parent = '0';
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('comments', function (err, comments_coll) {
            comments_coll.find(query).skip (page*pagesize).limit (pagesize).toArray(function(err, results) {
                if (results.length == 0) {
                    res.send (utils.message (utils.meta ("ok")));
                } else {
                    var data = new Array();
                    for (var i = 0; (i < results.length) && (i < pagesize); i++) {
                        /*TODO: get the useful attr */
                        data [i] = results [i];
                    }
                    res.send (utils.message (utils.meta("ok"), data));
                }
            });
        });
    });
};

function check_type (type, res) {
	var types = [1, 4, 7, 8];
	var valid;
	valid = false;
	if (type) {
		for (var i = 0; i < 4; i++) {
			if (type == types[i]) {
				valid = true;
				break;
			}
		}
	}
	if (valid == false) {
		res.send (utils.message (utils.meta ("wrong type")));
		return false;
	}
    return true;
}

function check_message (message, res) {
    if (message == null || message.length == 0) {
		res.send (utils.message (utils.meta ("message or subject must not be empty")));
        return false;
    }
    return true;
}

function check_content (content, res) {
	var valid;
	if (content == null || content.length == 0) {
			res.send (utils.message (utils.meta ("content must not be empty")));
			return false;
	}
    return true;
}

function add_comment (req, res) {
    var contentid = req.body.content;
    var parentid = req.body.parent;
    var type = parseInt (req.body.type);

    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('content', function (err, content_coll) {
            content_coll.find({"_id" : ObjectID(contentid)}).toArray(function(err, results) {
                if (results.length == 0) {
                    res.send (utils.message (utils.meta("invalid content id")));
                } else {
                    if (!utils.check_id (parentid)) {
                        parentid = '0';
                    }
                        
                    var obj = {
                        "type" : type,
                        "content" :contentid,
                        "parent"  :parentid,
		    		    "subject" :req.body["subject"],
        	           	"message" :req.body["message"]};

                    if (req.body.content2)
                            obj.content2 = req.body.content2;
                    var user = utils.get_username (req);
                    if (user) {
                            obj.user = user;
                    } else {
                        obj.guestname = req.body.guestname;
                        obj.guestemail = req.body.guestemail;
                    }
                    obj.date = Date();
                    ocs_db.collection('comments', function (err, comments_coll) {
                        if (err) {
                            console.log ("System error in add comment ");
                        } else {
                            content_coll.update({"_id" : ObjectID (contentid)}, {$inc: {"comments" :1}}, true, true);
                            comments_coll.find ({"parent" : parentid}).toArray(function(err, results) {
                                if (results.length == 0) {
                                    obj.parentid = 0;
                                    comments_coll.insert (obj); 
                                } else {
                                    comments_coll.insert (obj);
                                    comments_coll.update ({"_id" : ObjectID (parentid)}, {$inc: {"childcount" : 1}}, true, true);
                                }
                            });
                            res.send (utils.message (utils.meta("ok")));
                        }
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
    if (!check_type (req.body.type, res))
        return;
    /* Donnot check the subject */
    if (!check_message (req.body.message, res))
        return;
    if (!check_content (req.body.content, res))
        return;

    account.auth (req, res, function (r) {
        if (r == 0) {           /* success */
            add_comment (req, res);
        } else if (r == 1) {    /* no user and password */
            if ((req.body.guestname == null) || (req.body.guestemail == null)) {
                res.send (utils.message (utils.meta("no permission to add a comment")));
            } else {
                add_comment (req, res);
            }
        } else if (r == 2) {    /* we have user:password, but failed */
            res.send (utils.message (utils.meta("no permission to add a comment")));
        } else {    /*TODO: ? maybe the apis limitation  */
            console.log (r);
        }
    });

    return;
};

vote_comment = function (req, res) {
    var id = req.params.commentid;
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        if (err) {
            res.send (utils.message (utils.meta ("Server error")));
            console.log ("System error in vote comment");
            return;
        } else {
            res.send (utils.message (utils.meta (100)));
        }
        /* add to votes table */
        ocs_db.collection('votes', function (err, votes_coll) {
            var personid = utils.get_username (req);
            var date = Date();
            votes_coll.insert (
                {"commentid" :id,
                "score" :req.body.score,
                "personid" :personid,
                "date" : date}
            );
        });

        /* update the 'summary' table and the 'comment' table */
        ocs_db.collection('summary', function (err, summary_coll) {
            summary_coll.find({"vote_commentid" : id}).toArray(function(err, r) {
                if (r.length == 1) {
                    var score = parseInt (r[0].score);
                    var count = parseInt (r[0].count);
                    var total = count * score + parseInt (req.body.score);
                    count ++;
                    score = total / count;
                    summary_coll.update({"vote_commentid": id},
                        {$set : {"count":count,"score":score}}, true, true);
                    ocs_db.collection('comments', function (err, comments_coll) {
                        comments_coll.update({"_id": ObjectID(id)}, {$set: {"score" : score}});
                    });
                } else {
                    var score = parseInt (req.body.score);
                    summary_coll.insert(
                        {"vote_commentid": id,
                        "count": 1,
                        "score": score}
                    );
                    ocs_db.collection('comments', function (err, comments_coll) {
                        comments_coll.update({"_id": ObjectID(id)}, {$set: {"score" : score}});
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

    var id = req.params.commentid;
    if (!utils.check_id (id)) {
        res.send (utils.message (utils.meta ("invalid comment id")));
        return;
    }
    account.auth (req, res, function (r) {
        if (r == 0) {           /* success, only auth user can vote, guest cannot */
            var personid = utils.get_username(req);
            var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
            ocs_db.open(function(err, ocs_db) {
                ocs_db.collection('comments', function (err, comments_coll) {
                    comments_coll.find({"_id": ObjectID (id)}).toArray(function(err, results) {
                        if (results.length == 0) {
                            res.send (utils.message (utils.meta ("comment not found")));
                        } else {
                            ocs_db.collection('votes', function (err, votes_coll) {
                                votes_coll.find({"commentid": id, "personid": personid}).toArray(function(err, results) {
                                    if (results.length != 0) {
                                        res.send (utils.message (utils.meta ("you have already voted on this comment")));
                                    } else
                                        vote_comment (req, res);
                                });
                            });
                        }
                    });
             	});
            });
        } else {
            res.send (utils.message (utils.meta ("no permission to vote")));
        }
    });
};
