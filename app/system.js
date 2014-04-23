var system = require('../routes/system.js');
var equipment = require('./equipment.js');
var async = require('async');

var sensorLength;
var sensorInterval;
var sensorStoreInterval;
var systemjson;
var brewjson;
var temperatureData = [];
var socket;
var lasttempout;

exports.updateSystem = function(newsystemjson) {
	systemjson = newsystemjson;
	sensorCheck();
}

var sensorCheck = function() {
	var sensors = systemjson.sensors;
	system.checkTemp(sensors,function(tempout){
		lasttempout = tempout;
		if (!sensorLength) sensorLength = 120;
		for (var i=0; i < tempout.length; i++) {
			var sensorupdated = false;
			if (temperatureData.length == 0) {
				temperatureData.push({name:tempout[i].sensorname,values:[{date:Date(),temperature:tempout[i].temperature}]})
			} else {
				async.each(temperatureData,function(temperature,cb){
					if (tempout[i].sensorname == temperature.name) {
						if (temperature.values.length == sensorLength) {
							temperature.values.shift();
						}
						temperature.values.push({date:Date(),temperature:tempout[i].temperature})
						sensorupdated=true;
					}
					cb();
				},function(err){
					if( err ) {
						console.log('Err happened',err);
					} else {
						if (sensorupdated == false) {
							temperatureData.push({name:tempout[i].sensorname,values:[{date:Date(),temperature:tempout[i].temperature}]})
						}
					}
				})
			}
		}
	})
}

var readCurrentBrew = function(brew,callback) {
	fs.readFile(path.normalize(__dirname+'/../data/'+brew), 'utf8', function (err, brewjson) {
		if (err) {
			console.log('Error: ' + err);
			return;
		}
		brewjson = JSON.parse(brewjson)
		callback()
	});
}

exports.startBrew = function(newbrew) {

}

exports.stopBrew = function(oldbrew) {
	
}

var sensorStore = function() {
	//store the last value

}

exports.getInternalTemperature = function(callback) {
	callback(temperatureData);
}

exports.initSystem = function(socketio) {
	socket = socketio.sockets;
	system.loadSystemJson(function(systemdata){
		systemjson = systemdata;
		sensorLength = systemjson.sensorLength;
		if (!systemjson.sensorInterval) {
			sensorInterval = setInterval(sensorCheck,3000);
		} else {
			sensorInterval = setInterval(sensorCheck,systemjson.sensorInterval);
		}
		equipment.initPins(systemdata.equipment,function(){
			console.log('Pins Initialized.')
		})
		if (systemjson.brewstate != "") {
			//should be brewing, so load and continue storing data
			readCurrentBrew(systemjson.brewstate,function(){
				if (!systemjson.sensorStoreInterval) {
					sensorStoreInterval = setInterval(sensorStore,3000);
				} else {
					sensorStoreInterval = setInterval(sensorStore,systemjson.sensorInterval);
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