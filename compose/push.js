var fs = require('fs');
var $ = require("mongous").Mongous;

add_category = function (app) {
    console.log (app.appcategories);
    for (var i = 0; i < app.appcategories.length; i++) {
        var category = app.appcategories[i];
        $('test.category').save ({"name": category});
    }
};

fs.readFile('./appdata.json', function (err, data) {
    if (err)
        console.log ("error in load appdata.json\n");
    if (data) {
        var json = JSON.parse(data.toString('utf8'));
        var len = json.applications.length;
        for (var i = 0; i < len; i++) {
            json.applications [i].data = Date();
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
            $('test.content').save (json.applications [i]);
            add_category (json.applications [i]);
            /*TODO: license or lots of other infos should be added */
        }
    }
});
