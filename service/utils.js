exports.meta = function (status_code, status_message) {
	var json = "{";
	if (status_code == 100)
		json += "\"status\":\"ok\"";
	else
		json += "\"status\":\"fail\"";
    json += ",";
	json += "\"statuscode\":" + status_code;
    if (status_message != undefined) {
        json += ",";
    	json += "\"message\":\"" + status_message + "\"";
    }
	json += "}";
	return json;
}

exports.message = function (meta, data) {
    var json = "{\"ocs\": {";
    json += "\"meta\":" + meta;
    if (data != undefined) {
        json += ",";
        json += "\"data\":" + data;
    }
    json += "}}";

    return json;
}

exports.get_username = function (req) {
    var header = req.headers.authorization || '';
    var token = header.split(/\s+/).pop() || '';
    var auth = new Buffer(token, 'base64').toString();
    var parts = auth.split(":");
     
    return parts[0];  
}

