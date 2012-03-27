var utils = require('./utils');
var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;

var username = "fake1";
var id = "124";

var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
ocs_db.open(function(err, ocs_db) {
    ocs_db.collection('fake', function (err, fake_coll) {
        if (err) {
            console.log ("error in open coll");
            return;
        }
        fak_coll.insert ({"contentid" : id, "fakes" : ["personid":"begin"]});
        fake_coll.update({"contentid" : id},
            {$push: {"fakes" : {"personid" : username, 'timestamp' : Date ()}}}, true, true);

        fake_coll.update({"contentid" : id},
            {$pull: {"fakes" : {"personid" : username}}}, true, true);
    });
});

return;
