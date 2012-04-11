var account = require('./account');
var utils = require('./utils');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var voteDetailSchema = new Schema({
     score: {type: Number, min: 0, max: 100}
    ,personid: {type: String, required: true}
    ,date: {type: Date, default: Date.now}
});

var voteSchema = new Schema({
    score: {type: Number, min: 0, max: 100, default:50}
    ,count: {type: Number, default:50}
    ,collection_name: {type: String, required: true}
    ,item_id: {type: String, required: true}
    ,details: {type:[voteDetailSchema], default:[]}
});

mongoose.connect('mongodb://localhost/test');
var voteModel = mongoose.model('vote', voteSchema);
var voteDetailModel = mongoose.model('vote_detail', voteDetailSchema);


function parse_score(score) {
    if (!score)
        return -1;

    if (score == 'good')
        return 100;
    if (score == 'bad')
        return  0;

    var _score = parseInt(score);
    if (_score < 0 || _score > 100)
        return -1;

    return _score;
};

exports.vote = function(collection_name, item_id, req, callback) {
    var score = parse_score(req.body.vote);
    if (score < 0) {
        callback(-1, "vote with score between 0 and 100, or 'good' and 'bad' ");
        return;
    }

    var login = utils.get_username (req);
    var password = utils.get_password (req);
    account.auth(login, password, function(r, msg) {
        if (r) {
            voteModel.findOne({"collection_name": collection_name,"item_id": item_id},
                function(err, doc) {
                    if (err) {
                        console.log (err);
                        callback(-1, "Server error");
                    } else if (doc) {
                        for(var i = 0; doc.details[i]; i++)
                            if (doc.details[i].personid == login) {
                                callback(-1, "You have already voted on this item");
                                return;
                            }
                        var detail = new voteDetailModel();
                        detail.personid = login;
                        detail.score = score;
                        doc.details[doc.details.length] = detail;
                        var newCount = doc.count + 1;
                        var newScore =(score + doc.score)/newCount;
                        voteModel.update({_id:doc._id}, 
                            {count: newCount, score: newScore, details:doc.details}, 
                            function(err) {
                                if (err) {
                                    callback (-1, "Server error");
                                    console.log ("Error in update vote");
                                } else
                                    callback (newScore);
                            });
                    } else {
                        var doc = new voteModel();
                        doc.collection_name = collection_name;
                        doc.item_id = item_id;
                        doc.score = score;
                        doc.count = 1;
                        var detail = new voteDetailModel();
                        detail.personid = login;
                        detail.score = score;
                        doc.details[doc.details.length] = detail;
                        doc.save(function(err) {
                            if (err) {
                                callback(-1, "Server error");
                            } else
                                callback (score);
                        });
                    }
                });
        } else {
            callback(-1, msg);
        }
    });
};
