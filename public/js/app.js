var brwryApp = angular.module('brwryApp', ['ui.router','ngResource','ui.bootstrap','ui.router',
	'brwryApp.controllers','brwryApp.directives','brwryApp.services'])
	.config(function($stateProvider, $urlRouterProvider) {
		//
		// For any unmatched url, redirect to /state1
		$urlRouterProvider.otherwise("/");
		//
		// Now set up the states
		$stateProvider
		.state('home', {
			url: "/",
			templateUrl: "partials/home.html",
			controller: 'BrewCtrl'
		})
		.state('setup', {
			url: "/setup",
			templateUrl: "partials/setup.html",
			controller: 'BrewSetupCtrl'
		})
	})
	.run(
		[          '$rootScope', '$state', '$stateParams',
			function ($rootScope,   $state,   $stateParams) {

				// It's very handy to add references to $state and $stateParams to the $rootScope
				// so that you can access them from any scope within your applications.For example,
				// <li ui-sref-active="active }"> will set the <li> // to active whenever
				// 'contacts.list' or one of its decendents is active.
				$rootScope.$state = $state;
				$rootScope.$stateParams = $stateParams;
			}
		]
	)

angular.module('brwryApp.controllers', []);
angular.module('brwryApp.directives', []);
angular.module('brwryApp.services', []);