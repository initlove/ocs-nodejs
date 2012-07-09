var walk = require('walk');
var path = require('path');
var fs = require('fs');
var mime = require('mime');
var utils = require('./utils');

var default_cache = "/data/s3/";

function get_dir(req, res, url) {
    console.log('get dir'+ url);
    fs.readdir(url, function(err, files) {
        var val = {};
        if (err) {
            val.status = "fail";
            val.errno = err.errno;
        } else {
            val.status = "ok";
            val.files = files;
        }
        utils.info(req, res, val);
    });
};

function get_file(req, res, url) {
    console.log('get file' + url);

    fs.readFile(url, function(err, data) {
        if (err) {
            var val = {'status': 'error'};
            utils.info(req, res, val);
        } else {
            res.writeHead(200, {'Content-Type': mime.lookup(url)});
            res.end(data);
        }
    });
};

exports.get = function(req, res) {
    var url = req.query.url;
    var val = {};

    if (!url) {
        val.status = "fail";
        val.message = "define the url first";
        utils.info(req, res, val);
        return;
    }
    var real_url = path.join(default_cache, url);

    fs.stat(real_url, function (err, stats) {
        if (err) {
            var val = {};
            val.status = "error";
            val.errno = err.errno;
            utils.info(req, res, val);
        } else {
            if (stats.isDirectory()) {
                get_dir(req, res, real_url);
            } else if (stats.isFile()) {
                get_file(req, res, real_url);
            }
        }
    });
};

exports.get_info = function(req, res) {
    console.log('get info ' + req.query.url);
    var url = req.query.url;
    var val = {};

    if (!url) {
        val.status = "fail";
        val.message = "define the url first";
        utils.info(req, res, val);
        return;
    }
    var real_url = path.join(default_cache, url);

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
        utils.info(req, res, val);
    });
};

exports.add_dir = function(req, res) {
    //trick. curl seems not good with both upload and body info
    var url = '';
    console.log(req);
    if (req.query.url)
        url = req.query.url;
    else
        url = req.body.url;
    console.log ('add dir ' + url);
    var val = {};
    if (!url) {
        val.status = "fail";
        val.message = "define the url first";
        utils.info(req, res, val);
        return;
    }
    var real_url = path.join(default_cache, url);
    fs.mkdir(real_url, function(err) {
        if (err) {
            val.status = "fail";
            console.log(err);
            val.errno = err.errno;
            utils.info(req, res, val);
        } else {
            val.status = "ok";
            utils.info(req, res, val);
        }
    });
};

exports.add = function(req, res) {
    var url = '';
    if (req.query.url)
        url = req.query.url;
    else if (req.body.url)
        url = req.body.url;

    var val = {};
    if (!url) {
        val.status = "error";
        val.message = "Define url first";
        utils.info(req, res, val);
        return;
    }
    //TODO: check, if the url is dir, we add file to that dir
    var real_url = path.join(default_cache, url);

    console.log('\nuploaded %s %s'
                ,  req.files.upload.filename
                ,  req.files.upload.path);
    console.log(real_url);
    fs.stat(real_url, function(err, stat) {
        if (err) {
        } else if (stat.isDirectory()) {
            real_url = path.join(real_url, files.upload.filename);
        }
        //FIXME: only real_url with exist dir can be used
        // cannot rename in the different disk: nodejs bug
        fs.rename(req.files.upload.path, real_url, function (err) {
            if (err) {
                val.status = "error";
                val.errno = err.errno;
            } else {
                val.status = "ok";
            }
            utils.info(req, res, val);
        });
    });
};
