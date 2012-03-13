var fs = require('fs');
var $ = require("mongous").Mongous;

fs.readFile('./appdata.json', function (err, data) {
    if (err)
        console.log ("error in load appdata.json\n");
    if (data) {
        var json = JSON.parse(data.toString('utf8'));
        var len = json.applications.length;
        for (var i = 0; i < len; i++) {
            /*FIXME: json add a attribute? how to ? */
            var app = json.applications[i];
            var str = JSON.stringify(app);
            var pos = str.lastIndexOf('}');
            var new_str = str.substr(0, pos) + ","
                + "\"repo\":" + "\"" + json["repo"] + "\"}";
            var new_object = JSON.parse (new_str);
            $('test.content').insert (new_object);
        }
});
