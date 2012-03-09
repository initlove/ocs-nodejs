
/**
 * Module dependencies.
 */

var comments = require('./service/comments');
var express = require('express')
var mongo = require('mongodb');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

/*
db = new mongo.Db("test", new mongo.Server('localhost', 27017, {}), {});
db.open(function() {
	db.collection("things", function(err, collection) {
		collection.find(function(err, cursor) {
			cursor.toArray(function(err, items) {
				var len = items.length;
				console.log(len);
				for (var i = 0; i < len; i++) {
					console.log("type "+ items[i].type);
					console.log("parent " + items[i].parent);
					console.log("content "+ items[i].content);
					console.log("content2 "+ items[i].content2);
					console.log("subject "+ items[i].subject);
					console.log("message "+ items[i].message);
				}
			});
		});
	});
});
*/

app.get('/user/:id', function(req, res){
	res.send('user ' + req.params.id);
});

app.get('/comments/get', comments.get);
app.post('/comments/add', comments.add);
app.post('/comments/vote', comments.vote);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
