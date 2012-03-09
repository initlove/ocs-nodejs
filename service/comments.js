/**
 * Module dependencies.
 */

var express = require('express')
var mongo = require('mongodb');
var url = require('url');

exports.get = function (req, res){
    db = new mongo.Db("test", new mongo.Server('localhost', 27017, {}), {});

    db.open(function() {
        db.collection("things", function(err, collection) {
   	    var part = url.parse(req.url,true);
	    var params = part.query;
            collection.find({"type":	params.type, 
		             "content": params.content,
		             "content2":params.content2}, function(err, cursor){
		cursor.toArray(function(err, items) {
			var len = items.length;
			var ret;
			if (len==0) {
				ret = "{status:\"no item\", statuscode:100}\n";
				res.send(ret);
			} else {
				//TODO
				ret = "{status:\"ok\", statuscode:100}";
				for (var i=0; i< len; i++) {
					ret = ret + "subject : " + items[i].subject + "\tmessage : " + items[i].message + "\n";
				}
				res.send(ret);
			}
		});
    	    });
        });
    });
};

exports.add = function (req, res){
	db = new mongo.Db("test", new mongo.Server('localhost', 27017, {}), {});

	db.open(function() {
		db.collection("things", function(err, collection) {
			collection.insert({type :req.body["type"],
			       		content :req.body["content"],
					content2:req.body["content2"],
					parent  :req.body["parent"],
					subject :req.body["subject"],
					message    :req.body["message"]});
		});
	});
	var ret = "{status:\"ok\", statuscode:100}";
	res.send(ret);
};
