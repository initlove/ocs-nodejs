var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;

var tree = [{"id" : 10, "parent" : 0},
            {"id" : 11, "parent" : 0},
            {"id" : 12, "parent" : 0},
            {"id" : 13, "parent" : 10},
            {"id" : 14, "parent" : 10},
            {"id" : 15, "parent" : 11},
            {"id" : 16, "parent" : 13}
            ];

var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
ocs_db.open(function(err, ocs_db) {
    ocs_db.collection('fake', function (err, fake_coll) {
        if (err) {
            console.log ("error in open coll");
            return;
        }
        for (var i = 0; tree [i]; i++)
            fake_coll.insert ({"id" : tree[i].id, "parent" : tree[i].parent});
    });
});

return;
