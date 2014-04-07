'use strict';

angular.module('brwryApp.services', ['ngResource'])
	.factory('System', function($resource) {
	    return $resource('api/system/', {}, {
	        update: { method: 'PUT' } });
		})
	.factory('Recipe', function($resource) {
		return $resource('/recipe/:recipeid', {}, {
			// Use this method for getting a list of recipes
			query: { method: 'GET', params: { recipeId: 'recipe' }, isArray: true } });
		})
	.factory('History', function($resource) {
		return $resource('/history/:historyid', {}, {
			// Use this method for getting a list of previous brews
			query: { method: 'GET', params: { historyId: 'histories' }, isArray: true } });
		})
	.factory('socket', function($rootScope) {
		var socket = io.connect();
		return {
			on: function (eventName, callback) {
				socket.on(eventName, function() {
					var args = arguments;
					$rootScope.$apply(function () {
						callback.apply(socket, args);
					});
				});
			},
			emit: function (eventName, data, callback) {
				socket.emit(eventName, data, function () {
					var args = arguments;
					$rootScope.$apply(function () {
						if (callback) {
							callback.apply(socket,args);
						}
					});
				});
			}
		};
	});