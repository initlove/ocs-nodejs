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

	$('test.things').find(pagesize, page * pagesize, {"type": params.type, "content":params.content} ,
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
   $('test.things').find({"content": content},
        function(r) {
            if (r.documents.length == 0) {
                res.send (utils.message (utils.meta (105, "content id invalid")));
            } else {
	            $('test.things').insert(
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

exports.add = function (req, res){
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
