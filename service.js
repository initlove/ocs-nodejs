var querystring = require('querystring');

var HOST = 'api-ocs.rhcloud.com';
var PORT = '80';

var user1 = "testuser1";
var password1 = "testpassword1";
var auth1 = user1+":"+password1;

var user2 = "testuser2";
var password2 = "testuser2";    /* leave for edit */
var auth2 = user2+":"+password2;

var content1 = "4fab6b643f3584de46000009";
var comment1 = "4fab6c1a3f3584de4600007a";

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
    ,person_add2: {
        option: {path: '/person/add', method: 'POST'}
        ,data: {login: user2, password: password2, firstname: 'firstn2', lastname: 'secondn2', email: 'email@user2.com'}
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
        ,data: {}       /*remind me: if POST, and the data is empty, we should set it to {}, this is nodejs ... */
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
        ,data: {}
    }
    ,fan_remove: {
        option: {auth: auth1, path: '/fan/remove/'+content1, method: 'POST'}
        ,data: {}
    }
    /*
    ,content_add: {
        option: {auth: auth1, path: '/content/add', method: 'POST'}
        ,data: {}
    }*/
    /* test usage
    ,content_pull: {
        option: {path: '/content/push', method: 'POST'}
        ,data: {}
    }
    ,content_push: {
        option: {path: '/content/push', method: 'POST'}
        ,data: {}
    } */
    ,content_list: {
        option: {path: '/content/data/', method: 'GET'}
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
