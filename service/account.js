var db = require('mongodb').Db;
var server = require('mongodb').Server;
var utils = require('./utils');

/* 0: success,
 * 1: no basic auth info
 * 2: fail to auth
 * 3 and others  not defined yet
 */
exports.auth = function (req, res, callback) {
    var header = req.headers.authorization;
    if (header == undefined) 
        return callback (1);
    var token = header.split(/\s+/).pop() || '';
    var auth = new Buffer(token, 'base64').toString();
    var parts = auth.split(":");
    var username = parts[0];
    var password = parts[1];

    var admindb = new db('admin', new server('127.0.0.1', 27017, {}));
    admindb.open (function (error, client) {
        admindb.authenticate(username, password, function (err, val) {
            if (err)
                return callback (2);
            else
                return callback (0);
        });
    });
};
