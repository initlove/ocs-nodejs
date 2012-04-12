var utils = require('./utils');
var content = require('./content');
var account = require('./account');
var vote = require('./vote');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var commentSchema = new Schema({
    _id: {type:ObjectId, select:false}
    ,id: {type:ObjectId, auto:true, select: true}
    ,type:String
    ,childcount: {type:Number, default: 0, select: true}
    ,subject: {type:String, required: true, select: true}
    ,text: {type:String, required: true, select: true}
    ,user: {type:String, required: true, select: true}
    /*TODO: select false! */
    ,contentid: {type:String, required: true}
    ,contentid2: {type:String, default: "0"}
    ,parent: {type:String, default: "0"}
//    ,guestname: String
//    ,guestemail: String
    ,score: {type:Number, default: 50, select: true}
    ,date: {type:Date, default: Date.now, select: true}
    /*FIXME: if I remvoe the select attribute or if I set it to false
     * I cannot push or use .length, why ? what is the trick point */
    ,ancent: {type:[String], default:[], select: true}
});

function check_type(type) {
    if(!type)
        return false;
    if(type == '1' || type == '4' || type == '7' || type == '8')
        return true;
    return false;
};

commentSchema.path('type').validate(function(v){
    return check_type(v);
});

/*
commentSchema.path('guestemail').validate(function(v){
    if(v) {
        var email_filter = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/;
        if(!email_filter.test(v))
            return false;
    }
    return true;
});
*/

mongoose.connect('mongodb://localhost/test');
var commentModel = mongoose.model('comments', commentSchema);

exports.valid = function(id, callback) {
    commentModel.findOne({"id":id}, function(err, doc) {
        if(err)
            callback(false, "Server error");
        else if(doc)
            callback(true);
        else
            callback(false, "item id not found");
    });
};

function error_handle(req, res, err) {
    var message = "";
    if(err.errors.type) {
        message = "wrong type";
    } else if(err.errors.contentid) {
        message = "content not found";
    } else if(err.errors.subject || err.errors.text) {
        message = "subject or message not found";
/*
    } else if(err.errors.guestemail) {
        message = "please specify a valid email";
*/
    } else 
        message = "system error in add comment";
    utils.message(req, res, message);
};

function real_add_comment(req, res) {
    var comment = new commentModel();
    comment.type = req.body.type;
    comment.contentid = req.body.content;
    if (req.body.content2)
        comment.contentid2 = req.body.content2;
    comment.parent = req.body.parent;
    comment.subject = req.body.subject;
    comment.text = req.body.message;
//    comment.guestname = req.body.guestname;
//    comment.guestemail = req.body.guestemail;
    comment.user = utils.get_username(req);
    if (req.body.parent && req.body.parent != 0) {
        commentModel.findOne({id: req.body.parent}, function(err, doc) {
            if (err) {
                error_handle(req, res, err);
            } else {
                doc.ancent[doc.ancent.length] = req.body.parent;
                comment.ancent = doc.ancent;
                comment.save(function(err) {
                    if (err) {
                        error_handle(req, res, err);
                    } else {
                        content.addcomment (req.body.content, function (r, msg) {
                            if (r) {
                                utils.message(req, res, "ok");
                            } else {
                                utils.message(req, res, msg);
                            }
                        });
                    }
                });
            }
            commentModel.update({id:req.body.parent}, {$inc: {childcount: 1}}, function (err) {
                //TODO: need a rollback  if err
            });
        });
    } else {
        comment.save(function(err){
            if (err) {
                error_handle(req, res, err);
            } else {
                content.addcomment (req.body.content, function (r, msg) {
                    if (r) {
                        utils.message(req, res, "ok");
                    } else {
                        utils.message(req, res, msg);
                    }
                });
            }
        });
    }
};

function add_comment(req, res) {
    var contentid = req.body.content;
    var parent = req.body.parent;

    content.valid(contentid, function(r, msg) {
        if(r) {
            if(parent && parent != '0') {
                exports.valid(parent, function(r, msg) {
                    if(r) {
                        real_add_comment(req, res);
                    } else {
                        utils.message(req, res, msg);
                    }
                });
            } else {
                real_add_comment(req, res);
            }

        } else {
            utils.message(req, res, msg);
        }
    });
};

exports.add = function(req, res) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {
            add_comment(req, res);
        } else {
//            if(req.body.guestname && req.body.guestemail) {
//                add_comment(req, res);
//            } else
                utils.message(req, res, msg);
        }
    });
};

function get_comments(req, res) {
    var page = 0;
    var pagesize = 10;
    if(req.query.page)
        page = parseInt(req.query.page);
    if(req.query.pagesize)
        pagesize = parseInt(req.query.pagesize);

    var query = {"type" : req.params.type, "contentid" : req.params.contentid, "parent": "0"};
    query.contentid2 = req.params.contentid2;

    commentModel.find(query).skip(page * pagesize).limit(pagesize).exec(function(err, docs) {
        if(err) {
            console.log(err);
            utils.message(req, res, "Server error");
        } else {
            var meta = {"status":"ok", "statuscode": 100};
            var data = new Array();
            for (var i = 0; docs[i]; i++) {
                data[i] = {"comment": docs[i]};
                console.log (docs[i].id);
            }
            var result = {"ocs": {"meta": meta, "data": data}};
            utils.info(req, res, result);
        }
    });
};

exports.get = function(req, res) {
    if(!check_type(req.params.type)) {
        utils.message(req, res, "wrong type");
        return;
    }
    content.valid(req.params.contentid, function(r, msg) {
        if(r) {
            get_comments(req, res);
        } else {
            utils.message(req, res, msg);
        }
    });
};

exports.vote = function(req, res) {
    var id = req.params.commentid;
    exports.valid(id, function(r, msg) {
        if(r) {
            vote.vote("comments", id, req, function(score, msg) {
                if(score > -1) {
                    commentModel.update({id: id}, {score:score}, function(err) {
                        if(err)
                            utils.message(req, res, "Server error");
                        else
                            utils.message(req, res, "ok");
                    });
                } else {
                    utils.message(req, res, msg);
                }
            });
        } else {
            utils.message(req, res, msg);
        }
    });
};
