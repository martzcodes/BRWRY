var sensor = require('./sensor.js');
var brew = require('./brew.js');
var system = require('./system.js');
var equipment = require('./equipment.js');

exports.sensor = sensor;
exports.brew = brew;
exports.system = system;
exports.equipment = equipment;

var socket;

exports.socketio = function(io){
	socket = io.sockets;
	system.setSocket(io.sockets);
}

// Main application view
exports.index = function(req, res) {
	res.render('index');
};

exports.connect = function() {
	system.lastTempOut();
	/*
	system.loadSystem(sio,System);

	sensors.checkSensors(sio,Sensor);
	
	equipment.pinStates(sio,Equipment);
	
	equipment.allowablePins(sio);

	brew.sendData();
	*/
	socket.on('send:updateSystem',function(data){
		//system.updateSystem(sio,System,data);
	});
	socket.on('send:newBrew',function(data){
		//system.newBrew(sio,System,data);
		//brew.startBrew(data);
	});
	socket.on('send:stopBrew',function(){
		//system.stopBrew(sio,System);
		//brew.stopBrew();
	});

	socket.on('send:toggleGPIO',function(gpioPin){
		//equipment.togglePin(sio,Equipment,gpioPin);
		//equipment.logPins(Equipment,brew);
	});

	socket.on('send:toggleAllGPIO',function(){
		//Turn all pins off (emergency off)
		//equipment.toggleAllPin(sio,Equipment);
		//equipment.logPins(Equipment,brew);
	});

	socket.on('send:updateGPIO', function(gpioPin){
		//equipment.updatePin(sio,Equipment,gpioPin);
		//equipment.logPins(Equipment,brew);
	});

	socket.on('send:updateAllGPIO', function(gpioPin){
		//equipment.updateAllPin(sio,Equipment,gpioPin);
		//equipment.logPins(Equipment,brew);
	});

	socket.on('send:removeGPIO',function(gpioPin){
		//equipment.removePin(sio,Equipment,gpioPin);
		//equipment.logPins(Equipment,brew);
	});

	socket.on('send:updateSensor', function(sensor) {
		//sensor.updateSensor(sio,Sensor,sensor);
	});
	socket.on('send:updateSensors', function(tempsensors) {
		//sensor.updateSensors(sio,Sensor,tempsensors);
	});

}

exports.killPins = function(){
//	return equipment.killPins(Equipment);
}
