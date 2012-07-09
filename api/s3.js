var walk = require('walk');
var path = require('path');
var fs = require('fs');
var mime = require('mime');

var default_cache = "/data/s3/";

function get_dir(url, res) {
    var walker  = walk.walk(url, { followLinks: false });
    var files = [];
    var val = {'status' : 'ok'};

    walker.on('file', function(root, stat, next) {
        var item = {};
        item.name = stat.name;
        item.type = 'file';
        files.push(item);
        next();
    });
    walker.on('directory', function(root, stat, next) {
        var item = {};
        item.name = stat.name;
        item.type = 'dir';
        files.push(item);
        next();
    });

    walker.on('end', function() {
        val.files = files;
        res.send(val);
    });
};

function get_file(url, res) {
    fs.readFile(url, function(err, data) {
        if (err) {
            var val = {'status': 'error'};
            res.send(val);
        } else {
            res.writeHead(200, {'Content-Type': mime.lookup(url)});
            res.end(data);
        }
    });
};

exports.get = function(req, res) {
    var url = req.query.url;
    if (!url) {
        res.send("Define the url first");
        return;
    }
    var real_url = path.join(default_cache, url);

    fs.stat(real_url, function (err, stats) {
        if (err) {
            var val = {};
            val.status = "error";
            val.errno = err.errno;
            res.send(val);
        } else {
            if (stats.isDirectory()) {
                get_dir(real_url, res);
            } else if (stats.isFile()) {
                get_file(real_url, res);
            }
        }
    });
};

exports.get_info = function(req, res) {
    var url = req.query.url;
    if (!url) {
        res.send("Define the url first");
        return;
    }
    var real_url = path.join(default_cache, url);

    var val = {};

    fs.stat(real_url, function (err, stats) {
        if (err) {
            val.status = "error";
            val.errno = err.errno;   
        } else {
            val.status = "ok";
            if (stats.isDirectory()) {
                val.type = "dir";
            } else if (stats.isFile()) {
                val.type = "file";
            }
        }
        res.send(val);
    });
};

exports.add_dir = function(req, res) {
    var url = req.query.url;
    var val = {};
    if (!url) {
        val.status = "fail";
        val.message = "define the url first";
        res.send(val);
        return;
    }
    var real_url = path.join(default_cache, url);
    fs.mkdir(real_url, function(err) {
        if (err) {
            val.status = "fail";
            console.log(err);
            val.errno = err.errno;
            res.send(val);
        } else {
            val.status = "ok";
            res.send(val);
        }
    });
};

exports.add = function(req, res) {
    var url = req.query.url;
    if (!url) {
        res.send("Define the url first");
        return;
    }
    //TODO: check, if the url is dir, we add file to that dir
    var real_url = path.join(default_cache, url);
    var val = {};

    req.form.complete(function(err, fields, files){
        if (err) {
            val.status = "error";
            val.error = err;
            res.send(val);
        } else {
// curl -F upload=@./upload_text localhost:3000/s3/file?url=location
            console.log('\nuploaded %s %s'
                ,  files.upload.filename
                ,  files.upload.path);
            console.log(real_url);
            var stat = fs.statSync(real_url);
            if (stat && stat.isDirectory())
                real_url = path.join(real_url, files.upload.filename);
//FIXME: only real_url with exist dir can be used
// cannot rename in the different disk: nodejs bug
            fs.rename(files.upload.path, real_url, function (err) {
                if (err) {
                    val.status = "error";
                    val.errno = err.errno;
                } else {
                    val.status = "ok";
                }
                res.send(val);
            });
        }
      });

    req.form.on('progress', function(bytesReceived, bytesExpected){
        var percent = (bytesReceived / bytesExpected * 100) | 0;
        process.stdout.write('Uploading: %' + percent + '\r');
    });
};
