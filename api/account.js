var db = require('mongodb').Db;
var server = require('mongodb').Server;
var utils = require('./utils');

exports.authenticate = function (req, res, callback) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    var admindb = new db('admin', new server("127.0.0.1", 27017, {}));
    admindb.open(function(error, admindb) {
        admindb.authenticate(login, password, function(err, val) {
            if(err)
                return callback(req, res, "fail to auth");
            else
                return callback(req, res);
        });
    });
};

exports.auth = function(login, password, callback) {
    var admindb = new db('admin', new server("127.0.0.1", 27017, {}));
    admindb.open(function(error, admindb) {
        admindb.authenticate(login, password, function(err, val) {
            if(err)
                return callback(false, "fail to auth");
            else
                return callback(true);
        });
    });
};

exports.add = function(login, password, callback) {
    var admindb = new db('admin', new server("127.0.0.1", 27017, {}));
    admindb.open(function(err, admindb) {
        admindb.addUser(login, password, function(err, result) {
            if(err) {
                console.log("System error: add user to admin: "  + login + " ");
                callback(false, "Server error");
            } else {
                callback(true);
            }
        });
    });
}

exports.remove = function(login, password, callback) {
    exports.auth(login, password, function(r, msg) {
        if(r) {
            var admindb = new db('admin', new server("127.0.0.1", 27017, {}));
            admindb.open(function(error, admindb) {
                admindb.removeUser(login, function(err, result) {
                    if(err) {
                        callback(false, "Server error");
                    } else {
                        callback(true);
                    }
                });
            });
        } else {
            callback(false, msg);
        }
    });
}
