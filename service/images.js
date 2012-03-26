var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var GridStore = require('mongodb').GridStore;
var fs = require('fs');
var utils = require('./utils');

exports.get = function (req, res) {
    var imageid = req.params.imageid;
    if (!utils.check_id (imageid)) {
        res.send (utils.message (utils.meta("invalid image id")));
        return;
    }

    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function (err, ocs_db) {
        var gridStore = new GridStore(ocs_db, ObjectID (imageid), 'r');
        gridStore.open(function (err, gridStore) {
            if (err) {
                console.log (err);
                res.send (utils.message (utils.meta("Server error")));
                return;
            }
            gridStore.read(function (err, data) {
                if (err) {
                    res.send (utils.message (utils.meta ("Cannot find the image")));
                } else {
                    /*todo: content type? */
                    res.writeHead(200, {'Content-Type': 'image/gif' });
                    res.end(data, 'binary');
                }
            });
        });

    });
};

exports.save_image = function (filename, path, callback) {
    /*TODO: in every 'err', I should callback -1 */
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function (err, connection) {
    var gridStore = new GridStore(ocs_db, filename, 'w+');
        gridStore.open(function (err, gridStore) {
            fs.readFile(path, function (err, imageData) {
                gridStore.write(imageData, function (err, gridStore) {
                    gridStore.close(function (err, result) {
                        callback (result._id.toString());
                    });
                });
            });
        });
    });
};

exports.upload = function (req, res, next) {
    if (!req.form) {
        res.send (utils.message (utils.meta ("need to post the file...")));
        return;
    }
    req.form.complete(function(err, fields, files){
        if (err) {
            res.send (utils.message (utils.meta ("Server error")));
        } else {
            if (files.image) {
                console.log('\nuploaded %s to %s', files.image.filename, files.image.path);
                exports.save_image (files.image.filename, files.image.path, function (id) {
                    if (id == -1) {
                        res.send (utils.message (utils.meta ("Server error")));
                    } else {
                        var data = new Array();
                        data [0] = {"uri" : "http://localhost:3000/images/" + id};
                        res.send (utils.message (utils.meta ("ok"), data));
                    }
                    fs.unlink (files.image.path);
                });
            } else {
                res.send (utils.message (utils.meta ("please fill with 'image'")));
            }
        }
    });

    req.form.on('progress', function(bytesReceived, bytesExpected){
        var percent = (bytesReceived / bytesExpected * 100) | 0;
    });
};
