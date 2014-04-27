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
var activePIDs = [];


var updateSystem = function(newsystemjson,callback) {
	systemjson = newsystemjson;
	/*
	sensorCheck(temperatureData,'internal',function(newTemperatureData){
		temperatureData = newTemperatureData;
		callback();
	});
	*/
	callback();
}
exports.updateSystem = function(newsystemjson) {
	updateSystem(newsystemjson,function(){

	});
}

var sensorCheck = function(tempData,checktype,callback) {
	
	var temperatureDataMod = [];
	async.each(systemjson.sensors,function(sensor,syscb){
		async.each(tempData,function(tD,cb){
			if (tD.name == sensor.sensorname && sensor.sensorstatus == "1") {
				temperatureDataMod.push(tD);
			}
			cb();
		},function(err){
			syscb();
		})
	},function(err){
		var sensors = systemjson.sensors;
		system.checkTemp(sensors,systemjson.equipment,function(tempoutall){
			lasttempout = tempoutall;
			if (checktype == 'internal') {
				if (!sensorLength) sensorLength = 120;
			}
			async.each(tempoutall,function(tempout,allcb){
				var sensorupdated = false;
				if (temperatureDataMod.length == 0) {
					temperatureDataMod.push({
						name:tempout.sensorname,
						values:[{
							date:Date(),
							temperature:tempout.temperature,
							heattarget:tempout.heattarget,
							cooltarget:tempout.cooltarget
						}]
					})
					allcb();
				} else {
					async.each(temperatureDataMod,function(temperature,cb){
						if (tempout.sensorname == temperature.name) {
							if (checktype == 'internal') {
								if (temperature.values.length == sensorLength) {
									temperature.values.shift();
								}
							}
							temperature.values.push({
								date:Date(),
								temperature:tempout.temperature,
								heattarget:tempout.heattarget,
								cooltarget:tempout.cooltarget
							})
							sensorupdated=true;
						}
						cb();
					},function(err){
						if( err ) {
							console.log('Err happened',err);
						} else {
							if (sensorupdated == false) {
								temperatureDataMod.push({
									name:tempout.sensorname,
									values:[{
										date:Date(),
										temperature:tempout.temperature,
										heattarget:tempout.heattarget,
										cooltarget:tempout.cooltarget
									}]
								})
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

var equipmentLog = function(newsystemjson,gpioPin,pinaction) {
	if (brewing) {
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
}
exports.equipmentLog = equipmentLog;

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
		console.log('brewjson.sensordata',brewjson.sensordata);
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

var checkPID = function() {
	if (activePIDs.length > 0){
		var changed;
		var modsystemjson = systemjson;
		async.each(activePIDs,function(activePID,callback){
			var tempCheck = function(tempone,temptwo) {
				equipment.pinValue(systemjson.equipment,activePID.pinaddress,function(pinstate){
					if (tempone >= temptwo) {
						//console.log('Activate Activate Activate Activate Activate Activate Activate ')
						if (pinstate != 1) {
							//pin needs changing
							equipment.togglePin(modsystemjson,{address:activePID.pinaddress},'on',function(mod,newsystemjson){
								modsystemjson.equipment = newsystemjson.equipment;
							})
							changed = true;
						}
					} else {
						//console.log('Deactivate Deactivate Deactivate Deactivate Deactivate Deactivate Deactivate ')
						if (pinstate != 0) {
							equipment.togglePin(modsystemjson,{address:activePID.pinaddress},'off',function(mod,newsystemjson){
								modsystemjson.equipment = newsystemjson.equipment;
							})
							//pin needs changing
							changed = true;
						}
					}
				})
				callback();
			}
			var HeatCool = function() {
				var usetemp;
				if (lasttempout) {
					async.each(lasttempout,function(lasttemp,tcb){
						if (lasttemp.sensorname == activePID.targetname) {
							usetemp = lasttemp.temperature;
							activePID.lasttime = lasttemp.datetime;
						}
						tcb();

					},function(err){
						if (activePID.pintype == 'Cool') {
							tempCheck(usetemp,activePID.targetvalue)
							//console.log('Cool Cool Cool Cool Cool Cool Cool Cool Cool Cool Cool Cool ')
						}
						if (activePID.pintype == 'Heat') {
							tempCheck(activePID.targetvalue,usetemp)
							//console.log('Heat Heat Heat Heat Heat Heat Heat Heat Heat Heat Heat Heat ')
						}
						if (activePID.pintype != 'Cool' && activePID.pintype != 'Heat') {
							callback();
						}
					})
				}
			}
			if (activePID.lasttime) {
				if (activePID.lasttime != lasttempout.datetime) {
					HeatCool();
				} else {
					//temperature is not updating
					console.log('Temp not updating')
					callback();
				}
			} else {
				HeatCool()
			}
		},function(err){
			if (changed) {
				system.writeSystemJson(modsystemjson,function(newsystemjson){
					socket.emit('toggle', {'equipment': systemjson.equipment})
				})
			}
		})
	}
}

var updatePIDs = function(pinaddress,targetname,targetvalue,cb) {
	var newsystemjson = systemjson;
	async.each(newsystemjson.equipment,function(systemequipment,syscb){
		if (systemequipment.address == pinaddress) {
			async.each(systemequipment.targets,function(equipmenttarget,tarcb){
				if (equipmenttarget.targetname == targetname) {
					equipmenttarget.targetvalue = targetvalue;
				} else {
					equipmenttarget.targetvalue = '';
				}
				tarcb();

			},function(err){
				syscb();
			})
		} else {
			syscb();
		}
	},function(err){
		updateSystem(newsystemjson,function(){
			console.log('newsystemjson',newsystemjson)
			cb(newsystemjson);
		})
	})
}

exports.initPID = function(pinaddress,pintype,targetname,targetvalue,callback) {
	if (activePIDs.length > 0) {
		var pidcheck = false;
		var changecheck = false;
		async.each(activePIDs,function(activePID,cb){
			if (activePID.pinaddress == pinaddress) {
				if (activePID.targetname != targetname || activePID.targetvalue != targetvalue) {
					activePID.targetname = targetname;
					activePID.targetvalue = targetvalue;
					changecheck = true;
				}
				pidcheck = true;
				cb();
			} else {
				cb();
			}
		},function(err){
			if (!pidcheck) {
				activePIDs.push({
					pinaddress:pinaddress,
					pintype:pintype,
					targetname:targetname,
					targetvalue:targetvalue
				})
				updatePIDs(pinaddress,targetname,targetvalue,function(newsystemjson){
					callback(true,newsystemjson);
				})
			} else {
				if (changecheck) {
					updatePIDs(pinaddress,targetname,targetvalue,function(newsystemjson){
						callback(true,newsystemjson);
					})
				} else {
					callback(false,null);
				}
			}
		})
	} else {
		activePIDs.push({
			pinaddress:pinaddress,
			pintype:pintype,
			targetname:targetname,
			targetvalue:targetvalue
		})
		updatePIDs(pinaddress,targetname,targetvalue,function(newsystemjson){
			callback(true,newsystemjson);
		})
	}
}

exports.clearPIDs = function() {
	activePIDs = [];
}

exports.stopPID = function(pinaddress,callback) {
	var changedsystemjson = systemjson;
	if (activePIDs.length > 0) {
		async.series([
		    function(cb){
		        for (var i = 0; i < activePIDs.length; i++) {
		        	if (activePIDs[i].pinaddress == pinaddress) {
		        		activePIDs.splice(i,1);
		        		cb();
		        	}
		        }
		    },
		    function(cb){
		        updatePIDs(pinaddress,'','',function(newsystemjson){
		        	changedsystemjson.equipment = newsystemjson.equipment;
		        	cb();
				})
		    }
		],
		function(err){
		    callback(true,changedsystemjson);
		});
	} else {
		console.log('somehow got here?')
		callback(false,null);
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
		setInterval(function(){
			checkPID();
		},5000)
		for (var i = 0; i<systemjson.equipment.length; i++) {
			for (var j = 0; j < systemjson.equipment[i].targets.length; j++) {
				var targetdata = systemjson.equipment[i].targets[j];
				if (targetdata.targetvalue != '') {
					activePIDs.push({
						pinaddress:systemjson.equipment[i].address,
						pintype:systemjson.equipment[i].type,
						targetname:targetdata.targetname,
						targetvalue:targetdata.targetvalue
					})
				}
			}
		}
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