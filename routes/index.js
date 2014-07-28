var express = require('express');
var router = express.Router();
var async = require('async');

router.param('service', function(req, res, next, id){
	var serviceModel = req.models.service;

	serviceModel.get(id, function(err, service){
		if (err) {
			if(err.code === 2)
				return next(404);
			return next(err);
		}
		else if (!service) {
			return next(404);
		}

		req.service = service;
		next();
	});
});

router.get('/', function(req, res, next) {
	res.render('index');
});


router.get('/service', function(req, res, next) {
	var serviceModel = req.models.service;
	async.waterfall([
			function(cb) {
				serviceModel.find({}, function(err, services) {
					if(err) {
						cb(err);
					} else {
						cb(null, services);
					}
				});
			}
		],
		function(err, services) {
			if(err) {
				next(err);
			} else {
				//var sortedServices = serviceModel.sortedByPID(services);
				res.json(services);
			}
		}
	);
});

router.post('/service', function(req, res, next) {
	var serviceModel = req.models.service;
	var Service = new serviceModel();
	
	Service.name = req.body.name;
	Service.pid = serviceModel.getCurrentPID(req.body.pid);

	serviceModel.create(Service, function(err, model) {
		if(err)
			return next(err);

		res.json(model.id);
	});
});

router.put('/service/:service', function(req, res, next) {
	var serviceModel = req.models.service;
	var name = (req.body.name===undefined) ? req.service.name : req.body.name;
	var pid = (req.body.pid===undefined) ? req.service.pid : serviceModel.getCurrentPID(req.body.pid);

	req.service.save({ name: name, pid: pid }, function (err) {
		if(err)
			return next(err);

		res.json({ name: name, pid: pid });
	})
});

router.delete('/service/:service', function(req, res, next) {
	req.service.remove(function (err) {
		if(err)
			return next(err);

		res.json();
	});
});

module.exports = router;
