var currentbrew = '';
var model, control, socket;


function initSensors() {
	if (currentbrew != '') {
		model.sensor.find({}, function(err, sensors) {
			model.brew.findById(currentbrew, function(err, brew) {
				sensors.forEach(function(sensor){
					brew.sensors.push(sensor);
				});
				brew.save();
			})
		});
	} else {
		console.log('error, no current brew but init-ing sensors')
	}
}

function initEquipment() {
	if (currentbrew != '') {
		model.equipment.find({}, function(err, equipments) {
			model.brew.findById(currentbrew, function(err, brew) {
				equipments.forEach(function(equipment){
					brew.equipment.push(equipment);
				});
				brew.save();
			})
		});
	} else {
		console.log('error, no current brew but init-ing equipment')
	}
}

function brewSecond() {
	if (currentbrew != '') {
		var sensorObj = {
			time:Date(),
			//sensors:[]
		};
		var skipSensor = 0;

		model.sensor.find({},function(err,sensors){
			sensors.forEach(function(sensor){
				if (sensor.value != '' || sensor.value != null || !isNaN(sensor.value)) {
					sensorObj[sensor.address] = sensor.value;
					skipSensor = 1;
				}
			})
			if (skipSensor == 1) { //at least one sensor had data to store
				model.brew.findById(currentbrew, function(err, brew) {
					var popLength = brew.temperaturesecond.length - 300;
					if (popLength > 0) {
						for (var i=0;i<popLength;i++) {
							brew.temperaturesecond.pop(0);
						}
					}
					brew.temperaturesecond.push(sensorObj);
					socket.emit('brewdatasecond',{
						'temperaturesecond':brew.temperaturesecond
					});
					brew.save();
				});
			}
		});
	}
}

function brewMinute() {
	if (currentbrew != '') {
		var secondData;
		var sensorObj = {
			time:Date(),
			//sensors:[]
		}
		model.brew.findById(currentbrew, function(err, brew) {
			secondData = brew.temperaturesecond.slice(-1-9);  //last 10 entries
			secondData.forEach(function(second){
				for (key in second) {
					if (key != 'time') {
						if(isNaN(sensorObj[key])){
							sensorObj[key] = [second[key]];
						} else {
							sensorObj[key].push(second[key]);
						}
					}
				}
			})
			for (key in sensorObj) {
				if (key != 'time') {
					sensorObj[key] = sensorObj[key].reduce(function(a, b) { return a + b })/sensorObj[key].length;
				}
			}
			brew.temperatureminute.push(sensorObj);
			socket.emit('brewdataminute',{
				'temperatureminute':brew.temperatureminute
			});
			brew.save();
		})
	}
}

exports.equipmentLog = function(data) {
	if (currentbrew != '') {
		var equipmentObj = {
			time:Date(),
			equipment:[]
		}
		data.forEach(function(equipment){
			equipmentObj.equipment.push({
				address:equipment.address,
				value:equipment.value
			})
		})
		model.brew.findById(currentbrew, function(err, brew) {
			brew.dataequipment.push(equipmentObj);
			socket.emit('brewdataequipment',{
				'dataequipment':brew.dataequipment
			});
			brew.save();
		});
	}
}

exports.startBrew = function(data) {
	model.system.findOne({}, function(err, system) {
		if (err) {
			console.log("error: ",error)
		}
		if (system.currentbrewid != '') {
			model.brew.findByIdAndUpdate(system.currentbrewid,{status:'Active'});
		} else {
			model.brew.create({
				name: data.currentbrew,
				brewer: data.brewer,
				brewday: Date(),
				sensors: [],
				equipment: [],
				steps: [],
				status: 'Active',
				previous: [],
				temperatureminute: [],
				temperaturesecond: [],
				dataequipment: []
			},function(err,newbrew){
				if (err) {
					console.log('error:',err);
				} else {
					console.log('Created new brew, active');
					console.log('newbrew id:',newbrew._id)
					system.currentbrewid = newbrew._id;
					system.save();
					currentbrew = newbrew._id;
					//initialize sensor list
					initSensors();
					//initialize equipment list
					initEquipment();
				}
			});
		}
	});
}

exports.stopBrew = function() {
	if (currentbrew != '') {
		model.brew.findByIdAndUpdate(currentbrew, {state:0},function(err, brew) {
			currentbrew = '';
		});
	}
}

exports.sendData = function() {
	if (currentbrew != '') {
		model.brew.findById(currentbrew, function(err, brew) {
			socket.emit('brewdata',{
				'temperaturesecond':brew.temperaturesecond,
				'temperatureminute':brew.temperatureminute,
				'dataequipment':brew.dataequipment
			});
		});
	}
}

exports.initBrew = function(initBrew,initEquipment,initSensor,initSystem,initSocket) {
	model = {
		system:initSystem,
		sensor:initSensor,
		equipment:initEquipment,
		brew:initBrew
	};

	socket = initSocket;

	model.system.findOne({}, function(err, system) {
		if (err) {
			console.log("error: ",error)
		}
		if (system.currentbrewid != '') {
			currentbrew = system.currentbrewid;
			model.brew.findByIdAndUpdate(system.currentbrewid,{status:'Active'});
		}
	});

	setInterval(function(){
		brewSecond();
	},1000);
	setTimeout(function(){
		setInterval(function(){
			brewMinute();
		},60000);
	},60000);
}