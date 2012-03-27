var utils = require('./utils');
var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var account = require('./account');


function get_fan (req, res) {
    var page = 0;
    var pagesize = 10;

    if (req.query.page)
        page = parseInt (req.query.page);
    if (req.query.pagesize)
        pagesize = parseInt (req.query.pagesize);

    var id = req.params.contentid;
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('fan', function (err, fan_coll) {
            fan_coll.find({"contentid": id}).skip(page*pagesize).limit(pagesize).toArray(function(err, results) {
                if (err) {
                    res.send (utils.message(utils.meta("Server error")));
                } else if (results.length == 0) {
                    var meta = {"status" : "ok", "statuscode" : 100, "totalitems": 0, "itemsperpage": pagesize};
                    res.send (utils.message (meta));
                } else {
                    var meta = {"status" : "ok", "statuscode" : 100, "totalitems": results.length, "itemsperpage": pagesize};
                    var msg = {"meta" : meta};
                    var data = new Array();
                    for (var i = 0; (i < results.length) && (i < pagesize); i++) {
                        /*TODO: get the useful attr */
                        data [i] = results [i];
                    }
                    msg.data = data;
                    res.send (msg);
                }
            });
        });
    });
};

exports.get = function (req, res) {
    account.auth (req, res, function (auth_result) {
        if (auth_result == "ok") {   /* only authenticated user can use get */
            content.exist (req.params.contentid, function (exist_result) {
                if (exist_result == "ok") {
                    get_fan (req, res);
                } else
                    res.send (utils.message (utils.meta(exist_result)));
            });
        } else {
            res.send (utils.message (utils.meta("no permission to get fan status")));
        }
    });
};

function is_fan (req, res, callback) {
    var username = utils.get_username (req);
    var id = req.params.contentid;
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('fan', function (err, fan_coll) {
            fan_coll.find({"contentid": id}).toArray(function (err, results) {
                if (results.length > 0) {
                    var fans = results[0].fans;
                    for (var i = 0; fans[i]; i++) {
                        if (fans[i].personid == username) {
                            return callback (1);
                        }
                    }
                }
                return callback (0);
            });
        });
    });
};

exports.isfan = function (req, res) {
    account.auth (req, res, function (auth_result) {
        if (auth_result == "ok") {   /* only authenticated user can use get */
            content.exist (req.params.contentid, function (exist_result) {
                if (exist_result == "ok") {
                    is_fan (req, res, function (fan_result) {
                        var data = new Array ();
                        if (fan_result == 1) {
                            data [0].status = "fan";
                        } else {
                            data [0].status = "notfan";
                        }
                        res.send (utils.meta ("ok"), data);
                    });
                } else
                    res.send (utils.message (utils.meta(exist_result)));
            });
        } else {
            res.send (utils.message (utils.meta("no permission to get fan status")));
        }
    });
};

function add_fan (req, res) {
    var username = utils.get_username (req);
    var id = req.params.contentid;
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('fan', function (err, fan_coll) {
            fan_coll.find({"contentid": id}).toArray(function (err, results) {
                if (results.length > 0) {
                    /*TODO: add the user to the array and update the database*/
                    fan_coll.update({"contentid" : id}, 
                        {$push: {"fans" : {"personid" : username, 'timestamp' : Date ()}}}, true, true);;
                } else {
                    fan_coll.insert({"contentid": id, "fans" : [{'personid' : username, 'timestamp' : Date ()}]});
                }
                res.send (utils.message(utils.meta ("ok")));
                return;
            });
        });
    });
};

exports.add = function (req, res) {
    account.auth (req, res, function (auth_result) {
        if (auth_result == "ok") {   /* only authenticated user can use get */
            content.exist (req.params.contentid, function (exist_result) {
                if (exist_result == "ok") {
                    is_fan (req, res, function (fan_result) {
                        if (fan_result == 1) {
                            res.send (utils.message (utils.meta ("You have already been the fan.")));
                        } else {
                            add_fan (req, res);
                        }
                    });
                } else
                    res.send (utils.message (utils.meta(exist_result)));
            });
        } else {
            res.send (utils.message (utils.meta("no permission to get fan status")));
        }
    });
};

function remove_fan (req, res) {
    var username = utils.get_username (req);
    var id = req.params.contentid;
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('fan', function (err, fan_coll) {
            fan_coll.find({"contentid": id}).toArray(function (err, results) {
                if (results.length > 0) {
                    /*TODO: add the user to the array and update the database*/
                    fan_coll.update({"contentid" : id}, 
                        {$pull: {"fans" : {"personid" : username}}}, true, true);;
                    res.send (utils.message(utils.meta ("ok")));
                } else {
                    console.log ("System error, remove fan but the content is empty");
                    res.send (utils.message (utils.meta ("Server error")));
                }
            });
        });
    });
};

exports.remove = function (req, res) {
    account.auth (req, res, function (auth_result) {
        if (auth_result == "ok") {   /* only authenticated user can use get */
            content.exist (req.params.contentid, function (exist_result) {
                if (exist_result == "ok") {
                    is_fan (req, res, function (fan_result) {
                        if (fan_result == 0) {
                            res.send (utils.message (utils.meta ("You are not fan")));
                        } else {
                            remove_fan (req, res);
                        }
                    });
                } else
                    res.send (utils.message (utils.meta(exist_result)));
            });
        } else {
            res.send (utils.message (utils.meta("no permission to get fan status")));
        }
    });
};
