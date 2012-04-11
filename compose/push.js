var fs = require('fs');
var GridStore = require('mongodb').GridStore;
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var db = require('mongodb').Db;
var server = require('mongodb').Server;
var GridStore = require('mongodb').GridStore;

var downloadDetailSchema = new Schema ({
    _id: {type: ObjectId, select: false}
    ,downloadway: Number
    ,downloadtype: String
    ,downloadprice: Number
    ,downloadlink: String
    ,downloadname: String
    ,downloadsize: Number
    ,downloadfingerprint: String
    ,downloadsignature: String
    ,downloadpkgname: String
    ,downloadrepo: String
});

var homepageDetailSchema = new Schema ({
    homepageurl: String
    ,homepagetype: String
});

var categorySchema = new Schema ({
    id: String
    ,name: {type: String, unique: true, require: true}
});

var contentSchema = new Schema({
    _id: {type: ObjectId, select: false}
    ,id: {type: ObjectId, auto: true}
    ,name: {type: String}
    ,type: {type: String}
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

add_app = function (repo, app) {
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
        content.licensetype = parseInt (app.licensetype);
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
    downloadDetail.downloadpkgname = app.pkgname;
    downloadDetail.downloadrepo = repo;

    content.download.push(downloadDetail);
    var uri = get_icon_uri (app.icon);

    if (uri) {
        var client = new db('test', new server('127.0.0.1', 27017, {}));
        client.open(function (err, connection) {
            var gridStore = new GridStore(client, app.icon, 'w+');
            gridStore.open(function (err, gridStore) {
                fs.readFile(uri, function (err, imageData) {
                    gridStore.write(imageData, function (err, gridStore) {
                        gridStore.close(function (err, result) {
                            var icon_uri = "http://localhost:3000/images/" + result._id.toString();
                            content.icon.push (icon_uri);
                            content.save (function (err) {
                                console.log ("app: " + app.name + " added\n");
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

fs.readFile('./appdata.json', function (err, data) {
    if (err)
        console.log ("error in load appdata.json\n");
    if (data) {
        var json = JSON.parse(data.toString('utf8'));
        var len = json.applications.length;
        for (var i = 0; i < len; i++)
            add_app (json.repo, json.applications [i]);
    }
});

