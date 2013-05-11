var cluster = require('cluster'),
  domain = require('domain'),
	util = require('util'),
	os = require('os'),
	monitor = require('./ProjectMonitor'),
	logger = require('./logger').logger;

var defaultOption = {
		openCluster:true,
		useDomain:true,
		clusterCount : os.cpus().length
}
exports.clusterWorker = function(option,callback,childMethod){
	if (option)
		option = util._extend(defaultOption,option);
	else 
		option = defaultOption;
	if (!callback) throw new Error('callback argument must be past');

	if (option.openCluster){
		if (cluster.isMaster){
			while(option.clusterCount--){
				cluster.fork();
			}
			cluster.on('disconnect',function(worker){
					//logger(worker.id+' has disconnect.and then it will be restart');
					worker.kill();
					cluster.fork();
			});
			debugger;
			callback(cluster);	
		}else{
			console.log('fork is running '+cluster.worker.id);	
			childMethod(cluster);
		}
	}else{
		callback(cluster);
	}
}


