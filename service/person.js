var account = require('./account');
var utils = require('./utils');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var attributeSchema = new Schema({
    app: String
    ,key: String
    ,value: String
    ,lastmodifed: {type: Date, default: Date.now}
});

var personSchema = new Schema({
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

exports.valid = function(personid, callback) {
    personModel.findOne({'personid': personid}, function(err, doc) {
        if (err) {
            return callback(false, "Server error");
        } else if (doc) {
            return callback(true);
        } else {
            return callback(false, "Cannot find the person");
        }
    });
};

exports.check = function(req, res) {
    if(!req.body.login || !req.body.password) {
        utils.message(req, res, "please specify all mandatory fields");
        return;
    }

    account.auth(req.body.login, req.body.password, function(r, msg) {
        if(r)
            utils.message(req, res, "ok");
        else
            utils.message(req, res, msg);
    });
};

exports.getself = function(req, res) {
    account.auth(req, res, function(r, msg) {
        if(r) {
            var personid = utils.get_username(req);
            personModel.findOne({'personid': personid}, function(err, doc) {
                if(err) {
                    utils.message(req, res, "Server error");
                    console.log(err);
                } else if(doc) {
                    var meta = {"status":"ok", "statuscode":100};
                    var result = {"ocs": {"meta": meta, "data": doc}};
                    utils.info(req, res, result);
                } else {
                    utils.message(req, res, "Server error");
                    console.log("Cannot find the person : ", + personid);
                }
            });
        } else {
            utils.message (req, res, msg);
        }
    });
};

exports.add = function(req, res) {
    var login = req.body.login;
    var password = req.body.password;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;

    if(!login||
        !password ||
        !firstname ||
        !lastname ||
        !email) {
        utils.message(req, res, "please specify all mandatory fields ");
        return;
    }

    var password_filter = /[a-zA-Z0-9]{8,}/;
    if(!password_filter.test(password)) {
        utils.message(req, res, "please specify a valid password");
        return;
    }

    /*TODO: we did not spec the standard here */
    var login_filter = /[a-zA-Z0-9]{4,}/;
    if(!login_filter.test(login)) {
        utils.message(req, res, "please specify a valid login");
        return;
    }

    var email_filter = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/;
    if(!email_filter.test(email)) {
        utils.message(req, res, "please specify a valid email");
        return;
    }

    personModel.findOne({"personid":login}, function(err, doc) {
        if(err) {
            utils.message(req, res, "Server error");
            console.log(err);
        } else if(doc) {
            utils.message(req, res, "login already exists");
        } else {
            personModel.findOne({"email":email}, function(err, doc) {
                if(err) {
                    utils.message(req, res, "Server error");
                    console.log(err);
                } else if(doc) {
                    utils.message(req, res, "email already taken");
                } else {
                    account.add(login, password, function(r, msg) {
                        if(r) {
                            var person = new personModel();
                            person.personid = login;
                            person.firstname = firstname;
                            person.lastname = lastname;
                            person.email = email;
                            person.save(function(err) {
                                if(err) {
                                    utils.message(req, res, "Server error");
                                    console.log(err);
                                } else {
                                    utils.message(req, res, "ok");
                                }
                            });
                        } else {
                            utils.message(req, res, msg);
                        }
                    });
                }
            });
        }
    });
};

exports.remove = function(req, res) {
    var login = req.body.login;
    var password = req.body.password;

    if(!login || !password) {
        utils.message(req, res, "please specify all mandatory fields ");
        return;
    }

    account.remove(login, password, function(r, msg) {
        if(r) {
            personModel.remove({"personid" : login}, function(err) {
                if(err) {
                    utils.message(req, res, "Server error");
                    console.log(err);
                } else {
                    utils.message(req, res, "ok");
                }
            });
        } else {
            utils.message(req, res, msg);
        }
    });
};

exports.get = function(req, res) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {
            personModel.findOne({"personid": req.params.personid}, function(err, doc) {
                if(err) {
                    utils.message(req, res, "Server error");
                    console.log(err);
                } else if(doc) {
                    //TODO: is private
                    var meta = {"status":"ok", "statuscode":100};
                    var result = {"ocs": {"meta": meta, "data": data}};
                    utils.info(req, res, result);
                } else {
                    utils.message(req, res, "person not found");
                }
            });
        } else {
            utils.message(req, res, msg);
        }
    });
};

function search_account(req, res) {
    var page = 0;
    var pagesize = 10;

    if(req.query.page)
        page = parseInt(req.query.page);
    if(req.query.pagesize)
        pagesize = parseInt(req.query.pagesize);

    /*TODO: search other fields */
    var query = {};
    if(req.query.name) {
        query.$or = new Array();
        query.$or[0] = {"personid" : new RegExp(req.query.name, 'i')};
        query.$or[1] = {"firstname" : new RegExp(req.query.name, 'i')};
        query.$or[2] = {"lastname" : new RegExp(req.query.name, 'i')};
    }

    personModel.count(query, function(err, count) {
        if(err) {
            utils.message(req, res, "Server error");
            console.log(err);
        } else {
            if(count > page*pagesize) {
                personModel.find(query).skip(page*pagesize).limit(pagesize).exec(function(err, docs) {
                    if(err) {
                        utils.message(req, res, "Server error");
                        console.log(err);
                    } else {
                        var meta = {"status":"ok", "statuscode":100,
                                    "totalitems": count, "itemsperpage": pagesize};
                        var result = {"ocs": {"meta": meta, "data": docs}};
                        utils.info(req, res, result);
                    }
                });
            } else {
                var meta = {"status":"ok", "statuscode":100,
                            "totalitems": count, "itemsperpage": pagesize};
                var result = {"ocs": {"meta": meta}};
                utils.info(req, res, result);
            }
        }
    });
};

exports.search = function(req, res) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {
            search_account(req, res);
        } else {
            utils.message(req, res, msg);
        }
    });
};

exports.get_balance = function(req, res) {
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    account.auth(login, password, function(r, msg) {
        if(r) {
            personModel.findOne({"personid":login}, function(err, doc) {
                var data = new Array();
                data[0].currency = doc.currency;
                data[0].balance = doc.balance;
                var meta = {"status": "ok", "statuscode": 100};
                var result = {"ocs": {"meta": meta, "data": data}};
                utils.info(req, res, result);
            });
        } else {
            utils.message(req, res, msg);
        }
    });
};

