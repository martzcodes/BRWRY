'use strict';

angular.module('brwryApp.directives', [])
	.directive('stopEvent', function () {
		return {
			restrict: 'A',
			link: function (scope, element, attr) {
				element.bind(attr.stopEvent, function (e) {
					e.stopPropagation();
				});
			}
		};
	}).directive('ngEnter', function () {
		return function (scope, element, attrs) {
			element.bind("keydown keypress", function (event) {
				if(event.which === 13) {
					scope.$apply(function (){
						scope.$eval(attrs.ngEnter);
					});

					event.preventDefault();
				}
			});
		};
	}).directive('numbersOnly', function () {
		return  {
			restrict: 'A',
			link: function (scope, elm, attrs, ctrl) {
				elm.on('keydown', function (event) {
					if ([8, 13, 27, 37, 38, 39, 40].indexOf(event.which) > -1) {
						// backspace, enter, escape, arrows
						return true;
					} else if (event.which >= 48 && event.which <= 57) {
						// numbers
						return true;
					} else if (event.which >= 96 && event.which <= 105) {
						// numpad number
						return true;
					} else if ([110, 190].indexOf(event.which) > -1) {
						// dot and numpad dot
						return true;
					}else {
						event.preventDefault();
						return false;
					}
				});
			}
		}
	}).directive('d3', function($window){
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
					.domain([15,105]);

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
						//.interpolate("basis")
						.x(function(d) { return x(d.date); })
						.y(function(d) { return y(d.temperature); });
					
					var heatarea = d3.svg.area()
						//.interpolate("basis")
						.x(function(d) { return x(d.date); })
						.y0(function(d) { return y(d.heattarget); })
						.y1(function(d) { return y(d.temperature); });

					var coolarea = d3.svg.area()
						//.interpolate("basis")
						.x(function(d) { return x(d.date); })
						.y0(function(d) { return y(d.cooltarget); })
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

					var hackyFill = function(d,i) {
						for (var j = 0; j < data.length; j++) {
							
							if (data[j].values[i].date == d.date && data[j].values[i].temperature == d.temperature) {
								return color(data[j].name);
							}
						}
					}

					var sensor = svg.selectAll(".sensor")
						  .data(data)
						.enter().append("g")
						  .attr("class", "sensor");

					  sensor.append("path")
						  .attr("class", "heatarea")
						  .attr("d", function(d) { return heatarea(d.values); })


					  sensor.append("path")
						  .attr("class", "coolarea")
						  .attr("d", function(d) { return coolarea(d.values); })


					  sensor.append("path")
						  .attr("class", "line")
						  .attr("d", function(d) { return line(d.values); })
						  .style("stroke", function(d) { return color(d.name); });

/*
					  sensor.append("clipPath")
						  .attr("id", "clip-below")
						.append("path")
						  .attr("d", area.y0(height));

					  sensor.append("clipPath")
						  .attr("id", "clip-above")
						.append("path")
						  .attr("d", area.y0(0));

					  sensor.append("path")
						  .attr("class", "area above")
						  .attr("clip-path", "url(#clip-above)")
						  .attr("d", area.y0(function(d) { return y(d["San Francisco"]); }));

					  sensor.append("path")
						  .attr("class", "area below")
						  .attr("clip-path", "url(#clip-below)")
						  .attr("d", area);
*/


					  sensor.selectAll("circle")
						  .data(function(d) {return d.values;})
						.enter().append("circle")
						  .attr("class","dot")
						  .attr("r", 2.5)
						  .attr("cx", function(d) { return x(d.date); })
						  .attr("cy", function(d) { return y(d.temperature); })
						  .style("fill", function(d,i) { return hackyFill(d,i);});

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
								data[i].values.push({
									date:Date.parse(newVal[j].datetime),
									temperature:newVal[j].temperature,
									heattarget:newVal[j].heattarget,
									cooltarget:newVal[j].cooltarget
								})
							}
						}
					}
					chartdata(data);
				})
			}
		};
	});