var utils = require('./utils');
var content = require('./content');
var vote = require('./vote');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var commentsSchema = new Schema({
    _id: {type:ObjectId, select:false},
    ,id: String /* id is just the _id */
    ,type: String
    ,contentid: {type:String, required: true}
    ,contentid2: String
    ,parent: {type:String, default: "0"}
    ,subject: {type:String, required: true}
    ,message: {type:String, required: true}
    ,personid: String
    ,guestname: String
    ,guestemail: String
    ,score: {type: Number, default: 50}
    ,date: {type: Date, default: Date.now}
});

function check_type (type) {
    if (!type)
        return false;
    if (type == '1' || type == '4' || type == '7' || type == '8')
        return true;
    return false;
};

commentsSchema.path('type').validate(function (v){
    return check_type (v);
});

commentsSchema.path('guestemail').validate(function (v){
    if (v) {
        var email_filter = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/;
        if (!email_filter.test(v))
            return false;
    }
    return true;
});

mongoose.connect('mongodb://localhost/test');
var CommentModel = mongoose.model('comments', commentsSchema);

exports.valid (id, callback) {
    CommentModel.findById (id, function (err, doc) {
        if (err)
            callback (false);
        else if (doc)
            callback (true);
        else
            callback (false);
    });
};

function real_add_comment (req, res) {
    var comment = new CommentModel();

    comment.type = req.body.type;
    comment.contentid = req.body.content;
    comment.contentid2 = req.body.contentid2;
    comment.parent = req.body.parent;
    comment.subject = req.body.subject;
    comment.message = req.body.message;
    comment.guestname = req.body.guestname;
    comment.guestemail = req.body.guestemail;
    comment.personid = utils.get_userid (req);

    comment.save(function(err){
        if (!err) {
            /*TODO: any other way to change _id to id ? */
            CommentModel.update({_id: comment._id}, {id: comment._id.toString ()}, function (err) {
            }); 

            if (req.body.parent != 0) {
                CommentModel.update ({_id: req.body.parent}, {$inc: {"childcount" :1}, function (err) {
                    if (err) {
                        console.log ("Unable to update the parent child count");
                    } 
                }
            }
            ContentModel.update ({_id: req.body.content}, {$inc: {{"comments":1}, function (err) {
                if (err) {
                    console.log ("Unable to update the content comment counts");
                }
            }
            res.send (utils.message (utils.meta ("ok")));
            return;
        }
        var message = "";
        if (err.errors.type) {
            message = "wrong type";
        } else if (err.errors.contentid) {
            message = "content not found";
        } else if (err.errors.subject || err.errors.message) {
            message = "subject or message not found";
        } else if (err.errors.guestemail) {
            message = "please specify a valid email";
        } else 
            message = "system error in add comment";

        res.send (utils.message (utils.meta (message)));
    });

};

function add_comment (req, res) {
    var contentid = req.body.content;
    var parent = req.body.parent;

    content.valid (contentid, function (contentid_r) {
        if (contentid_r) {
            if (parent && parent != '0') {
                exports.valid (parent, function (commentsid_r) {
                    if (commentsid_r) {
                        real_add_comment (req, res);
                    } else {
                        res.send (utils.message (utils.meta ("invalid parent id")));
                    }
                }
            } else {
                real_add_comment (req, res);
            }

        } else {
            res.send (utils.message (utils.meta ("invalid content id")));
        }
    });
};

exports.add = function (req, res) {
    account.auth (req, res, function (auth_r) {
        switch (auth_r) {
            case "ok":
                add_comment (req, res);
                break;
            case "no auth info":
                if ((req.body.guestname == null) || (req.body.guestemail == null)) {
                    res.send (utils.message (utils.meta ("no permission to add a comment")));
                } else {
                    add_comment (req, res);
                }
                break;
            case "fail to auth":
                res.send (utils.message (utils.meta ("no permission to add a comment")));
                break;
            default:
                /*TODO: the apis limitation?  */
                res.send (utils.message (utils.meta (auth_r)));
                console.log (auth_r);
                break;
        }
    });
};

function get_comments (req, res) {
    var page = 0;
    var pagesize = 10;
    if (req.query.page)
        page = parseInt(req.query.page);
    if (req.query.pagesize)
        pagesize = parseInt(req.query.pagesize);

    var query = {"type" : req.query.type, "content" : req.query.content};
    if (req.query.content2)
        query.content2 = req.query.content2;
    if (req.query.parent)
        query.parent = req.query.parent;
    else
        query.parent = '0';

    commentModel.find(query).skip (page * pagesize).limit (pagesize).exec (function (err, doc) {
        if (err) {
            res.send (utils.message (utils.meta ("Server error")));
        } else {
            res.send (utils.message (utils.meta ("ok"), doc));
        }
    });
};

exports.get = function (req, res) {
    if (!check_type (req.query.type)) {
        res.send (utils.message (utils.meta ("wrong type")));
        return;
    }
    content.valid (req.query.content, function (r) {
        if (r) {
            get_comments (req, res);
        } else {
            res.send (utils.message (utils.meta ("invalid content id")));
        }
    });
};

exports.vote = function (req, res) {
    var id = req.params.commentid;
    exports.valid (id, callback (r) {
        if (r) {
            vote.vote ("comments", id, req, function (msg, score) {
                if (msg == "ok") {
                    CommentModel.update ({_id: id}, {score:score}, function (err) {
                        if (err)
                            res.send (utils.message (utils.meta ("Server error")));
                        else
                            res.send (utils.message (utils.meta ("ok")));
                    });
                } else {
                    res.send (utils.message (utils.meta (msg)));
                }
            });
        } else {
            res.send (utils.message (utils.meta ("invalid content id")));
        }
    });
};
