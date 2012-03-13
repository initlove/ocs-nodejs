var $ = require('mongous').Mongous;
var db = require('mongodb').Db;
var server = require('mongodb').Server;


var client = new db('test', new server('127.0.0.1', 27017, {}));

var list_all = function (err, collection) {
    collection.find().toArray(function(err, results) {
        console.log (results);
    });
};

client.open(function(err, Client) {
    client.collection('category', list_all);
    client.collection('content', list_all);
});


return;

/*TODO: donnot know why, the mongous always fail to connect .. */
$('test.category').find (
        function (r) {
            console.log (r.documents);
        }
        );

$('test.content').find(
        function (r) {
            if (r.documents.length > 0)
               console.log (r.documents[0]);
}); 

