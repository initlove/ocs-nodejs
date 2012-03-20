exports.meta = function (status_code, status_message) {
    var meta = {};
	if (status_code == 100)
        meta.status = "ok";
    else
        meta.status = "fail";
    meta.statuscode = status_code;
    if (status_message != undefined) {
        meta.message = status_message;
    }
	return meta;
}

exports.message = function (meta, data) {
    var msg = {"meta" : meta};
    if (data)
        msg.data = data;

    return msg;
}

exports.get_username = function (req) {
    var header = req.headers.authorization || '';
    var token = header.split(/\s+/).pop() || '';
    var auth = new Buffer(token, 'base64').toString();
    var parts = auth.split(":");
     
    return parts[0];  
}

