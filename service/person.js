var account = require('./account');
var utils = require('./utils');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var attributeSchema = new Schema ({
    app: String
    ,key: String
    ,value: String
    ,lastmodifed: {type: Date, default: Date.now}
});

var personSchema = new Schema ({
    _id: {type: ObjectId, select: false}
    ,personid: {type: String, required: true, unique: true}
    ,firstname: {type: String, required: true}
    ,lastname: {type: String, required: true}
    ,email: {type: String, required: true}
    ,gender: String
    ,birthday: Date
    ,company: String
    ,homepage: String
    ,country: String
    ,city: String
    ,longitude: Number
    ,latitude: Number
    ,currency: String
    ,balance: Number
});

mongoose.connect('mongodb://localhost/test');
var personModel = mongoose.model('person', personSchema);

exports.check = function (req, res) {
    if (!req.body.login || !req.body.password) {
        res.send (utils.message (utils.meta ("please specify all mandatory fields")));
        return;
    }

    account.auth (req.body.login, req.body.password, function (r, msg) {
        if (r)
            res.send(utils.message(utils.meta("ok")));
        else
            res.send(utils.message(utils.meta(msg)));
    });
};

exports.getself = function (req, res) {
    account.auth (req, res, function (r, msg) {
        if (r) {
            var personid = utils.get_username (req);
            personModel.findOne({'personid': personid}, function (err, doc) {
                if (err) {
                    res.send(utils.message(utils.meta("Server error")));
                    console.log (err);
                } else if (doc) {
                    res.send(utils.message(utils.meta("ok"), doc));
                } else {
                    res.send(utils.message(utils.meta("Server error")));
                    console.log ("Cannot find the person : ", + personid);
                }
            });
        } else {
            res.send (utils.message (utils.meta (msg)));
        }
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

    personModel.findOne({"personid":login}, function (err, doc) {
        if (err) {
            res.send (utils.message (utils.meta ("Server error")));
            console.log (err);
        } else if (doc) {
            res.send (utils.message (utils.meta ("login already exists")));
        } else {
            personModel.findOne({"email":email}, function (err, doc) {
                if (err) {
                    res.send (utils.message (utils.meta ("Server error")));
                    console.log (err);
                } else if (doc) {
                    res.send (utils.message (utils.meta ("email already taken")));
                } else {
                    account.add (login, password, function (r, msg) {
                        if (r) {
                            var person = new personModel();
                            person.personid = login;
                            person.firstname = firstname;
                            person.lastname = lastname;
                            person.email = email;
                            person.save (function (err) {
                                if (err) {
                                    res.send(utils.message(utils.meta("Server error")));
                                    console.log (err);
                                } else {
                                    res.send(utils.message(utils.meta("ok")));
                                }
                            });
                        } else {
                            res.send(utils.message(utils.meta(msg)));
                        }
                    });
                }
            });
        }
    });
};

exports.remove = function (req, res) {
    var login = req.body.login;
    var password = req.body.password;

    if (!login || !password) {
        res.send (utils.message (utils.meta ("please specify all mandatory fields ")));
        return;
    }

    account.remove (login, password, function (r, msg) {
        if (r) {
            personModel.remove({"personid" : login}, function (err) {
                if (err) {
                    res.send(utils.message(utils.meta("Server error")));
                    console.log (err);
                } else {
                    res.send(utils.message(utils.meta("ok")));
                }
            });
        } else {
            res.send(utils.message(utils.meta (msg)));
        }
    });
};

exports.get = function (req, res) {
    var login = utils.get_username (req);
    var password = utils.get_password (req);
    account.auth (login, password, function (r, msg) {
        if (r) {
            personModel.findOne({"personid": req.params.personid}, function (err, doc) {
                if (err) {
                    res.send(utils.message(utils.meta("Server error")));
                    console.log (err);
                } else if (doc) {
                    //TODO: is private
                    res.send(utils.message(utils.meta("ok"), data));
                } else {
                    res.send (utils.message (utils.meta ("person not found")));
                }
            });
        } else {
            res.send (utils.message (utils.meta (msg)));
        }
    });
};

function search_account (req, res) {
    var page = 0;
    var pagesize = 10;

    if (req.query.page)
        page = parseInt (req.query.page);
    if (req.query.pagesize)
        pagesize = parseInt (req.query.pagesize);

    /*TODO: search other fields */
    var query = {};
    if (req.query.name) {
        query.$or = new Array();
        query.$or[0] = {"personid" : new RegExp (req.query.name, 'i')};
        query.$or[1] = {"firstname" : new RegExp (req.query.name, 'i')};
        query.$or[2] = {"lastname" : new RegExp (req.query.name, 'i')};
    }

    personModel.count(query, function (err, count) {
        if (err) {
            res.send (utils.message(utils.meta("Server error")));
            console.log (err);
        } else {
            if (count > page*pagesize) {
                personModel.find(query).skip(page*pagesize).limit(pagesize).exec (function (err, docs) {
                    if (err) {
                        res.send (utils.message(utils.meta("Server error")));
                        console.log (err);
                    } else {
                        var meta = utils.meta("ok");
                        meta.totalitems = count;
                        meta.itemsperpage = pagesize;
                        res.send (utils.message(meta, docs));
                    }
                });
            } else {
                var meta = utils.meta("ok");
                meta.totalitems = count;
                meta.itemsperpage = pagesize;
                res.send (utils.message(meta));
            }
        }
    });
};

exports.search = function (req, res) {
    var login = utils.get_username (req);
    var password = utils.get_password (req);
    account.auth (login, password, function (r, msg) {
        if (r) {
            search_account (req, res);
        } else {
            res.send (utils.message (utils.meta (msg)));
        }
    });
};

exports.get_balance = function (req, res) {
    var login = utils.get_username (req);
    var password = utils.get_password (req);
    account.auth (login, password, function (r, msg) {
        if (r) {
            personModel.findOne({"personid":login}, function (err, doc) {
                var data = new Array();
                data[0].currency = doc.currency;
                data[0].balance = doc.balance;
                res.send (utils.message (utils.meta (msg), data));
            });
        } else {
            res.send (utils.message (utils.meta (msg)));
        }
    });
};

