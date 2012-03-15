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
            json.applications [i].repo = json.repo;
            $('test.content').save (json.applications [i]);
            add_category (json.applications [i]);
            /*TODO: license or lots of other infos should be added */
        }
    }
});
