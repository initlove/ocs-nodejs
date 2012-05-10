var utils = require('./utils');
var vote = require('./vote');
var comment = require('./comment');
var fan = require('./fan');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var downloadDetailSchema = new Schema({
    downloadway: Number
    ,downloadtype: String
    ,downloadprice: Number
    ,downloadlink: String
    ,downloadname: String
    ,downloadsize: Number
    ,downloadfingerprint: String
    ,downloadsignature: String
    ,downloadpackagename: String
    ,downloadrepository: String
});

var homepageDetailSchema = new Schema({
    homepageurl: String
    ,homepagetype: String
});

var categorySchema = new Schema({
    name: String
});

var contentSchema = new Schema({
    name: {type: String, required: true}
    ,type: String
    ,typeid: String
    ,typename: String
    ,language: String
    ,personid: String
    ,depend: String
    ,description: String
    ,summary: String
    ,licensetype: String
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
    ,created: {type: Date, default: Date.now}
    ,changed: Date

    ,download: {type: [downloadDetailSchema], default:[]}
    ,homepage: {type: [homepageDetailSchema], default:[]}
    ,smallpreview: {type: [String], default:[]}
    ,preview: {type: [String], default:[]}
    ,icon: {type: [String], default:[]}
    ,video: {type: [String], default:[]}
});

/*TODO: disconnect it ?  or keep it ? */
mongoose.connect(utils.dbname);
var contentModel = mongoose.model('content', contentSchema);
var categoryModel = mongoose.model('category', categorySchema);

