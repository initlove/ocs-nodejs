var utils = require('./utils');
var person = require('./person');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var friendDetailSchema = new Schema({
    _id: {type:ObjectId, select:false}
    ,personid: String
    ,timestamp: {type: Date, default: Date.now}
});

var inviteSchema = new Schema({
    _id: {type:ObjectId, select:false}
    ,sender: String
    ,receiver: String
    ,status: {type: String, default: 'new'}
    ,message: String
    ,timestamp: {type: Date, default: Date.now}
});

var friendSchema = new Schema({
    personid: String
    ,friends: {type:[friendDetailSchema], default:[]}
});

mongoose.connect('mongodb://localhost/test');
var friendModel = mongoose.model('friend', friendSchema);
var friendDetailModel = mongoose.model('friend_detail', friendDetailSchema);
var inviteModel = mongoose.model('invite', inviteSchema);

exports.status = function(req, res) {
    var from = utils.get_username(req);
    var to = req.params.personid;
    friendModel.findOne({personid:from, friends:to}, function(err, doc) {
        if (err) {
            utils.message(req, res, "Server error");
        } else {
            var meta = {"status": "ok", "statuscode": 100};
            var result = {"ocs": {"meta": meta, "data": {"status": doc?"friend":"notfriend"}}};
            utils.info(req, res, result);
        }
    });
};

exports.get = function(req, res) {
    var page = 0;
    var pagesize = 10;

    if(req.query.page)
        page = parseInt(req.query.page);
    if(req.query.pagesize)
        pagesize = parseInt(req.query.pagesize);

    var personid = req.params.personid;
    friendModel.findOne({personid:personid}, function(err, doc) {
        if(err) {
            console.log(err);
            utils.message(req, res, "Server error");
        } else {
            var count = doc? doc.friends.length: 0;
            var meta = {"status": "ok", "statuscode": 100,
                        "totalitems": count, "itemsperpage": pagesize};
            var data = new Array();
            var skip = page*pagesize;
            for (var i = 0; (i < pagesize) && ((i + skip)<count); i++) {
                data[i] = {"user": {"personid": doc.friends[i+skip].personid}};
            }
            var result = {"ocs": {"meta": meta, "data": data}};
            utils.info(req, res, result);
        }
    });
};

exports.rece = function (req, res) {
    var page = 0;
    var pagesize = 10;

    if(req.query.page)
        page = parseInt(req.query.page);
    if(req.query.pagesize)
        pagesize = parseInt(req.query.pagesize);

    var personid = utils.get_username(req);
    inviteModel.count({receiver: personid}, function(err, count) {
        if (err) {
            console.log(err);
            utils.message(req, res, "Server error");
        } else {
            if (count > page*pagesize) {
                inviteModel.find({receiver: personid}).skip(page*pagesize).limit(pagesize).exec(function(err, docs) {
                    if (err) {
                        console.log(err);
                        utils.message(req, res, "Server error");
                    } else {
                        var meta = {"status":"ok", "statuscode":100,
                                    "totalitems": count, "itemsperpage": pagesize};
                        var data = new Array();
                        var len = docs? docs.length:0;
                        for(var i = 0; i < len; i++) {
                            data [i] = {"user": docs[i]};
                        }
                        var result = {"ocs": {"meta": meta, "data": data}};
                        utils.info(req, res, result);
                    }
                });
            } else {
                var meta = {"status":"ok", "statuscode":100,
                            "totalitems": count, "itemsperpage": pagesize};
                var result = {"ocs": {"meta": meta}};
                utils.info(req, res, result);
            }
        }
    });
};

exports.sent = function (req, res) {
    var page = 0;
    var pagesize = 10;

    if(req.query.page)
        page = parseInt(req.query.page);
    if(req.query.pagesize)
        pagesize = parseInt(req.query.pagesize);

    var personid = utils.get_username(req);
    inviteModel.count({sender: personid}, function(err, count) {
        if (err) {
            console.log(err);
            utils.message(req, res, "Server error");
        } else {
            if (count > page*pagesize) {
                inviteModel.find({sender: personid}).skip(page*pagesize).limit(pagesize).exec(function(err, docs) {
                    if (err) {
                        console.log(err);
                        utils.message(req, res, "Server error");
                    } else {
                        var meta = {"status":"ok", "statuscode":100,
                                    "totalitems": count, "itemsperpage": pagesize};
                        var data = new Array();
                        var len = docs? docs.length:0;
                        for(var i = 0; i < len; i++) {
                            data [i] = {"user": docs[i]};
                        }
                        var result = {"ocs": {"meta": meta, "data": data}};
                        utils.info(req, res, result);
                    }
                });
            } else {
                var meta = {"status":"ok", "statuscode":100,
                            "totalitems": count, "itemsperpage": pagesize};
                var result = {"ocs": {"meta": meta}};
                utils.info(req, res, result);
            }
        }
    });
};

