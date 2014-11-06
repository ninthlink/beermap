/* https://angular-ui.github.io/angular-google-maps/#!/use */
(function() {
	angular
		.module('beerMap', ['ui.router', 'google-maps'.ns()])
		.factory('locationFactory', locationFactory)
		.controller('beerMapd', beerMapd)
.config(['GoogleMapApiProvider'.ns(), function (GoogleMapApi) {
	GoogleMapApi.configure({
		key: 'AIzaSyCUwl6lVEzZGsbFp8-QKu3FYwFcOEPgUo4',
		v: '3.17',
		libraries: 'weather,geometry,visualization'
	});
}])
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
}]);
	
	beerMapd.$inject = ['$scope', '$http', 'locationFactory'];
	
	function beerMapd($scope, $http, locationFactory){
		$scope.map = {center: {latitude: 32.85, longitude: -116.6206 }, zoom: 9 };
		$scope.options = {};//scrollwheel: false};
		$scope.coordsUpdates = 0;
		$scope.dynamicMoveCtr = 0;
		
		$scope.mapclass = '';
		$scope.brewon = false;
		
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
			console.log('##');
			console.log($scope.markers);
		})
		.error(function(err) {
			console.log('Error loading : '+ err.message);
			$scope.markers = [];
		});
	}
	
	locationFactory.$inject = ['$http'];
	
	function locationFactory( $http ) {
		var beerURL = 'beerdb.json';
		var o = {};
		
		o.loadAll = function() {
			return $http.get(beerURL);
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
		$scope.$apply();
	}
})();