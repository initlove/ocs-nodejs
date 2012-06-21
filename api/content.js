var utils = require('./utils');
var vote = require('./vote');
var comment = require('./comment');
var fan = require('./fan');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var downloadDetailSchema = new Schema({
    downloadway: {type: Number, default: 0}
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

var categorySchema = new Schema({
    name: String
});

var contentSchema = new Schema({
    name: {type: String, required: true}
    ,language: String
    ,personid: {type: String, required: true}
    ,depend: String
    ,description: String
    ,summary: String
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

/* download and homepage, my design is, we have only one */
    ,download: {type: [downloadDetailSchema], default:[]}
    ,homepage: {type: [String], default:[]}
    ,category: {type: [String], default:[]}
    ,distribution: {type: [String], default:[]}
    ,license: {type: [String], default:[]}
    ,smallpreview: {type: [String], default:[]}
    ,preview: {type: [String], default:[]}
    ,icon: {type: [String], default:[]}
    ,video: {type: [String], default:[]}

/* inner prop */
/* status: 'in censor', 'online', 'offline' */
    ,status: {type: String, default: "in censor"}
/* uid is the md5 of repo + name, repo end with '/' */
    ,uid: {type: String, unique: true}
});

/*TODO: disconnect it ?  or keep it ? */
mongoose.connect(utils.dbname);
var contentModel = mongoose.model('content', contentSchema);
var downloadModel = mongoose.model('download', downloadDetailSchema);

exports.add_content = function(doc, callback) {
    var content = new contentModel();
    content.name = doc.name;

    for(var key in doc) {
        if (key == 'download') {
            /*TODO: doc to schema? */
            var download = new downloadModel();
            for (var download_key in doc.download[0]) {
                download[download_key] = doc.download[0][download_key];
            }
            content.download.push(download);
        } else {
            content[key] = doc[key];
        }
    }
    var crypto = require('crypto');
    var str = doc.download[0].downloadrepository;
    if (str[str.length-1] != '/')
        str += '/';
    content.uid = crypto.createHash('md5').update(str+doc.download[0].downloadname).digest("hex");
    content.save(function(err){
        if (err) {
            callback(false, err.toString());
        } else {
            callback(true, "ok");
        }
    });
}

exports.add = function(req, res) {
    /* The body.type is defined in ocs, 
     * it will be set to category in the inner implementation
     */
    if (!req.body.name || !req.body.type) {
        utils.message(req, res, "please specify all mandatory fields");
        return;
    }
    var doc = {};
    doc.name = req.body.name;
    doc.personid = utils.get_username(req);
    if (req.body.language)
        doc.language = req.body.language;
    if (req.body.depend)
        doc.depend = req.body.depend;
    if (req.body.description)
        doc.description = req.body.description;
    if (req.body.summary)
        doc.summary = req.body.summary;
    if (req.body.feedbackurl)
        doc.feedbackurl = req.body.feedbackurl;
    if (req.body.version)
        doc.version = req.body.version;
    if (req.body.changelog)
        doc.changelog = req.body.changelog;
    
    doc.category = req.body.type.split(";");
    /*TODO: better way to get serveral downloads? defined in ocs? */
    var download = {};
    doc.download = [];
    if (req.body.downloadway)
        download.downloadway = req.body.downloadway;
    if (req.body.downloadtype)
        download.downloadtype = req.body.downloadtype;
    if (req.body.downloadprice)
        download.downloadprice = req.body.downloadprice;
    if (req.body.downloadlink)
        download.downloadlink = req.body.downloadlink;
    if (req.body.downloadname)
        download.downloadname = req.body.downloadname;
    if (req.body.downloadsize)
        download.downloadsize = req.body.downloadsize;
    if (req.body.downloadfingerprint)
        download.downloadfingerprint = req.body.downloadfingerprint;
    if (req.body.downloadsignature)
        download.downloadsignature = req.body.downloadsignature;
    if (req.body.downloadpackagename)
        download.downloadpackagename = req.body.downloadpackagename;
    if (req.body.downloadrepository)
        download.downloadrepository = req.body.downloadrepository;
    doc.download.push(download);

    if (req.body.homepage)
        doc.homepage = req.body.homepage.split(";");
    if (req.body.distribution)
        doc.distribution = req.body.distribution.split(";");
    if (req.body.license)
        doc.license = req.body.license.split(";");
    if (req.body.smallpreview)
        doc.smallpreview = req.body.smallpreview.split(";");
    if (req.body.preview)
        doc.preview = req.body.preview.split(";");
    if (req.body.icon)
        doc.icon = req.body.icon.split(";");
    if (req.body.video)
        doc.video = req.body.video.split(";");

    exports.add_content(doc, function(r, msg) {
        utils.message(req, res, msg);
    });
}

/*TODO: not ocs compatable */
function publish_content(doc) {
    var content = { id: doc._id};
    var keys = ['name', 'language', 'personid',
                'depend', 'description', 'summary',
                'feedbackurl', 'version', 'changelog',
                'donation', 'donationreason',
                'score', 'comments', 'fans', 'downloads',
                'created', 'changed'];

    for (var i = 0; i < keys.length; i++) {
        if (doc[keys[i]]) {
            content[keys[i]] = doc[keys[i]];
        }
    }

    var list_keys = ['homepage', 'category', 'distribution', 'license',
                'smallpreview', 'preview', 'icon', 'video'];
    for (var i = 0; i < list_keys.length; i++) {
        if (doc[list_keys[i]]) {
            content[list_keys[i]] = doc[list_keys[i]];
        }
    }

    var download_keys = ['downloadtype', 'downloadprice', 'downloadname',
                'downloadsize', 'downloadfingerprint', 'downloadsignature'];
    var download = {};
    var d0 = download[0];
    content.download = [];
    for (var i = 0; i < download_keys.length; i++) {
        if (d0[download_keys[i])
            download[download_keys[i]] = d0[download_keys[i]];
    }
    content.download.push(download);

    return content;
};

function ocs_publish_content(doc) {
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

    /* list the online packages */
    var query = {status: 'online'};
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
            utils.message(req, res, "Server error "+err);
            console.log(err);
        } else {
            if (count > page*pagesize) {
                contentModel.find(query).asc(sort_filed).skip(page*pagesize).limit(pagesize).exec(function(err, docs) {
                    if (err) {
                        utils.message(req, res, "Server error "+err);
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
            utils.message(req, res, "Server error: "+err);
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
            utils.message(req, res, "Server error: "+err);
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
function content_download (id, itemid, callback) {
    contentModel.findOne({_id: id}, function(err, doc) {
        if (err) {
            return callback(false, "Server error: "+err);
        } else if (doc) {
            for(var i = 0; doc.download[i]; i++) {
                if (doc.download[i].downloadway == itemid) {
                    contentModel.update({_id : id}, {$inc: {"downloads" :1}}, function(err) {
                        if (err) {
                            return callback(false, "Server error: "+err);
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
                            return callback(true, result);
                        }
                    });
                }
            }
            return callback(false, "content item not found");
        } else {
            return callback(false, "content not found");
        }
    });
};

exports.download_default = function(req, res) {
    var id = req.params.contentid;
    var itemid = 0;
    content_download(id, itemid, function(r, result) {
        if (r) {
            utils.info(req, res, result);
        } else {
            utils.message(req, res, result);
        }
    });
};

exports.download = function(req, res) {
    var id = req.params.contentid;
    var itemid = req.params.itemid;
    content_download(id, itemid, function(r, result) {
        if (r) {
            utils.info(req, res, result);
        } else {
            utils.message(req, res, result);
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
