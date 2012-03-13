/**
 * Module dependencies.
 */

var $ = require("mongous").Mongous;
var express = require('express')
var mongo = require('mongodb');
var url = require('url');
var utils = require('./utils');

exports.get = function (req, res){
	var part = url.parse(req.url,true);
	var params = part.query;
    var page = 0;
    var pagesize = 10;
    var json;

    if (!check_type (params.type, res))
        return;
    if (!check_content (params.content, res))
        return;

    if (params.page != undefined)
        page = params.page;
    if (params.pagesize != undefined)
        pagesize = params.pagesize;

	$('test.comments').find(pagesize, page * pagesize, {"type": params.type, "content":params.content} ,
		function (r) {
            var data;
            data = JSON.stringify(r.documents);
            //TODO: children load issue..., so we need to rewrite the 'data'
            res.send (utils.message (utils.meta (100), data));
		});
};

function check_type (type, res) {
	var types = [1, 4, 7, 8];
	var valid;
	valid = false;
	if (type != undefined) {
		for (var i = 0; i < 4; i++) {
			if (type == types[i]) {
				valid = true;
				break;
			}
		}
	}
	if (valid == false) {
		res.send (utils.message (utils.meta (104, "wrong type")));
		return false;
	}
    return true;
}

function check_message (message, res) {
    if (message == undefined || message.length == 0) {
		res.send (utils.message (utils.meta (102, "message or subject must not be empty")));
        return false;
    }
    return true;
}

function check_content (content, res) {
	var valid;
	if ((content == undefined) || (content.length == 0)) {
			res.send (utils.message (utils.meta (101, "content must not be empty")));
			return false;
	}
    return true;
}

function add_comment (req, res) {
   var content2 = 0;
   if (req.body["content2"] != undefined)
       content2 = req.body["content2"];

   /* TODO: Check the validation of 'parent'*/
   $('test.comments').find({"content": content},
        function(r) {
            if (r.documents.length == 0) {
                res.send (utils.message (utils.meta (105, "content id invalid")));
            } else {
	            $('test.comments').insert(
			            {"type" :req.body["type"],
			       		"content" :req.body["content"],
    					"content2":content2,
	    				"parent"  :req.body["parent"],
		    			"subject" :req.body["subject"],
			    		"message" :req.body["message"]});
       			res.send (utils.message (utils.meta (100)));
            }
     	});
}

exports.add = function (req, res) {
    if (!check_type (req.body["type"], res))
        return;
    /* Donnot check the subject */
    if (!check_message (req.body["message"], res))
        return;
    if (!check_content (req.body["content"], res))
        return;

    add_comment (req, res);

    return;
};

vote_comment = function (req, res) {
    var date = Date();
    //TODO: get personid
    var personid;
    /* add to votes table */
    $('test.votes').insert(
        {"commentid" :req.body["commentid"],
        "score" :req.body["score"],
        "personid" :personid,
        "date" : date,
        });
       			
    /* update the summary table */
    $('test.summary').find({"commentid": req.body["commentid"]},
        function (r) {
            var score;
            if (r.documents.length == 1) {
                score = r.documents[0].score;
                var count = r.documents[0].count;
                var total = count * score + req.body["score"];
                count ++;
                score = total / count;
                $('test.summary').update({"commentid": req.body["commentid"]},
                    {"commentid": req.body["commentid"],
                    "count":count,
                    "score":score});
            } else {
                score = req.body["score"];
                $('test.summary').insert({
                    "commentid": req.body["commentid"],
                    "count": 1,
                    "score": score});
            }
            /* update the comment table */
            $('test.comments').find({"commentid" : req.body["commentid"]},
                function (r) {
                    $('test.comments').update({"commentid" : req.body["commentid"]},
                        {"commentid": r.documents[0].commentid,
                        "type": r.documents[0].type,
                        "content": r.documents[0].content,
                        /*  "content2", r.documents[0].content2, */
                        "parent": r.documents[0].parent,
                        /*  "subject", r.documents[0].subject,  */
                        "message": r.documents[0].message,
                        "score": score});
                });
        });
    res.send (utils.message (utils.meta (100)));
};

exports.vote = function (req, res) {
    var score = req.body["score"];
    var score_valid = false;
    if (score != undefined) {
        if ((score >= 0) && (score <= 100)) {
            score_valid = true;
        }
    }
    if (score_valid == false) {
        res.send (utils.message (utils.meta (102, "score is invalid")));
        return;
    }

    var commentid = req.body["commentid"];
    if ((commentid == undefined) || (commentid.length == 0)) {
        res.send (utils.message (utils.meta (101, "comment is empty")));
        return;
    }

    $('test.comments').find({"commentid": commentid},
        function(r) {
            if (r.documents.length == 0) {
                res.send (utils.message (utils.meta (101, "comment is empty")));
            } else {
                $('test.votes').find({"commentid": commentid, "personid": personid},
                    function (r) {
                        if (r.documents.length == 0) {
                            vote_comment (req, res);
                        } else {
                            res.send (utils.message (utils.meta (103, "you have already voted on this comment")));
                        }
                    });
            }
     	});
};
