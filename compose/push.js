var fs = require('fs');
var mime = require('mime');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var mongodb = require('mongodb');
var GridStore = require('mongodb').GridStore;

var downloadDetailSchema = new Schema ({
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

var homepageDetailSchema = new Schema ({
    homepageurl: String
    ,homepagetype: String
});

var categorySchema = new Schema ({
    name: {type: String, unique: true, require: true}
});

var contentSchema = new Schema({
    name: {type: String}
    ,type: {type: String}
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
    ,download: {type: [downloadDetailSchema], default:[]}
    ,homepage: {type: [homepageDetailSchema], default:[]}
    ,smallpreview: {type: [String], default:[]}
    ,preview: {type: [String], default:[]}
    ,icon: {type: [String], default:[]}
    ,video: {type: [String], default:[]}
    ,created: {type: Date, default: Date.now}
    ,changed: Date
});

var dbname = "mongodb://admin:XP9jx78hpWkq@127.4.84.129:27017/api";
mongoose.connect(dbname);

var contentModel = mongoose.model('content', contentSchema);
var categoryModel = mongoose.model('category', categorySchema);
var downloadDetailModel = mongoose.model('download', downloadDetailSchema);

get_icon_uri = function (icon_name) {
    if (!icon_name)
        return null;
    var uri;
    var suffix = [".png", ".svg", ".xpm", ".icon"];
    var stat = "";
    for (var i = 0; suffix[i]; i++) {
        uri = "./icons/" + icon_name + suffix [i];
        try {
            fs.statSync(uri);
            break;
        } catch (e) {
            uri = "";
        }
    }
    return uri;
};

add_category = function (app) {
    for (var i = 0; i < app.appcategories.length; i++) {
        category = new categoryModel();
        category.name = app.appcategories[i];
        category.save (function (err) {
        });
    }
 };

add_app = function (req, res, repo, app) {
    var content = new contentModel();
    if (app.name)
        content.name = app.name;
    if (app.type)
        content.type = app.type;
    if (app.sumary)
        content.summary = app.summary;
    if (app.description)
        content.description = app.description;
    if (app.summary)
        content.summary = app.summary;
    if (app.license)
        content.license = app.license;
    if (app.licensetype)
        content.licensetype = app.licensetype;
    if (app.feedbackurl)
        content.feedbackurl = app.feedbackurl;
    if (app.version)
        content.version = app.version;
    if (app.changelog)
        content.changelog = app.changelog;

    var downloadDetail = new downloadDetailModel();
    downloadDetail.downloadway = 0;
    downloadDetail.downloadprice = 0;
    downloadDetail.downloadname = app.name;
    downloadDetail.downloadpackagename = app.pkgname;
    downloadDetail.downloadrepository = repo;

    content.download.push(downloadDetail);
    var uri = get_icon_uri (app.icon);
    if (uri) {
        mongodb.connect(dbname, function(err, connect) {
            if (err)
                return res.send("Server error "+err);
/* In openshift, the content_type setting seems not work ! maybe nodejs version issuse? */
            var gridStore = new GridStore(connect, app.icon, 'w+', {
                                "content_type": mime.lookup(uri), 
                                'metadata': {'contentType': mime.lookup(uri)}
                            });
            gridStore.open(function (err, gridStore) {
                if (err)
                    return res.send("Server error "+err);
                fs.readFile(uri, function (err, imageData) {
                    gridStore.write(imageData, function (err, gridStore) {
                        if (err)
                            return res.send("Server error "+err);
                        gridStore.close(function (err, result) {
                            if (err)
                                return res.send("Server error "+err);
                            var icon_uri = "http://api-ocs.rhcloud.com/images/" + result._id.toString();
                            content.icon.push(icon_uri);
                            content.save (function (err) {
                                if (err)
                                    return res.send("Server error "+err);
                                add_category (app);
                            });
                        });
                    });
                });
            });
        });
    } else {
        content.save (function (err) {
            add_category (app);
        });
    }
};

exports.push = function(req, res) {
    fs.readFile('./appdata.json', function (err, data) {
        if (err) {
            res.send("error in load appdata.json " + err);
        } else {
            if (data) {
                var json = JSON.parse(data.toString('utf8'));
                var len = json.applications.length;
                for (var i = 0; i < len; i++)
                    add_app (req, res, json.repo, json.applications [i]);
            }
        }
    });
};

exports.pull = function(req, res) {
    categoryModel.remove({}, function(err) {
    });
    contentModel.remove({}, function(err) {
    });
    mongodb.connect(dbname, function(err, connect) {
        connect.collection("fs.files", function(err, coll) {
            coll.drop(function(err, reply) {
                if (reply)
                    console.log(reply);
            });
        });
        connect.collection("fs.chunks", function(err, coll) {
            coll.drop(function(err, reply) {
                if (reply)
                    console.log(reply);
            });
        });
    });
};
