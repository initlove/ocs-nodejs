var walk = require('walk');
var path = require('path');
var fs = require('fs');
var mime = require('mime');
var utils = require('./utils');

var default_cache = "/data/s3/";

function home_dir_valid(username, callback) { 
	var homedir = path.join(default_cache, username);
	console.log(homedir);
    fs.stat(homedir, function (err, stats) {
        if (err) {
			fs.mkdir(homedir, function(err) {
				if (err) {
					return callback(null, err);
				} else {
					return callback(homedir);
				}
			});
        } else {
            if (stats.isDirectory()) {
				return callback(homedir);
            } else {
				fs.unlink(homedir, function(err) {
					if (err) {
						return callback(null, err);
					} else {
						fs.mkdir(homedir, function(err) {
							if (err) {
								return callback(null, err);
							} else {
								return callback(homedir);
							}
						});
					}
				});
            }
        }
    });
}

function get_real_url (req, url) {
	var username = utils.get_username (req);
	if (!username) {
		console.log ("Cannot get user's name");
		return null;
	}

	return path.join(default_cache, username, url);
};

function get_dir(req, res, url) {
    console.log('get dir'+ url);
    fs.readdir(url, function(err, files) {
        var val = {};
        if (err) {
            val.status = "fail";
            val.errno = err.errno;
        } else {
            val.status = "ok";
            val.files = files;
        }
        utils.info(req, res, val);
    });
};

function get_file(req, res, url) {
    console.log('get file' + url);

    fs.readFile(url, function(err, data) {
        if (err) {
            var val = {'status': 'error'};
            utils.info(req, res, val);
        } else {
            res.writeHead(200, {'Content-Type': mime.lookup(url)});
            res.end(data);
        }
    });
};

exports.get = function(req, res) {
    var url = req.query.url;
    var val = {};

    if (!url) {
        val.status = "fail";
        val.message = "define the url first";
        utils.info(req, res, val);
        return;
    }
    var real_url = get_real_url(req, url);
	if (!real_url) {
		val.status = "fail";
		val.errno = -1;
		utils.info(req, res, val);
		return ;
	}

    fs.stat(real_url, function (err, stats) {
       	if (err) {
	        val.status = "error";
    	    val.errno = err.errno;
            utils.info(req, res, val);
	    } else {
    	    if (stats.isDirectory()) {
				get_dir(req, res, real_url);
			} else if (stats.isFile()) {
               	get_file(req, res, real_url);
			}
	    }
	});
};

