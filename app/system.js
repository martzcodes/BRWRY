var system = require('../routes/system.js');
var equipment = require('./equipment.js');
var async = require('async');
var fs = require('fs');
var path = require('path');

var sensorLength;
var sensorInterval;
var sensorStoreInterval;
var systemjson;
var brewjson;
var temperatureData = [];
var socket;
var lasttempout;
var brewing = false;


var updateSystem = function(newsystemjson,callback) {
	systemjson = newsystemjson;
	sensorCheck(temperatureData,'internal',function(newTemperatureData){
		temperatureData = newTemperatureData;
		callback();
	});
}
exports.updateSystem = function(newsystemjson) {
	updateSystem(newsystemjson,function(){

	});
}

var sensorCheck = function(tempData,checktype,callback) {
	
	var temperatureDataMod = [];
	async.each(systemjson.sensors,function(sensor,syscb){
		async.each(temperatureData,function(tD,cb){
			if (tD.name == sensor.sensorname && sensor.sensorstatus == "1") {
				temperatureDataMod.push(tD);
			}
			cb();
		},function(err){
			syscb();
		})
	},function(err){
		var sensors = systemjson.sensors;
		system.checkTemp(sensors,function(tempoutall){
			lasttempout = tempoutall;
			if (checktype == 'internal') {
				if (!sensorLength) sensorLength = 120;
			}
			async.each(tempoutall,function(tempout,allcb){
				var sensorupdated = false;
				if (temperatureDataMod.length == 0) {
					temperatureDataMod.push({name:tempout.sensorname,values:[{date:Date(),temperature:tempout.temperature}]})
					allcb();
				} else {
					async.each(temperatureDataMod,function(temperature,cb){
						if (tempout.sensorname == temperature.name) {
							if (checktype == 'internal') {
								if (temperature.values.length == sensorLength) {
									temperature.values.shift();
								}
							}
							temperature.values.push({date:Date(),temperature:tempout.temperature})
							sensorupdated=true;
						}
						cb();
					},function(err){
						if( err ) {
							console.log('Err happened',err);
						} else {
							if (sensorupdated == false) {
								temperatureDataMod.push({name:tempout.sensorname,values:[{date:Date(),temperature:tempout.temperature}]})
							}
							allcb();
						}
					})
				}
			},function(err){
				callback(temperatureDataMod);
			})
		})
	})
}

var readCurrentBrew = function(brew,callback) {
	fs.readFile(path.normalize(__dirname+'/../data/'+brew), 'utf8', function (err, readbrewjson) {
		if (err) {
			console.log('Error: ' + err);
			return;
		}
		brewjson = JSON.parse(readbrewjson)
		callback()
	});
}


var writeBrew = function(brew,newbrewjson,callback) {
	fs.writeFile(path.normalize(__dirname+'/../data/'+brew), JSON.stringify(newbrewjson, null, 2), function (err) {
		if (err) throw err;
		brewjson = newbrewjson;
		callback();
	});
}

exports.equipmentLog = function(newsystemjson,gpioPin,pinaction) {
	async.each(brewjson.equipmentdata,function(equipment,callback){
		if (equipment.eaddress == gpioPin.address) {
			equipment.values.push({date:Date(),evalue:equipment.value})
		}
		callback();
	},function(err){
		writeBrew(systemjson.brewstate,brewjson,function(){
			console.log('equipment logged',gpioPin)
		})
	})
}

var initEquipmentLog = function(callback) {
	var equipmentlog = [];
	async.each(systemjson.equipment,function(equipmentitem,cb){
		equipmentlog.push({ename:equipmentitem.name,eaddress:equipmentitem.address,etype:equipmentitem.type,safeValue:equipmentitem.safeValue,values:[{date:Date(),evalue:equipmentitem.value}]})
		cb();
	},function(err){
		callback(equipmentlog);
	})
}

var initBrew = function(brew,callback) {
	var newbrewjson = {
		'brewname':systemjson.currentbrew,
		'brewername':systemjson.brewername,
		'systemname':systemjson.systemname,
		'sensordata':[],
		'equipmentdata':[],
		'recipe':[],
		'ingredients':[]
	}

	async.parallel([
		function(pcallback){
			sensorCheck([],'store',function(newsensordata){
				newbrewjson.sensordata = newsensordata;
				pcallback(null);
			})
		},
		function(pcallback){
			initEquipmentLog(function(newequipmentdata){
				newbrewjson.equipmentdata = newequipmentdata;
				pcallback(null);
			})
		}
	],function(err){
		writeBrew(brew,newbrewjson,function(){
			callback();
		})
	});
}

exports.startBrew = function(newsystemjson) {
	updateSystem(newsystemjson,function(){
		brewing = true;
		initBrew(newsystemjson.brewstate,function(){
			socket.emit('startbrew', {'system': systemjson});
			if (!systemjson.sensorStoreInterval) {
				sensorStoreInterval = setInterval(sensorStore,30000);
			} else {
				sensorStoreInterval = setInterval(sensorStore,systemjson.sensorStoreInterval);
			}
		})
	});
}

exports.stopBrew = function(newsystemjson) {
	updateSystem(newsystemjson,function(){
		brewing = false;
		clearInterval(sensorStoreInterval);
		socket.emit('stopbrew', {'system': systemjson});
	});
}

var sensorStore = function() {
	if (brewing) {
		sensorCheck(brewjson.sensordata,'store',function(newsensordata){
			brewjson.sensordata = newsensordata;
			writeBrew(systemjson.brewstate,brewjson,function(){
				
			})
		})
	}
}

exports.getInternalTemperature = function(callback) {
	if (brewing) {
		callback(brewjson.sensordata)
	} else {
		callback(temperatureData);
	}
}

exports.initSystem = function(socketio) {
	socket = socketio.sockets;
	system.loadSystemJson(function(systemdata){
		systemjson = systemdata;
		sensorLength = systemjson.sensorLength;
		if (!systemjson.sensorInterval) {
			sensorInterval = setInterval(function(){sensorCheck(temperatureData,'internal',function(newTemperatureData){
				temperatureData = newTemperatureData;
			})},3000);
		} else {
			sensorInterval = setInterval(function(){sensorCheck(temperatureData,'internal',function(newTemperatureData){
				temperatureData = newTemperatureData;
			})},systemjson.sensorInterval);
		}
		equipment.initPins(systemdata.equipment,function(){
			console.log('Pins Initialized.')
		})
		if (systemjson.brewstate != "") {
			//should be brewing, so load and continue storing data
			readCurrentBrew(systemjson.brewstate,function(){
				if (!systemjson.sensorStoreInterval) {
					sensorStoreInterval = setInterval(sensorStore,30000);
				} else {
					sensorStoreInterval = setInterval(sensorStore,systemjson.sensorStoreInterval);
				}
			})
		}
	})
}
exports.shutItDown = function() {
	equipment.killPins(systemjson.equipment,function(){
		console.log('Shutdown Complete.');
		return process.exit(0);
	})
}