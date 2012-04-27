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
    ,count: {type: Number, default:0}
    ,url: {type: String, required: true}
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

exports.realvote = function(req, url, callback) {
    var score = parse_score(req.body.vote);
    if (score < 0) {
        return callback(-1, "vote with score between 0 and 100, or 'good' and 'bad' ");
    }

    voteModel.findOne({url: url}, function(err, doc) {
        if (err) {
            console.log (err);
            return callback(-1, "Server error");
        } else {
            var login = utils.get_username(req);
            if (doc) {
                for(var i = 0; doc.details[i]; i++) {
                    if (doc.details[i].personid == login) {
                        return callback(-1, "You have already voted on this item");
                    }
                }
            } else {
                doc = new voteModel();
                doc.url = url;
            }
            var detail = new voteDetailModel();
            detail.personid = login;
            detail.score = score;
            doc.details.push(detail);
            doc.count += 1;
            if (doc.count == 1)
                doc.score = score;
            else
                doc.score = (doc.score + score)/doc.count;
            doc.save(function(err) {
                if (err) {
                    console.log(err);
                    return callback(-1, "Server error");
                } else
                    return callback (score);
            });
        }
    });
};

exports.vote = function(req, res) {
    exports.realvote(req, req.params.urlmd5, function(score, msg) {
        if (score < 0) {
            utils.message(req, res, msg);
        } else {
            var meta = {"status":"ok", "statuscode":100};
            var result = {"ocs": {"meta": meta, "data": {"score": score}}};
            utils.info(req, res, result);
        }
    });
};