exports.get_info = function(req, res) {
   // console.log('get info ' + req.query.url);
    var url = req.query.url;
    var val = {};

    if (!url) {
        val.status = "fail";
        val.message = "define the url first";
        utils.info(req, res, val);
        return;
    }
    var real_url = get_real_url(req, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    fs.stat(real_url, function (err, stats) {
        if (err) {
            val.status = "error";
            val.errno = err.errno;   
        } else {
            val.status = "ok";
            if (stats.isDirectory()) {
                val.type = "dir";
            } else if (stats.isFile()) {
                val.type = "file";
            }
            val.size = stats.size;
        }
        utils.info(req, res, val);
    });
};

exports.add_dir = function(req, res) {
    var url = req.body.url;
    console.log ('add dir ' + url);
    var val = {};
    if (!url) {
        val.status = "fail";
        val.message = "define the url first";
        utils.info(req, res, val);
        return;
    }
    var real_url = get_real_url(req, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    fs.mkdir(real_url, function(err) {
        if (err) {
            val.status = "fail";
            console.log(err);
            val.errno = err.errno;
            utils.info(req, res, val);
        } else {
            val.status = "ok";
            utils.info(req, res, val);
        }
    });
};

exports.remove_dir = function(req, res) {
    var url = req.body.url;
    console.log ('remove dir ' + url);
    var val = {};
    if (!url) {
        val.status = "fail";
        val.message = "define the url first";
        utils.info(req, res, val);
        return;
    }
    var real_url = get_real_url(req, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    fs.rmdir(real_url, function(err) {
        if (err) {
            val.status = "fail";
            console.log(err);
            val.errno = err.errno;
            utils.info(req, res, val);
        } else {
            val.status = "ok";
            utils.info(req, res, val);
        }
    });
};

exports.rename_file = function(req, res) {
    var from = req.body.from;
    var to = req.body.to;

    var val = {};
    if (!from || !to) {
        val.status = "fail";
        val.message = "define from and to first";
        utils.info(req, res, val);
        return;
    }
    var real_from = get_real_url(req, url);
    var real_to = get_real_url(req, url);
	if (!real_url || !real_to) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    fs.rename(real_from, real_to, function(err) {
        if (err) {
            val.status = "fail";
            console.log(err);
            val.errno = err.errno;
            utils.info(req, res, val);
        } else {
            val.status = "ok";
            utils.info(req, res, val);
        }
    });
};

exports.remove_file = function(req, res) {
    //trick. curl seems not good with both upload and body info
    var url = req.body.url;
    console.log ('remove file ' + url);
    var val = {};
    if (!url) {
        val.status = "fail";
        val.message = "define the url first";
        utils.info(req, res, val);
        return;
    }
    var real_url = get_real_url(req, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    fs.unlink (real_url, function(err) {
        if (err) {
            val.status = "fail";
            console.log(err);
            val.errno = err.errno;
            utils.info(req, res, val);
        } else {
            val.status = "ok";
            utils.info(req, res, val);
        }
    });
};

exports.truncate = function(req, res) {
    var url = req.body.url;

    var val = {};
    if (!url) {
        val.status = "error";
        val.message = "Define url first";
        utils.info(req, res, val);
        return;
    }
    var real_url = get_real_url(req, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    var size = req.body.size;
    
console.log('truncate is ' + real_url);
    fs.open(real_url, "w", function(err, fd) {
		if (err) {
	    	val.status = "error";
		    val.errno = err.errno;
		    utils.info(req, res, val);
		} else {
		    fs.truncate(fd, parseInt(size), function(err) {
				if (err) {
    			    val.status = "error";
		    		val.errno = err.errno;
				} else {
				    val.status = "ok";
				}
				utils.info(req, res, val);
	    	});
		}
    });
};

exports.read_link = function(req, res) {
	var url = req.body.url;
	var size = req.body.size;
	var val = {};

    if (!url || !size) {
        val.status = "error";
        val.message = "Define from and to first";
        utils.info(req, res, val);
        return;
    }
    var real_url = get_real_url(req, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
	fs.readlink(real_url, function(err, linkString) {
		if (err) {
        	val.status = "error";
			val.errno = err.errno;
        	utils.info(req, res, val);
	    } else {
				//FIXME: not done 
            res.writeHead(200, {'Content-Type': mime.lookup(url)});
            res.end(linkString);
	    }
	});
};

exports.access = function(req, res) {
	var url = req.body.url;
	var mode = req.body.mode;
	var val = {};
    if (!url || !mode) {
        val.status = "error";
        val.message = "Define from and to first";
        utils.info(req, res, val);
        return;
    }
    var real_url = get_real_url(req, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}

	//FIXME: any relevant access nodejs 
        val.status = "ok";
        utils.info(req, res, val);
};

exports.symlink = function(req, res) {
    var from = req.body.from;
    var to = req.body.to;

    var val = {};
    if (!from || !to) {
        val.status = "error";
        val.message = "Define from and to first";
        utils.info(req, res, val);
        return;
    }
    var real_from = get_real_url(req, url);
    var real_to = get_real_url(req, url);
	if (!real_from || !real_to) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    
    fs.symlink(real_from, real_to, function(err, fd) {
	    if (err) {
        	val.status = "error";
			val.errno = err.errno;
	    } else {
			val.status = "ok";
	    }
        utils.info(req, res, val);
    });
};

exports.link = function(req, res) {
    var from = req.body.from;
    var to = req.body.to;

    var val = {};
    if (!from || !to) {
        val.status = "error";
        val.message = "Define from and to first";
        utils.info(req, res, val);
        return;
    }
    var real_from = get_real_url(req, url);
    var real_to = get_real_url(req, url);
	if (!real_from || !real_to) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	};
    
    fs.link(real_from, real_to, function(err, fd) {
	    if (err) {
        	val.status = "error";
			val.errno = err.errno;
	    } else {
			val.status = "ok";
	    }
        utils.info(req, res, val);
    });
};

exports.chmod = function(req, res) {
    var url = req.body.url;
    var mode = req.body.mode;

    var val = {};
    if (!url || !mode) {
        val.status = "error";
        val.message = "Define url and mode first";
        utils.info(req, res, val);
        return;
    }
    var real_url = get_real_url(req, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    
    fs.chmod(real_url, parseInt(mode), function(err) {
	    if (err) {
        	val.status = "error";
		val.errno = err.errno;
	    } else {
		val.status = "ok";
	    }
        utils.info(req, res, val);
    });
};

exports.chown = function(req, res) {
    var url = req.body.url;
    var uid = req.body.uid;
    var gid = req.body.gid;

    var val = {};
    if (!url || !uid || !gid) {
        val.status = "error";
        val.message = "Define url and uid and gid first";
        utils.info(req, res, val);
        return;
    }
    var real_url = get_real_url(req, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    
    fs.chown(real_url, parseInt(uid), parseInt(gid), function(err) {
	    if (err) {
        	val.status = "error";
		val.errno = err.errno;
	    } else {
		val.status = "ok";
	    }
        utils.info(req, res, val);
    });
};

exports.mknod = function(req, res) {
    var url = req.body.url;

    var val = {};
    if (!url) {
        val.status = "error";
        val.message = "Define url first";
        utils.info(req, res, val);
        return;
    }
    var real_url = get_real_url(req, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    fs.open(real_url, "w", function(err, fd) {
	    if (err) {
        	val.status = "error";
		val.errno = err.errno;
	    } else {
		val.status = "ok";
	    	fs.close(fd);
	    }
        utils.info(req, res, val);
    });
};

exports.add_data = function(req, res) {
	//FIXME: I donnot know how to use rest_*upload ...
	//check data size ..
    console.log("add data");
    var url = req.body.url;

    var val = {};
    var real_url = path.join(default_cache, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    var data = req.body.data;
    var size = req.body.size;
    var offset = req.body.offset;
    if (!url || !data || !size || !offset) {
        val.status = "error";
        val.message = "Define url and data and size and offset first";
        utils.info(req, res, val);
        return;
    }
    var orig = new Buffer(data, 'base64');

    fs.open(real_url, "r+", function(err, fd) {
	if (err) {
	    val.status = "error";
	    val.errno = err.errno;
	    utils.info(req, res, val);
	} else {
   	    fs.write(fd, orig, 0, parseInt(size), parseInt(offset), function(err, write_val) {
//console.log ("write " + 'size  ' + size + ' off ' + offset);
	        if (err) {
		    val.status = "error";
		    val.errno = err.errno;
	        } else {
		    val.status = "ok";
		    val.size = write_val;
		}
	        fs.closeSync(fd);
		utils.info(req, res, val);
	    });
	}
    });
};

exports.add = function(req, res) {
    var url = '';
    if (req.query.url)
        url = req.query.url;
    else if (req.body.url)
        url = req.body.url;

    var val = {};
    if (!url) {
        val.status = "error";
        val.message = "Define url first";
        utils.info(req, res, val);
        return;
    }
    //TODO: check, if the url is dir, we add file to that dir
    var real_url = get_real_url(req, url);
	if (!real_url) {
        val.status = "fail";
        val.errno = -1;
		utils.info(req, res, val);
		return ;
	}
    console.log('\nuploaded %s %s'
                ,  req.files.upload.filename
                ,  req.files.upload.path);
    console.log(real_url);
    fs.stat(real_url, function(err, stat) {
        if (err) {
        } else if (stat.isDirectory()) {
            real_url = path.join(real_url, files.upload.filename);
        }
        //FIXME: only real_url with exist dir can be used
        // cannot rename in the different disk: nodejs bug
        fs.rename(req.files.upload.path, real_url, function (err) {
            if (err) {
                val.status = "error";
                val.errno = err.errno;
            } else {
                val.status = "ok";
            }
            utils.info(req, res, val);
        });
    });
};
