var db = require('mongodb').Db;
var server = require('mongodb').Server;
var GridStore = require('mongodb').GridStore;
var fs = require('fs');
var utils = require('./utils');

exports.get = function (req, res) {
    var imageid = req.params.imageid;

    var client = new db('test', new server('127.0.0.1', 27017, {}));
    client.open(function (err, dd) {
        var gridStore = new GridStore(client, imageid, 'r');
        gridStore.open(function (err, gridStore) {
            if (err) {
                console.log (err);
                return;
            }
            gridStore.read(function (err, data) {
                /*todo: content type? */
                res.writeHead(200, {'Content-Type': 'image/gif' });
                res.end(data, 'binary');
            });
        });

    });
        

};

/*TODO: the filename is missing? where to save it? */
exports.save_image = function (filename, path, callback) {
    if (!path) {
        callback (-1);
        return;
    }
    utils.generate_id ("image", function (id) {
        if (id == -1) {
            callback (-1);
            return;
        }
        /*TODO: in every 'err', I should callback -1 */
        var client = new db('test', new server('127.0.0.1', 27017, {}));
        client.open(function (err, connection) {
            var gridStore = new GridStore(client, id.toString(), 'w+');
            gridStore.open(function (err, gridStore) {
                fs.readFile(path, function (err, imageData) {
                    gridStore.write(imageData, function (err, gridStore) {
                        gridStore.close(function (err, result) {
                            callback (id);
                        });
                    });
                });
            });
        });
    });
};

exports.upload = function (req, res, next) {
    if (!req.form) {
        res.send (utils.message (utils.meta (101, "need to post the file...")));
        return;
    }
    req.form.complete(function(err, fields, files){
        if (err) {
            res.send (utils.message (utils.meta (110, "System error in upload")));
        } else {
            if (files.image) {
                console.log('\nuploaded %s to %s'
                    ,  files.image.filename
                    , files.image.path);
                exports.save_image (files.image.filename, files.image.path, function (id) {
                    if (id == -1) {
                        res.send (utils.message (utils.meta (110, "System error in upload")));
                    } else {
                        res.send (utils.message (utils.meta (100)));
                    }
                    fs.unlink (files.image.path);
                });
            } else {
                res.send (utils.message (utils.meta (101, "please fill the 'image' ")));
            }
        }
    });

    req.form.on('progress', function(bytesReceived, bytesExpected){
        var percent = (bytesReceived / bytesExpected * 100) | 0;
    });
};
