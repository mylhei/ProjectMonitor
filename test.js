var http = require('http'),
    monitor = require('./lib/ProjectMonitor'),
    path = require('path'),
  util = require('util'),
	logger = require('./lib/logger').logger;

//http.createServer(function (req, res) {
//    res.writeHead(200, { 'Content-Type': 'text/html' });
//    monitor.init(path.join(__dirname, 'lib'), {
//        ignoreDotFile: true
//    }, function (ev) {
//        console.dir(ev);

//    });

//    res.end('Hello, world!');

//}).listen(process.env.PORT || 8080);

var watchDir = path.join(__dirname, 'lib');

//monitor.FolderScan(watchDir, { ignoreDotFile: true }, function (err, files) {
//    Object.keys(files).forEach(function (i) {
//        console.log(i);
//    })
//    console.log('over');
//});
/*
monitor.watch(watchDir, { ignoreDotFile: true }, function (f, c, p) {
    if (typeof f === 'object' && c == null && p == null) {

    } else if (p == null) {
        console.log("added " + f);
    } else if (c.nlink === 0) {
        console.log('removed:' + f);
    } else {
        //for (var i in arguments) {
        //    console.log(arguments[i]);
        //}
        //if (c.isDirectory()) return;
        console.log('changed: ' + f);
    }
})*/
/*
monitor.ProjectMonitor(watchDir, { ignoreDotFile: true }, function(e){
	e.on('created',function(f,c){
			console.log(f + "has created! at "+c.mtime)	;
		});	
	e.on('removed',function(f,c){
			console.log(f + "has removed! at "+c.mtime)	;
		});	
	e.on('changed',function(f,c){
			console.log(f + "has changed! at "+c.mtime)	;
		});	
});
*/
var cWorker = require('./lib/clusterWorker').clusterWorker;
cWorker({
			clusterCount:2
		},
		function(cluster){
			var cur = new Date();
			monitor.ProjectMonitor(watchDir, { ignoreDotFile: true }, function(e){
				var restartServer = function(){
					debugger;
					for(w in cluster.workers){
						logger(cluster.workers[w].id);
					cluster.workers[w].disconnect();
					cluster.workers[w].send({cmd:'restart'});
		//
	//					cluster.workers[w].kill('SIGHUP');
						break;
					}
				}
				e.on('created',function(f,c){
					restartServer();
					//console.log(f + "has created! at "+c.mtime)	;
				});	
				e.on('removed',function(f,c){
					restartServer();
				//	console.log(f + "has removed! at "+c.mtime)	;
				});	
				e.on('changed',function(f,c){
					restartServer();
				//	console.log(f + "has changed! at "+c.mtime)	;
				});	
			});


		},function(cluster){
				var server = http.createServer(function(req,res){
					res.end('hello world');
				});
				cluster.worker.on('message',function(msg){
					if (msg.cmd){
						switch(msg.cmd){
							case 'restart':
								server.close();
								break;
							case 'stop':
								break;
							default:
								console.log('recieved:'+JSON.stringify(cmd));
								break;
						}		
					}
				})
				console.log('i\'m child ');
				server.listen(88);
			});

/*
var timer = setTimeout(function(){
	var	spawn = require('child_process').spawn,
		filename = path.join(__dirname,'lib','1');
	var touch =	spawn('touch',[filename]);
	touch.stdin.end();
	clearTimeout(timer)
		},100000000);
		*/
