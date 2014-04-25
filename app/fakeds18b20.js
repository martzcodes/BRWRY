//For testing on something other than a pi (vagrant machine, for instance)
//generates a random "temperature" every time it's called

var sensors = function(callback) {
	var parts = ["test-address","test-address-two"];
	callback(null, parts);
}
exports.sensors = sensors;

var temperature = function(sensor, callback) {
	//random number
	var value = Math.floor((Math.random()*1000)+1)/10;
	
	//generates a sinusoidal over a 15 minute period
	var d = new Date();
	var min = d.getMinutes();
	var sec = d.getSeconds();

	if (sensor == "test-address") {
		value = (60 + Math.sin((min+(sec/60))*6*4*Math.PI/180)*40).toFixed(2);
	} else {
		value = (60 + Math.cos((min+(sec/60))*6*12*Math.PI/180)*40).toFixed(2);
	}
	
	callback(null, value);
};
exports.temperature = temperature; 