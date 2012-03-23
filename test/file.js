var fs = require ('fs');

var a = ["aa", "bb", "cc", "auth.js"];
var d = "";
for (var i = 0; a[i]; i++) {
    try {
        stat = fs.statSync(a[i]);
        d = a[i];
        break;
    } catch (e) {
        console.log ("cannot find");
    }
}

if (d)
    console.log ("we got d");
