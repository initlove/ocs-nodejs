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

var data = {};

function compose_child (i, results, child) {
    if (i < results.length) {
        child[i] = results [i];
        get_child (child[i], child[i].id, function (result) {
            if (result == "empty")
                compose_child (i+1, results, child);
        });
    } else {
        console.log ("-- " + data + "\n");
    }
};

function get_child (parent, parentid, callback) {
    var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
    ocs_db.open(function(err, ocs_db) {
        ocs_db.collection('fake', function (err, fake_coll) {
            fake_coll.find({"parent" : parentid}).toArray (function (err, results) {
                if (results.length == 0) {
                    callback ("get the end");
                } else {
                    parent.child = results[0];
                    get_child(results[0], results[0].id, callback);
                }
            });
        });
    });
};

get_child (data, 0, function (result) {
    console.log (data);
    console.log (result);
});

return;
