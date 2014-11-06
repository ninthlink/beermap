/* https://angular-ui.github.io/angular-google-maps/#!/use */
(function() {
	angular
		.module('beerMap', ['ui.router', 'ngAnimate', 'google-maps'.ns()])
		.factory('locationFactory', locationFactory)
		.controller('beerMapd', beerMapd)
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
		
		locationFactory.loadAll().success(function(locs) {
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
				$scope.boundary = locationFactory.checkBounds( $scope.boundary, locs[i].latitude, locs[i].longitude, false );
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
			console.log('## all '+ $scope.markers.length +' markers loaded : bounds are...');
			console.log($scope.boundary);
		})
		.error(function(err) {
			console.log('Error loading : '+ err.message);
			$scope.markers = [];
		});

		/**
		 *	Get Map Stylesfrom external file [includes/map.styles.js]
		 *
		 *	Should we build in a dynamic style selector? For example, light versus dark app style?
		 */
		$scope.styles = mapStyles;

		/**
		 * HTML5 geolocation sensor
		 *
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
	}
	
	locationFactory.$inject = ['$http'];
	
	function locationFactory( $http ) {
		var beerURL = 'beerdb.json';
		var o = {};
		
		o.loadAll = function() {
			return $http.get(beerURL);
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
		console.log('clicked!');
		console.log(arguments);
		var m = $scope.markers[i];
		console.log(m);
		$scope.mapclass = 'col-md-6';
		$scope.brewon = m;
		$scope.markers.selected = m.id;
		$scope.$apply();
	}
})();