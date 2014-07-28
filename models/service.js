module.exports = function (db) {

	var Service = db.define('services', {
		id: { type: 'serial' },
		name: { type: 'text', size: '255' },
		pid: { type: 'integer' }
	});

	Service.sortedByPID = function(collection, callback) {
		var newCollection = {};
		collection.forEach(function(obService, key) {
			var pid = (obService.pid === null) ? 0 : obService.pid;

			if(newCollection[pid] === undefined)
				newCollection[pid] = {};

			newCollection[pid][obService.id] = obService;
		});


		return newCollection;
	}

	Service.getCurrentPID = function(pid, callback) {
		pid = parseInt(pid);
		return pid ? pid : null;
	}

	return Service;

};