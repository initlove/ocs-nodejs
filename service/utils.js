var db = require('mongodb').Db;
var server = require('mongodb').Server;

exports.meta = function (message_type) {
    var meta = {};
    switch (message_type) {
        case "ok":
            meta.status = "ok";
            meta.statuscode = 100;
            break;
        case "Server error":
            meta.statuscode = 110;
            break;
        case "no permission to get fan status":
            meta.statuscode = 101;
            break;
        case "You have already been the fan":
            meta.statuscode = 102;
            break;
        case "wrong type":
            meta.statuscode = 104;
            break;
        case "not authenticated":
            meta.statuscode = 102;
            break;
        case "person not found":
            meta.statuscode = 101;
            break;
        case "login not valid":
            meta.statuscode = 102;
            break;
        case "please specify all mandatory fields":
            meta.statuscode = 101;
            break;
        case "please specify a valid password":
            meta.statuscode = 102;
            break;
        case "please specify a valid login":
            meta.statuscode = 103;
            break;
        case "login aleady exists":
            meta.statuscode = 104;
            break;
        case "email already taken":
            meta.statuscode = 105;
            break;
        case "please specify a valid email":
            meta.statuscode = 106;
            break;
        case "message or subject must not be empty":
            meta.statuscode = 102;
            break;
        case "no permission to add a comment":
            meta.statuscode = 103;
            break;
        case "no permission to get person info":
            meta.statuscode = 103;
            break;
        case "comment not found":
            meta.statuscode = 104;
        case "content must not be empty":
            meta.statuscode = 101;
            break;
        case "content not found":
            meta.statuscode = 101;
            break;
        case "invalid comment id":
            meta.statuscode = 105;
            break;
        case "invalid content id":
            meta.statuscode = 105;
            break;
        case "content item not found":
            meta.statuscode = 103;
            break;
        case "vote with score between 0 and 100":
            meta.statuscode = 102;
            break;
        case "no permission to vote":
            meta.statuscode = 104;
            break;
        case "you have already voted on this content":
            meta.statuscode = 105;
            break;
        case "need to post the file...":
            meta.statuscode = 101;
            break;
        case "please fill with 'image'":
            meta.statuscode = 102;
            break;
        case "invalid image id":
            meta.statuscode = 103;
            break;
        case "Cannot find the image":
            meta.statuscode = 104;
            break;
        default :
            console.log ("Some meta result was not include: " + mesage_type + "\n");
            meta.statuscode = 111;
            break;
    }
    if (message_type != "ok") {
        meta.status = "fail";
        meta.message = message_type;
    }
    return meta;
}

exports.message = function (meta, data) {
    var msg = {"meta" : meta};
    if (data)
        msg.data = data;

    return msg;
}

exports.check_id = function (id) {
    if (id == null || (id.length != 12 && id.length != 24)) {
        return false;
    } else
        return true;
}

exports.get_username = function (req) {
    var header = req.headers.authorization || '';
    var token = header.split(/\s+/).pop() || '';
    var auth = new Buffer(token, 'base64').toString();
    var parts = auth.split(":");
     
    return parts[0];  
}
