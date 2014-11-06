/* https://angular-ui.github.io/angular-google-maps/#!/use */
(function() {
	angular
		.module('beerMap', ['ui.router', 'ngAnimate', 'google-maps'.ns()])
		.factory('locationFactory', locationFactory)
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
						templateUrl: '/home.html',
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
						templateUrl: '/list.html',
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
	
	locationFactory.$inject = ['$http'];
	
	function locationFactory( $http ) {
		var beerURL = 'beerdb.json';
		var o = {};
		
		o.beerdbjson = false;
		o.omarkers = [];
		
		o.getJSON = function() {
			if ( this.beerdbjson === false ) {
				console.log('loading '+ beerURL);
				this.beerdbjson = $http.get(beerURL);
			} else {
				console.log('loading '+ beerURL + ' from stored version?!');
			}
			return this.beerdbjson;
		};
		o.loadAll = function( $scope ) {
			var vm = this;
			if ( vm.omarkers.length == 0 ) {
				vm.getJSON().success(function(locs) {
					var c = locs.length;
					$scope.markers = [];
					console.log('loaded '+ c + ' locations');
					for( var i = 0; i < c; i++ ) {
						var obj = locs[i];
						obj.id = i;
						obj.coords = {
							latitude: locs[i].latitude,
							longitude: locs[i].longitude
						};
						$scope.boundary = vm.checkBounds( $scope.boundary, locs[i].latitude, locs[i].longitude, false );
						$scope.markers.push(obj);
					}
					angular.forEach($scope.markers, function(marker) {
						marker.onClick = function() {
							console.log('onClick '+ marker.id);
							markerClicked($scope, marker.id);
						}
						marker.phoneNumber = function() {
							return marker.phone.replace('(', '').replace(')', '').replace(/ /i, '').replace(/-/i, '');
						}
						marker.closeRight = function() {
							console.log('close..');
							$scope.brewon = false;
							$scope.mapclass = '';
						}
					});
					//console.log('##');
					//console.log($scope.markers);
					vm.omarkers = $scope.markers; // save for later
					console.log('## all '+ $scope.markers.length +' markers loaded : bounds are...');
					console.log($scope.boundary);
				})
				.error(function(err) {
					console.log('Error loading : '+ err.message);
					$scope.markers = [];
					vm.omarkers = [];
				});
			}
			return vm.omarkers;
		};
		o.checkBounds = function(bounds, newlat, newlng, ob) {
			var inbounds = true;
			if ( bounds.minlat === false ) {
				bounds.minlat = newlat;
				inbounds = false;
			} else {
				if ( bounds.minlat > newlat ) {
					bounds.minlat = newlat;
					inbounds = false;
				}
			}
			if ( bounds.maxlat === false ) {
				bounds.maxlat = newlat;
				inbounds = false;
			} else {
				if ( bounds.maxlat < newlat ) {
					bounds.maxlat = newlat;
					inbounds = false;
				}
			}
			if ( bounds.minlng === false ) {
				bounds.minlng = newlng;
				inbounds = false;
			} else {
				if ( bounds.minlng > newlng ) {
					bounds.minlng = newlng;
					inbounds = false;
				}
			}
			if ( bounds.maxlng === false ) {
				bounds.maxlng = newlng;
				inbounds = false;
			} else {
				if ( bounds.maxlng < newlng ) {
					bounds.maxlng = newlng;
					inbounds = false;
				}
			}
			return ob ? inbounds : bounds;
		};
		return o;
	}
	
	function markerClicked( $scope, i ) {
		console.log('clicked #'+ i + ' !');
		var m = $scope.markers[i];
		console.log(m);
		$scope.mapclass = 'customMapClass';
		$scope.overlayclass = 'col-md-12 customOverlayClass';
		$scope.brewon = m;
		$scope.markers.selected = m.id;
		$scope.$apply();
	}
	
	breweryList.$inject = ['$scope', '$http', 'locationFactory'];
	
	function breweryList($scope, $http, locationFactory){
		// and then?
	}
})();