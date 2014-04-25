var system = require('../app/system.js');
var sensors = require('../app/sensors.js');
var equipment = require('../app/equipment.js');
var fs = require('fs');
var path = require('path');
var async = require('async');

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

exports.checkTemp = function(sensorsjson,activePIDs,callback) {
	sensors.checkTemp(sensorsjson,activePIDs,function(tempout){
		socket.emit('tempout', {'tempout': tempout});
		lasttempout = tempout;
		callback(tempout);
	})
}

var writeSystemJson = function(newsystemjson,cb) {
	fs.writeFile(path.normalize(__dirname+'/../data/system.json'), JSON.stringify(newsystemjson, null, 2), function (err) {
		if (err) throw err;
		cb(newsystemjson);
		system.updateSystem(newsystemjson);
	});
}
exports.writeSystemJson = function(newsystemjson,cb){
	writeSystemJson(newsystemjson,function(updatedsystemjson){
		cb(updatedsystemjson);
	})
}

var loadSystemJson = function(cb) {
	fs.exists(path.normalize(__dirname+'/../data/system.json'), function(exists) {
		if (exists) {
			//system configuration file exits
			fs.readFile(path.normalize(__dirname+'/../data/system.json'), 'utf8', function (err, systemjson) {
				if (err) {
					console.log('Error: ' + err);
					return;
				}
				systemjson = JSON.parse(systemjson)
				sensors.checkSensors(systemjson, function(sensorsystemjson){
					if (sensorsystemjson.sensors != systemjson.sensors) {
						writeSystemJson(sensorsystemjson,function(newsystemjson){
							cb(newsystemjson);
						})
					} else {
						cb(systemjson);
					}
				})
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
				brews:[]
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
			var sensorSystemChange = false;
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
			//updaterequest.newPin and updaterequest.system available
			equipment.addEquipment(systemjson,updaterequest.newPin,function(changed,changedsystemjson){
				if (changed) {
					systemjson.equipment = changedsystemjson.equipment;
					writeSystemJson(systemjson,function(newsystemjson){
						console.log(newsystemjson)
						socket.emit('equipmentadd',newsystemjson);
					})
				}
			})
			
		}
		if (updaterequest.type == 'removeequipment') {
			//check for differences... if different, then update systemjson
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
			//updaterequest.system available
			equipment.updateEquipment(systemjson,updaterequest.system.equipment,function(changed,changedsystemjson){
				if (changed) {
					systemjson.equipment = changedsystemjson.equipment;
					writeSystemJson(systemjson,function(newsystemjson){
						console.log(newsystemjson)
						socket.emit('equipment',newsystemjson);
					})
				}
			})
		}
		if (updaterequest.type == 'toggle') {
			if (updaterequest.pinaction == 'pid') {
				system.initPID(updaterequest.gpioPin.address,updaterequest.gpioPin.type,updaterequest.targetname,updaterequest.targetvalue,function(changed,changedsystemjson){
					if (changed){
						systemjson.equipment = changedsystemjson.equipment;
						writeSystemJson(systemjson,function(newsystemjson){
							system.equipmentLog(newsystemjson,updaterequest.gpioPin,updaterequest.targetvalue);
							socket.emit('toggle', newsystemjson);
						})
					}
				})
			} else {
				var waspid = false;
				async.each(updaterequest.gpioPin.targets,function(gpiopintarget,cb){
					if (gpiopintarget.targetvalue != '') {
						waspid = true;
						cb();
					} else {
						cb();
					}
				},function(err){
					if (waspid) {
						system.stopPID(updaterequest.gpioPin.address,function(changed,changedsystemjson){
							var pinaction = updaterequest.pinaction;
							if (updaterequest.pinaction == 'toggle'){
								pinaction = 'off'
							}
							equipment.togglePin(changedsystemjson,updaterequest.gpioPin,pinaction,function(changed,togglesystemjson){
								if (changed) {
									systemjson.equipment = togglesystemjson.equipment;
									writeSystemJson(systemjson,function(newsystemjson){
										system.equipmentLog(newsystemjson,updaterequest.gpioPin,updaterequest.pinaction);
										socket.emit('toggle', newsystemjson);
									})
								} else {
									systemjson.equipment = changedsystemjson.equipment
									writeSystemJson(systemjson,function(newsystemjson){
										system.equipmentLog(newsystemjson,updaterequest.gpioPin,updaterequest.pinaction);
										socket.emit('toggle', newsystemjson);
									})
								}
							})
						})
					} else {
						equipment.togglePin(systemjson,updaterequest.gpioPin,updaterequest.pinaction,function(changed,changedsystemjson){
							if (changed) {
								systemjson.equipment = changedsystemjson.equipment;
								writeSystemJson(systemjson,function(newsystemjson){
									system.equipmentLog(newsystemjson,updaterequest.gpioPin,updaterequest.pinaction);
									socket.emit('toggle', newsystemjson);
								})
							}
						})
					}
				})
			}
		}
		if (updaterequest.type == 'toggleall') {
			equipment.toggleAll(systemjson,function(changedsystemjson){
				systemjson.equipment = changedsystemjson.equipment;
				writeSystemJson(systemjson,function(newsystemjson){
					system.clearPIDs();
					async.each(systemjson.equipment,function(equipmentitem,cb){
						system.equipmentLog(systemjson,equipmentitem,'off');
						cb();
					},function(err){
						socket.emit('togglesafe',newsystemjson)
					})
				})
			})
		}
		if (updaterequest.type == 'startbrew') {
			//start brew
			//console.log(Date.now()+'.brwry')
			if (updaterequest.currentbrew != '') { //has a name
				if (systemjson.brewstate == '' && systemjson.currentbrew == '') { //not currently brewing
					systemjson.brewstate = 'brew-'+Date.now()+'.brwry';  //new data file name
					systemjson.currentbrew = updaterequest.currentbrew;
					systemjson.brews.push({brewname:systemjson.currentbrew,brewfile:systemjson.brewstate,brewstart:Date.now()})
					writeSystemJson(systemjson,function(newsystemjson){
						//socket.emit('togglesafe', newsystemjson);
						system.startBrew(newsystemjson);
					})
				}
			} else {
				//send back error... name must not be blank
			}
		}
		if (updaterequest.type == 'stopbrew') {
			//stop brew
			if (systemjson.brewstate != '' && systemjson.currentbrew != '') {
				async.each(systemjson.brews,function(brew,cb){
					if (brew.brewfile == systemjson.brewstate) {
						brew.brewend = Date.now();
					}
					cb();
				},function(err){
					systemjson.brewstate = '';
					systemjson.currentbrew = '';
					writeSystemJson(systemjson,function(newsystemjson){
						//socket.emit('togglesafe', newsystemjson);
						system.stopBrew(newsystemjson);
					})
				})
			}
		}
		res.render('OK', { status: 200 });
	})
}