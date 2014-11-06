/**
 * breweryList Controller
 *
 * for state /list (in angularApp.js config)
 * with /partials/list.html
 * 
 */
(function() {
	angular
		.module('beerMap')
		.controller('breweryList', breweryList);
		
	breweryList.$inject = ['$scope', '$http', 'locationFactory'];
	
	function breweryList($scope, $http, locationFactory){
		$scope.map = false;
		$scope.markers = [];
		
		console.log('brewery list here :');
		/**
		 * Get all brewery location markers from the locationFactory
		 *
		 */
		locationFactory.loadAll($scope);
	}
})();