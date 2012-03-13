var fs = require('fs');
var $ = require("mongous").Mongous;

add_content = function (app, repo) {
    /*FIXME: json add a attribute? how to ? */
    var str = JSON.stringify(app);
    var pos = str.lastIndexOf('}');
    var new_str = str.substr(0, pos) + ","
                + "\"repo\":" + "\"" + repo + "\"}";
    var new_object = JSON.parse (new_str);
    /*TODO: check, update */
    $('test.content').save (new_object);
};

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
            add_content (json.applications [i], json["repo"]);
            add_category (json.applications [i]);
            /*TODO: license or lots of other infos should be added */
        }
    }
});
