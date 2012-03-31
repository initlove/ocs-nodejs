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
    ,pkg: String
    ,repo: String
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
    /*ocs way? 
    ,downloadway1: Number
    ,downloadtype1: String
    ,downloadprice1: Number
    ,downloadlink1: String
    ,downloadname1: String
    ,downloadsize1: Number
    ,downloadgpgfingerprint1: String
    ,downloadgpgsignature1: String
    ,downloadpackagename1: String
    ,downloadrepository1: String
    ,downloadway2: Number
    ,downloadtype2: String
    ,downloadprice2: Number
    ,downloadlink2: String
    ,downloadname2: String
    ,downloadsize2: Number
    ,downloadgpgfingerprint2: String
    ,downloadgpgsignature2: String
    ,downloadpackagename2: String
    ,downloadrepository2: String
    ,icon: String
    */
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
var contentModel = mongoose.model('content', contentSchema);
var categoryModel = mongoose.model('category', categorySchema);

exports.valid = function (id, callback) {
    contentModel.findOne ({"id":id}, function (err, doc) {
        if (err)
            callback (false, "Server error");
        else if (doc)
            callback (true);
        else
            callback (false, "content not found");
    });
};

exports.add = function (req, res) {
    if (!req.body.name || !req.body.type) {
        res.send(utils.message(utils.meta("please specify all mandatory fields")));
        return;
    }
    var content = new contentModel();
    content.name = req.body.name;
    content.type = req.body.type;
    if (req.body.language)
        content.language = req.body.language;
    if (req.body.personid)
        content.personid = req.body.personid;
    if (req.body.depend)
        content.depend = req.body.depend;
    if (req.body.description)
        content.description = req.body.description;
    if (req.body.summary)
        content.summary = req.body.summary;
    if (req.body.license)
        content.license = req.body.license;
    if (req.body.licensetype)
        content.licensetype = parseInt (req.body.licensetype);
    if (req.body.feedbackurl)
        content.feedbackurl = req.body.feedbackurl;
    if (req.body.version)
        content.version = req.body.version;
    if (req.body.changelog)
        content.changelog = req.body.changelog;

    content.save(function(err){
        if (err) {
            res.send(utils.message(utils.meta("Server error")));
        } else {
            res.send(utils.message(utils.meta("ok")));
        }
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
    contentModel.count(query, function (err, count) {
        if (err) {
            res.send (utils.message(utils.meta("Server error")));
            console.log (err);
        } else {
            if (count > page*pagesize) {
                contentModel.find(query).asc(sort_filed).skip(page*pagesize).limit(pagesize).exec (function (err, docs) {
                    if (err) {
                        res.send (utils.message(utils.meta("Server error")));
                        console.log (err);
                    } else {
                        var meta = utils.meta("ok");
                        meta.totalitems = count;
                        meta.itemsperpage = pagesize;
                        res.send (utils.message(meta, docs));
                    }
                });
            } else {
                var meta = utils.meta("ok");
                meta.totalitems = count;
                meta.itemsperpage = pagesize;
                res.send (utils.message(meta));
            }
        }
    });
};

exports.get = function(req, res) {
    var id = req.params.contentid;
    contentModel.findOne ({"id": id}, function (err, doc) {
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
    categoryModel.find({}, function (err, docs) {
        if (err)
            res.end (utils.message (utils.meta ("Server error")));
        else
            res.send (utils.message (utils.meta ("ok"), docs));
    });
};

/*TODO: if someone download it already, donnot charge it? 
 * 
 */
exports.download = function (req, res) {
    var id = req.params.contentid;
    contentModel.findOne ({"id": id}, function (err, doc) {
        if (err) {
            res.send (utils.message (utils.meta ("Server error")));
        } else if (doc) {
            for (var i = 0; doc.download[i]; i++) {
                if (doc.download[i].way == req.params.itemid) {
                    var data = new Array ();
                    data [0] = results[0].downloadinfos [i];
                    contentModel.update({"_id" : id}, {$inc: {"downloads" :1}}, function (err) {
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
    exports.valid (id, function (r, msg) {
        if (r) {
            vote.vote ("content", id, req, function (score, msg) {
                if (score > -1) {
                    contentModel.update ({_id: id}, {score:score}, function (err) {
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
            res.send (utils.message (utils.meta (msg)));
        }
    });
};

exports.isfan = function (req, res) {
    var id = req.params.contentid;
    exports.valid (id, function (r, msg) {
        if (r) {
            fan.isfan ("content", id, req, function (r, msg) {
                if (r) {
                    var data = new Array();
                    data [0].status = "fan";
                    res.send(utils.message(utils.meta("ok"), data));
                } else {
                    if (message) {
                        res.send(utils.message(utils.meta(msg)));
                    } else {
                        var data = new Array();
                        data [0].status = "notfan";
                        res.send(utils.message(utils.meta("ok"), data));
                    }
                }
            });
        } else {
            res.send (utils.message (utils.meta (msg)));
        }
    });
};

exports.getfan = function (req, res) {
    var id = req.params.contentid;
    exports.valid (id, function (r, msg) {
        if (r) {
            fan.get ("content", id, req, function (r, msg) {
                if (r) {
                    res.send(r);
                } else {
                    res.send(utils.message(utils.meta(msg)));
                }
            });
        } else {
            res.send (utils.message (utils.meta (msg)));
        }
    });
};

exports.addfan = function (req, res) {
    var id = req.params.contentid;
    exports.valid (id, function (r, msg) {
        if (r) {
            fan.add ("content", id, req, function (r, msg) {
                if (r) {
                    contentModel.update({id:id}, {$inc: {"fans":1}}, function (err) {
                        if (err) {
                            res.send(utils.message(utils.meta("Server error")));
                        } else
                            res.send(utils.message(utils.meta("ok")));
                    });
                } else {
                    res.send(utils.message(utils.meta(msg)));
                }
            });
        } else {
            res.send (utils.message (utils.meta (msg)));
        }
    });
};

exports.removefan = function (req, res) {
    var id = req.params.contentid;
    exports.valid (id, function (r, msg) {
        if (r) {
            fan.remove ("content", id, req, function (r, msg) {
                if (r) {
                    contentModel.update({id:id}, {$inc: {"fans":-1}}, function (err) {
                        if (err) {
                            res.send(utils.message(utils.meta("Server error")));
                        } else
                            res.send(utils.message(utils.meta("ok")));
                    });
                } else {
                    res.send(utils.message(utils.meta(msg)));
                }
            });
        } else {
            res.send (utils.message (utils.meta (msg)));
        }
    });
};
