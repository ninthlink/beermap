/* https://angular-ui.github.io/angular-google-maps/#!/use */
(function() {
	angular
		.module('beerMap', ['ui.router', 'ngAnimate', 'google-maps'.ns()])
		.controller('beerMapd', beerMapd)
		.controller('breweryList', breweryList)
		.config([
			'GoogleMapApiProvider'.ns(),
			function (GoogleMapApi) {
				GoogleMapApi.configure({
					key: 'AIzaSyCUwl6lVEzZGsbFp8-QKu3FYwFcOEPgUo4',
					v: '3.17',
					libraries: 'weather,geometry,visualization'
				});
			}
			])
		.config([
			'$stateProvider',
			'$urlRouterProvider',
			function($stateProvider, $urlRouterProvider) {
				$stateProvider
					.state('home', {
						url: '/home',
						templateUrl: './partials/home.html',
						controller: 'beerMapd'
					})
				$urlRouterProvider.otherwise('home');
			}
		])
		.config([
			'$stateProvider',
			'$urlRouterProvider',
			function($stateProvider, $urlRouterProvider) {
				$stateProvider
					.state('list', {
						url: '/list',
						templateUrl: './partials/list.html',
						controller: 'breweryList'
					})
				$urlRouterProvider.otherwise('home');
			}
		]);
	
	beerMapd.$inject = ['$scope', '$http', 'locationFactory', 'GoogleMapApi'.ns()];
	
	function beerMapd($scope, $http, locationFactory, GoogleMapApi){
		$scope.map = {center: {latitude: 32.91, longitude: -117 }, zoom: 10 };
		$scope.options = {};//scrollwheel: false};
		$scope.coordsUpdates = 0;
		$scope.dynamicMoveCtr = 0;
		
		$scope.mapclass = '';
		$scope.brewon = false;
		
		$scope.boundary = {
			minlat: false,
			maxlat: false,
			minlng: false,
			maxlng: false
		};
		
		/**
		 * Get all brewery location markers from the locationFactory
		 *
		 * it also sets the markers inside function, so that can be cleaned up at some pt
		 */
		$scope.markers = locationFactory.loadAll($scope);
		
		/**
		 *	Get Map Stylesfrom external file [includes/map.styles.js]
		 *
		 *	Should we build in a dynamic style selector? For example, light versus dark app style?
		 */
		$scope.styles = mapStyles;

		/**
		 * HTML5 geolocation sensor
		 *
		 * should this be elsewhere?
		 */
		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				/**
				 * only center to new position if new position is within san diego area, +/- ?
				 * note : not sure if this always fires in the right order?
				 */
				if ( locationFactory.checkBounds( $scope.boundary, position.coords.latitude, position.coords.longitude, true ) ) {
					$scope.map.zoom = 12;
					$scope.map.center = { latitude: position.coords.latitude, longitude: position.coords.longitude };
					$scope.$apply();
					console.log('geoloc : all set');
				} else {
					console.log('geoloc : oob');
				}
			}, function() {
				// geoloc err
				console.log('geoloc : err?');
			});
		} else {
			// no geoloc
			console.log('geoloc : no?');
		}
		
		/**
		 * test reloading data in the locationFactory
		 *
		 */
		$scope.reload = function() {
			console.log('reload?!');
			var reload = locationFactory.loadAll();
			console.log(reload);
		};
	}
	
	breweryList.$inject = ['$scope', '$http', 'locationFactory'];
	
	function breweryList($scope, $http, locationFactory){
		// and then?
	}
})();