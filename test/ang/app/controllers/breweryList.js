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
		$scope.llon = false;
		$scope.sort = 'id';
		$scope.asc = false;
		$scope.sortBy = function( what ) {
			if ( $scope.sort == what ) {
				// switch directions
				$scope.asc = !$scope.asc;
			} else {
				$scope.sort = what;
			}
		}
		/*
		// scope columns hardcoded cause alex couldnt figure this out..
		$scope.cols = [
			{ n: "#", f: "id" },
			{ n: "Brewery", f: "name" },
		];
		*/
		/**
		 * Get all brewery location markers from the locationFactory
		 *
		 */
		locationFactory.loadAll($scope);
		
		$scope.fullName = function( marker ) {
			return marker.fullNameLink();
		};
		/*
		function( marker ) {
			alert('fullnamed');
		};
		*/
	}
})();