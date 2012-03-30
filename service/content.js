var utils = require('./utils');
var vote = require('./vote');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var downloadDetailSchema = new Schema ({
    _id: {type: ObjectId, select: false}
    ,way: Number
    ,type: String
    ,price: Number
    ,link: String
    ,name: String
    ,size: Number
    ,fingerprint: String
    ,signature: String
    ,packagename: String
    ,repository: String
});

var homepageDetailSchema = new Schema ({
    url: String
    ,type: String
});

var categorySchema = new Schema ({
    id: String
    ,name: String
});

var contentSchema = new Schema({
    _id: {type: ObjectId, select: false}
    ,id: {type: ObjectId, auto: true}
    ,name: {type: String, required: true}
    ,type: {type: String, required: true}
    ,typeid: String
    ,typename: String
    ,language: String
    ,personid: String
    ,depend: String
    ,description: String
    ,summary: String
    ,licensetype: Number
    ,license: String
    ,feedbackurl: String
    ,version: String
    ,changelog: String
    ,donation: String
    ,donationreason: String
    ,osbsproject: String
    ,osbspackage: String
    ,score: {type: Number, default:50}
    ,comments: {type: Number, default: 0}
    ,fans: {type: Number, default: 0}
    ,downloads: {type: Number, default:0}
    ,download: {type: [downloadDetailSchema], default:[]}
    ,homepage: {type: [homepageDetailSchema], default:[]}
    ,smallpreview: {type: [String], default:[]}
    ,preview: {type: [String], default:[]}
    ,icon: {type: [String], default:[]}
    ,video: {type: [String], default:[]}
    ,created: {type: Date, default: Date.now}
    ,changed: Date
});

/*TODO: disconnect it ?  or keep it ? */
mongoose.connect('mongodb://localhost/test');
var ContentModel = mongoose.model('content', contentSchema);
var CategoryModel = mongoose.model('category', categorySchema);

exports.valid = function (id, callback) {
    ContentModel.findOne ({"id":id}, function (err, doc) {
        if (err)
            callback (false);
        else if (doc)
            callback (true);
        else
            callback (false);
    });
};

exports.add = function (req, res) {
    var content = new ContentModel();
    content.name = "second irst app";
    content.type = "no idea";
    content.save(function(err){
    });
}

exports.list = function (req, res) {
    var page = 0;
    var pagesize = 10;

    if (req.query.page)
        page = parseInt (req.query.page);
    if (req.query.pagesize)
        pagesize = parseInt (req.query.pagesize);

    var query = {};
    if (req.query.search) {
        query.$or = new Array();
        query.$or[0] = {"name" : new RegExp (req.query.search, 'i')};
        query.$or[1] = {"summary" : new RegExp (req.query.search, 'i')};
    }
    if (req.query.categories) {
        var category_array = req.query.categories.split ("x");
        query.appcategories = {$in: category_array};
    }

    var sort_filed = 'date';
    if (req.query.sort) {
        if (req.query.sort == "new") {
        } else if (req.query.sort == "alpha") {
            sort_filed = 'id';
        } else if (req.query.sort == "high") {
            sort_filed = 'score';
        } else if (req.query.sort == "down") {
            sort_filed = 'downloads';
        }
    }
    ContentModel.count(query, function (err, count) {
        if (err) {
            res.send (utils.message(utils.meta("Server error")));
            console.log (err);
        } else {
            var meta = utils.meta("ok");
            meta.totalitems = count;
            meta.itemsperpage = pagesize;
            if (count > page*pagesize) {
                ContentModel.find(query).asc(sort_filed).skip(page*pagesize).limit(pagesize).exec (function (err, docs) {
                    if (err) {
                        res.send (utils.message(utils.meta("Server error")));
                        console.log (err);
                    } else 
                        res.send (utils.message(meta, docs));
                });
            } else {
                res.send (utils.message(meta));
            }
        }
    });
};

exports.get = function(req, res) {
    var id = req.params.contentid;
    ContentModel.findOne ({"id": id}, function (err, doc) {
        if (err) {
            res.send (utils.message (utils.meta ("Server error")));
        } else if (doc) {
            res.send (utils.message (utils.meta ("ok"), doc));
        } else {
            res.send (utils.message (utils.meta ("content not found")));
        }
    });
};

exports.categories = function (req, res) {
    CategoryModel.find({}, function (err, docs) {
        if (err)
            res.end (utils.message (utils.meta ("Server error")));
        else
            res.send (utils.message (utils.meta ("ok"), docs));
    });
};

exports.download = function (req, res) {
    var id = req.params.contentid;
    ContentModel.findOne ({"id": id}, function (err, doc) {
        if (err) {
            res.send (utils.message (utils.meta ("Server error")));
        } else if (doc) {
            for (var i = 0; doc.download[i]; i++) {
                if (doc.download[i].way == req.params.itemid) {
                    var data = new Array ();
                    data [0] = results[0].downloadinfos [i];
                    ContentModel.update({"_id" : id}, {$inc: {"downloads" :1}}, function (err) {
                        if (err)
                            res.send (utils.message (utils.meta ("Server error")));
                        else
                            res.send (utils.message (utils.meta ("ok"), data));
                    });
                    return;
                }
            }
            res.send (utils.message (utils.meta ("content item not found")));
        } else {
            res.send (utils.message (utils.meta ("content not found")));
        }
    });
};

exports.vote = function (req, res) {
    var id = req.params.contentid;
    exports.valid (id, function (r) {
        if (r) {
            vote.vote ("content", id, req, function (msg, score) {
                if (msg == "ok") {
                    ContentModel.update ({_id: id}, {score:score}, function (err) {
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
            res.send (utils.message (utils.meta ("content not found")));
        }
    });
};
