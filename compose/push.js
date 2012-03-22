var fs = require('fs');
var $ = require("mongous").Mongous;
var utils = require("../service/utils.js");

add_category = function (app) {
    for (var i = 0; i < app.appcategories.length; i++) {
        var category = app.appcategories[i];
        $('test.category').save ({"name": category});
    }
};

add_app = function (json, i, len) {
    utils.generate_id ('content', function (id) {
        if (id == -1) {
            console.log ("System error in generate content id");
        } else if (i < len){
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
            console.log ("we get id " + id +" \n");
            $('test.content').save (json.applications [i]);
            add_category (json.applications [i]);

            add_app (json, parseInt (i) + 1, len);
        }
    });
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
