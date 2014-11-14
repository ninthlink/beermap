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
		// "quick" helper "Factory" for loading some initial data Promises for location details (social feeds)?!
		.factory("locationCtrlInitialData", function( socialFactory, $q ) {
			return function() {
				var sampleTwitterUserFeed = socialFactory.loadSampleFeed( 'twitter', 'user', 0 );
				var sampleInstagramUserFeed = socialFactory.loadSampleFeed( 'instagram', 'user', 0 );
				var sampleInstagramLocationFeed = socialFactory.loadSampleFeed( 'instagram', 'loc', 0 );
				
				return $q.all([sampleTwitterUserFeed, sampleInstagramUserFeed, sampleInstagramLocationFeed]).then(function(results) {
					// combine sampleTwitterUserFeed + sampleInstagramUserFeed into 1 singleFeed..
					var singleFeed = results[0].concat(results[1]);
					// sort too by timestamp
					singleFeed.sort(function(a,b) {
						if ( a.timestamp > b.timestamp ) return -1;
						if ( a.timestamp < b.timestamp ) return 1;
						return 0;
					});
					
					return {
						singleFeed: singleFeed,
						instaTest: results[1],
						locationImageFeed: results[2]
					};
				});
			}
		})
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
							initialData: function() {
								return {
									singleFeed: undefined,
									instaTest: undefined,
									locationImageFeed: undefined
								};
							}
						}
					})
					.state('location', {
						url: '/location/{id}',
						templateUrl: './partials/location.html',
						controller: 'mainCtrl',
						resolve: {
							initialData: function( locationCtrlInitialData ) {
								return locationCtrlInitialData();
							}
						}
					})
			}
		])
		.controller('mainCtrl', mainCtrl);
	
	mainCtrl.$inject = ['$scope', '$rootScope', '$state', '$stateParams', '$http', '$window', 'locationFactory', 'GoogleMapApi'.ns(), 'layoutHelper', 'socialFactory', 'locationCtrlInitialData', 'initialData' ];
	//omg wtf so many args
	function mainCtrl( $scope, $rootScope, $state, $stateParams, $http, $window, locationFactory, GoogleMapApi, layoutHelper, socialFactory, locationCtrlInitialData, initialData ){
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
		$scope.singleFeed = initialData.singleFeed;
		$scope.instaTest = initialData.instaTest;
		$scope.locationImageFeed = initialData.locationImageFeed;
		
		if ( $stateParams.id !== undefined ) {
			// on LOCATION DETAILS 
			$scope.onlocation = $stateParams.id;
			$scope.showMainFeed = false;
			$rootScope.onlocation = true;
			$scope.animationstyle = 'slidey';
		} else {
			// on HOME
			$scope.animationstyle = 'fadey';
			$scope.onlocation = false;
			$rootScope.onlocation = false;
			$scope.locationData = undefined;
			$rootScope.locationData = undefined;
			$scope.showMainFeed = true;
			// load our main news (sample)
			socialFactory.loadSampleNews( $rootScope );
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
	}
})();