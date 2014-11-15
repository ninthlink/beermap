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
	
	mainCtrl.$inject = [ '$scope', '$rootScope', '$state', '$stateParams', '$window', 'locationFactory', 'GoogleMapApi'.ns(), 'layoutHelper', 'socialFactory', 'initialData', 'markersinboundsFilter' ];
	//omg wtf so many args
	function mainCtrl( $scope, $rootScope, $state, $stateParams, $window, locationFactory, GoogleMapApi, layoutHelper, socialFactory, initialData, markersinboundsFilter ){
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
		$scope.geolocationWatchID = null;
		$scope.myDot = locationFactory.myLocationIcon();
		
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
			
			// html5 geolocation
			$scope.firstgeolocset = false;
			$scope.mapmoved = false;
			$scope.mapzoomchanged = false;
			
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
				// clear the watchPosition at least for now
				$window.navigator.geolocation.clearWatch($scope.geolocationwatchID);
			}
			function geo_error(error){
				console.log("geolocation error");
				console.log(error);
			}
			$scope.geolocationwatchID = $window.navigator.geolocation.watchPosition( geo_success, geo_error, { enableHighAccuracy: false });
			$scope.$on("$destroy", function() {
				console.log('destroying this view?! current map center was...');
				var gmapd = $scope.map.control.getGMap();
				console.log(gmapd.getCenter());
				// clear the watchPosition to save battery lives?
				$window.navigator.geolocation.clearWatch($scope.geolocationwatchID);
			});
		}
		
		// Get all brewery location markers from the locationFactory
		locationFactory.loadAll( $scope, $rootScope, $state );
		
		/*
        * GoogleMapApi is a promise with a
        * then callback of the google.maps object
        *   @pram: maps = google.maps
        */
        GoogleMapApi.then(function(maps) {
			// trigger gmap.resize when windows resize
			var w = angular.element($window);
			w.bind('resize', function() {
				var gmapd = $scope.map.control.getGMap();
				google.maps.event.trigger(gmapd, "resize");
			});
			
			if ( $scope.onlocation === false ) {
				// on home screen, add some map listener(s)
				$scope.refilterTimeout = null;
				setTimeout(function() {
					var gmapd = $scope.map.control.getGMap();
					// listen when the center has manually been moved
					$scope.mapMoveListener = google.maps.event.addListener(gmapd, 'center_changed', function() {
						clearTimeout( $scope.refilterTimeout );
						//console.log('map moved : center changed');
						$scope.mapmoved = true;
						// add throttled call to filter map markers in the area, here?
						$scope.refilterTimeout = setTimeout( function() {
							console.log('check bounds :');
							var gmapd = $scope.map.control.getGMap();
							var bounds = gmapd.getBounds();
							var markersinbounds = markersinboundsFilter( bounds, $scope.markers );
							console.log(markersinbounds);
							// #todo : filter News Feed and Location Images and List for just the in-bounds
						}, 200 );
						// don't just go back to previous centering? but by now watch should be done anyways..
						//$window.navigator.geolocation.clearWatch($scope.geolocationWatchID);
					});
				}, 400);
			}
        });
	}
})();