var system = require('../routes/system.js');
var async = require('async');

var sensorLength;
var sensorInterval;
var sensorStoreInterval;
var systemjson;
//var temperatureData = {datetime:[]};
var temperatureData = [];
var socket;
var lasttempout;

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

/*
var sensorCheck = function() {
	var sensors = systemjson.sensors;
	system.checkTemp(sensors,function(tempout){
		lasttempout = tempout;
		if (!sensorLength) sensorLength = 120;
		for (var k; k < temperatureData.length; k++) {
			if (temperatureData)
		}
//		if (temperatureData.datetime.length == sensorLength) {
//			temperatureData.datetime.shift();
//		};
		temperatureData.datetime.push(Date());
		for (var i; i < temperatureData.datetime.length; i++) {

		}

		async.each(tempout,function(temperature,cb){
			if (temperatureData[temperature.sensoraddress]) {
				if (temperatureData[temperature.sensoraddress].length == sensorLength) {
					temperatureData[temperature.sensoraddress].shift();
				};
				temperatureData[temperature.sensoraddress].push({temperature:temperature.temperature,sensortarget:temperature.sensortarget});
			} else {
				temperatureData[temperature.sensoraddress] = [temperature.temperature];
			}
			cb();
		},function(err){
			if( err ) {
				console.log('Err happened',err);
			} else {
				//console.log('tempdata',temperatureData);
			}
		})
	})
}
*/
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
		/*
		if (!systemjson.sensorStoreInterval) {
			sensorStoreInterval = setInterval(sensorStore,3000);
		} else {
			sensorStoreInterval = setInterval(sensorStore,systemjson.sensorInterval);
		}
		*/
	})
}