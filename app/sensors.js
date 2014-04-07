//var sense = require('ds18b20');
var sense = require('./fakeds18b20.js'); //when testing on something other than a pi
var async = require('async');

function checkSensors(systemjson,callback){
	sense.sensors(function(err, ids) {
		if (systemjson.sensors.length == 0) {
			async.each(ids,function(sensorid,cb){
				systemjson.sensors.push({sensoraddress:sensorid,
					sensorname:'',
					sensorloc:'',
					sensorstatus:'',
					sensorcalibration:'',
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
					if (sensorid == jsonsensorid) {
						idexist = true;
					}
					jsoncb()
				},function(jsonerr){
					if (idexist == false) {
						systemjson.sensors.push({sensoraddress:sensorid,
							sensorname:'',
							sensorloc:'',
							sensorstatus:'',
							sensorcalibration:'',
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
			/*
			for (var i=0;i<ids.length;i++) {
				var sensorexists = false;
				for (var k=0;k<systemjson.sensors.length;k++){
					if (ids[i] == systemjson.sensors[k]) {
						sensorexists = true;
					}
				}
				systemjson.sensors.push({sensoraddress:ids[i],
					sensorname:'',
					sensorloc:'',
					sensorstatus:'',
					sensorcalibration:'',
					sensorlastchange:Date()
				})

			}
			if (i === ids.length-1) {
				callback(systemjson);
			}
			*/
		}
		//ids.forEach(function(sensor){

			/*
			Sensor.find({address:sensor},function (err, sensors) {
				if (err) {
					console.log("error: ",error)
				}
				if (sensors.length == 0) {
					Sensor.create({
						name: 'unnamed', //Name
						type: 'Temperature', //Normally temperature (don't want to prevent using other types of senors), not used
						address: sensor, //addressed used to get readings
						location: 'No Where', //description of where this is placed in the brewing process
						calibration: 0, //Calibration number (if the sensor is off by a set amount)
						value: -1, //current reading
						date: Date(), //time of current reading
						lastValue: -1, //last reading
						active: 1, //Is it being used?
						linked: []  //Is it linked to anything else (PID control of something)
					});
					console.log('Created sensor',sensor,'!')
				}
			})
*/
		//});
	});
/*
	Sensor.find({},function (err, sensors) {
		if (socket) socket.emit('checksensors', {'checksensors': sensors});
	});
*/
}

exports.checkSensors = function(systemjson,callback) {
	checkSensors(systemjson,callback);
}

function checkTemp(socket,Sensor) {
	Sensor.find({},function(err, sensors) {
		sensors.forEach(function(tempSensor) {
			sense.temperature(tempSensor.address, function(err, value) {
				var newReading = value+tempSensor.calibration;
				Sensor.update({address:tempSensor.address},{lastValue:tempSensor.value,
					value:newReading,date:Date()}, function(err, numberAffected, raw) {
  					if (err) console.log('Error:',err);
				});
			});
		})
	});
	Sensor.find({},function(err,sensors){
		if (socket) socket.emit('tempout', {'tempout': sensors});
	})
}


exports.checkTemp = function(socket,Sensor) {
	checkTemp(socket,Sensor);
}

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