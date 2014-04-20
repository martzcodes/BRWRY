'use strict';

angular.module('brwryApp.directives', [])
	.directive('d3', function($window){
		return {
      		restrict: 'E',
      		link: function (scope, element, attrs) {
				var margin = {top: 10, right: 20, bottom: 30, left: 30};
				//var width = 960 - margin.left - margin.right;
				var width = $window.document.getElementById("d3chart").getBoundingClientRect().width - margin.left - margin.right;
				var aspect = 500 / 900;
				var height = (width * aspect) - margin.top - margin.bottom;
				//var height = 500 - margin.top - margin.bottom;

				//var parseTime = d3.time.format("%X").parse;

				var x = d3.time.scale()
				    .range([0, width]);

				var y = d3.scale.linear()
				    .range([height, 0])
				    .domain([0,100]);

				var color = d3.scale.category10();

				var xAxis = d3.svg.axis()
				    .scale(x)
				    .orient("bottom");

				var yAxis = d3.svg.axis()
				    .scale(y)
				    .orient("left");

				var color = d3.scale.category10();

				/*
				var svg = d3.select("d3").append("svg")
				    .attr("width", width + margin.left + margin.right)
				    .attr("height", height + margin.top + margin.bottom)
				  .append("g")
				    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				*/
				
				var svg = d3.select("d3").append("svg")
					.attr("preserveAspectRatio", "xMaxYMin")
					.attr("viewBox", "0 0 "+(900 + margin.left + margin.right)+" "+(500 + margin.top + margin.bottom))
				  .append("g")
				  	.attr("width", width + margin.left + margin.right)
					.attr("height", (width * aspect) + margin.top + margin.bottom)
				    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				angular.element($window).bind('resize', function() {
					var rewidth = $window.document.getElementById("d3chart").getBoundingClientRect().width;
					svg.attr("width", rewidth + margin.left + margin.right);
					svg.attr("height", (rewidth * aspect) + margin.top + margin.bottom);
					scope.$apply();
				});


				var chartdata = function(data) {
					svg.selectAll('*').remove();

					var line = d3.svg.line()
						.interpolate("basis")
					    .x(function(d) { return x(d.date); })
					    .y(function(d) { return y(d.temperature); });

					color.domain(d3.keys(data[0]).filter(function(key) { return key === "name"; }));

					//x.domain(d3.extent(data, function(d) {return d.date}));
					x.domain([
						d3.min(data, function(d) { return d3.min(d.values, function(v) { return v.date; }); }),
						d3.max(data, function(d) { return d3.max(d.values, function(v) { return v.date; }); })
					]);

					svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")")
						.call(xAxis);

					svg.append("g")
						.attr("class", "y axis")
						.call(yAxis)
					.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", 6)
						.attr("dy", ".71em")
						.style("text-anchor", "end")
						.text("Temperature C");

					var sensor = svg.selectAll(".sensor")
					      .data(data)
					    .enter().append("g")
					      .attr("class", "sensor");

					  sensor.append("path")
					      .attr("class", "line")
					      .attr("d", function(d) { return line(d.values); })
					      .style("stroke", function(d) { return color(d.name); });

					  sensor.append("text")
					      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
					      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
					      .attr("x", 3)
					      .attr("dy", ".35em")
					      .text(function(d) { return d.name; });
				}

				var data = [];
      			scope.getInternal(function(internaldata){
      				//Date format: Sun Apr 20 2014 00:46:39 GMT+0000 (UTC)
      				/*for(var key in internaldata) {
      					if (key != 'datetime') {
      						var values = [];
      						for (var i = 0; i < internaldata['datetime'].length; i++) {
      							values.push({date:Date.parse(internaldata['datetime'][i]),temperature:internaldata[key][i]})
      						}
							data.push({name: key, values: values});
						}
					}*/
					for (var i = 0; i < internaldata.length; i++) {
						for (var k = 0; k < internaldata[i].values.length; k++) {
							internaldata[i].values[k].date = Date.parse(internaldata[i].values[k].date);
						}
						data.push({name:internaldata[i].name,values:internaldata[i].values})
					}
					chartdata(data);
      			})

				scope.$watch('temperatures',function(newVal, oldVal) {
					if (!newVal) {
						return;
					}
					for (var i = 0; i < data.length; i++) {
						for (var j = 0; j < newVal.length; j++) {
							if (data[i].name == newVal[j].sensorname) {
								data[i].values.push({date:Date.parse(newVal[j].datetime),temperature:newVal[j].temperature})
							}
						}
					}
					chartdata(data);
				})

/*
      			scope.$watch('temperaturehistory', function (newVal, oldVal) {
      				svg.selectAll('*').remove();

      				// if 'val' is undefined, exit
			        if (!newVal) {
			          return;
			        }

					var line = d3.svg.line()
						.interpolate("basis")
					    .x(function(d) { return x(d.time); })
					    .y(function(d) { return y(d.value); });

					var data = scope.temperaturehistory;
					data.forEach(function(d) {
						//console.log(d.time);
						//d.time = parseTime(d.time);
						d.value = +d.value;
					});

					x.domain(d3.extent(data, function(d) { return d.time; }));
					//y.domain(d3.extent(data, function(d) { return d.value; }));

					svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")")
						.call(xAxis);

					svg.append("g")
						.attr("class", "y axis")
						.call(yAxis)
					.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", 6)
						.attr("dy", ".71em")
						.style("text-anchor", "end")
						.text("Temperature C");

					svg.append("path")
						.datum(data)
						.attr("class", "line")
						.attr("d", line);
				},true);
*/

/*
				scope.$watch('temperaturesecond', function (newVal, oldVal) {
      				svg.selectAll('*').remove();

      				// if 'val' is undefined, exit
			        if (!newVal) {
			          return;
			        }

					var line = d3.svg.line()
						.interpolate("basis")
					    .x(function(d) { return x(d.time); })
					    .y(function(d) { return y(d.value); });

					var data = scope.temperaturesecond;
//need to limit the size of temperaturesecond
					
					var keys = d3.set();

					data.forEach(function(d) {
						d3.keys(d).forEach(function(key) {
							if (key != "time") {
								if (!d3.set(keys).has(key)) {
									keys.add(key);
								}	
							}
						});
						//console.log(d.time);
						//d.time = parseTime(d.time);
						//d.value = +d.value;
					});

//NEED TO FIX THIS PART:
					color.domain(keys);

					var temps = color.domain().map(function(name) {
						return {
							name: name,
							values: data.map(function(d) {
								return {time: d.time, temperature: +d[name]};
							})
						};
					});
					console.log(temps);
					*/
					/*
					x.domain(d3.extent(data, function(d) { return d.time; }));
					//y.domain(d3.extent(data, function(d) { return d.value; }));

					svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")")
						.call(xAxis);

					svg.append("g")
						.attr("class", "y axis")
						.call(yAxis)
					.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", 6)
						.attr("dy", ".71em")
						.style("text-anchor", "end")
						.text("Temperature C");

					svg.append("path")
						.datum(data)
						.attr("class", "line")
						.attr("d", line);
					*/
				//},true);
      		}
    	};
	});