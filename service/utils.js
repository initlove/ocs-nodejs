var db = require('mongodb').Db;
var server = require('mongodb').Server;

exports.meta = function (status_code, status_message) {
    var meta = {};
	if (status_code == 100)
        meta.status = "ok";
    else
        meta.status = "fail";
    meta.statuscode = status_code;
    if (status_message != undefined) {
        meta.message = status_message;
    }
	return meta;
}

exports.message = function (meta, data) {
    var msg = {"meta" : meta};
    if (data)
        msg.data = data;

    return msg;
}

exports.get_username = function (req) {
    var header = req.headers.authorization || '';
    var token = header.split(/\s+/).pop() || '';
    var auth = new Buffer(token, 'base64').toString();
    var parts = auth.split(":");
     
    return parts[0];  
}

exports.generate_id = function (collection_name, callback) {
    var client = new db('test', new server('127.0.0.1', 27017, {}));
    client.open(function(err, client) {
        client.collection('summary', function (err, collection) {
            collection.find ({"collection_name" : collection_name}).toArray (function (err, r) {
                if (err) {
                    return callback (-1);
                } else if (r.length == 0) {
                    var begin = 10000;
                    collection.insert ({"collection_name" : collection_name, "id" : begin});
                    return callback (begin);
                } else {
                    collection.update ({"collection_name" : collection_name}, {$inc: {"id":1}}, true, true);
                    return callback (parseInt(r[0].id) + 1);
                }
            });
        });
    });
}
