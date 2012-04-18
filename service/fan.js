var account = require('./account');
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

mongoose.connect('mongodb://localhost/test');
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
            return callback(null, "Server error");
        } else {
            var count = 0;
            if (doc)
                count = doc.fan.length;
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
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if (r) {
            exports.getfans(req, url, function(result, msg) {
                if (result) {
                    return utils.info(req, res, result);
                } else {
                    return utils.message(req, res, msg);
                }
            });
        } else {
            return utils.message(req, res, msg);
        }
    });
};

exports.fanstatus = function(req, url, callback) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {
            /*TODO: element match */
            fanModel.findOne({url: url}, function(err, doc) {
                if(err) {
                    console.log(err);
                    return callback(null, "Server error");
                } else {
                    var isfan = false;
                    console.log(doc);
                    if (doc) {
                        for (var i = 0; doc.fan[i]; i++) {
                            if (doc.fan[i].personid == login) {
                                isfan = true;
                                break;
                            }
                        }
                    }
                    var meta = {"status": "ok", "statuscode": 100};
                    var result = {"ocs": {"meta": meta, "data": {"status": isfan?"fan":"notfan"}}};
                    return callback(result);
                }
            });
        } else {
            return callback(null, msg);
        }
    });
};

exports.status = function(req, res) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {
            exports.fanstatus(req, req.params.url, function(result, msg) {
                if (result) {
                    return utils.info(req, res, result);
                } else {
                    return utils.message(req, res, msg);
                }
            });
        } else {
            return utils.message(req, res, msg);
        }
    });
};

exports.addfan = function(req, url, callback) {
    fanModel.findOne({url: url}, function(err, doc) {
        if(err) {
            console.log(err);
            return callback(false, "Server error");
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
                    return callback(false, "Server error");
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
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {   /* only authenticated user can use add */
            exports.addfan(req, url, function(r, msg) {
                if (r) {
                    return utils.info(req, res, "ok");
                } else {
                    return utils.message(req, res, msg);
                }
            });
        } else {
            utils.message(req, res, msg);
        }
    });
};

exports.removefan = function(req, url, callback) {
    fanModel.findOne({url: url}, function(err, doc) {
        if(err) {
            console.log(err);
            return callback(false, "Server error");
        } else {
            console.log(doc);
            var login = utils.get_username(req);
            var found = false;
            for (var i=0; doc.fan[i]; i++) {
                if (doc.fan[i].personid == login) {
                    found = true;
                    doc.fan.splice (i, 1);
                    doc.save(function(err) {
                        if(err) {
                            console.log(err);
                            return callback(false, "Server error");
                        } else {
                            return callback(true);
                        }
                    });
                }
            }
            if (!found)
                return callback(false, "You are not the fan");
        }
    });
};

exports.remove = function(req, res) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {
            exports.removefan(req, req.params.urlmd5, function (r, msg) {
                if (r) {
                    return utils.message(req, res, "ok");
                } else {
                    return utils.message(req, res, msg);
                }
            });
        } else {
            return utils.message(req, res, msg);
        }
    });
};

exports.follow = function(req, res) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {
    /*TODO: the element test*/        
            return utils.message(req, res, "ok");
        } else {
            return utils.message(req, res, msg);
        }
    });
};
