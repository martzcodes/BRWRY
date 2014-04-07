'use strict';
angular.module('brwryApp.controllers')
	.controller('BrewCtrl', ['$scope','socket', 'System', function ($scope,socket,System) {
		var tempout = "";

		System.get({},function(data){
			$scope.system = data;
		})


		socket.on('system', function (data) {
			$scope.system = {
				systemname:data.systemname,
				brewername:data.brewername,
				currentbrew:data.currentbrew,
				brewstate:data.brewstate
			}
		});

		socket.on('brewdata', function (data){
			$scope.temperaturesecond = data.temperaturesecond;
			$scope.temperatureminute = data.temperatureminute;
			$scope.dataequipment = data.dataequipment;
		})
		socket.on('brewdatasecond', function (data){
			$scope.temperaturesecond = data.temperaturesecond;
		})
		socket.on('brewdataminute', function (data){
			$scope.temperatureminute = data.temperatureminute;
		})
		socket.on('brewdataequipment', function (data){
			$scope.dataequipment = data.dataequipment;
		})

		socket.on('tempout', function (data) {
			$scope.temperatures = data.tempout;
			var tempObj = {time:Date.parse(data.tempout[0].date),value:data.tempout[0].value,name:data.tempout[0].name};
			if (!$scope.temperaturehistory) {
				$scope.temperaturehistory = [tempObj];
			} else {
				$scope.temperaturehistory.push(tempObj);
			}
		});

		socket.on('checksensors', function (data) {
			$scope.checksensors = data.checksensors;
		});

		socket.on('allowablepins', function (data) {
			$scope.allowablepins = data.allowablepins;
		});

		socket.on('gpiopinout', function (data) {
			$scope.gpioPins = data.gpiopinout;
		});

		$scope.toggleGPIO = function(gpioPin) {
		  	//console.log('toggled in ctrler',gpioPin);
		  	socket.emit('send:toggleGPIO', gpioPin);
		}

		$scope.toggleAllGPIO = function() {
		  	//console.log('toggled in ctrler',gpioPin);
		  	socket.emit('send:toggleAllGPIO');
		}

		$scope.newBrew = function(system) {
			system.type = 'brew';
			socket.emit('send:newBrew', system);
			System.update({},system);
		}
		$scope.stopBrew = function() {
			socket.emit('send:stopBrew');
			system.type = 'brew';
			System.update({},system);
		}
	}])
	.controller('BrewSetupCtrl', ['$scope','socket', 'System', function ($scope,socket,System) {

		System.get({},function(data){
			$scope.system = data;
		})

		socket.on('tempout', function (data) {
			$scope.temperatures = data.tempout;
		});

		socket.on('checksensors', function (data) {
			$scope.checksensors = data.checksensors;
		});

		socket.on('gpiopinout', function (data) {
			$scope.gpioPins = data.gpiopinout;
		});

		$scope.updateSystem = function(system) {
			system.type = 'basic';
			socket.emit('send:updateSystem', system);
			System.update({},system);
		}
/*
		$scope.updateSensor = function(sensor) {
			socket.emit('send:updateSensor', sensor);
		}
		*/
		$scope.updateSensors = function(system) {
			system.type = 'sensor'
			socket.emit('send:updateSensors', system.sensors);
			System.update({},system)
		}
		$scope.updateGPIO = function(gpioPin) {
			//console.log('toggled in ctrler',gpioPin);
			socket.emit('send:updateGPIO', gpioPin);
		}
		$scope.updateAllGPIO = function(gpioPins) {
			//console.log('toggled in ctrler',gpioPin);
			socket.emit('send:updateAllGPIO', gpioPins);
		}
		$scope.removeGPIO = function(gpioPin) {
			//console.log('toggled in ctrler',gpioPin);
			socket.emit('send:removeGPIO', gpioPin);
		}
	}]);