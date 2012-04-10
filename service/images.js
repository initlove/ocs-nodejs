var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var GridStore = require('mongodb').GridStore;
var fs = require('fs');
var dbname = require('./config').db_name;
var dbaddr = require('./config').db_addr;

exports.get = function(req, res) {
    var imageid = req.params.imageid;
    if(imageid == null ||(image.length != 12 && image.length != 24)) {
        utils.message(req, res, "invalid image id");
        return;
    }

    var ocs_db = new db(dbname(), new server(dbaddr(), 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        var gridStore = new GridStore(ocs_db, ObjectID(imageid), 'r');
        gridStore.open(function(err, gridStore) {
            if(err) {
                console.log(err);
                utils.message(req, res, "Server error");
                return;
            }
            gridStore.read(function(err, data) {
                if(err) {
                    utils.message(req, res, "Cannot find the image");
                } else {
                    /*todo: content type? */
                    res.writeHead(200, {'Content-Type': 'image/gif' });
                    res.end(data, 'binary');
                }
            });
        });

    });
};

exports.save_image = function(filename, path, callback) {
    /*TODO: in every 'err', I should callback -1 */
    var ocs_db = new db(dbname(), new server(dbaddr(), 27017, {}));
    ocs_db.open(function(err, connection) {
        if(err) {
            callback(null, "Server error");
            return;
        }
         
        var gridStore = new GridStore(ocs_db, filename, 'w+');
        gridStore.open(function(err, gridStore) {
            if(err) {
                callback(null, "Server error");
                return;
            }
            fs.readFile(path, function(err, imageData) {
                if(err) {
                    callback(null, "Server error");
                    return;
                }
                gridStore.write(imageData, function(err, gridStore) {
                    if(err) {
                        callback(null, "Server error");
                        return;
                    }
                    gridStore.close(function(err, result) {
                        if(err) {
                            callback(null, "Server error");
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
            utils.message(req, res, "Server error");
        } else {
            if(files.image) {
                console.log('\nuploaded %s to %s', files.image.filename, files.image.path);
                exports.save_image(files.image.filename, files.image.path, function(id) {
                    if(id == -1) {
                        utils.message(req, res, "Server error");
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
