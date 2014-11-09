/**
 * socialFactory
 *
 * provides methods for querying social APIs?!
 */
(function() {
	angular
		.module('beerMap')
		.factory('socialFactory', socialFactory);
	
	socialFactory.$inject = ['$http', 'locationFactory'];
	
	function socialFactory( $http, locationFactory ) {
		var foursquare_auth = {
			client_id: 'HQD2GOLKBT40T4ANKBCVI4VLSESIBN1MSOKX1OVX04O2DD4J',
			client_secret: 'KZH5ACVPC30HZKGQIQE3TVEX0TUKRF4SZUM3UDCCIPEMQZTX',
			v: '20140808',
			m: 'swarm'
		};
	
		var foursquare_search = 'https://api.foursquare.com/v2/venues/search';
		//client_id=HQD2GOLKBT40T4ANKBCVI4VLSESIBN1MSOKX1OVX04O2DD4J&client_secret=KZH5ACVPC30HZKGQIQE3TVEX0TUKRF4SZUM3UDCCIPEMQZTX&ll=32.78997072, -117.2557908&query=Amplified Ale Works&v=20140806&m=swarm';
		
		var o = {};
		
		o.foursquareSearchCall = function( name, addr, lat, lng ) {
			var params = foursquare_auth;
			params.name = name;
			//params.ll = lat +','+ lng;
			params.intent = 'checkin';
			params.near = addr;
			console.log('GET '+ foursquare_search + ' with params :');
			console.log(params);
			var s = $http({
				url: foursquare_search,
				method: 'GET',
				params: params
			});
			return s;
		};
		o.foursquareSearch = function( marker ) {
			var vm = this;
			var name = marker.name;
			var addr = marker.fullAddr();
			var lat = marker.coords.latitude;
			var lng = marker.coords.longitude;
			vm.foursquareSearchCall( name, addr, lat, lng ).success(function(result) {
				console.log('social search complete');
				console.log(result);
				var rid = result.response.confident;
				if ( rid ) {
					// confident!
					if ( result.response.venues.length > 0 ) {
						console.log(result.response.venues[0]);
						rid = result.response.venues[0].id; //
					}
				} else {
					// loop anyways
					angular.forEach(result.response.venues, function(venue) {
						if ( venue.name.indexOf( name ) >= 0 ) {
							// jackpot
							rid = venue.id;
						}
					});
				}
				marker.foursquared( rid );
				
			})
			.error(function(err) {
				console.log('Error loading : '+ err.message);
			});
		};
		
		return o;
	}
})();