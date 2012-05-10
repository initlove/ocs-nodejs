var utils = require('./utils');
var vote = require('./vote');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var commentSchema = new Schema({
    /* also mean parent */
    url: {type:String, required: true}
    ,childcount: {type:Number, default: 0}
    ,subject: {type:String, required: true}
    ,message: {type:String, required: true}
    ,user: {type:String, required: true}
//    ,guestname: String
//    ,guestemail: String
    ,score: {type:Number, default: 50}
    ,date: {type:Date, default: Date.now}
    ,path: {type:String}
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

mongoose.connect(utils.dbname);
var commentModel = mongoose.model('comments', commentSchema);

function error_msg(err) {
    var message = "";
    if(err.errors.url) {
        message = "url should not be empty";
    } else if(err.errors.subject || err.errors.text) {
        message = "subject or message not found";
    } else 
        message = "system error in add comment";
    return message;
};

exports.addcomment = function(req, url, callback) {
    var comment = new commentModel();
    comment.url = url;
    comment.subject = req.body.subject;
    comment.message = req.body.message;
    comment.user = utils.get_username(req);
    commentModel.findOne({_id:url}, function(err, doc) {
        /* err may mean the id is the url from outside */
        if (err || !doc) {
            comment.path = comment._id;
        } else {
            comment.path = doc.path + ":" + comment._id;
        }
        comment.save(function(err) {
            if (err) {
                return callback(false, error_msg(err));
            } else if (doc) {
                doc.childcount += 1;
                doc.save(function(err) {
                    if (err) {
                        console.log(err);
                        return callback(false, "Server error");
                    } else
                        return callback(true);
                });
            } else
                return callback(true);
        });
    });
};

exports.add = function(req, res) {
    var url = req.params.urlmd5;
    exports.addcomment(req, url, function(r, msg){
        if (r) {
            utils.message(req, res, "ok");
        } else {
            utils.message(req, res, msg);
        }
    });
};

function generate_children(regex, callback){
    commentModel.find({path: new RegExp(regex)}).asc("path").exec(function(err, docs) {
        if (err) {
            console.log(err);
            return callback(null, "Server error "+err);
        } else {

            var meta = {"status":"ok", "statuscode":100};
            var result = {"ocs": {"meta": meta, "data": new Array()}};
            var data = new Array();
            var cache = new Array();
            cache[0] = result.ocs.data;
            var len = docs?docs.length:0;
            for (var i = 0; i<len; i++) {
                data[i] = {"id": docs[i]._id,
                            "url": docs[i].url,
                            "subject": docs[i].subject,
                            "text" : docs[i].message,
                            "childcount": docs[i].childcount,
                            "user": docs[i].user,
                            "date": docs[i].date,
                            "score": docs[i].score,
                            "children": new Array()
                        };
                    
                var count = docs[i].path.split(":").length;
                cache[count] = data[i].children;
                cache[count-1].push({"comment": data[i]});
            }
            return callback(result);
        }
    });
};

exports.getcomment = function(req, url, callback) {
    var page = 0;
    var pagesize = 10;
    if(req.query.page)
        page = parseInt(req.query.page);
    if(req.query.pagesize)
        pagesize = parseInt(req.query.pagesize);

    var query = {url: url};

    commentModel.find(query).skip(page * pagesize).limit(pagesize).exec(function(err, docs) {
        if(err) {
            console.log(err);
            return callback(null, "Server error "+err);
        } else {
            if (!docs || (docs.length == 0)) {
                return callback(null, "ok");
            } else {
                var regex = "";
                var len = docs.length;
                for (var i = 0; i<len; i++) {
                    if (i != 0)
                        regex += "|";
                    regex += "^"+docs[i].path;
                }
                generate_children(regex, callback);
            }
        }
    });
};

exports.get = function(req, res) {
    var url = req.params.urlmd5;
    exports.getcomment(req, url, function(result, msg) {
        if (result) {
            utils.info(req, res, result);
        } else {
            utils.message(req, res, msg);
        }
    });
};

exports.vote = function(req, res) {
    var id = req.params.commentid;
    commentModel.findOne({_id:id}, function(err, doc) {
        if (doc) {
            var url = "comments:"+id;
            vote.realvote(req, url, function(score, msg) {
                if(score > -1) {
                    doc.score = score;
                    doc.save(function(err) {
                        if(err)
                            utils.message(req, res, "Server error "+err);
                        else
                            utils.message(req, res, "ok");
                    });
                } else {
                    utils.message(req, res, msg);
                }
            });
        } else {
            utils.message(req, res, "comment not found");
        }
    });
};
