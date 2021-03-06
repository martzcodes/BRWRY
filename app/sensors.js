//var sense = require('ds18b20');
var sense = require('./fakeds18b20.js'); //when testing on something other than a pi
var async = require('async');

exports.checkUpdate = function(systemjson,updaterequest,callback) {
	if (systemjson.sensors.length == 0) {
		async.each(updaterequest.sensors,function(updatesensor,cb){
			systemjson.sensors.push({sensoraddress:updatesensor.sensoraddress,
				sensorname:updatesensor.sensorname,
				sensorloc:updatesensor.sensorloc,
				sensorstatus:updatesensor.sensorstatus,
				sensorcalibration:updatesensor.sensorcalibration,
				sensortarget:0,
				sensorlastchange:Date()
			})
			cb();
		},function(err){
			if(err) {
				// One of the iterations produced an error.
				// All processing will now stop.
				console.log('An id failed to process');
			} else {
				console.log('All ids have been processed successfully');
				callback(true,systemjson);
			}
		})
	} else {
		//sensors are already in the list (which they should be)
		var changeexist = false;
		async.each(updaterequest.sensors,function(updatesensor,updatecb){
			var sensorexist = false;
			var detailchange = false;
			async.each(systemjson.sensors,function(systemsensor,cb){
				if (systemsensor.sensoraddress == updatesensor.sensoraddress) {
					sensorexist = true;
					async.parallel([
						function(pcallback){
							if (systemsensor.sensorname == updatesensor.sensorname) {
								pcallback(null);
							} else {
								systemsensor.sensorname = updatesensor.sensorname;
								detailchange = true;
								pcallback(null);
							}
						},
						function(pcallback){
							if (systemsensor.sensorloc == updatesensor.sensorloc) {
								pcallback(null);
							} else {
								systemsensor.sensorloc = updatesensor.sensorloc;
								detailchange = true;
								pcallback(null);
							}
						},
						function(pcallback){
							if (systemsensor.sensorstatus == updatesensor.sensorstatus) {
								pcallback(null);
							} else {
								systemsensor.sensorstatus = updatesensor.sensorstatus;
								detailchange = true;
								pcallback(null);
							}
						},
						function(pcallback){
							if (systemsensor.sensorcalibration == updatesensor.sensorcalibration) {
								pcallback(null);
							} else {
								systemsensor.sensorcalibration = updatesensor.sensorcalibration;
								detailchange = true;
								pcallback(null);
							}
						}
					],
					function(err){
						// if (detailchange) set changeexist to true
						if (detailchange) {
							changeexist = true;
							systemsensor.sensorlastchange = Date();
							cb();
						} else {
							cb();
						}
					});
				} else {
					cb();
				}

			},function(jsonerr){
				if (sensorexist == false) {
					systemjson.sensors.push({sensoraddress:updatesensor.sensoraddress,
						sensorname:updatesensor.sensorname,
						sensorloc:updatesensor.sensorloc,
						sensorstatus:updatesensor.sensorstatus,
						sensorcalibration:updatesensor.sensorcalibration,
						sensorlastchange:Date()
					})
					changeexist = true;
					updatecb();
				} else {
					if (detailchange) {
						changeexist = true;
					}
					updatecb();
				}
			})
		},function(err){
			if( err ) {
				// One of the iterations produced an error.
				// All processing will now stop.
				console.log('An id failed to process');
			} else {
				console.log('All ids have been processed successfully');
				callback(changeexist,systemjson);
			}
		})
	}
}

function checkSensors(systemjson,callback){
	sense.sensors(function(err, ids) {
		if (systemjson.sensors.length == 0) {
			async.each(ids,function(sensorid,cb){
				systemjson.sensors.push({sensoraddress:sensorid,
					sensorname:'',
					sensorloc:'',
					sensorstatus:'',
					sensorcalibration:0,
					sensortarget:0,
					sensorlastchange:Date()
				})
				cb();
			},function(err){
				if(err) {
					// One of the iterations produced an error.
					// All processing will now stop.
					console.log('An id failed to process');
				} else {
					console.log('All ids have been processed successfully');
					callback(systemjson);
				}
			})
		} else {
			//sensors are already in the list
			async.each(ids,function(sensorid,cb){
				var idexist = false;
				async.each(systemjson.sensors,function(jsonsensorid,jsoncb){
					if (sensorid.address == jsonsensorid.address) {
						idexist = true;
					}
					jsoncb()
				},function(jsonerr){
					if (idexist == false) {
						systemjson.sensors.push({sensoraddress:sensorid,
							sensorname:'',
							sensorloc:'',
							sensorstatus:'',
							sensorcalibration:0,
							sensortarget:0,
							sensorlastchange:Date()
						})
					}
					cb();
				})
			},function(err){
				if( err ) {
					// One of the iterations produced an error.
					// All processing will now stop.
					console.log('An id failed to process');
				} else {
					console.log('All ids have been processed successfully');
					callback(systemjson);
				}
			})
		}
	});
}

