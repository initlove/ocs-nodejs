var db = require('mongodb').Db;
var server = require('mongodb').Server;
var utils = require('./utils');

exports.valid = function (login, callback) {
    callback (true);
};

exports.auth = function (req, callback) {
    var header = req.headers.authorization;
    if (!header)
        return callback (false, "no auth info");

    var token = header.split(/\s+/).pop() || '';
    var auth = new Buffer(token, 'base64').toString();
    var parts = auth.split(":");
    var userid = parts[0];
    var password = parts[1];

    var admindb = new db('admin', new server("127.0.0.1", 27017, {}));
    admindb.open (function (error, admindb) {
        admindb.authenticate(userid, password, function (err, val) {
            if (err)
                return callback (false, "fail to auth");
            else
                return callback (true);
        });
    });
};

exports.add = function (login, password, callback) {
    var admindb = new db('admin', new server("127.0.0.1", 27017, {}));
    admindb.open (function (err, admindb) {
        admindb.addUser(login, password, function (err, result) {
            if (err) {
                console.log ("System error: add user to admin: "  + login + " ");
                callback (false, "Server error");
            } else {
                callback (true);
            }
        });
    });
}

exports.remove = function (login, password, callback) {
    exports.auth (login, password, function (r, msg) {
        if (r) {
            var admindb = new db('admin', new server("127.0.0.1", 27017, {}));
            admindb.open (function (error, admindb) {
                admindb.removeUser(login, function (err, result) {
                    if (err) {
                        callback (false, "Server error");
                    } else {
                        callback (true);
                    }
                });
            });
        } else {
            callback (false, msg);
        }
    });
}
