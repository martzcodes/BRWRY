'use strict';

angular.module('brwryApp.directives', [])
	.directive('d3', function($window){
		return {
      		restrict: 'E',
      		link: function (scope, element, attrs) {
				var margin = {top: 10, right: 40, bottom: 30, left: 30};
				//var width = 960 - margin.left - margin.right;
				var vbwidth = $window.document.getElementById("d3chart").getBoundingClientRect().width;
				var width = vbwidth - margin.left - margin.right;
				if (width > 800) {
					width = 800;
				}
				var vbheight = 400;
				$window.document.getElementById("d3chart").style.height = vbheight
				var height = vbheight - margin.top - margin.bottom;
				
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
				
				var svg = d3.select("d3").append("svg")
					//.attr("viewBox", "0 0 "+vbwidth+" "+vbheight)
					.attr("width", vbwidth+"px")
					.attr("height", vbheight+"px")
					//.attr("preserveAspectRatio", "none")
					.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				/*
				angular.element($window).bind('resize', function() {
					var rewidth = $window.document.getElementById("d3chart").getBoundingClientRect().width;
					scope.$apply();
				});
				*/


				var chartdata = function(data) {
					svg.selectAll('*').remove();

					var line = d3.svg.line()
						.interpolate("basis")
					    .x(function(d) { return x(d.date); })
					    .y(function(d) { return y(d.temperature); });
					
					var area = d3.svg.area()
						.interpolate("basis")
						.x(function(d) { return x(d.date); })
						.y0(height)
						.y1(function(d) { return y(d.temperature); });

					color.domain(data[0])

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
						.attr("class", "area")
						.attr("d", function(d) { return area(data); });

					  sensor.append("path")
					      .attr("class", "line")
					      .attr("d", function(d) { return line(d.values); })
					      .style("stroke", function(d) { return color(d.name); });

					/*
					  sensor.append("text")
					      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
					      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
					      .attr("x", 3)
					      .attr("dy", ".35em")
					      .text(function(d) { return d.name; });
					*/

					var legend = svg.selectAll(".legend")
						.data(color.domain())
					  .enter().append("g")
						.attr("class", "legend")
						.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

					legend.append("rect")
						.attr("x", width - 18)
						.attr("width", 18)
						.attr("height", 18)
						.style("fill", color);

					legend.append("text")
						.attr("x", width - 24)
						.attr("y", 9)
						.attr("dy", ".35em")
						.style("text-anchor", "end")
						.text(function(d) { return d; });
				}

				var data = [];
      			scope.getInternal(function(internaldata){
      				//Date format: Sun Apr 20 2014 00:46:39 GMT+0000 (UTC)
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