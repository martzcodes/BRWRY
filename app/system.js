var system = require('../routes/system.js');
var async = require('async');

var sensorLength;
var sensorInterval;
var sensorStoreInterval;
var systemjson;
var temperatureData = {datetime:[]};
var socket;
var lasttempout;

var sensorCheck = function() {
	var sensors = systemjson.sensors;
	system.checkTemp(sensors,function(tempout){
		lasttempout = tempout;
		if (!sensorLength) sensorLength = 120;
		if (temperatureData.datetime.length == sensorLength) {
			temperatureData.datetime.shift();
		};
		temperatureData.datetime.push(Date());
		async.each(tempout,function(temperature,cb){
			if (temperatureData[temperature.sensoraddress]) {
				if (temperatureData[temperature.sensoraddress].length == sensorLength) {
					temperatureData[temperature.sensoraddress].shift();
				};
				temperatureData[temperature.sensoraddress].push(temperature.temperature);
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