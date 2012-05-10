var content = require('./content');
var utils   = require('./utils');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var fanDetailSchema = new Schema({
    _id: {type:ObjectId, select:false}
    ,personid: String
    ,timestamp: {type: Date, default: Date.now}
});

var fanSchema = new Schema({
    url: String
    ,fan: {type:[fanDetailSchema], default:[]}
});

mongoose.connect(utils.dbname);
var fanModel = mongoose.model('fan', fanSchema);
var fanDetailModel = mongoose.model('fan_detail', fanDetailSchema);

exports.getfans = function(req, url, callback) {
    var page = 0;
    var pagesize = 10;
 
    if(req.query.page)
        page = parseInt(req.query.page);
    if(req.query.pagesize)
        pagesize = parseInt(req.query.pagesize);

    fanModel.findOne({url:url}, function(err, doc) {
        if(err) {
            console.log(err);
            return callback(null, "Server error "+err);
        } else {
            var count = doc?doc.fan.length:0;
            var meta = {"status": "ok", "statuscode": 100,
                        "totalitems": count, "itemsperpage": pagesize};
            var data = new Array();
            var skip = page*pagesize;
            for (var i = 0; (i < pagesize) && ((i + skip)<count); i++) {
                data[i] = {"person": doc.fan[i+skip]};
            }
            var result = {"ocs": {"meta": meta, "data": data}};
            return callback(result);
        }
    });
};

exports.get = function(req, res) {
    var url = req.params.urlmd5;
    exports.getfans(req, url, function(result, msg) {
        if (result) {
            return utils.info(req, res, result);
        } else {
            return utils.message(req, res, msg);
        }
    });
};

exports.fanstatus = function(req, url, callback) {
    var login = utils.get_username(req);
    fanModel.findOne({url: url, 'fan.personid': login}, function(err, doc) {
        if(err) {
            console.log(err);
            return callback(null, "Server error "+err);
        } else {
            var meta = {"status": "ok", "statuscode": 100};
            var result = {"ocs": {"meta": meta, "data": {"status": doc?"fan":"notfan"}}};
            return callback(result);
        }
    });
};

exports.status = function(req, res) {
    var login = utils.get_username(req);
    exports.fanstatus(req, req.params.url, function(result, msg) {
        if (result) {
            return utils.info(req, res, result);
        } else {
            return utils.message(req, res, msg);
        }
    });
};

exports.addfan = function(req, url, callback) {
    fanModel.findOne({url: url}, function(err, doc) {
        if(err) {
            console.log(err);
            return callback(false, "Server error "+err);
        } else {
            var login = utils.get_username(req);
            if(doc) {
                for(var i = 0; doc.fan[i]; i++) {
                    if(doc.fan[i].personid == login) {
                        return callback(false, "You have already been the fan.");
                    }
                }
            } else {
                doc = new fanModel();
                doc.url = url;
            }
            var fan_detail = new fanDetailModel();
            fan_detail.personid = login;
            doc.fan.push(fan_detail);
            doc.save(function(err) {
                if (err) {
                    console.log(err);
                    return callback(false, "Server error "+err);
                } else {
                    return callback(true);
                }
            });
        }
    });
};

exports.add = function(req, res) {
    var url = req.params.urlmd5;
    var login = utils.get_username(req);
    exports.addfan(req, url, function(r, msg) {
        if (r) {
            return utils.info(req, res, "ok");
        } else {
            return utils.message(req, res, msg);
        }
    });
};

exports.removefan = function(req, url, callback) {
    fanModel.findOne({url: url}, function(err, doc) {
        if(err) {
            console.log(err);
            return callback(false, "Server error "+err);
        } else {
            var login = utils.get_username(req);
            var len = doc?doc.fan.length:0;
            for (var i=0; i < len; i++) {
                if (doc.fan[i].personid == login) {
                    doc.fan.splice (i, 1);
                    doc.save(function(err) {
                        if(err) {
                            console.log(err);
                            return callback(false, "Server error "+err);
                        } else {
                            return callback(true);
                        }
                    });
                    return;
                }
            }
            return callback(false, "You are not the fan");
        }
    });
};

exports.remove = function(req, res) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    exports.removefan(req, req.params.urlmd5, function (r, msg) {
        if (r) {
            return utils.message(req, res, "ok");
        } else {
            return utils.message(req, res, msg);
        }
    });
};

exports.follow = function(req, res) {
    var login = utils.get_username(req);
    /*TODO: the element test*/        
};
