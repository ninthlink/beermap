/**
 * locationFactory
 *
 * provides methods for loading all Brewery Locations from a JSON call,
 * checking whether a given lat&lng are within bounds of all loaded locations,
 * and clicking on a location marker
 */
(function() {
	angular
		.module('beerMap')
		.factory('locationFactory', locationFactory);
	
	locationFactory.$inject = ['$http'];
	
	function locationFactory( $http ) {
		var beerURL = 'beerdb.json';
		var o = {};
		
		o.beerdbjson = false;
		o.omarkers = [];
		
		/**
		 * caches $http.get beerURL request?
		 */
		o.getJSON = function() {
			if ( this.beerdbjson === false ) {
				console.log('loading '+ beerURL);
				this.beerdbjson = $http.get(beerURL);
			} else {
				console.log('loading '+ beerURL + ' from stored version?!');
			}
			return this.beerdbjson;
		};
		/**
		 * loads all markers either from stored object or from calling getJSON
		 */
		o.loadAll = function( $scope ) {
			var vm = this;
			if ( vm.omarkers.length == 0 ) {
				console.log('reload markers from JSON?');
				vm.getJSON().success(function(locs) {
					var c = locs.length;
					$scope.markers = [];
					for( var i = 0; i < c; i++ ) {
						var obj = locs[i];
						obj.id = i;
						// create coords pair for mapping
						obj.coords = {
							latitude: locs[i].latitude,
							longitude: locs[i].longitude
						};
						// set up some more social media placeholder stub fields for now
						obj.foursquare_id = false;
						// if we have a map, extend the stored "boundary" to fit this new marker
						if ( $scope.map !== false ) {
							$scope.boundary = vm.checkBounds( $scope.boundary, locs[i].latitude, locs[i].longitude, false );
						}
						$scope.markers.push(obj);
					}
					vm.addMarkerEvents( $scope );
					//console.log('##');
					//console.log($scope.markers);
					vm.omarkers = $scope.markers; // save for later
					console.log('## all '+ $scope.markers.length +' markers loaded');
					//console.log($scope.boundary);
				})
				.error(function(err) {
					console.log('Error loading : '+ err.message);
					$scope.markers = [];
					vm.omarkers = [];
				});
			} else {
				$scope.markers = vm.omarkers;
				$scope.$apply();
				// re-add events so clicks on markers work again
				vm.addMarkerEvents( $scope );
			}
		};
		/**
		 * loops through a set of markers (inside $scope)
		 * and (re)attaches some helper functions to them
		 */
		o.addMarkerEvents = function( $scope ) {
			if ( angular.isArray( $scope.markers ) ) {
				angular.forEach($scope.markers, function(marker) {
					/**
					 * returns "City, State Zip"
					 */
					marker.CSZ = function() {
						return marker.city +', '+ marker.state +' '+ marker.zip;
					}
					/**
					 * returns full address in 1 line
					 */
					marker.fullAddr = function() {
						return marker.addr +', '+ marker.CSZ();
					}
					/**
					 * returns name + location (if there is one),
					 * wrapped in link to the website (if there is one)
					 */
					marker.fullNameLink = function() {
						var o = '<strong>'+ marker.name +'</strong>';
						if ( marker.loc !== '' ) {
							o += ' <small>'+ marker.loc +'</small>';
						}
						if ( marker.www != '' ) {
							o = '<a href="http://'+ marker.www +'" target="_blank">'+ o +'</a>';
						}
						return o;
					}
					/**
					 * given a number like "(858) 427-1470",
					 * 
					 * returns that number wrapped in an <a href="tel:##########" />
					 */
					marker.phoneNumber = function() {
						var phone = marker.phone;
						var justnumber = phone.replace('(', '').replace(')', '').replace(/ /i, '').replace(/-/i, '');
						return '<a href="tel:'+ justnumber +'">'+ phone +'</a>';
					}
					if ( $scope.map !== false ) {
						marker.onClick = function() {
							console.log('onClick '+ marker.id);
							markerClicked($scope, marker.id);
						}
						marker.closeRight = function() {
							console.log('close..');
							$scope.showOverlay = false;
							$scope.showMainFeed = true;
							$scope.mapclass = '';
							//console.log($scope.map.center);
							window.setTimeout(function(){
								var gmapd = $scope.map.control.getGMap();
								google.maps.event.trigger(gmapd, "resize");
								// reset map position to original center
								// note : not sure this is right functionality?
								$scope.map.center = $scope.originalCenter;
								$scope.map.zoom = $scope.originalZoom;
								$scope.$apply();
							}, 100);
						}
					} else {
						/**
						 * there's no map, so maybe this is list view?
						 * 
						 * in that case, add a few social functions for debuggings
						 */
						marker.foursquared = function( id ) {
							marker.foursquare_id = id;
						}
						marker.print4s = function() {
							var o = false;
							if ( marker.foursquare_id !== false ) {
								if ( angular.isObject( marker.foursquare_id ) ) {
									// for further debugging..
									o = 'objd';
								} else {
									o = marker.foursquare_id;
								}
							}
							return o;
						}
					}
				});
			}
		}
		/**
		 * checks whether a new lat & lng is inside an existing bounds,
		 * and updates bounds to contain that location otherwise
		 * 
		 * returns the updated bounds if ob = false,
		 * or else just returns true/false for if it was already in bounds 
		 */
		o.checkBounds = function(bounds, newlat, newlng, ob) {
			var inbounds = true;
			if ( bounds.minlat === false ) {
				bounds.minlat = newlat;
				inbounds = false;
			} else {
				if ( bounds.minlat > newlat ) {
					bounds.minlat = newlat;
					inbounds = false;
				}
			}
			if ( bounds.maxlat === false ) {
				bounds.maxlat = newlat;
				inbounds = false;
			} else {
				if ( bounds.maxlat < newlat ) {
					bounds.maxlat = newlat;
					inbounds = false;
				}
			}
			if ( bounds.minlng === false ) {
				bounds.minlng = newlng;
				inbounds = false;
			} else {
				if ( bounds.minlng > newlng ) {
					bounds.minlng = newlng;
					inbounds = false;
				}
			}
			if ( bounds.maxlng === false ) {
				bounds.maxlng = newlng;
				inbounds = false;
			} else {
				if ( bounds.maxlng < newlng ) {
					bounds.maxlng = newlng;
					inbounds = false;
				}
			}
			return ob ? inbounds : bounds;
		};
		return o;
	}
	/**
	 * function fired when a particular marker is clicked on the map
	 */
	function markerClicked( $scope, i ) {
		console.log('clicked #'+ i + ' !');
		var m = $scope.markers[i];
		console.log(m);
		
		// set classes for when overlay is active
		$scope.mapclass = 'mapsmall';
		$scope.overlayclass = 'growd';
		$scope.listclass = 'listhidden';
		
		// show overlay
		$scope.showOverlay = true;
		$scope.showMainFeed = false;
		
		// data to pass to overlay DOM
		$scope.locationData = m;
		$scope.markers.selected = m.id;
		
		// Map adjustments

		// store original center for later use?
		$scope.originalCenter = $scope.map.center;
		$scope.originalZoom = $scope.map.zoom;
		
		// trigger resize event now that map display area has changed via CSS class from above
		window.setTimeout(function(){
			var gmapd = $scope.map.control.getGMap();
			google.maps.event.trigger(gmapd, "resize");
			// ...then recenter map on clicked marker...
			$scope.map.center = { latitude: m.coords.latitude, longitude: m.coords.longitude };
			// ...and zoom in
			$scope.map.zoom = 16;
			// ...and apply
			$scope.$apply();
		},100);
	}
})();