exports.add = function(req, res) {
    if (!req.body.name || !req.body.type) {
        utils.message(req, res, "please specify all mandatory fields");
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
        content.licensetype = req.body.licensetype;
    if (req.body.feedbackurl)
        content.feedbackurl = req.body.feedbackurl;
    if (req.body.version)
        content.version = req.body.version;
    if (req.body.changelog)
        content.changelog = req.body.changelog;

    content.save(function(err){
        if (err) {
            utils.message(req, res, "Server error");
        } else {
            utils.message(req, res, "ok");
        }
    });
}

function publish_content(doc) {
    var content = { id: doc._id,
                    name: doc.name,
                    type: doc.type,
                    typeid: doc.typeid,
                    typename: doc.typename,
                    language: doc.language,
                    personid: doc.personid,
                    depend: doc.depend,
                    description: doc.description,
                    summary: doc.summary,
                    licensetype: doc.licensetype,
                    license: doc.license,
                    feedbackurl: doc.feedbackurl,
                    version: doc.version,
                    changelog: doc.changelog,
                    donation: doc.donation,
                    donationreason: doc.donationreason,
                    osbsproject: doc.osbsproject,
                    osbspackage: doc.osbspackage,
                    score: doc.score,
                    comments: doc.comments,
                    fans: doc.fans,
                    downloads: doc.downloads,
                    created: doc.created,
                    changed: doc.changed};

    for (var i = 0; doc.icon[i]; i++) {
        content["smallpreview"+i] = doc.smallpreview[i];
    }
    for (var i = 0; doc.icon[i]; i++) {
        content["preview"+i] = doc.preview[i];
    }
    for (var i = 0; doc.icon[i]; i++) {
        content["icon"+i] = doc.icon[i];
    }
    for (var i = 0; doc.icon[i]; i++) {
        content["video"+i] = doc.video[i];
    }
    for (var i = 0; doc.download[i]; i++) {
        content["downloadway"+i] = doc.download[i].downloadway;
        content["downloadtype"+i] = doc.download[i].downloadtype;
        content["downloadprice"+i] = doc.download[i].downloadprice;
        content["downloadlink"+i] = doc.download[i].downloadlink;
        content["downloadname"+i] = doc.download[i].downloadname;
        content["downloadsize"+i] = doc.download[i].downloadsize;
        content["downloadfingerprint"+i] = doc.download[i].downloadfingerprint;
        content["downloadsignature"+i] = doc.download[i].downloadsignature;
        content["downloadpackagename"+i] = doc.download[i].downloadpackagename;
        content["downloadrepository"+i] = doc.download[i].downloadrepository;
    }
    for (var i = 0; doc.homepage[i]; i++) {
        content["homepage"+i] = doc.homepage[i].homepageurl;
        content["homepagetype"+i] = doc.homepage[i].homepagetype;
    }

    return content;
};

exports.list = function(req, res) {
    var page = 0;
    var pagesize = 10;

    if (req.query.page)
        page = parseInt(req.query.page);
    if (req.query.pagesize)
        pagesize = parseInt(req.query.pagesize);

    var query = {};
    if (req.query.search) {
        query.$or = new Array();
        query.$or[0] = {"name" : new RegExp(req.query.search, 'i')};
        query.$or[1] = {"summary" : new RegExp(req.query.search, 'i')};
    }
    if (req.query.categories) {
        var category_array = req.query.categories.split("x");
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
    contentModel.count(query, function(err, count) {
        if (err) {
            utils.message(req, res, "Server error");
            console.log(err);
        } else {
            if (count > page*pagesize) {
                contentModel.find(query).asc(sort_filed).skip(page*pagesize).limit(pagesize).exec(function(err, docs) {
                    if (err) {
                        utils.message(req, res, "Server error");
                        console.log(err);
                    } else {
                        var meta = {"status": "ok", "statuscode": 100,
                                    "totalitems": count, "itemsperpage": pagesize};
                        var data = new Array();
                        for (var i = 0; docs[i]; i++) {
                            data[i] = {"content": publish_content(docs[i])};
                        }
                        var result = {"ocs": {"meta": meta, "data": data}};
                        utils.info(req, res, result);
                    }
                });
            } else {
                var meta = {"status": "ok", "statuscode": 100,
                            "totalitems": count, "itemsperpage": pagesize};
                var result = {"ocs": {"meta": meta}};
                utils.info(req, res, result);
            }
        }
    });
};

exports.get = function(req, res) {
    var id = req.params.contentid;
    contentModel.findOne({_id: id}, function(err, doc) {
        if (err) {
            utils.message(req, res, "Server error");
        } else if (doc) {
            var meta = {"status": "ok", "statuscode": 100};
            var data = new Array();
            data[0] = {"content": publish_content(doc)};
            var result = {"ocs": {"meta": meta, "data": data}};
            utils.info(req, res, result);
        } else {
            utils.message(req, res, "content not found");
        }
    });
};

exports.categories = function(req, res) {
    categoryModel.find({}, function(err, docs) {
        if (err) {
            utils.message(req, res, "Server error");
        } else {
            var meta = {"status": "ok", "statuscode": 100};
            var data = new Array();
            for (var i = 0; docs[i]; i++)
                data[i] = {"category": docs[i]};
            var result = {"ocs": {"meta": meta, "data": data}};
            utils.info(req, res, result);
        }
    });
};

/*TODO: if someone download it already, donnot charge it? 
 * add the download -map for all the user?
 */
exports.download = function(req, res) {
    var id = req.params.contentid;
    contentModel.findOne({_id: id}, function(err, doc) {
        if (err) {
            utils.message(req, res, "Server error");
        } else if (doc) {
            for(var i = 0; doc.download[i]; i++) {
                if (doc.download[i].downloadway == req.params.itemid) {
                    contentModel.update({_id : id}, {$inc: {"downloads" :1}}, function(err) {
                        if (err) {
                            utils.message(req, res, "Server error");
                        } else {
                            var meta = {"status": "ok", "statuscode": 100};
                            var data = new Array();
                            data[0] = {"content": {
                                            "downloadway": doc.download[i].downloadway,
                                            "downloadlink": doc.download[i].downloadlink,
                                            "mimetype": "TODO",
                                            "packagename" : doc.download[i].downloadpackagename,
                                            "packagerepository": doc.download[i].downloadrepository,
                                            "gpgfingerprint": doc.download[i].downloadfingerprint,
                                            "gpgsignature": doc.download[i].downloadsignature
                                            }
                                        };
                            var result = {"ocs": {"meta": meta, "data": data}};
                            utils.info(req, res, result);
                        }
                    });
                    return;
                }
            }
            utils.message(req, res, "content item not found");
        } else {
            utils.message(req, res, "content not found");
        }
    });
};

exports.vote = function(req, res) {
    var id = req.params.contentid;
    contentModel.findOne({_id:id}, function(err, doc) {
        if (err) {
            console.log(err);
            return utils.message(req, res, "Server error");
        } else if (doc) {
            var url = "content:"+id;
            vote.realvote(req, url, function(score, msg) {
                if (score > -1) {
                    doc.score = score;
                    doc.save(function(err) {
                        if (err) {
                            console.log(err);
                            return utils.message(req, res, "Server error");
                        } else
                            return utils.message(req, res, "ok");
                    });
                } else {
                    return utils.message(req, res, msg);
                }
            });
        } else {
            return utils.message(req, res, "content not found");
        }
    });
};

exports.isfan = function(req, res) {
    var id = req.params.contentid;
    contentModel.findOne({_id:id}, function(err, doc) {
        if (err) {
            console.log(err);
            return utils.message(req, res, "Server error");
        } else if (doc) {
            var url = "content:"+id;
            fan.fanstatus(req, url, function(result, msg) {
                if (result) {
                    utils.info(req, res, result);
                } else {
                    utils.message(req, res, msg);
                }
            });
        } else {
            utils.message(req, res, "content not found");
        }
    });
};

exports.getfan = function(req, res) {
    var id = req.params.contentid;
    contentModel.findOne({_id:id}, function(err, doc) {
        if (err) {
            console.log(err);
            return utils.message(req, res, "Server error");
        } else if (doc) {
            var url = "content:"+id;
            fan.getfans(req, url, function(result, msg) {
                if (result) {
                    return utils.info(req, res, result);
                } else {
                    return utils.message(req, res, msg);
                }
            });
        } else {
            return utils.message(req, res, "content not found");
        }
    });
};

exports.addfan = function(req, res) {
    var id = req.params.contentid;
    contentModel.findOne({_id:id}, function(err, doc) {
        if (err) {
            console.log(err);
            return utils.message(req, res, "Server error");
        } else if (doc) {
            var url = "content:"+id;
            fan.addfan(req, url, function(r, msg) {
                if (r) {
                    doc.fans+=1;
                    doc.save(function(err) {
                        if (err) {
                            console.log(err);
                            utils.message(req, res, "Server error");
                        } else
                            utils.message(req, res, "ok");
                    });
                } else {
                    utils.message(req, res, msg);
                }
            });
        } else {
            utils.message(req, res, "content not found");
        }
    });
};

exports.removefan = function(req, res) {
    var id = req.params.contentid;
    contentModel.findOne({_id:id}, function(err, doc) {
        if (err) {
            console.log(err);
            return utils.message(req, res, "Server error");
        } else if (doc) {
            var url = "content:"+id;
            fan.removefan(req, url, function(r, msg) {
                if (r) {
                    doc.fans -= 1;
                    doc.save(function(err) {
                        if (err) {
                            console.log(err);
                            utils.message(req, res, "Server error");
                        } else
                            utils.message(req, res, "ok");
                    });
                } else {
                    utils.message(req, res, msg);
                }
            });
        } else {
            utils.message(req, res, "content not found");
        }
    });
};

function check_type(type) {
    if (!type)
        return false;
    if (type == '1' || type == '4' || type == '7' || type == '8')
        return true;
    return false;
};

exports.getcomment = function(req, res) {
    if (!check_type(req.params.type)) {
        utils.message(req, res, "wrong type");
        return;
    }

    var id = req.params.contentid;
    contentModel.findOne({_id:id}, function(err, doc) {
        if (err) {
            console.log(err);
            return utils.message(req, res, "Server error");
        } else if (doc) {
            var url = "content:"+id;
            comment.getcomment(req, url, function(result, msg) {
                if (result)
                    utils.info(req, res, result);
                else
                    utils.message(req, res, msg);
            });
        } else {
            utils.message(req, res, "content not found");
        }
    });
};

exports.addcomment = function(req, res) {
    var id = req.body.content;
    contentModel.findOne({_id:id}, function(err, doc) {
        if (err) {
            console.log(err);
            return utils.message(req, res, "Server error");
        } else if (doc) {
            var url = "";
            if (req.body.parent && (req.body.parent != 0))
                url = req.body.parent;
            else
                url = "content:"+id;
            comment.addcomment(req, url, function(r, msg) {
                if (r) {
                    doc.comments+=1;
                    doc.save(function(err) {
                        if (err) {
                            console.log(err);
                            utils.message(req, res, "Server error");
                        } else {
                            utils.message(req, res, "ok");
                        }
                    });
                } else {
                    utils.message(req, res, msg);
                }
            });
        } else {
            utils.message(req, res, "content not found");
        }
    });
};