exports.checkSensors = function(systemjson,callback) {
	checkSensors(systemjson,callback);
}

function checkTemp(sensors,equipment,callback) {
	var tempout = [];
	async.each(sensors,function(sensor,cb){
		var heattarget, cooltarget;
		var heattempmod = 0;
		var cooltempmod = 0;
		if (sensor.sensorstatus == '1') {
			async.each(equipment,function(equipmentitem,ecb){
				var hasPID = false;
				var hasSensor = false;
				async.each(equipmentitem.targets,function(activePID,acb){
					if (activePID.targetname == sensor.sensorname) {
						hasSensor = true;
					}
					if (activePID.targetvalue != "") {
						hasPID = true;
						if (activePID.targetname == sensor.sensorname) {
							if (equipmentitem.type == 'Heat') {
								heattarget = activePID.targetvalue;
								acb();
							}
							if (equipmentitem.type == 'Cool') {
								cooltarget = activePID.targetvalue;
								acb();
							}
							if (equipmentitem.type != 'Heat' && equipmentitem.type != 'Cool') {
								acb();
							}
						} else {
							acb();
						}
					} else {
						acb();
					}
				},function(err){
					if (hasPID) {
						ecb();
					} else {
						if (hasSensor) {
							if (equipmentitem.safeValue != equipmentitem.value) {
								if (equipmentitem.type == 'Heat') {
									heattempmod = 5;
									ecb();
								}
								if (equipmentitem.type == 'Cool') {
									cooltempmod = -5;
									ecb();
								}
								if (equipmentitem.type != 'Heat' && equipmentitem.type != 'Cool') {
									ecb();
								}
							} else {
								ecb();
							}
						} else {
							ecb();
						}
					}
				})
			},function(err){
				sense.temperature(sensor.sensoraddress, function(err,value){
					var newReading = parseFloat(value + sensor.sensorcalibration);
					if (!cooltarget) {
						cooltarget = parseFloat(newReading + cooltempmod);
					} else {
						if (newReading <= cooltarget) {
							cooltarget = newReading;
						}
					}
					if (!heattarget) {
						heattarget = parseFloat(newReading + heattempmod);
					} else {
						if (newReading >= heattarget) {
							heattarget = newReading;
						}
					}
					tempout.push({
						sensoraddress:sensor.sensoraddress,
						temperature:newReading,
						sensorname:sensor.sensorname,
						datetime:Date(),
						time:Date.now(),
						heattarget:heattarget,
						cooltarget:cooltarget
					})
					cb();
				})
			})
		} else {
			cb();
		}
	},function(err){
		if( err ) {
			// One of the iterations produced an error.
			// All processing will now stop.
			console.log('Err happened',err);
		} else {
			callback(tempout);
		}
	})
}

exports.checkTemp = function(sensors,activePIDs,callback) {
	checkTemp(sensors,activePIDs,callback);
}

/*
exports.updateSensor = function(socket,Sensor,sensor) {
	Sensor.update({address:sensor.address},{active:sensor.active,
		calibration:sensor.calibration},function (err, numberAffected, raw) {
			if (err) console.log('Error:',err);
			console.log('The number of updated documents was %d', numberAffected);
			console.log('The raw response from Mongo was ', raw);
	});
	Sensor.find({},function (err, checksensors) {
		socket.emit('checksensors', {'checksensors': checksensors});
	});
	checkTemp(socket,Sensor);
}
*/

/*
exports.updateSensors = function(socket,Sensor,sensors) {
	sensors.forEach(function(sensor){
			Sensor.update({address:sensor.address},{active:sensor.active, name:sensor.name, location:sensor.location,
				calibration:sensor.calibration},function (err, numberAffected, raw) {
					if (err) console.log('Error:',err);
					console.log('The number of updated documents was %d', numberAffected);
					console.log('The raw response from Mongo was ', raw);
			});
		})
		Sensor.find({},function (err, checksensors) {
			socket.emit('checksensors', {'checksensors': checksensors});
		});
		checkTemp(socket,Sensor);
}
*/
