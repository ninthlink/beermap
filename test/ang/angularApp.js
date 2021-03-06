/**
 * angularApp.js
 *
 * not just named app.js incase we are going to merge this into a node thing?
 * defines "beerMap" module
 * configures GoogleMaps API
 * defines app state routing here
 */
(function() {
	angular
		/**
		 * lets name our overall module "beerMap" ?
		 *
		 */
		.module('beerMap', ['ui.router', 'ngAnimate', 'google-maps'.ns(), 'ngSanitize', 'ui.bootstrap'])
		
		/**
		 * configure Google Maps
		 *
		 * see https://angular-ui.github.io/angular-google-maps/#!/api
		 */
		.config([
			'GoogleMapApiProvider'.ns(),
			function (GoogleMapApi) {
				GoogleMapApi.configure({
					key: 'AIzaSyCUwl6lVEzZGsbFp8-QKu3FYwFcOEPgUo4',
					v: '3.17',
					libraries: 'weather,geometry,visualization'
				});
			}
			])
		// app states mostly set in their own Controllers?
		.config([
			'$stateProvider',
			'$urlRouterProvider',
			function($stateProvider, $urlRouterProvider) {
				$urlRouterProvider.otherwise('home');
			}
		]);
})();