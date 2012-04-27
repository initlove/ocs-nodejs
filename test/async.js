
var db = require('mongodb').Db;
var server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;

var len = 10;
var data = new Array ();

function doing_list (data, i) {
    data[i].callback (data[i].data, function (result) {
        if (result == "continue") {
            doing_list (data, i+1);
        }
    });
};

function get_child (item, i, childcount) {
    if (i >= childcount)
        return;
    db.getchild (function (err, results) {
    });
};

function fill_data (data, i, len, callback) {
    if (i < len) {
        var ocs_db = new db('test', new server('127.0.0.1', 27017, {}));
        ocs_db.open(function(err, ocs_db) {
            data[i] = i;
//            fill_data (data, i+1, len, callback);
            return callback (i);
        });
    } else {
        console.log ('we get' + data);
    }
};

for (var i = 0; i < len; i++) {
    fill_data (data, i, len, function (r) {
    console.log (r + '\n');
    });
}
        console.log ('we get' + data);
return;

for (var i = 0; i < len; i++) {
    data[i] = i;
}

console.log (data);
