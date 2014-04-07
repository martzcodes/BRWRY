var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.set('theport', process.env.VCAP_APP_PORT || 3000);
app.set('theip', process.env.VCAP_APP_IP || "0.0.0.0");
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Handle Errors
app.use(function(err, req, res, next) {
	if(!err) return next();
	console.log(err.stack);
	res.json({error: true});
});

//Pass io to routes so that other modules can use it
routes.socketio(io);

// Main App
app.get('/', routes.index);

app.get('/api/system', routes.system.all);
app.get('/api/sensors', routes.system.sensors);
app.get('/api/equipment', routes.system.equipment);
app.put('/api/system', routes.system.update);

app.get('/api/brews', routes.brew.all);
app.post('/api/brews', routes.brew.create);
app.put('/api/brews/:brewId', routes.brew.update);
app.del('/api/brews/:brewId', routes.brew.destroy);

/*
app.get('/api/sensors', routes.sensor.all);
app.get('/api/equipment', routes.equipment.all);
app.get('/api/brews', routes.brew.all);
app.get('/api/system', routes.system.all);

app.post('/api/sensors', routes.sensor.create);
app.post('/api/equipment', routes.equipment.create);
app.post('/api/brews', routes.brew.create);

app.put('/api/sensors/:sensorId', routes.sensor.update);
app.put('/api/equipment/:equipmentId', routes.equipment.update);
app.put('/api/brews/:brewId', routes.brew.update);
app.put('/api/system', routes.system.update);

app.del('/api/sensors/:sensorId', routes.sensor.destroy);
app.del('/api/equipment/:equipmentId', routes.equipment.destroy);
app.del('/api/brews/:brewId', routes.brew.destroy);

app.param('sensorId', routes.sensor.id);
app.param('equipmentId', routes.equipment.id);
app.param('brewId', routes.brew.id);
*/

io.sockets.on('connection',routes.connect)

server.listen(app.get('theport'),app.get('theip'), function() {
	console.log('BRWRY running on ' + app.get('theip') + ':' + app.get('theport'));
});

process.stdin.resume();//so the program will not close instantly
process.on('exit', function (){
	console.log('Goodbye!');
});
process.on('SIGINT', function () {
	console.log('Got SIGINT.  Exiting...');
	routes.killPins();
	setTimeout(function(){
		process.exit();	
	}, 1000);
});