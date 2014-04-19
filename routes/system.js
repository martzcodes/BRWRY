var system = require('../app/system.js');
var sensors = require('../app/sensors.js');
var equipment = require('../app/equipment.js');
var fs = require('fs');
var path = require('path');
var async = require('async');

var writeSystemJson = function(newsystemjson,cb) {
	fs.writeFile(path.normalize(__dirname+'/../data/system.json'), JSON.stringify(newsystemjson, null, 2), function (err) {
		if (err) throw err;
		cb(newsystemjson);
	});
}

var loadSystemJson = function(cb) {
	//console.log('test path:',path.normalize(__dirname+'/../data/system.json'))
	fs.exists(path.normalize(__dirname+'/../data/system.json'), function(exists) {
		if (exists) {
			//system configuration file exits
			fs.readFile(path.normalize(__dirname+'/../data/system.json'), 'utf8', function (err, systemjson) {
				if (err) {
					console.log('Error: ' + err);
					return;
				}
				cb(JSON.parse(systemjson));
			});
		} else {
			//configuration file doesn't exist, so make one
			var templatejson = {
				systemname:'Default Name',
				brewername:'Awesome Brwr',
				currentbrew:'',
				brewstate:'',
				equipment:[],
				sensors:[],
			};
			sensors.checkSensors(templatejson, function(systemjson){
				writeSystemJson(systemjson,function(newsystemjson){
					cb(newsystemjson)
				})
			})
		}
	});
}

exports.all = function(req, res) {
	loadSystemJson(function(systemjson){
		res.jsonp(systemjson);
	})
}

exports.sensors = function(req, res) {
	loadSystemJson(function(systemjson){
		res.jsonp(systemjson.sensors);
	})
}

exports.equipment = function(req, res) {
	loadSystemJson(function(systemjson){
		res.jsonp(systemjson.equipment);
	})
}

exports.update = function(req, res) {
	var updaterequest = req.body;
	loadSystemJson(function(systemjson){
		if (updaterequest.type == 'basic') {
			if (updaterequest.systemname != systemjson.systemname || updaterequest.brewername != systemjson.brewername) {
				console.log('system or brewer name changed');
				systemjson.systemname = updaterequest.systemname;
				systemjson.brewername = updaterequest.brewername;
				writeSystemJson(systemjson,function(newsystemjson){
					console.log(newsystemjson)
				})
			}
		}
		if (updaterequest.type == 'sensor') {
			var sensorcheck = false;
			//check for differences... if different, then update systemjson
			//i.e. don't write if nothing has changed

			sensors.checkUpdate(systemjson,updaterequest,function(changed,changedsystemjson){
				console.log('changed',changed)
				if (changed) {
					writeSystemJson(changedsystemjson,function(newsystemjson){
						console.log(newsystemjson)
					})
				}
			})

		}
		if (updaterequest.type == 'equipment') {
			var equipmentcheck = false;
			//check for differences... if different, then update systemjson
			
		}
		if (updaterequest.type == 'brew') {
			//start or stop brew
			
		}
	})
}