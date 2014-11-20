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
	
	mainCtrl.$inject = [ '$scope', '$rootScope', '$state', '$stateParams', '$window', 'locationFactory', 'GoogleMapApi'.ns(), 'layoutHelper', 'socialFactory', 'initialData', 'markersinboundsFilter', 'finditembykeyFilter' ];
	//omg wtf so many args
	function mainCtrl( $scope, $rootScope, $state, $stateParams, $window, locationFactory, GoogleMapApi, layoutHelper, socialFactory, initialData, markersinboundsFilter, finditembykeyFilter ){
		$rootScope.menu = layoutHelper.getMenu( 'home' ); // gets and sets active menu?
		// set some initial map variables
		$scope.map = {center: {latitude: 32.95, longitude: -117 }, zoom: 10, control: {}, markerControl: {} };
		$scope.options = {};//scrollwheel: false};
		$scope.coordsUpdates = 0;
		$scope.dynamicMoveCtr = 0;
		// Map Styles : not sure how to inject otherwise..
		$scope.styles = [{'featureType':'water','elementType':'all','stylers':[{'hue':'#e9ebed'},{'saturation':-78},{'lightness':67},{'visibility':'simplified'}]},{'featureType':'landscape','elementType':'all','stylers':[{'hue':'#ffffff'},{'saturation':-100},{'lightness':100},{'visibility':'simplified'}]},{'featureType':'road','elementType':'geometry','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':31},{'visibility':'simplified'}]},{'featureType':'poi','elementType':'all','stylers':[{'hue':'#ffffff'},{'saturation':-100},{'lightness':100},{'visibility':'off'}]},{'featureType':'road.local','elementType':'geometry','stylers':[{'hue':'#e9ebed'},{'saturation':-90},{'lightness':-8},{'visibility':'simplified'}]},{'featureType':'transit','elementType':'all','stylers':[{'hue':'#e9ebed'},{'saturation':10},{'lightness':69},{'visibility':'on'}]},{'featureType':'administrative.locality','elementType':'all','stylers':[{'hue':'#2c2e33'},{'saturation':7},{'lightness':19},{'visibility':'on'}]},{'featureType':'road','elementType':'labels','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':31},{'visibility':'on'}]},{'featureType':'road.arterial','elementType':'labels','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':-2},{'visibility':'simplified'}]}];
		// initial default variables that get set later with locationFactory
		$scope.mapclass = '';
		$scope.boundary = {
			minlat: false,
			maxlat: false,
			minlng: false,
			maxlng: false
		};
		// map initialData, mostly just for on location Details but not specific to it?!
		$scope.nearbyMarkers = [];
		$scope.nearbyLoaded = false;
		$scope.nearbyNotFound = false;
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
		$rootScope.myCoords = false;
		$scope.hideDistances = true;
		
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
				$rootScope.myCoords = false;
			}
			$scope.geolocationwatchID = $window.navigator.geolocation.watchPosition( geo_success, geo_error, { enableHighAccuracy: false });
			$scope.$on("$destroy", function() {
				console.log('destroying this view?! #todo probably want to save this map center & zoom for when you come back : current map center was...');
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
			
			$scope.distanceMatrixService = new google.maps.DistanceMatrixService();
			
			if ( $scope.onlocation === false ) {
				// on home screen, add some map listener(s)
				$scope.refilterTimeout = null;
				$scope.refilter = function() {
					$scope.nearbyLoaded = false;
					var gmapd = $scope.map.control.getGMap();
					var bounds = gmapd.getBounds();
					var inbounds = markersinboundsFilter( bounds, $scope.markers );
					/**
					 * returns object with some info
					 * .inbounds = [ array of markers that were inbounds ]
					 * .latlngs = [ array of LatLng of those markers ]
					 * .count = length of those arrays, which match
					 */
					
					// store results
					$scope.nearbyMarkers = inbounds.inbounds;
					console.log($scope.nearbyMarkers);
					$scope.nearbyNotFound = ( inbounds.count == 0 );
					$scope.nearbyLoaded = true;
					//console.log('nearbyNotFound = ' + ( $scope.nearbyNotFound ? 'true' : 'false' ) + ' : nearbyLoaded = ' + ( $scope.nearbyLoaded ? 'true' : 'false' ) + ' : so that = ' + ( ( $scope.nearbyLoaded && !$scope.nearbyNotFound ) ? 'true' : 'false' ) );
					// recalc distances?
					if ( ( $rootScope.myCoords !== false ) && ( inbounds.count > 0 ) ) {
						var myLatLng = new google.maps.LatLng( $rootScope.myCoords.latitude, $rootScope.myCoords.longitude );
						$scope.distanceMatrixService.getDistanceMatrix({
							origins: [ myLatLng ],
							destinations: inbounds.latlngs,
							travelMode: google.maps.TravelMode.DRIVING,
							unitSystem: google.maps.UnitSystem.IMPERIAL,
							avoidHighways: false,
							avoidTolls: false
						}, $scope.recalcDistances );
					} else {
						// we don't have current user's location so hide all distances?
						$scope.hideDistances = true;
					}
				};
				$scope.recalcDistances = function( response, status ) {
					if (status != google.maps.DistanceMatrixStatus.OK) {
						console.log('Distance Matrix Error was: ' + status);
						$scope.hideDistances = true;
					} else {
						// success!
						console.log('DISTANCES UPDATE :');
						console.log(response);
						angular.forEach( response.rows[0].elements, function( d, k ) {
							$scope.nearbyMarkers[k].updateDistance( d.distance.text );
						});
						$scope.nearbyMarkers.sort(function(a,b) {
							var af = parseFloat(a.distance);
							var bf = parseFloat(b.distance);
							if ( af < bf ) return -1;
							if ( af > bf ) return 1;
							return 0;
						});
						$scope.hideDistances = false;
						$scope.nearbyLoaded = true;
					}
				};
				setTimeout(function() {
					var gmapd = $scope.map.control.getGMap();
					// listen when the center has manually been moved
					$scope.mapMoveListener = google.maps.event.addListener(gmapd, 'center_changed', function() {
						clearTimeout( $scope.refilterTimeout );
						//console.log('map moved : center changed');
						$scope.mapmoved = true;
						// add throttled call to filter map markers in the area, here?
						$scope.refilterTimeout = setTimeout( $scope.refilter, 200 );
						// don't just go back to previous centering? but by now watch should be done anyways..
						//$window.navigator.geolocation.clearWatch($scope.geolocationWatchID);
					});
					$scope.mapZoomListener = google.maps.event.addListener(gmapd, 'zoom_changed', function() {
						clearTimeout( $scope.refilterTimeout );
						console.log('map moved : zoom changed');
						$scope.mapmoved = true;
						// add throttled call to filter map markers in the area, here?
						$scope.refilterTimeout = setTimeout( $scope.refilter, 200 );
					});
					// initial check for markers in the area, too
					$scope.refilterTimeout = setTimeout( $scope.refilter, 100 );
				}, 400);
				
				$scope.clickEventsObject = {
					mouseover: markerMouseOver,
					mouseout: markerMouseOut,
				};
				function markerMouseOver( result, event ) {
					//console.log('markerMouseOver ?? #'+ result.key);
					var overmarker = finditembykeyFilter( $scope.nearbyMarkers, 'id', result.key, true );
					//console.log(overmarker);
					overmarker.mouseover();
				}
				function markerMouseOut( mousedmarker, event ) {
					//console.log('?? markerMouseOut #'+ mousedmarker.key);
					//console.log(mousedmarker);
					$scope.markers[mousedmarker.key].mouseout();
				}
			}
        });
	}
})();