var person = require('./person');
var utils = require('./utils');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var messageSchema = new Schema({
    _id: {type:ObjectId, select:false}
    ,from: {type: String, required: true}
    ,to: {type: String, required: true}
    ,subject: {type: String, required: true}
    ,body: {type: String, required: true}
    ,date: {type: Date, default: Date.now}
    ,status: {type: String, default: "unread"}
});

mongoose.connect(utils.dbname);
var messageModel = mongoose.model('message', messageSchema);

exports.send = function(req, res){
    if(!req.body.message || !req.body.subject) {
        utils.message(req, res, "subject or message not found");
        return;
    }
    var to = req.body.to;
    if(!to) {
        utils.message(req, res, "You should name who the receiver is");
        return;
    }
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    if(login == to) {
        utils.message(req, res, "You can not send a message to yourself");
        return;
    }

    person.valid(to, function(r, msg) {
        if(r) {
            var message = new messageModel();
            message.from = login;
            message.to = to;
            message.subject = req.body.subject;
            message.body = req.body.message;
            message.save(function(err) {
                if(err)
                    utils.message(req, res, "Server error "+err);
                else
                    utils.message(req, res, "ok");
            });
        } else {
            utils.message(req, res, msg);
        }
    });
}

exports.list = function(req, res){
    var login = utils.get_username(req);
    var password = utils.get_password(req);
    var page = 0;
    var pagesize = 10;
    if(req.query.page)
        page = parseInt(req.query.page);
    if(req.query.pagesize)
        pagesize = parseInt(req.query.pagesize);

    var query = {};
    var i = 0;
    if(req.query.search) {
        query.$or = new Array();
        query.$or[i++] = {"subject" : new RegExp(req.query.search, 'i')};
        query.$or[i++] = {"message" : new RegExp(req.query.search, 'i')};
    }
            
    var userid = '';
    if(req.query.with) {
        userid = req.query.with;
    } else
        userid = login;
    if(!query.$or)
        query.$or = new Array();
    query.$or[i++] = {"from" : userid};
    query.$or[i++] = {"to": userid};

    messageModel.find(query).skip(page*pagesize).limit(pagesize).exec(function(err,docs) {
        if(err) {
            utils.message(req, res, "Server error "+err);
        } else {
            var meta = {"status":"ok", "statuscode": 100};
            var data = new Array();
            var len = docs ? docs.length:0;
            for (var i = 0; i < len; i++) {
                data[i] = {"message": docs[i]};
            }
            var result = {"ocs": {"meta": meta, "data": data}};
            utils.info(req, res, result);
        }
    });
}
