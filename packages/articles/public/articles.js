'use strict';

angular.module('mean.articles', [ 'uiGmapgoogle-maps' ])
		/**
		 * configure Google Maps
		 *
		 * see https://angular-ui.github.io/angular-google-maps/#!/api
		 */
		.config(function (uiGmapGoogleMapApiProvider) {
				uiGmapGoogleMapApiProvider.configure({
					key: 'AIzaSyCUwl6lVEzZGsbFp8-QKu3FYwFcOEPgUo4',
					v: '3.17',
					libraries: 'weather,geometry,visualization'
				});
			});