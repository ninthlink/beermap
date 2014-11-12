/**
 * mainCtrl Controller
 *
 * for states (in angularApp.js config) :
 * /home , with /partials/home.html
 * /location/{id} , with /partials/location.html
 */
(function() {
	angular
		.module('beerMap')
		.controller('mainCtrl', mainCtrl);
	
	mainCtrl.$inject = ['$scope', '$rootScope', '$state', '$stateParams', '$http', 'locationFactory', 'GoogleMapApi'.ns(), 'layoutHelper', 'socialFactory'];
	
	function mainCtrl( $scope, $rootScope, $state, $stateParams, $http, locationFactory, GoogleMapApi, layoutHelper, socialFactory ){
		$rootScope.menu = layoutHelper.getMenu( 'home' ); // gets and sets active menu?
		$rootScope.searchFor = layoutHelper.searchFor; // typeahead search callback
		
		$scope.map = {center: {latitude: 32.95, longitude: -117 }, zoom: 10, control: {} };
		$scope.options = {};//scrollwheel: false};
		$scope.coordsUpdates = 0;
		$scope.dynamicMoveCtr = 0;
		
		/**
		 * initial default variables that get set later with locationFactory
		 *
		 */
		$scope.mapclass = '';
		if ( $stateParams.id >= 0 ) {
			$scope.onlocation = $stateParams.id;
			$rootScope.onlocation = true;
		} else {
			$scope.onlocation = false;
			$rootScope.onlocation = false;
			$scope.locationData = undefined;
			$rootScope.locationData = undefined;
		}
		$scope.showMainFeed = true;
		$scope.boundary = {
			minlat: false,
			maxlat: false,
			minlng: false,
			maxlng: false
		};
		
		// Get all brewery location markers from the locationFactory
		locationFactory.loadAll( $scope, $rootScope, $state );
		
		// attach socialFactory.loadSampleFeed to something we can call from partials?
		$rootScope.loadSampleFeed = function(socialnetwork, type, sample) {
			// also pass $scope in..
			socialFactory.loadSampleFeed(socialnetwork, type, sample, $scope);
		};
		// load our main news (sample)
		socialFactory.loadSampleNews( $rootScope );
		
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
		
		// test reloading data in the locationFactory
		$scope.reload = function() {
			console.log('reload?!');
			var reload = locationFactory.loadAll();
			console.log(reload);
		};
	}
})();