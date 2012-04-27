var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var GridStore = require('mongodb').GridStore;
var fs = require('fs');

var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));

var imageid;
imageid = "4f700de4f1d06a863b000231";
ocs_db.open(function (err, ocs_db) {
    var gridStore = new GridStore(ocs_db, ObjectID (imageid), 'r');
    gridStore.open(function (err, gridStore) {
        if (err) {
            console.log (err);
            return;
        }
        gridStore.read(function (err, data) {
            if (err)
                console.log ("cannot find the data");
            fs.writeFile ("/tmp/dldldld", data);
            console.log (data);
        });
    });
});