function real_invite(req, res) {
    var sender = utils.get_username(req);
    var receiver = req.params.personid;
    friendModel.findOne({personid:sender, friends:receiver}, function(err, doc) {
        if (err) {
            console.log(err);
            utils.message(req, res, "Server error");
        } else {
            if (doc) {
                return utils.message(req, res, "You have already been the friends");
            } else {
                var invite = new inviteModel();
                invite.sender = sender;
                invite.receiver = receiver;
                invite.message = req.body.message;
                invite.save(function(err) {
                    if (err) {
                        console.log(err);
                        return utils.message(req, res, "Server error");
                    } else {
                        return utils.message(req, res, "ok");
                    }
                });
            }
        }
    });
};

exports.invite = function(req, res) {
    var from = utils.get_username(req);
    var to = req.params.personid;
    if (from == to) {
        utils.message(req, res, "you can't invite yourself");
        return;
    }
    if (!req.body.message) {
        utils.message(req, res, "message must not be empty");
        return;
    }
    person.valid(to, function(r) {
        if (r) {
            real_invite(req, res);
        } else {
            utils.message(req, res, "user not found");
        }
    });
};

function add_friend(I, you, callback) {
    friendModel.findOne({personid:I}, function (err, doc) {
        if (err) {
            console.log(err);
            return callback(false, "Server error");
        } else {
            if (!doc) {
                doc = new friendModel();
                doc.personid = I;
            } else {
                var len = doc.friends.length;
                for (var i = 0; i < len; i++) {
                    if (doc.friends[i].personid == you) {
                        return callback(false, "You have already been the friends");
                    }
                }
            }
            var friend_detail = new friendDetailModel();
            friend_detail.personid = you;
            doc.friends.push(friend_detail);
            doc.save(function(err) {
                if (err) {
                    console.log(err);
                    return callback(false, "Server error");
                } else {
                    return callback(true);
                }
            });
        }
    });
};

/*TODO: should we approve by the id, not the personid ? */
exports.approve = function(req, res) {
    var I = utils.get_username(req);
    var you = req.params.personid;
    var query = {sender: you, receiver: I, status: 'new'};
    inviteModel.findOne(query, function(err, doc) {
        if (err) {
            console.log(err);
            utils.message(req, res, "Server error");
        } else if (doc) {
            add_friend(I, you, function(r, msg){
                if (r) {
                    add_friend(you, I, function(r, msg) {
                        if (r) {
                            inviteModel.update(query, {$set: {status: 'approve'}}, function(err) {
                                if (err) {
                                    console.log(err);
                                    utils.message(req, res, "Server error");
                                } else {
                                    utils.message(req, res, "ok");
                                }
                            });
                            /* VIP! very trick, when we set _id: select = false, we cannot use the doc.save */
                            /*
                            doc.status = 'approved';
                            doc.save(function(err) {
                            }); */
                        } else {
                            //TODO: roll back
                            utils.message(req, res, msg);
                        }
                    });
                } else {
                    utils.message(req, res, msg);
                }
            });
        } else {
            utils.message(req, res, "No invitation from this person");
        }
    });
};

exports.decline = function(req, res) {
    var I = utils.get_username(req);
    var you = req.params.personid;
    var query = {sender: you, receiver: I, status: 'new'};
    inviteModel.findOne(query, function(err, doc) {
        if (err) {
            console.log(err);
            utils.message(req, res, "Server error");
        } else if (doc) {
            inviteModel.update(query, {$set: {status: 'decline'}}, function(err) {
                if (err) {
                    console.log(err);
                    utils.message(req, res, "Server error");
                } else {
                    utils.message(req, res, "ok");
                }
            });
            /* we set id select = false, we cannot use save way ..
            doc.status = 'decline';
            doc.save(function(err) {
            }); */
        } else {
            utils.message(req, res, "No invitation from this person");
        }
    });
};

function remove_friend(I, you, callback) {
    friendModel.findOne({personid:I}, function(err, doc) {
        if (err) {
            console.log(err);
            return callback(false, "Server error");
        } else {
            if (doc) {
                var len = doc.friends.length;
                for (var i = 0; i < len; i++) {
                    if (doc.friends[i].personid == you) {
                        doc.friends.splice (i, 1);
                        doc.save(function(err) {
                            if (err) {
                                console.log(err);
                                return callback(false, "Server error");
                            } else {
                                return callback(true);
                            }
                        });
                        return;
                    }
                }
            }
            return callback(false, "You are not friend");
        }
    });
};

exports.cancel = function(req, res) {
    var I = utils.get_username(req);
    var you = req.params.personid;
    remove_friend(I, you, function(r, msg) {
        if (r) {
            remove_friend(you, I, function(r, msg) {
                if (r) {
                    utils.message(req, res, "ok");
                } else {
                    //TODO: rollback
                    utils.message(req, res, msg);
                }
            });
        } else {
            utils.message(req, res, msg);
        }
    });
}
