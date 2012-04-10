var account = require('./account');
var content = require('./content');
var utils   = require('./utils');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var fanDetailSchema = new Schema({
    personid: String
    ,timestamp: {type: Date, default: Date.now}
});

var fanSchema = new Schema({
    collection_name: String
    ,item_id: String
    ,fan: {type:[fanDetailSchema], default:[]}
});

mongoose.connect('mongodb://localhost/test');
var fanModel = mongoose.model('fan', fanSchema);

exports.get = function(collection_name, req, callback) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {
            var page = 0;
            var pagesize = 10;
 
            if(req.query.page)
                page = parseInt(req.query.page);
            if(req.query.pagesize)
                pagesize = parseInt(req.query.pagesize);

            fanModel.count({"collection_name" : collection_name, "item_id": req.params.contentid}, function(err, count) {
                if(err) {
                    console.log(err);
                    callback(null, "Server error");
                } else {
                    var meta = {"status": "ok", "statuscode": 100,
                                "totalitems": count, "itemsperpage": pagesize};
                    if(count > page*pagesize) {
                        fanModel.skip(page*pagesize).limit(pagesize).exec(function(err, docs) {
                            if(err) {
                                console.log(err);
                                callback(null, "Server error");
                            } else {
                                var data = new Array();
                                for (var i; docs[i]; i++)
                                    data[i] = {"person": docs[i]};
                                var result = {"ocs": {"meta": meta, "data": data}};
                                callback(result);
                            }
                        });
                    } else {
                        var result = {"ocs": {"meta": meta}};
                        callback(result);
                    }
                }
            });
        } else {
            callback(null, "no permission");
        }
    });
};

exports.isfan = function(collection_name, id, req, callback) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {   /* only authenticated user can use get */
            fanModel.findOne({"collection_name" : collection_name, "item_id" : id, "fan.personid":login}, function(err, doc) {
                if(err) {
                    console.log(err);
                    callback(false, "Server error");
                } else {
                    if(doc) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                }
            });
        } else {
            callback(false, "no permission");
        }
    });
};

exports.add = function(collection_name, id, req, callback) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {   /* only authenticated user can use get */
            fanModel.findOne({"collection_name" : collection_name, "item_id": id}, function(err, doc) {
                if(err) {
                    console.log(err);
                    callback(false, "Server error");
                } else {
                    var fan = {};
                    if(doc) {
                        fan = doc;
                        for(var i = 0; doc.fan[i]; i++) {
                            if(doc.fan[i].personid == login) {
                                callback(false, "You have already been the fan.");
                                return;
                            }
                        }
                    } else {
                        fan = new fanModel();
                        fan.content = id;
                    }
                    
                    var fan_detail = new fanDetailModel();
                    fan_detail.personid = login;
                    fan.fan.push(fan_detail);
                    fan.save(function(err) {
                        if(err) {
                            console.log(err);
                            callback(false, "Server error");
                        } else {
                            callback(true);
                        }
                    });
                }
            });
        } else {
            callback(false, "no permission");
        }
    });
};

exports.remove = function(collection_name, id, req, callback) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {   /* only authenticated user can use get */
            fanModel.findOne({"collection_name": collection_name, "item_id": id}, function(err, doc) {
                if(err) {
                    console.log(err);
                    callback(false, "Server error");
                } else {
                    for(var i=0; doc.fan[i]; i++) {
                        if(doc.fan[i].personid == login) {
                            doc.fan[i].remove();
                            doc.save(function(err) {
                                if(err) {
                                    console.log(err);
                                    callback(false, "Server error");
                                } else {
                                    callback(true);
                                }
                            });
                            return;
                        }
                    }
                    callback(false, "You are not the fan");
                }
            });
        } else {
            callback(false, "no permission");
        }
    });
};
