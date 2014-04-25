//var gpio = require('rpi-gpio');
var gpio = require('./fakerpi-gpio.js') //when testing on something other than a pi
var async = require('async');

var allowablePins = [11,12,13,15,16,18];

exports.addEquipment = function(systemjson,newPin,callback) {
	var existcheck = false;
	async.each(systemjson.equipment,function(equipment,cb){
		if (equipment.address == newPin.address) {
			existcheck = true;
		}
		cb();
	},function(err){
		if (existcheck == false) {
			if (!newPin.safeValue) {
				newPin.safeValue = 0;
			}
			if (!newPin.value) {
				newPin.value = 0;
			}
			systemjson.equipment.push(newPin)
			callback(true,systemjson)
		} else {
			callback(false)
		}
	})
}

exports.updateEquipment = function(systemjson,updateequipment,callback) {
	var changecheck = false;
	async.each(systemjson.equipment,function(equipment,cb){
		async.each(updateequipment,function(updateequip,cb2){
			if (equipment.address == updateequip.address) {
				//check to see what, if anything, changed
				if (equipment.name != updateequip.name) {
					equipment.name = updateequip.name;
					changecheck = true;
				}
				if (equipment.type != updateequip.type) {
					equipment.type = updateequip.type;
					changecheck = true;
				}
				if (equipment.targets != updateequip.targets) {
					equipment.targets = updateequip.targets;
					changecheck = true;
				}
				if (equipment.location != updateequip.location) {
					equipment.location = updateequip.location;
					changecheck = true;
				}
				if (equipment.value != updateequip.value) {
					equipment.value = updateequip.value;
					changecheck = true;
				}
				if (equipment.safeValue != updateequip.safeValue) {
					equipment.safeValue = updateequip.safeValue;
					changecheck = true;
				}
			}
			cb2();
		},
		function(err){
			cb();
		})
	},function(err){
		if (changecheck == true) {
			callback(true,systemjson)
		} else {
			callback(false)
		}

	})
}

exports.removeEquipment = function(systemjson,gpioPin,callback) {
	var existcheck = false;
	gpio.write(gpioPin.address,gpioPin.safeValue,function(err){
		if(err) console.log('Error:',err);
		console.log('Pin',gpioPin.address,'made safe.');
	});
	async.each(systemjson.equipment,function(equipment,cb){
		if (equipment.address == gpioPin.address) {
			existcheck = true;
			for (var i = 0; i < systemjson.equipment.length; i++) {
				if (systemjson.equipment[i].address == gpioPin.address) {
					systemjson.equipment.splice(i,1);
				}
			}
		}
		cb();
	},function(err){
		if (existcheck == true) {
			callback(true,systemjson)
		} else {
			callback(false)
		}

	})
}

exports.allowablePins = function(socket) {
	socket.emit('allowablepins',{'allowablepins':allowablePins});
}

exports.initPins = function(equipment,callback) {
	async.each(allowablePins,function(gpioPin,acb){
		gpio.setup(gpioPin, gpio.DIR_OUT, function(){
			//go through equipment and see if it exists/what the value should be, otherwise turn it off
			var writeValue = 0;
			async.each(equipment,function(item,cb){
				if (item.address == gpioPin) {
					writeValue = item.value;
				}
				cb();
			},function(err){
				gpio.write(gpioPin,writeValue,function(err){
					if (err) console.log('Error:',err)
					console.log('Pin',gpioPin,'initialized and turned to ',writeValue);
				})
			})
		});
	},function(err){
		callback();
	})
}

exports.togglePin = function(systemjson,gpioPin,pinaction,callback) {
	var existcheck = false;
	var changevalue = false;
	async.each(systemjson.equipment,function(equipment,cb){
		if (equipment.address == gpioPin.address) {
			existcheck = true;
			if (pinaction == "toggle") {
				changevalue = true;
				if (equipment.value == 1) {
					equipment.value = 0;
				} else {
					equipment.value = 1;
				}
			}
			if (pinaction == "on") {
				if (equipment.safeValue == 1) {
					if (equipment.value == 1) {
						changevalue = true;
					}
					equipment.value = 0;
				} else {
					if (equipment.value == 0) {
						changevalue = true;
					}
					equipment.value = 1;
				}
			}
			if (pinaction == "off") {
				if (equipment.safeValue == 1) {
					if (equipment.value == 0) {
						changevalue = true;
					}
					equipment.value = 1;
				} else {
					if (equipment.value == 1) {
						changevalue = true;
					}
					equipment.value = 0;
				}
			}
			gpio.write(equipment.address,equipment.value,function(err){
				console.log('Error:',err);
				cb();
			});
		} else {
			cb();
		}
		
	},function(err){
		if (existcheck == true && changevalue == true) {
			callback(true,systemjson)
		} else {
			callback(false)
		}
	})
}
exports.toggleAll = function(systemjson,callback) {
	async.each(systemjson.equipment,function(equipment,cb){
		gpio.write(equipment.address,equipment.safeValue,function(err){
			equipment.value = equipment.safeValue;
			cb();
		});
	},function(err){
		callback(systemjson)
	})
}

exports.killPins = function(equipment,callback) {
	async.each(allowablePins,function(gpioPin,acb){
		var writeValue = 0;
		async.each(equipment,function(item,cb){
			if (item.address == gpioPin) {
				writeValue = item.safeValue;
			}
			cb();
		},function(err){
			gpio.write(gpioPin,writeValue,function(err){
				if (err) console.log('Error:',err)
				console.log('Pin',gpioPin,'initialized and made safe.');
			})
		})
	},function(err){
		gpio.destroy(function() {
			console.log('All pins unexported.');
			callback();
			
		})
	})
}