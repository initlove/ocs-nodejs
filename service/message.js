var account = require('./account');
var utils = require('./utils');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var messageSchema = new Schema({
    from: {type: String, required: true}
    ,to: {type: String, required: true}
    ,subject: {type: String, required: true}
    ,message: {type: String, required: true}
    ,date: {type: Date, default: Date.now}
    ,status: {type: String, default: "unread"}
});

mongoose.connect('mongodb://localhost/test');
var messageModel = mongoose.model('message', messageSchema);



exports.send = function (req, res){
    if (!req.body.message || !req.body.subject) {
        res.send (utils.message (utils.meta ("subject or message not found")));
        return;
    }
    var to = req.body.to;
    if (!to) {
        res.send (utils.message (utils.meta ("You should name who the receiver is")));
        return;
    }
    var login = utils.get_username (req);
    var password = utils.get_password (req);
    if (login == to) {
        res.send(utils.message(utils.meta ("You can not send a message to yourself")));
        return;
    }

    account.auth (login, password, function (r, msg) {
        if (r) {
            account.valid (to, function (r, msg) {
                if (r) {
                    var message = new messageModel();
                    message.from = login;
                    message.to = to;
                    message.subject = req.body.subject;
                    message.message = req.body.message;
                    message.save(function(err) {
                        if (err)
                            res.send(utils.message(utils.meta("Server error")));
                        else
                            res.send(utils.message(utils.meta("ok")));
                    });
                } else {
                    res.send(utils.message(utils.meta(msg)));
                }
            });
        } else {
            res.send(utils.message(utils.meta(msg)));
        }
    });
}

exports.list = function (req, res){
    var login = utils.get_username (req);
    var password = utils.get_password (req);
    account.auth (login, password, function (r, msg) {
        if (r) {
            var page = 0;
            var pagesize = 10;
            if (req.query.page)
                page = parseInt (req.query.page);
            if (req.query.pagesize)
                pagesize = parseInt (req.query.pagesize);

            var query = {};
            var i = 0;
            if (req.query.search) {
                query.$or = new Array();
                query.$or[i++] = {"subject" : new RegExp (req.query.search, 'i')};
                query.$or[i++] = {"message" : new RegExp (req.query.search, 'i')};
            }
            
            var userid = '';
            if (req.query.with) {
                userid = req.query.with;
            } else
                userid = login;
            if (!query.$or)
                query.$or = new Array();
            query.$or[i++] = {"from" : userid};
            query.$or[i++] = {"to": userid};

            messageModel.find(query).skip(page*pagesize).limit(pagesize).exec(function(err,docs) {
                if (err) {
                    res.send(utils.message(utils.meta("Server error")));
                } else {
                    res.send(utils.message(utils.meta("ok"), docs));
                }
            });
        } else {
            res.send(utils.message(utils.meta(msg)));
        }
    });
}
