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
		// "quick" helper "Factory" for loading some initial data promises for location details?!
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
	
	mainCtrl.$inject = ['$scope', '$rootScope', '$state', '$stateParams', '$http', 'locationFactory', 'GoogleMapApi'.ns(), 'layoutHelper', 'socialFactory', 'locationCtrlInitialData', 'initialData' ];
	//omg wtf so many args
	function mainCtrl( $scope, $rootScope, $state, $stateParams, $http, locationFactory, GoogleMapApi, layoutHelper, socialFactory, locationCtrlInitialData, initialData ){
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
		$scope.boundary = {
			minlat: false,
			maxlat: false,
			minlng: false,
			maxlng: false
		};
		
		$scope.singleFeed = initialData.singleFeed;
		$scope.instaTest = initialData.instaTest;
		$scope.locationImageFeed = initialData.locationImageFeed;
		if ( $stateParams.id !== undefined ) {
			$scope.onlocation = $stateParams.id;
			$scope.showMainFeed = false;
			$rootScope.onlocation = true;
		} else {
			$scope.onlocation = false;
			$rootScope.onlocation = false;
			$scope.locationData = undefined;
			$rootScope.locationData = undefined;
			$scope.showMainFeed = true;
			
			
		/**
		 * HTML5 geolocation sensor
		 *
		 * should this be elsewhere?
		 *
		*/
		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				// only center to new position if new position is within san diego area, +/- ?
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
		// Get all brewery location markers from the locationFactory
		locationFactory.loadAll( $scope, $rootScope, $state );
		
		/*
		//CURRENT BROKE : attach socialFactory.loadSampleFeed to something we can call from partials?
		$rootScope.loadSampleFeed = function(socialnetwork, type, sample) {
			// also pass $scope in..
			socialFactory.loadSampleFeed( socialnetwork, type, sample );
		};
		*/
		// load our main news (sample)
		socialFactory.loadSampleNews( $rootScope );
		
		/**
		 *	Get Map Stylesfrom external file [includes/map.styles.js]
		 *
		 *	Should we build in a dynamic style selector? For example, light versus dark app style?
		 */
		$scope.styles = mapStyles;

		// test reloading data in the locationFactory
		$scope.reload = function() {
			console.log('reload?!');
			var reload = locationFactory.loadAll();
			console.log(reload);
		};
	}
})();