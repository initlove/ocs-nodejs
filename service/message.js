/**
 * Module dependencies.
 */

var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var utils = require('./utils');
var account = require('./account');
var dbname = require('./config').db_name;
var dbaddr = require('./config').db_addr;

exports.folders = function (req, res){
    account.auth (req, res, function (auth_result) {
        console.log (auth_result);
        if (auth_result == "ok") {
            var ocs_db = new db(dbname(), new server(dbaddr(), 27017, {}));
            ocs_db.open(function(err, ocs_db) {
                ocs_db.collection('message', function (err, message_coll) {
                    var username = utils.get_username (req);
                    message_coll.find({"login" : username}).toArray(function(err, results) {
                        if (results.length == 0) {
                            var folders = [{"id": "0", "name": "inbox", "messagecount": 0, "type": "inbox"},
                                           {"id": "1", "name": "send", "messagecount": 0, "type": "send"},
                                           {"id": "2", "name": "trash", "messagecount": 0, "type": "trash"},
                                           {"id": "3", "name": "archive", "messagecount": 0, "type": "archive"}];
                            message_coll.insert ({"login" : username, "folders" : folders});
                            res.send (utils.message (utils.meta ("ok"), folders));
                        } else {
                            res.send (utils.message (utils.meta ("ok"), results[0].folders));
                        }
                    });
                });
            });
        } else {
            res.send (utils.message (utils.meta ("You need to login")));
        }
    });
};

