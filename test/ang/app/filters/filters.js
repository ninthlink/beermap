/**
 * all filters in 1 file?!
 */
(function() {
	angular
		.module('beerMap')
		/**
		 * markerinbounds returns true/false for if a given bounds contains a given LatLng 
		 */
		.filter('markerinbounds', function() {
			return function( bounds, latlng ) {
				// bounds.contains takes a LatLng object
				return bounds.contains(latlng);
			};
		})
		/**
		 * markersinbounds returns a filtered array containing the items inside the bounds?
		 */
		.filter('markersinbounds', [ 'GoogleMapApi'.ns(), function( GoogleMapApi ) {
			return function( bounds, markerArray, distanceFrom ) {
				var inbounds = [];
				var latlngs = [];
				var count = 0;
				angular.forEach( markerArray, function( marker ) {
					// create a new LatLng object to check bounds.contains against
					if ( marker.latLngObj == undefined ) {
						marker.latLngObj = new google.maps.LatLng( marker.coords.latitude, marker.coords.longitude );
					}
					if ( bounds.contains( marker.latLngObj ) ) {
						// add marker to the subset we are returning
						inbounds.push( marker );
						// and add the ll to the LatLngs we are returning
						latlngs.push( marker.latLngObj );
						// inc counter
						count++;
					}
				});
				return {
					count: count,
					inbounds : inbounds,
					latlngs : latlngs
				};
			};
		}])
		/**
		 * search array of markers for that one with matching key
		 *
		 * returning either the array of all matching,
		 * or just the first found if singular = true
		 */
		.filter('finditembykey', function() {
			return function( array, key, value, singular ) {
				var found = [];
				angular.forEach( array, function( item ) {
					if ( item[key] == value ) {
						found.push(item);
					}
				});
				if ( ( found.length > 0 ) && ( singular == true ) ) {
					// in this case, return just the first match
					return found[0];
				}
				return found;
			};
		})
		/**
		 * #todo : add filters to filter markers by...
		 *
		 * by twitter username
		 * twitter user ID
		 * instagram username
		 * instagram location
		 *
		 * and then?
		 */
})();