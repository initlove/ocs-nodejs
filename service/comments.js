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
    ,id: {type:ObjectId, auto:true}
    ,type: {type:Number}
    ,subject: {type:String, required: true}
    ,text: {type:String, required: true}
    ,user: {type:String, required: true}
    /*TODO: select false! */
    ,contentid: {type:String, required: true, select:true}
    ,contentid2: {type: String, select:true}
    ,parent: {type:String, default: "0", select:true}
//    ,guestname: String
//    ,guestemail: String
    ,score: {type: Number, default: 50}
    ,date: {type: Date, default: Date.now}
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
    commentModel.findByOne({"id":id}, function(err, doc) {
        if(err)
            callback(false, "Server error");
        else if(doc)
            callback(true);
        else
            callback(false, "item id not found");
    });
};

function real_add_comment(req, res) {
    var comment = new commentModel();

    comment.type = req.body.type;
    comment.contentid = req.body.content;
    comment.contentid2 = req.body.contentid2;
    comment.parent = req.body.parent;
    comment.subject = req.body.subject;
    comment.text = req.body.message;
//    comment.guestname = req.body.guestname;
//    comment.guestemail = req.body.guestemail;
    comment.user = utils.get_username(req);

    comment.save(function(err){
        if(!err) {
            if(req.body.parent != 0) {
                commentModel.update({id: req.body.parent}, {$inc: {"childcount" :1}}, function(err) {
                    if(err)
                        console.log("Unable to update the parent child count");
                });
            }
            content.addcomment (req.body.content, function (r, msg) {
                if (!r) {
                    console.log (msg);
                }
            });
            /*TODO: as I did not add rollback function, so every thing is 'ok'*/
            utils.message(req, res, "ok");
            return;
        } else {
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
        }
    });

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

    var query = {"type" : req.params.type, "content" : req.params.contentid};
    if(req.params.content2)
        query.contentid2 = req.params.contentid2;
    /* add the parent id */
    if(req.query.parent)
        query.parent = req.query.parent;
    else
        query.parent = '0';

/*TODO: find have problem */
    commentModel.find(query).skip(page * pagesize).limit(pagesize).exec(function(err, docs) {
        if(err) {
            utils.message(req, res, "Server error");
        } else {
            var meta = {"status":"ok", "statuscode": 100};
            var data = new Array();
            for (var i = 0; docs[i]; i++)
                data[i] = {"comment": docs[i]};
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
                    commentModel.update({_id: id}, {score:score}, function(err) {
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
