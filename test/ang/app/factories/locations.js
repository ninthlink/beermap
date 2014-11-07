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
		
		o.getJSON = function() {
			if ( this.beerdbjson === false ) {
				console.log('loading '+ beerURL);
				this.beerdbjson = $http.get(beerURL);
			} else {
				console.log('loading '+ beerURL + ' from stored version?!');
			}
			return this.beerdbjson;
		};
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
						obj.coords = {
							latitude: locs[i].latitude,
							longitude: locs[i].longitude
						};
						obj.fs = false;
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
				vm.addMarkerEvents( $scope );
			}
		};
		
		o.addMarkerEvents = function( $scope ) {
			if ( angular.isArray( $scope.markers ) ) {
				angular.forEach($scope.markers, function(marker) {
					marker.CSZ = function() {
						return marker.city +', '+ marker.state +' '+ marker.zip;
					}
					marker.fullAddr = function() {
						return marker.addr +', '+ marker.CSZ();
					}
					marker.fullNameLink = function() {
						var o = '<strong>'+ marker.name +'</strong>';
						if ( marker.loc !== '' ) {
							o += ' <small>'+ marker.loc +'</small>';
						}
						if ( marker.www != '' ) {
							o = '<a href="'+ marker.www +'" target="_blank">'+ o +'</a>';
						}
						return o;
					}
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
							$scope.brewon = false;
							$scope.mapclass = '';
						}
					}
				});
			}
		}
		
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
	
	function markerClicked( $scope, i ) {
		console.log('clicked #'+ i + ' !');
		var m = $scope.markers[i];
		console.log(m);
		$scope.mapclass = '';
		$scope.overlayclass = '';
		$scope.brewon = m;
		$scope.markers.selected = m.id;
		$scope.$apply();
	}
})();