var j2x = require ('jsontoxml');
var j3x = require ('json2xml');

var meta = {};
meta.status = "ok";
meta.statuscode = 100;
meta.message = null;

    var data = {};

    data.version = '1.4';
    data.website = 'localhost:3000';
    data.host = 'localhost:3000';
    data.contact = 'liangchenye@gmail.com';

    var services = new Array ();
    var i = 0;
    services[i++] = '/config';
    services[i++] = '/person/check';
    services[i++] = '/person/add';
    services[i++] = '/person/remove';
    services[i++] = '/person/data/:personid';
    services[i++] = '/person/self';
    services[i++] = '/person/data';

    services[i++] = '/fan/data/:contentid';
    services[i++] = '/fan/status/:contentid';
    services[i++] = '/fan/add/:contentid';
    services[i++] = '/fan/remove/:contentid';

    services[i++] = '/content/data';
    services[i++] = '/content/categories';
    services[i++] = '/content/data/:contentid';
    services[i++] = '/content/download/:contentid/:itemid';
    services[i++] = '/content/vote/:contentid';

    services[i++] = '/comments/get';
    services[i++] = '/comments/add';
    services[i++] = '/comments/vote/:commentid';

    services[i++] = '/images/upload';
    services[i++] = '/images/:imageid';

    data.services = services;

    var ocs = {"meta": meta, "data": data};

var result = {"ocs": ocs};

   console.log (j2x.obj_to_xml(result));


    console.log (j3x.toXml ("hello", ocs));
