
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');
var mongo = require('mongodb');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

db = new mongo.Db("test", new mongo.Server('localhost', 27017, {}), {});
db.open(function() {
	db.collection("things", function(err, collection) {
		collection.find(function(err, cursor) {
			cursor.toArray(function(err, items) {
				var len = items.length;
				console.log(len);
				for (var i = 0; i < len; i++) {
					console.log(items[i].name);
				}
			});
		});
	});
});
// Routes

app.get('/user/:id', function(req, res){
	res.send('user ' + req.params.id);
});

app.post('/comment/:id', function(req, res){
	res.send('comment dldld');
});

app.get('/', routes.index);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
