var jsontoxml = require('jsontoxml');
var array =  ["a", "a:b", "a:b:c", "a:b:d", "a:e", "f", "f:g", "f:h"];

var result = new Array();
for (var i = 0; array[i]; i++) {
    result[i] = {"name": array[i], "children": new Array()};
}
var root = {"name": "root", "children": new Array()};
for (var i = 0; result[i]; i++) {
    var v = result[i].name.indexOf(":");
    if (v < 0) {
        root.children.push({"comment": result[i]});
    } else {
        for (var j = i-1; j >= 0; j--) {
            var d = result[i].name.match("^"+ result[j].name);
            if (d != null) {
                result[j].children.push({"comment": result[i]});
                break;
            }
        }
    }
}

var xml = jsontoxml.obj_to_xml ({"ocs": root}, true);
console.log(xml);

var arr = ["a", "b"];
var dl = {"ocs": {"hello": arr}};
var xml1= jsontoxml.obj_to_xml (dl, true);
console.log(xml1);
