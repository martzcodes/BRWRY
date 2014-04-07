'use strict';

angular.module('brwryApp.directives', [])
	.directive('d3', function(){
		return {
      		restrict: 'E',
      		link: function (scope, element, attrs) {

				var margin = {top: 20, right: 20, bottom: 30, left: 50},
				    width = 960 - margin.left - margin.right,
				    height = 500 - margin.top - margin.bottom;

				var parseTime = d3.time.format("%X").parse;

				var x = d3.time.scale()
				    .range([0, width]);

				var y = d3.scale.linear()
				    .range([height, 0])
				    .domain([0,100]);

				var xAxis = d3.svg.axis()
				    .scale(x)
				    .orient("bottom");

				var yAxis = d3.svg.axis()
				    .scale(y)
				    .orient("left");

				var color = d3.scale.category10();

				var svg = d3.select("d3").append("svg")
				    .attr("width", width + margin.left + margin.right)
				    .attr("height", height + margin.top + margin.bottom)
				  .append("g")
				    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
				},true);
      		}
    	};
	});