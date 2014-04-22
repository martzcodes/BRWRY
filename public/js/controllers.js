'use strict';
angular.module('brwryApp.controllers')
	.controller('BrewCtrl', ['$scope','$http','socket','System', function ($scope,$http,socket,System) {
		var tempout = "";

		$scope.alerts = [];

		$scope.closeAlert = function(index) {
			$scope.alerts.splice(index, 1);
		};

		System.get({},function(data){
			$scope.system = data;
		})

		$scope.toggleGPIO = function(system,gpioPin) {
		  	//console.log('toggled in ctrler',gpioPin);
		  	//socket.emit('send:toggleGPIO', gpioPin);
		  	console.log(gpioPin)
		  	var data = {type:'toggle',system:system,gpioPin:gpioPin}
		  	System.update({},data);
		}

		$scope.getInternal = function(callback) {
			$http({method: 'GET', url: '/api/internal'})
				.success(function(responsedata, status, headers, config) {
				// this callback will be called asynchronously
				// when the response is available
					callback(responsedata);
				})
				.error(function(responsedata, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
					callback({});
				});
		}

		socket.on('basic', function (data) {
			$scope.system = {
				systemname:data.systemname,
				brewername:data.brewername,
				currentbrew:data.currentbrew,
				brewstate:data.brewstate
			}
			$scope.alerts.push({ type: 'success', msg: 'Updated Information!' });
		});

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
		$scope.alerts = [];

		$scope.closeAlert = function(index) {
			$scope.alerts.splice(index, 1);
		};

		$scope.availablePins = [11,12,13,15,16,18];

		$scope.pinSet = function(selectedPin) {
			if ($scope.newPin) {
				$scope.newPin.address = selectedPin;
			} else {
				$scope.newPin = {address:selectedPin}
			}
		}

		$scope.getEquipmentStatus = function(gpioPin) {
			if(gpioPin.value != gpioPin.safeValue) {
				return "On"
			} else {
				return "Off"
			}
		}

		$scope.getEquipmentClass = function(gpioPin) {
			if(gpioPin.value != gpioPin.safeValue) {
				return "btn-danger"
			} else {
				return "btn-success"
			}
		}

		System.get({},function(data){
			$scope.system = data;
			for (var i = 0; i < $scope.system.equipment.length; i++) {
				for (var j = 0; j < $scope.availablePins.length; j++) {
					if ($scope.system.equipment[i].address == $scope.availablePins[j]) {
						$scope.availablePins.splice(j,1);
					}
				}
			}
			if ($scope.newPin) {
				$scope.newPin.address = $scope.availablePins[0];
			} else {
				$scope.newPin = {address:$scope.availablePins[0]}
			}
		})

		socket.on('tempout', function (data) {
			$scope.temperatures = data.tempout;
		});
		socket.on('basic', function (data) {
			$scope.system = data;
			$scope.alerts.push({ type: 'success', msg: 'Updated Information!' });
		});
		socket.on('sensor', function (data) {
			$scope.system.sensors = data.sensors;
			$scope.alerts.push({ type: 'success', msg: 'Updated Sensors!' });
		});
		socket.on('equipment', function (data) {
			$scope.system.equipment = data.equipment;
			$scope.alerts.push({ type: 'success', msg: 'Updated Equipment!' });
		});
		socket.on('toggle', function (data) {
			$scope.system.equipment = data.equipment;
			//$scope.alerts.push({ type: 'danger', msg: 'All Equipment Safe!' });
		});
		socket.on('togglesafe', function (data) {
			$scope.system.equipment = data.equipment;
			$scope.alerts.push({ type: 'danger', msg: 'All Equipment Safe!' });
		});
		socket.on('equipmentadd', function (data) {
			$scope.newPin = {address:$scope.availablePins[0]};

			$scope.system.equipment = data.equipment;
			$scope.alerts.push({ type: 'success', msg: 'Equipment Added!' });
		})
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
		$scope.updateSensors = function(system) {
			system.type = 'sensor';
			System.update({},system)
		}
		$scope.newGPIO = function(system,newPin) {
			var data = {type:'addequipment',system:system,newPin:newPin}
			for (var j = 0; j < $scope.availablePins.length; j++) {
				if (newPin.address == $scope.availablePins[j]) {
					$scope.availablePins.splice(j,1);
				}
			}
			//console.log('toggled in ctrler',gpioPin);
			//socket.emit('send:updateGPIO', gpioPin);
			System.update({},data)
		}

		$scope.toggleGPIO = function(system,gpioPin) {
		  	//console.log('toggled in ctrler',gpioPin);
		  	//socket.emit('send:toggleGPIO', gpioPin);
		  	var data = {type:'toggle',system:system,gpioPin:gpioPin}
		  	System.update({},data);
		}

		$scope.toggleAllGPIO = function() {
		  	//console.log('toggled in ctrler',gpioPin);
		  	//socket.emit('send:toggleAllGPIO');
		  	var data = {type:'toggleall'}
		  	System.update({},data);
		}

		$scope.updateAllGPIO = function(system) {
			//console.log('toggled in ctrler',gpioPin);
			//socket.emit('send:updateAllGPIO', gpioPins);
			var data = {type:'updateequipment',system:system}
			System.update({},data)
		}
		$scope.removeGPIO = function(system,gpioPin) {
			var data = {type:'removeequipment',system:system,gpioPin:gpioPin}
			//console.log('toggled in ctrler',gpioPin);
			//socket.emit('send:updateGPIO', gpioPin);
			if ($scope.availablePins.length == 0) {
				if ($scope.newPin) {
					$scope.newPin.address = gpioPin.address;
				} else {
					$scope.newPin = {address: gpioPin.address};
				}
			}
			$scope.availablePins.push(gpioPin.address)
			System.update({},data)
		}
	}]);