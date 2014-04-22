//may or may not work
//For testing on something other than a pi (vagrant machine, for instance)
//generates a random "temperature" every time it's called

var sensors = function(callback) {
	var parts = ["test-address","test-address-two"];
	callback(null, parts);
}
exports.sensors = sensors;


var temperature = function(sensor, callback) {
	var value = Math.floor((Math.random()*1000)+1)/10;
	callback(null, value);
};
exports.temperature = temperature;