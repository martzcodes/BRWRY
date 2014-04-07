function emitSystem(socket,system) {
	socket.emit('system', {
		systemname: system.systemname,
		brewer:system.brewer,
		state:system.state,
		currentbrew:system.currentbrew
	});
	console.log('system: ',system)
}

function newSystem(socket,System) {
	System.create({
		systemname: 'New System Name',
		brewer: 'New Brewer',
		state: 0,
		currentbrew: '',
		currentbrewid: ''
	},function(err,system){
		if (err) {
			console.log('error:',err);
		} else {
			console.log('Created new system');
			emitSystem(socket,system);
		}
	});
}

exports.updateSystem = function(socket,System,data) {
	System.findOne({},function (err, system) {
		if (!system) {
			System.create({
				systemname: data.systemname,
				brewer: data.brewer,
				state: 0,
				currentbrew: '',
				currentbrewid: ''
			},function(err,newsystem){
				if (err) {
					console.log('error:',err);
				} else {
					console.log('Created new system');
					emitSystem(socket,newsystem);
				}
			});
		} else {
			System.findOneAndUpdate({},{
				systemname: data.systemname,
				brewer: data.brewer,
			},function (err, updatedsystem) {
				console.log('updated system');
				emitSystem(socket,updatedsystem);
			});
		}
	})
}
exports.newBrew = function(socket,System,data) {
	System.findOne({},function (err, system) {
		if (!system) {
			System.create({
				systemname: data.systemname,
				brewer: data.brewer,
				state: 1,
				currentbrew: data.currentbrew,
				currentbrewid: ''
			},function(err,newsystem){
				if (err) {
					console.log('error:',err);
				} else {
					console.log('Created new system, started brew');
					emitSystem(socket,newsystem);
				}
			});
		} else {
			System.findOneAndUpdate({},{
				state: 1,
				currentbrew: data.currentbrew
			},function (err, updatedsystem) {
				console.log('started brew');
				emitSystem(socket,updatedsystem);
			});
		}
	})
}
exports.stopBrew = function(socket,System,data) {
	System.findOne({},function (err, system) {
		if (!system) {
			System.create({
				systemname: data.systemname,
				brewer: data.brewer,
				state: 0,
				currentbrew: '',
				currentbrewid: ''
			},function(err,newsystem){
				if (err) {
					console.log('error:',err);
				} else {
					console.log('Created new system, stopped brew');
					emitSystem(socket,newsystem);
				}
			});
		} else {
			System.findOneAndUpdate({},{
				state: 0,
				currentbrew: '',
				currentbrewid: ''
			},function (err, updatedsystem) {
				console.log('stopped brew');
				emitSystem(socket,updatedsystem);
			});
		}
	})
}

exports.loadSystem = function(socket,System) {
	System.findOne({}, function(err, system) {
		if (err) {
			console.log("error: ",error)
		}
		if (!system) {
			newSystem(socket,System);
		} else {
			emitSystem(socket,system);
		}
	});
}