var utils = require('./utils');
var ObjectID = require('mongodb').ObjectID;
var GridStore = require('mongodb').GridStore;
var fs = require('fs');
var mongodb = require('mongodb');

var dbname = "mongodb://admin:XP9jx78hpWkq@127.4.84.129:27017/api";

exports.get = function(req, res) {
    var imageid = req.params.imageid;
    if(imageid == null ||(imageid.length != 12 && imageid.length != 24)) {
        utils.message(req, res, "invalid image id");
        return;
    }
    mongodb.connect(dbname, function(err, connect) {
        if (err) {
            console.log(err);
            utils.message(req, res, "Server error "+err);
            return;
        }
        var gridStore = new GridStore(connect, ObjectID(imageid), 'r');
        gridStore.open(function(err, gridStore) {
            if(err) {
                console.log(err);
                utils.message(req, res, "Server error "+err);
                return;
            }
            var type = "";
            /*openshift node version issuse? cannot get the contentType*/
            if (gridStore.metadata)
                type = gridStore.metadata.contentType;
            if (!type)
                type = gridStore.contentType;
            gridStore.read(function(err, data) {
                if(err) {
                    utils.message(req, res, "Cannot find the image");
                } else {
                    /*todo: content type? */
                    res.writeHead(200, {'Content-Type': type});
                    res.end(data);
                }
            });
        });

    });
};

exports.save_image = function(filename, path, callback) {
    /*TODO: in every 'err', I should callback -1 */
    mongodb.connect(dbname, function(err, connect) {
        if(err) {
            callback(null, "Server error "+err);
            return;
        }
        var gridStore = new GridStore(connect, filename, 'w+');
        gridStore.open(function(err, gridStore) {
            if(err) {
                callback(null, "Server error "+err);
                return;
            }
            fs.readFile(path, function(err, imageData) {
                if(err) {
                    callback(null, "Server error "+err);
                    return;
                }
                gridStore.write(imageData, function(err, gridStore) {
                    if(err) {
                        callback(null, "Server error "+err);
                        return;
                    }
                    gridStore.close(function(err, result) {
                        if(err) {
                            callback(null, "Server error "+err);
                            return;
                        } else {
                            callback(result._id.toString());
                        }
                    });
                });
            });
        });
    });
};

exports.upload = function(req, res, next) {
    if(!req.form) {
        utils.message(req, res, "need to post the file...");
        return;
    }
    req.form.complete(function(err, fields, files){
        if(err) {
            utils.message(req, res, "Server error "+err);
        } else {
            if(files.image) {
                console.log('\nuploaded %s to %s', files.image.filename, files.image.path);
                exports.save_image(files.image.filename, files.image.path, function(id, msg) {
                    if(id == null) {
                        utils.message(req, res, msg);
                    } else {
                        var meta = {"status": "ok", "statuscode": 100};
                        var data = new Array();
                        data [0] = {"uri" : "http://localhost:3000/images/" + id};
                        var result = {"ocs":{"meta": meta, "data": data}};
                        utils.info(req, res, result);
                    }
                    fs.unlink(files.image.path);
                });
            } else {
                utils.message(req, res, "please fill with 'image'");
            }
        }
    });

    req.form.on('progress', function(bytesReceived, bytesExpected){
        var percent =(bytesReceived / bytesExpected * 100) | 0;
    });
};
