var sensors = require('../app/sensors.js');
var fs = require('fs');

/*
Address
Name
Location
Enabled?
Calibration
*/


exports.id = function(req, res, next, id) {
	
}

var getSensors = function(cb) {
	sensors.checkSensors(function(data){
		cb(data);
	})
}

exports.all = function(req, res) {
	fs.exists(path, function(exists) {
		if (exists) {
			fs.readFile('../data/sensors.json', 'utf8', function (err, data) {
				if (err) {
					console.log('Error: ' + err);
					return;
				}

				data = JSON.parse(data);

				console.dir(data);
			});
		} else {
			//generate a new sensor.json file
		}
	});
}

exports.create = function(req, res) {

}

exports.update = function(req, res) {

}

exports.destroy = function(req, res) {

}