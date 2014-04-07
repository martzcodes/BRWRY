//var gpio = require('rpi-gpio');
var gpio = require('./fakerpi-gpio.js') //when testing on something other than a pi

var allowablePins = [11,12,13,15,16,18];

exports.allowablePins = function(socket) {
	socket.emit('allowablepins',{'allowablepins':allowablePins});
}

function pinStates(socket,Equipment){
	Equipment.find({}, function(err,equipment){
		socket.emit('gpiopinout',{'gpiopinout':equipment});
	});
}

exports.pinStates = function(socket,Equipment) {
	pinStates(socket,Equipment);
}

exports.logPins = function(Equipment,brew) {
	Equipment.find({}, function(err,equipment){
		brew.equipmentLog(equipment);
	});	
}

exports.devPin = function(socket,Equipment) {
	Equipment.create({
		name: 'Test Light 1',
		type: 'LED',
		address: 16,
		location: 'Development', //Description of where it is in the process
		modes: ['on','off'],
		value: 1,
		state: 1,
		date: Date(),
		pidtime: 1,
		laststate: Date(),
		safeValue: 1,
		linked: []
	});
	console.log('Created dev equipment!')
}

exports.initPins = function(socket,Equipment) {
	Equipment.find({},function (err, equipment) {
		equipment.forEach(function(gpioPin){
			gpio.setup(gpioPin.address, gpio.DIR_OUT, function(){
				gpio.write(gpioPin.address,gpioPin.value,function(err){
					if (err) console.log('Error:',err)
					console.log('Pin',gpioPin.address,'initialized and turned',gpioPin.modes[gpioPin.state]);
				})
			});
		})
	});
}

exports.togglePin = function(socket,Equipment,gpioPin) {
	var currentState = gpioPin.state;
	var newState, newValue;
	if (currentState == 0) {
		//pin is off, turn it on
		newState = 1;
		newValue = 1;
	} else if (currentState >= 1) {
		//pin is on or in PID mode, turn it off
		newState = 0;
		newValue = 0;
	}
	//Update the database
	Equipment.update({address:gpioPin.address},{value:newValue,
		state:newState,date:Date(),lastState:Date()},function (err, numberAffected, raw) {
			if (err) console.log('Error:',err);
			//console.log('The raw response from Mongo was ', raw);
			pinStates(socket,Equipment);
	});
	gpio.write(gpioPin.address,newValue,function(err){
		if(err) console.log('Error:',err);
		console.log('Pin',gpioPin.address,'turned',gpioPin.modes[newState]);
	});
}

exports.toggleAllPin = function(socket,Equipment) {
	//Turn all pins off
	Equipment.find({},function (err, equipment){
		equipment.forEach(function(gpioPin){
			Equipment.update({address:gpioPin.address},{value:gpioPin.safeValue,
				state:gpioPin.safeValue,date:Date(),lastState:Date()},function (err, numberAffected, raw) {
					if (err) console.log('Error:',err);
					gpio.write(gpioPin.address,gpioPin.safeValue,function(err){
						console.log('Error:',err);
					});
					//console.log('The raw response from Mongo was ', raw);
			});
		})
		pinStates(socket,Equipment);
	})
}

exports.updatePin = function(socket,Equipment,gpioPin) {
	//Check if it's in the database
	Equipment.findOne({address:gpioPin.address},function (err, equipment) {
		var newValue;
		var safeValue;
		console.log('gpioPin:',gpioPin)
		if (gpioPin.value == true) {
			newValue = 1;
		} else if (gpioPin.value == false) {
			newValue = 0;
		} else {
			newValue = gpioPin.value;
		}
		if (gpioPin.safeValue == true) {
			safeValue = 1;
		} else if (gpioPin.safeValue == false) {
			safeValue = 0;
		} else {
			safeValue = gpioPin.safeValue;
		}
		if (!equipment) {
			allowablePins.forEach(function(allowablePin){
				if (allowablePin == gpioPin.address){
					Equipment.create({
						name: 'unnamed',
						type: 'LED',
						address: gpioPin.address,
						location: 'Development', //Description of where it is in the process
						modes: ['on','off'],
						value: newValue,
						state: newValue,
						date: Date(),
						pidtime: 1,
						laststate: Date(),
						safeValue: safeValue,
						linked: []
					},function(err,equipment){
						pinStates(socket,Equipment);
						gpio.setup(gpioPin.address, gpio.DIR_OUT, function(){
							gpio.write(gpioPin.address,gpioPin.value,function(err){
								if (err) console.log('Error:',err)
								console.log('Pin',equipment.address,'initialized and turned',equipment.modes[equipment.state]);
							})
						});
					});
				}
			})
		} else {
			//equipment exists
			newValue = gpioPin.value;
			Equipment.update({address:gpioPin.address},{value:newValue,safeValue:safeValue,
				state:newValue,date:Date(),lastState:Date()},function (err, numberAffected, raw) {
					if (err) console.log('Error:',err);
					gpio.write(gpioPin.address,newValue,function(err){
						console.log('Error:',err);
					});
					pinStates(socket,Equipment);
					//console.log('The raw response from Mongo was ', raw);
			});
		}
	})
}

exports.updateAllPin = function(socket,Equipment,gpioPins) {
	//Check if it's in the database
	gpioPins.forEach(function(gpioPin){
		Equipment.findOne({address:gpioPin.address},function (err, equipment) {
			var newValue;
			var safeValue;
			console.log('gpioPin:',gpioPin)
			if (gpioPin.value == true) {
				newValue = 1;
			} else if (gpioPin.value == false) {
				newValue = 0;
			} else {
				newValue = gpioPin.value;
			}
			if (gpioPin.safeValue == true) {
				safeValue = 1;
			} else if (gpioPin.safeValue == false) {
				safeValue = 0;
			} else {
				safeValue = gpioPin.safeValue;
			}
			//equipment exists
			newValue = gpioPin.value;
			Equipment.update({address:gpioPin.address},{value:newValue,safeValue:safeValue,
				state:newValue,date:Date(),lastState:Date()},function (err, numberAffected, raw) {
					if (err) console.log('Error:',err);
					gpio.write(gpioPin.address,newValue,function(err){
						console.log('Error:',err);
					});
					pinStates(socket,Equipment);
					//console.log('The raw response from Mongo was ', raw);
			});
		})
	})
}

exports.removePin = function(socket,Equipment,gpioPin) {
	//Make it safe...
	gpio.write(gpioPin.address,gpioPin.safeValue,function(err){
		if(err) console.log('Error:',err);
		console.log('Pin',gpioPin.address,'made safe.');
	});
	//remove from database:
	Equipment.remove({address:gpioPin.address}, function (err) {
		console.log('removePin err:',err);
		pinStates(socket,Equipment);
	});
}

exports.killPins = function(Equipment) {
	Equipment.find({},function (err, equipment) {
		equipment.forEach(function(gpioPin){
			gpio.write(gpioPin.address, gpioPin.safeValue);
			console.log('All pins safe.')
		})
		gpio.destroy(function() {
			console.log('All pins unexported.');
			return process.exit(0);
		})
	})
}