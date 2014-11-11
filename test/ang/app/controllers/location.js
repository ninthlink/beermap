/**
 * beerMap locationCtrl Controller
 *
 * for state /location/{id} (in angularApp.js config)
 * with /partials/location.html
 * 
 */
(function() {
	angular
		.module('beerMap')
		.controller('locationCtrl', locationCtrl);
	
	locationCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$http', 'locationFactory', 'GoogleMapApi'.ns(), 'layoutHelper', 'socialFactory'];
	
	function locationCtrl( $scope, $rootScope, $stateParams, $http, locationFactory, GoogleMapApi, layoutHelper, socialFactory ){
		$rootScope.menu = layoutHelper.getMenu( 'home' ); // gets and sets active menu?
		
		$scope.map = {center: {latitude: 32.95, longitude: -117 }, zoom: 10, control: {} };
		$scope.options = {};//scrollwheel: false};
		$scope.coordsUpdates = 0;
		$scope.dynamicMoveCtr = 0;
		
		/**
		 * initial default variables that get set later with locationFactory
		 *
		 */
		$scope.mapclass = '';
		$scope.showMainFeed = false;
		$scope.boundary = {
			minlat: false,
			maxlat: false,
			minlng: false,
			maxlng: false
		};
		// set up to load a particular location from param ID
		$scope.brewon = $stateParams.id;
		// Get all brewery location markers from the locationFactory
		locationFactory.loadAll($scope);
		
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
	}
})();