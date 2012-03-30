var account = require('./account');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var fanDetailSchema = new Schema({
    personid: String
    ,timestamp: {type: Date, default: Date.now}
});

var fanSchema = new Schema({
    content: String
    ,fan: {type:[fanDetailSchema], default:[]}
});

mongoose.connect('mongodb://localhost/test');
var FanModel = mongoose.model('fan', fanSchema);

exports.get = function(req, res) {
    var login = utils.get_username (req);
    var password = utils.get_password (req);
    account.auth (login, password, function (r, msg) {
        if (r) {
            var page = 0;
            var pagesize = 10;
 
            if (req.query.page)
                page = parseInt (req.query.page);
            if (req.query.pagesize)
                pagesize = parseInt (req.query.pagesize);

            FanModel.count({"content": req.params.contentid}, function (err, count) {
                if (err) {
                    res.send(utils.message(utils.meta ("Server error")));
                    console.log (err);
                } else {
                    var meta = utils.meta("ok");
                    meta.totalitems = count;
                    meta.itemsperpage = pagesize;
                    if (count > page*pagesize) {
                        FanModel.skip(page*pagesize).limit(pagesize).exec (function (err, docs) {
                            if (err) {
                                res.send(utils.message(utils.meta ("Server error")));
                                console.log (err);
                            } else {
                                res.send (utils.message(meta), docs);
                            }
                        });
                    } else {
                        res.send (utils.message(meta));
                    }
                }
            });
        } else {
            res.send (utils.message(utils.meta("no permission")));
        }
    });
};

exports.isfan = function (req, res) {
    var login = utils.get_username (req);
    var password = utils.get_password (req);
    account.auth (login, password, function (r, msg) {
        if (r) {   /* only authenticated user can use get */
            FanModel.findOne({"content":req.parmas.contentid}, function (err, doc) {
                if (err) {
                    res.send(utils.message(utils.meta ("Server error")));
                    console.log (err);
                } else if (doc) {
                } else {
                }
            });
        } else {
            res.send (utils.message(utils.meta("no permission")));
        }
    });
};


