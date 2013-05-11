var path = require('path'),
    fs = require('fs'),
  events = require('events');
	
function FolderScan(dir,config,callback) {
    ///
    /// callback : (err,files);
    ///
    if (!callback){
        callback = config;
        config = {};
    }
    if (callback && !callback.files) {
        callback.files = {};
    }
    if (callback && !callback.remain) {
        callback.remain = 0;
    }

    var done = false;

    callback.remain++;
    fs.stat(dir, function (err, stats) {
        if (err) throw new Error();
        callback.files[dir] = stats;
    });
    fs.readdir(dir, function (err, files) {
        if (err) throw new Error();
        callback.remain--;
        files.forEach(function (f, idx) {
            var currentPath = path.join(dir, f);
            callback.remain++;
            //console.log("out:" + callback.remain + " dir:" + currentPath);
            fs.stat(currentPath, function (err, stat) {
                callback.remain--;
                //console.log("in:" + callback.remain);
                if (err) {
                    if (err.code === 'ENOENT') {
                        throw new Error("asdfasdfasdf");
                    } else {
                        callback(err);
                    }
                    return;
                }

                if (stat.isDirectory()) {
                    FolderScan(currentPath, config, callback);
                }
                done = callback.remain === 0;

                if (config.ignoreDotFile && path.basename(currentPath)[0] === '.') {
                    return done && callback(null, callback.files);
                }
                if (config.filter && config.filter(currentPath)) {
                    return done && callback(null, callback.files);
                }
                callback.files[currentPath] = stat;
                if (done) {
                    callback(null, callback.files);
                }
            })
        });
    });
}

exports.watch = function (dir, config, callback) {
    if (!callback) {
        callback = config;
        config = {};
    }
    FolderScan(dir, config, function (err, files) {
        var watchFile = function (f) {
            fs.watchFile(f, config, function (cur, pre) {
                var item = files[f];
                //if (!item) {
                //    return callback(null, cur, null);
                //}
                files[f] = cur;
                if (item && item.isDirectory()) { //变动的是目录 则遍历所有子元素
                    fs.readdir(f, function (err, nfiles) {
                        if (err) return;
                        nfiles.forEach(function (nfile) {
                            var fullnPath = path.join(f, nfile);
                            if (!files[fullnPath] && (!config.ignoreDotFile || path.basename(nfile)[0] !== '.')) {
                                fs.stat(fullnPath, function (err, nstat) {
                                    callback(fullnPath, nstat, null);
                                    files[fullnPath] = nstat;
                                    watchFile(fullnPath);
                                });
                            }
                        });
                    });
                } else {                    //变动的不是目录
                    //元素存在 且时间未变 且当前状态不是删除
                    if (item && item.mtime.getTime() == cur.mtime.getTime() && cur.nlink !== 0) {
                        return;
                    } else if (cur.nlink === 0) { //被删除的文件
                        callback(f, cur, pre);
                        delete files[f];
                        fs.unwatchFile(f);
                    } else {
                        return callback(f, cur, pre);
                    }
                }
            });
        }
	    // watchFile(dir);
        Object.keys(files).forEach(function (f) {
            watchFile(f);
        });
        callback(files, null, null)

    });
}

exports.FolderScan = FolderScan;
exports.DefaultConfig = {
	ignoreDotFile:true,
	interval:5007
}

exports.ProjectMonitor = function(folder,config,callback){
	if(!callback && typeof config === 'function'){
		callback = config;
		config = exports.DefaultConfig;
	}
	var monitorEvent = new events.EventEmitter();
	exports.watch(folder,config,function(f,c,p){
		if (typeof f === 'object' && c == null && p == null) {
			monitorEvent.files = f;	
			callback(monitorEvent);
		} 
		else if (p == null) {
		    monitorEvent.emit('created',f,c);
		  	//console.log("added " + f);
		} else if (c.nlink === 0) {
			monitorEvent.emit('removed',f,c);
		    //console.log('removed:' + f);
		} else {
		         //for (var i in arguments) {
		         //    console.log(arguments[i]);
		         //}
		         //if (c.isDirectory()) return;
				
			monitorEvent.emit('changed',f,c);
		    //console.log('changed: ' + f);
		 }
	});

}
