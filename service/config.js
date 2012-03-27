var utils = require ('./utils');

exports.get = function (req, res) {
    var data = {};

    data.version = '2.0';
    data.website = 'localhost:3000';
    data.host = 'localhost:3000';
    data.contact = 'liangchenye@gmail.com';

    var services = new Array ();
    var i = 0;
    services[i] = '/config';
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

    res.send (utils.message (utils.meta ("ok"), data));
};

exports.db_addr = function () {
    return "127.0.0.1";
};

exports.db_name = function (collection_name) {
    if (!collection_name)
        return "test";

    switch (collection_name) {
        case "admin":
            return "admin";
            break;
        default:
            return "test";
            break;
    }
};
              
