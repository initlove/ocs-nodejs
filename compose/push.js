/* push
 * just the test.
 * we will push lots of data in seconds,
 * mongodb will close the connection
 * I guess or I can set the mongodb to accept the local push
 * or make a stronger id generation function
 */

var fs = require('fs');
var $ = require("mongous").Mongous;
var utils = require("../service/utils");
var db = require('mongodb').Db;
var server = require('mongodb').Server;
var GridStore = require('mongodb').GridStore;

get_icon_uri = function (icon_name) {
    var uri;
    var suffix = [".png", ".svg", ".xpm", ".icon"];
    var stat = "";
    for (var i = 0; suffix[i]; i++) {
        uri = "./icons/" + icon_name + suffix [i];
        try {
            fs.statSync(uri);
            break;
        } catch (e) {
            uri = "";
        }
    }
    return uri;
};

add_category = function (app) {
    for (var i = 0; i < app.appcategories.length; i++) {
        var category = app.appcategories[i];
        $('test.category').save ({"name": category});
    }
};

add_app = function (json, i, len) {
    var id = parseInt (i) + 10000;
    if (i < len){
            json.applications [i].id = id;
            json.applications [i].date = Date();
            json.applications [i].comments = 0;
            json.applications [i].downloads = 0;
            json.applications [i].fans = 0;
            json.applications [i].score = 50;

            var downloadinfos = new Array ();
            downloadinfos[0] = {};
            downloadinfos[0].way = 0;
            downloadinfos[0].price = 0;
            downloadinfos[0].name = json.applications[i].name;
            downloadinfos[0].repo = json.repo;
            downloadinfos[0].pkgname = json.applications[i].pkgname;
            json.applications [i].downloadinfos = downloadinfos;

            var uri = get_icon_uri (json.applications[i].icon);
            console.log ("save uri " + uri + "  " + i + " " + id);

            if (uri) {
                var client = new db('test', new server('127.0.0.1', 27017, {}));
                client.open(function (err, connection) {
                    var gridStore = new GridStore(client, id.toString(), 'w+');
                    gridStore.open(function (err, gridStore) {
                        fs.readFile(uri, function (err, imageData) {
                            gridStore.write(imageData, function (err, gridStore) {
                                gridStore.close(function (err, result) {
                                    json.applications[i].icon = "http://localhost:3000/images/" + id.toString();
                                    $('test.content').save (json.applications [i]);
                                    add_category (json.applications [i]);
                                    add_app (json, parseInt (i) + 1, len);
                                });
                            });
                        });
                    });
                });
            } else {
                $('test.content').save (json.applications [i]);
                add_category (json.applications [i]);
                add_app (json, parseInt (i) + 1, len);
            }
    } else {
            var connect = new db('test', new server('127.0.0.1', 27017, {}));
            connect.open(function(err, database) {
                database.collection('summary', function (err, collection) {
                    collection.insert ({"collection_name" : "content", "id" : id});
                    collection.insert ({"collection_name" : "image", "id" : id});
                });
            });
    }
};

fs.readFile('./appdata.json', function (err, data) {
    if (err)
        console.log ("error in load appdata.json\n");
    if (data) {
        var json = JSON.parse(data.toString('utf8'));
        var len = json.applications.length;
        add_app (json, 0, len);
    }
});
