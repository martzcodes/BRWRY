var system = require('../app/system.js');
var sensors = require('../app/sensors.js');
var equipment = require('../app/equipment.js');
var fs = require('fs');
var path = require('path');
//var async = require('async');

var socket;
var lasttempout;

exports.setSocket = function(socketio) {
	socket = socketio;
}

exports.lastTempOut = function() {
	socket.emit('tempout', {'tempout': lasttempout});
}

var checkEquipment = function(sensorsjson,callback) {

}

exports.checkEquipment = function(sensorsjson,callback) {
	checkEquipment(sensorsjson, callback);
}

exports.checkTemp = function(sensorsjson,callback) {
	sensors.checkTemp(sensorsjson,function(tempout){
		socket.emit('tempout', {'tempout': tempout});
		lasttempout = tempout;
		callback(tempout);
	})
}

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
				sensorLength:120,
				sensorInterval:3000,
				sensorStoreInterval:30000,
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
exports.loadSystemJson = function(cb) {
	loadSystemJson(function(systemjson){
		cb(systemjson);
	})
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

exports.internal = function(req,res) {
	system.getInternalTemperature(function(data){
		res.jsonp(data);
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
				systemjson.systemname = updaterequest.systemname;
				systemjson.brewername = updaterequest.brewername;
				writeSystemJson(systemjson,function(newsystemjson){
					console.log(newsystemjson)
					socket.emit('basic', newsystemjson);
				})
			}
		}
		if (updaterequest.type == 'sensor') {
			//check for differences... if different, then update systemjson
			//i.e. don't write if nothing has changed
			if (updaterequest.sensorLength != systemjson.sensorLength || updaterequest.sensorInterval != systemjson.sensorInterval || updaterequest.sensorStoreInterval != systemjson.sensorStoreInterval) {
				systemjson.sensorLength = updaterequest.sensorLength;
				systemjson.sensorInterval = updaterequest.sensorInterval;
				systemjson.sensorStoreInterval = updaterequest.sensorStoreInterval;
				sensorSystemChange = true;
			}
			sensors.checkUpdate(systemjson,updaterequest,function(changed,changedsystemjson){
				if (changed || sensorSystemChange) {
					systemjson.sensors = changedsystemjson.sensors;
					writeSystemJson(systemjson,function(newsystemjson){
						console.log(newsystemjson)
						socket.emit('sensor', newsystemjson);
					})
				}
			})

		}
		if (updaterequest.type == 'addequipment') {
			//check for differences... if different, then update systemjson
			console.log(updaterequest)
			//updaterequest.newPin and updaterequest.system available
			equipment.addEquipment(systemjson,updaterequest.newPin,function(changed,changedsystemjson){
				if (changed) {
					systemjson.equipment = changedsystemjson.equipment;
					writeSystemJson(systemjson,function(newsystemjson){
						console.log(newsystemjson)
						socket.emit('equipment',newsystemjson);
					})
				}
			})
			
		}
		if (updaterequest.type == 'removeequipment') {
			//check for differences... if different, then update systemjson
			console.log(updaterequest)
			//updaterequest.gpioPin and updaterequest.system available
			equipment.removeEquipment(systemjson,updaterequest.gpioPin,function(changed,changedsystemjson){
				if (changed) {
					systemjson.equipment = changedsystemjson.equipment;
					writeSystemJson(systemjson,function(newsystemjson){
						console.log(newsystemjson)
						socket.emit('equipment',newsystemjson);
					})
				}
			})
			
		}
		if (updaterequest.type == 'updateequipment') {
			//check for differences... if different, then update systemjson
			console.log(updaterequest)
			//updaterequest.system available
			
		}
		if (updaterequest.type == 'toggle') {
			console.log('toggled')
			loadSystemJson(function(systemjson){
				equipment.togglePin(systemjson,updaterequest.gpioPin,function(changed,changedsystemjson){
					console.log('toggle',changedsystemjson.equipment)
					if (changed) {
						systemjson.equipment = changedsystemjson.equipment;
						writeSystemJson(systemjson,function(newsystemjson){
							console.log(newsystemjson)
							socket.emit('equipment', newsystemjson);
						})
					}
				})
			})
		}
		if (updaterequest.type == 'brew') {
			//start or stop brew
			
		}
	})
}