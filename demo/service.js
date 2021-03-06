var querystring = require('querystring');

//var HOST = 'api-ocs.rhcloud.com';
var HOST = 'localhost';
var PORT = '3000';

var user1 = "testuser001";
var password1 = "testuserpassword001";
var auth1 = user1+":"+password1;

var user2 = "testuser002";
var password2 = "testuserpassword002";
var auth2 = user2+":"+password2;

var content1 = "4f8be6bf274e3ed42300029d";
var comment1 = "4f9a7668e19bd5531c00001b";

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
        ,data: {login: user1, password: password1, firstname: 'firstn', lastname: 'secondn', email: 'email@user122.com'}
    }
    ,person_add2: {
        option: {path: '/person/add', method: 'POST'}
        ,data: {login: user2, password: password2, firstname: 'firstn2', lastname: 'secondn2', email: 'email@user2222.com'}
    }
    ,person_search: {
        option: {auth: auth1, path: '/person/data?name=test&pagesize=5', method: 'GET'}
    }
    ,person_get: {
        option: {auth: auth1, path: '/person/data/'+user1, method: 'GET'}
    }
    ,person_getself: {
        option: {auth: auth1, path: '/person/self', method: 'GET'}
    }
    ,person_edit: {
        option: {auth: auth1, path: '/person/self', method: 'POST'}
        ,data: {latitude: 1234, longitude: 123, city: 'beijing', country: 'china'}
    }
    ,person_balance: {
        option: {auth: auth1, path: '/person/balance', method: 'GET'}
    }
    /*TODO: person attribute? */

    ,friend_status: {
        option: {auth: auth1, path: '/friend/status/'+user2, method: 'GET'}
    }
    ,friend_get: {
        option: {auth: auth1, path: '/friend/data/'+user1+'?pagesize=5', method: 'GET'}
    }
    ,friend_rece: {
        option: {auth: auth2, path: '/friend/receivedinvitations?pagesize=5', method: 'GET'}
    }
    ,friend_send: {
        option: {auth: auth1, path: '/friend/sentinvitations', method: 'GET'}
    }
    ,friend_invite: {
        option: {auth: auth1, path: '/friend/invite/'+user2, method: 'POST'}
        ,data: {message: 'hello, you'}
    }
    ,friend_approve: {
        option: {auth: auth2, path: '/friend/approve/'+user1, method: 'POST'}
        ,data: {}
    }
    ,friend_decline: {
        option: {auth: auth2, path: '/friend/decline/'+user1, method: 'POST'}
        ,data: {}
    }
    ,friend_cancel: {
        option: {auth: auth1, path: '/friend/cancel/'+user2, method: 'POST'}
        ,data: {}
    }

    ,message_list: {
        option: {auth: auth1, path: '/message?with='+user2, method: 'GET'}
    }
    ,message_send: {
        option: {auth: auth1, path: '/message', method: 'POST'}
        ,data: {message: 'hello user2', subject: 'subject title', to: user2}
    }
    ,fan_get: {
        option: {auth: auth1, path: '/fan/data/'+content1, method: 'GET'}
    }
    ,fan_status: {
        option: {auth: auth1, path: '/fan/status/'+content1, method: 'GET'}
    }
    ,fan_add: {
        option: {auth: auth1, path: '/fan/add/'+content1, method: 'POST'}
    }
    ,fan_remove: {
        option: {auth: auth1, path: '/fan/remove/'+content1, method: 'POST'}
    }
    /*
    ,content_add: {
        option: {auth: auth1, path: '/content/add', method: 'POST'}
        ,data: {}
    }*/
    ,content_list: {
        option: {path: '/content/data/?pagesize=1&search=edit', method: 'GET'}
    }
    ,content_category: {
        option: {path: '/content/categories', method: 'GET'}
    }
    ,content_get: {
        option: {path: '/content/data/'+content1, method: 'GET'}
    }
    ,content_download: {
        option: {path: '/content/download/'+content1+'/0', method: 'GET'}
    }
    ,content_vote: {
        option: {auth: auth1, path: '/content/vote/'+content1, method: 'POST'}
        ,data: {vote: 80}
    }

    ,comment_get: {
        option: {path: '/comments/data/1/'+content1+'/0', method: 'GET'}
    }
    ,comment_add: {
        option: {auth: auth1, path: '/comments/add', method: 'POST'}
        ,data: {content: content1, subject: 'comment subject', message: 'comment message'}
    }
    ,comment_add2: {
        option: {auth: auth1, path: '/comments/add', method: 'POST'}
        ,data: {content: content1, subject: 'comment subject', message: 'comment message', parent: comment1}
    }
    ,comment_vote: {
        option: {auth: auth1, path: '/comments/vote/'+comment1, method: 'POST'}
        ,data: {vote: 70}
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
