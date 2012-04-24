var querystring = require('querystring');

var HOST = 'localhost';
var PORT = '3000';

var user1 = "ocstestuser1";
var password1 = "ocstestpassword1";

var options = {
    config: {
        option: {path: '/config', method : 'GET'}
    }
    ,person_check: {
        option: {path: '/person/check', method: 'POST'}
        ,data: {login: user1, password: password1}
    }
    ,person_add: {
        option: {path: '/person/add', method: 'POST'}
        ,data: {login: user1, password: password1, firstname: 'firstn', lastname: 'secondn', email: 'email@user1.com'}
    }
    ,person_search: {
        option: {auth: user1 + ":" + password1, path: '/person/data?name=test&pagesize=5', method: 'GET'}
    }
    ,content_list: {
        option: {path: '/content/data/?pagesize=1&search=edit', method: 'GET'}
    }
};

exports.support = function () {
    var result = null;
    for (var key in options) {
        if (result)
            result = result + ', ' + key;
        else
            result = key;
    }
    return  result;
}

exports.get_option  = function (service) {
    if (!options[service])
        return null;
    var option = options[service].option;
    if (!option)
        return null;

    option.host = HOST;
    option.port = PORT;
    var data = options[service].data;
    if (data) {
        option.headers = {
            "Content-Type": 'application/x-www-form-urlencoded'
            ,"Content-Length": querystring.stringify(data).length
        }
    }
    return option;
};

exports.get_data = function (service) {
    if (!options[service])
        return null;
    return querystring.stringify(options[service].data);
};
