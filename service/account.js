var db = require('mongodb').Db;
var server = require('mongodb').Server;
var utils = require('./utils');

/* 0: success,
 * 1: no basic auth info
 * 2: fail to auth
 * 3 and others  not defined yet
 */
exports.auth = function (req, res, callback) {
    console.log (req);
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

exports.check = function (req, res) {
    if ((req.body["login"] == undefined) || (req.body["password"] == undefined)) {
        res.send (utils.message (utils.meta (101, "please specify all mandatory fields")));
        return;
    }

    var admindb = new db('admin', new server('127.0.0.1', 27017, {}));
    admindb.open (function (err, client) {
        admindb.authenticate(req.body["login"], req.body["password"], function (err, val) {
            if (err)
                res.send (utils.message (utils.meta (102, "login not valid")));
            else
                res.send (utils.message (utils.meta (100, "successfull / valid account")));
        });
    });
};

function add_account (req, res) {
    var login = req.body["login"];
    var password = req.body["password"];
    var firstname = req.body["firstname"];
    var lastname = req.body["lastname"];
    var email = req.body["email"];

    var client = new db('test', new server('127.0.0.1', 27017, {}));
    client.open (function (err, client) {
        client.collection('person', function (err, collection) {
            collection.find({"login" : login}).toArray(function(err, results) {
                if (results.length == 0) {
                    /* password should not be saved */
                    collection.insert (
                        {"login" : login,
                        "firstname" : firstname,
                        "lastname": lastname,
                        "email": email}
                    );
                    var admindb = new db('admin', new server('127.0.0.1', 27017, {}));
                    admindb.open (function (err, client) {
                        admindb.addUser(login, password, function (err, result) {
                            if (err) {
                                console.log ("System error: add user to admin: "  + login + " ");
                                res.send (utils.message (utils.meta (110, "system error, should fix in the server")));
                            } else {
                                res.send (utils.message (utils.meta (100)));
                            }
                        });
                    });
                } else {
                    console.log ("System error: add the same account to 'person': "  + login + " ");
                }
            });
        });
    });

};

exports.add = function (req, res) {
    var login = req.body["login"];
    var password = req.body["password"];
    var firstname = req.body["firstname"];
    var lastname = req.body["lastname"];
    var email = req.body["email"];

    if ((login == undefined) ||
        (password == undefined) ||
        (firstname  == undefined) ||
        (lastname == undefined) ||
        (email == undefined)) {
        res.send (utils.message (utils.meta (101, "please specify all mandatory fields ")));
        return;
    }

    var password_filter = /[a-zA-Z0-9]{8,}/;
    if (!password_filter.test(password)) {
        res.send (utils.message (utils.meta (102, "please specify a valid password")));
        return;
    }

    /*TODO: we did not spec the standard here */
    var login_filter = /[a-zA-Z0-9]{4,}/;
    if (!login_filter.test(login)) {
        res.send (utils.message (utils.meta (103, "please specify a valid login")));
        return;
    }

    var email_filter = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/;
    if (!email_filter.test(email)) {
        res.send (utils.message (utils.meta (106, "email invalid")));
        return;
    }

    var client = new db('test', new server('127.0.0.1', 27017, {}));
    client.open(function(err, client) {
        client.collection('person', function (err, collection) {
            collection.find({"login" : login}).toArray(function(err, results) {
                if (err) {
                    console.log (err);
                    res.send (utils.message (utils.meta (110, "system error, should fix in the server")));
                    return;
                }
                if (results.length > 0) {
                    res.send (utils.message (utils.meta (104, "login already exists")));
                } else {
                    collection.find({"email" : email}).toArray(function(err, results) {
                        if (err) {
                            console.log (err);
                            res.send (utils.message (utils.meta (110, "system error, should fix in the server")));
                            return;
                        }
                        if (results.length > 0) {
                            res.send (utils.message (utils.meta (105, "email already taken")));
                        } else {
                            add_account (req, res);
                        }
                    });
                }
            });
        });
    });
};

function remove_account (req, res) {
    var admindb = new db('admin', new server('127.0.0.1', 27017, {}));
    admindb.open (function (error, client) {
        admindb.removeUser(req.body["login"], function (err, result) {
            if (err) {
                res.send (utils.message (utils.meta (110, "system error, should fix in the server")));
            } else {
                var client = new db('test', new server('127.0.0.1', 27017, {}));
                client.open(function(err, client) {
                    client.collection('person', function (err, collection) {
                        collection.find({"login" : req.body["login"]}).toArray(function(err, results) {
                            if (results.length == 0) {
                                console.log ("System error: remove the unexisted user?");
                                res.send (utils.message (utils.meta (110, "system error, should fix in the server")));
                            } else {
                                collection.remove({"login" : req.body["login"]});
                                res.send (utils.message (utils.meta (100)));
                            }
                        });
                    });
                });
            }
        });
    });

};

exports.remove = function (req, res) {
    var login = req.body["login"];
    var password = req.body["password"];

    if (login == undefined || password == undefined) {
        res.send (utils.message (utils.meta (101, "please specify all mandatory fields ")));
        return;
    }

    /*TODO: find the user first? */
    var admindb = new db('admin', new server('127.0.0.1', 27017, {}));
    admindb.open (function (error, client) {
        admindb.authenticate(login, password, function (err, val) {
            if (err)
                res.send (utils.message (utils.meta (102, "not authenticated")));
            else
                remove_account (req, res);
        });
    });
};

function get_account (req, res) {
    var client = new db('test', new server('127.0.0.1', 27017, {}));
    client.open(function(err, client) {
        client.collection('person', function (err, collection) {
            collection.find({"login" : req.params.personid}).toArray(function(err, results) {
                if (err) {
                    console.log ("System error in get account " + req.params.personid);
                } else if (results.length == 0) {
                    res.send (utils.message (utils.meta (101, "person not found")));
                } else {
                    /*TODO: is private */
                    var data = new Array();
                    data [0] = results[0];
                    var meta = {"status" : "ok", "statuscode" : 100};
                    var msg = {"meta" : meta};
                    msg.data = data;
                    res.send (msg);
                }
            });
        });
    });
};

exports.get = function (req, res) {
    exports.auth (req, res, function (r) {
        if (r == 0) {
            get_account (req, res);
        } else {
            res.send (utils.message (utils.meta (103, "no permission")));
        }
    });
};
