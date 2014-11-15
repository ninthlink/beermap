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
		// app states for this Controller
		.config([
			'$stateProvider',
			'$urlRouterProvider',
			function($stateProvider, $urlRouterProvider) {
				$stateProvider
					.state('home', {
						url: '/home',
						templateUrl: './partials/home.html',
						controller: 'mainCtrl',
						resolve: {
							initialData: function( socialFactory ) {
								return socialFactory.initHomeData();
							}
						}
					})
					.state('location', {
						url: '/location/{id}',
						templateUrl: './partials/location.html',
						controller: 'mainCtrl',
						resolve: {
							initialData: function( socialFactory ) {
								return socialFactory.initLocationData();
							}
						}
					})
			}
		])
		.controller('mainCtrl', mainCtrl);
	
	mainCtrl.$inject = ['$scope', '$rootScope', '$state', '$stateParams', '$http', '$window', 'locationFactory', 'GoogleMapApi'.ns(), 'layoutHelper', 'socialFactory', 'initialData' ];
	//omg wtf so many args
	function mainCtrl( $scope, $rootScope, $state, $stateParams, $http, $window, locationFactory, GoogleMapApi, layoutHelper, socialFactory, initialData ){
		$rootScope.menu = layoutHelper.getMenu( 'home' ); // gets and sets active menu?
		// set some initial map variables
		$scope.map = {center: {latitude: 32.95, longitude: -117 }, zoom: 10, control: {} };
		$scope.options = {};//scrollwheel: false};
		$scope.coordsUpdates = 0;
		$scope.dynamicMoveCtr = 0;
		//	Get Map Stylesfrom external file [includes/map.styles.js]
		$scope.styles = mapStyles;
		// initial default variables that get set later with locationFactory
		$scope.mapclass = '';
		$scope.boundary = {
			minlat: false,
			maxlat: false,
			minlng: false,
			maxlng: false
		};
		// map initialData, mostly just for on location Details but not specific to it?!
		$scope.newsLoaded = false;
		$scope.newsFeed = initialData.newsFeed;
		if ( angular.isArray( $scope.newsFeed ) ) {
			if ( $scope.newsFeed.length > 0 ) {
				$scope.newsLoaded = true;
			}
		}
		$scope.locationImageFeed = initialData.locationImageFeed;
		
		if ( $stateParams.id !== undefined ) {
			// on LOCATION DETAILS 
			$scope.onlocation = $stateParams.id;
			$scope.showMainFeed = false;
			$rootScope.onlocation = true;
			$scope.animationstyle = 'slidey';
			$scope.tab = 1;
			$scope.tabsliderclass = function() { return 'tabslider tab'+ $scope.tab; };
		} else {
			// on HOME
			$scope.animationstyle = 'fadey';
			$scope.onlocation = false;
			$rootScope.onlocation = false;
			$scope.locationData = undefined;
			$rootScope.locationData = undefined;
			$scope.showMainFeed = true;
			
			// html5 geoloc
			function geo_success(position) {
				var lat = position.coords.latitude;
				var lng = position.coords.longitude;
				console.log(position.coords);
				$scope.$apply(function(){
					// center map on new location
					$scope.map.center = { latitude: position.coords.latitude, longitude: position.coords.longitude };
					// zoom in a bit? lucky 13?
					$scope.map.zoom = 13;
					// set rootScope.myCoords too, mostly just for debugging
					$rootScope.myCoords = position.coords;
				});
			}
			function geo_error(error){
				console.log("geolocation error");
				console.log(error);
			}
			var watchID = $window.navigator.geolocation.watchPosition( geo_success, geo_error, { enableHighAccuracy: true });
			$scope.$on("$destroy", function() {
				$window.navigator.geolocation.clearWatch(watchID);
			});
		}
		
		// Get all brewery location markers from the locationFactory
		locationFactory.loadAll( $scope, $rootScope, $state );
		
		// trigger gmap.resize when windows resize
		var w = angular.element($window);
		w.bind('resize', function() {
			var gmapd = $scope.map.control.getGMap();
			google.maps.event.trigger(gmapd, "resize");
		});
	}
})();