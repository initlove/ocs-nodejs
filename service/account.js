var db = require('mongodb').Db;
var server = require('mongodb').Server;
var utils = require('./utils');

/* "ok"
 * "no auth info"
 * "fail to auth"
 */
exports.auth = function (req, res, callback) {
    var header = req.headers.authorization;
    if (!header)
        return callback ("no auth info");

    var token = header.split(/\s+/).pop() || '';
    var auth = new Buffer(token, 'base64').toString();
    var parts = auth.split(":");
    var username = parts[0];
    var password = parts[1];

    var admindb = new db('admin', new server('127.0.0.1', 27017, {}));
    admindb.open (function (error, admindb) {
        admindb.authenticate(username, password, function (err, val) {
            if (err)
                return callback ("fail to auth");
            else
                return callback ("ok");
        });
    });
};

exports.getself = function (req, res) {
    exports.auth (req, res, function (auth_result) {
        if (auth_result == "ok") {
            var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
            ocs_db.open (function (err, ocs_db) {
                ocs_db.collection('person', function (err, person_coll) {
                    person_coll.find({"login" : utils.get_username(req)}).toArray(function(err, results) {
                        var data = new Array ();
                        data [0] = results [0];
                        res.send(utils.message (utils.meta ("ok"), data));
                    });
                });
            });
        } else {
            res.send (utils.message (utils.meta ("no permission to get person info")));
        }
    });
};

exports.check = function (req, res) {
    if (!req.body.login || !req.body.password) {
        res.send (utils.message (utils.meta ("please specify all mandatory fields")));
        return;
    }

    var admindb = new db('admin', new server('127.0.0.1', 27017, {}));
    admindb.open (function (err, admindb) {
        admindb.authenticate(req.body.login, req.body.password, function (err, val) {
            if (err)
                res.send (utils.message (utils.meta ("login not valid")));
            else
                res.send (utils.message (utils.meta ("ok")));
        });
    });
};

function add_account (req, res) {
    var login = req.body.login;
    var password = req.body.password;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;

    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open (function (err, ocs_db) {
        ocs_db.collection('person', function (err, person_coll) {
            person_coll.find({"login" : login}).toArray(function(err, results) {
                if (results.length == 0) {
                    /* password should not be saved */
                    person_coll.insert (
                        {"login" : login,
                        "firstname" : firstname,
                        "lastname": lastname,
                        "email": email}
                    );
                    var admindb = new db('admin', new server('127.0.0.1', 27017, {}));
                    admindb.open (function (err, admindb) {
                        admindb.addUser(login, password, function (err, result) {
                            if (err) {
                                console.log ("System error: add user to admin: "  + login + " ");
                                res.send (utils.message (utils.meta ("Server error")));
                            } else {
                                res.send (utils.message (utils.meta ("ok")));
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
    var login = req.body.login;
    var password = req.body.password;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;

    if (!login||
        !password ||
        !firstname ||
        !lastname ||
        !email) {
        res.send (utils.message (utils.meta ("please specify all mandatory fields ")));
        return;
    }

    var password_filter = /[a-zA-Z0-9]{8,}/;
    if (!password_filter.test(password)) {
        res.send (utils.message (utils.meta ("please specify a valid password")));
        return;
    }

    /*TODO: we did not spec the standard here */
    var login_filter = /[a-zA-Z0-9]{4,}/;
    if (!login_filter.test(login)) {
        res.send (utils.message (utils.meta ("please specify a valid login")));
        return;
    }

    var email_filter = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/;
    if (!email_filter.test(email)) {
        res.send (utils.message (utils.meta ("please specify a valid email")));
        return;
    }

    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('person', function (err, person_coll) {
            person_coll.find({"login" : login}).toArray(function(err, results) {
                if (err) {
                    console.log (err);
                    res.send (utils.message (utils.meta ("Server error")));
                    return;
                }
                if (results.length > 0) {
                    res.send (utils.message (utils.meta ("login already exists")));
                } else {
                    person_coll.find({"email" : email}).toArray(function(err, results) {
                        if (err) {
                            console.log (err);
                            res.send (utils.message (utils.meta ("Server error")));
                            return;
                        }
                        if (results.length > 0) {
                            res.send (utils.message (utils.meta ("email already taken")));
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
    admindb.open (function (error, admindb) {
        admindb.removeUser(req.body.login, function (err, result) {
            if (err) {
                res.send (utils.message (utils.meta ("Server error")));
            } else {
                var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
                ocs_db.open(function(err, ocs_db) {
                    ocs_db.collection('person', function (err, person_coll) {
                        person_coll.find({"login" : req.body.login}).toArray(function(err, results) {
                            if (results.length == 0) {
                                console.log ("System error: remove the unexisted user?");
                                res.send (utils.message (utils.meta ("Server error")));
                            } else {
                                person_coll.remove({"login" : req.body.login});
                                res.send (utils.message (utils.meta ("ok")));
                            }
                        });
                    });
                });
            }
        });
    });

};

exports.remove = function (req, res) {
    var login = req.body.login;
    var password = req.body.password;

    if (!login || !password) {
        res.send (utils.message (utils.meta ("please specify all mandatory fields ")));
        return;
    }

    /*TODO: find the user first? */
    var admindb = new db('admin', new server('127.0.0.1', 27017, {}));
    admindb.open (function (error, admindb) {
        admindb.authenticate(login, password, function (err, val) {
            if (err)
                res.send (utils.message (utils.meta ("not authenticated")));
            else
                remove_account (req, res);
        });
    });
};

function get_account (req, res) {
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('person', function (err, person_coll) {
            person_coll.find({"login" : req.params.personid}).toArray(function(err, results) {
                if (err) {
                    console.log ("System error in get account " + req.params.personid);
                    res.send (utils.message (utils.meta ("Server error")));
                } else if (results.length == 0) {
                    res.send (utils.message (utils.meta ("person not found")));
                } else {
                    /*TODO: is private */
                    var data = new Array();
                    data [0] = results[0];
                    res.send (utils.message (utils.meta ("ok"), data));
                }
            });
        });
    });
};

exports.get = function (req, res) {
    exports.auth (req, res, function (auth_result) {
        if (auth_result == "ok") {
            get_account (req, res);
        } else {
            res.send (utils.message (utils.meta ("no permission to get person info")));
        }
    });
};
