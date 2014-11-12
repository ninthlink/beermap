/**
 * socialFactory
 *
 * provides methods for querying social APIs?!
 */
(function() {
	angular
		.module('beerMap')
		.factory('socialFactory', socialFactory);
	
	socialFactory.$inject = ['$http', '$q', 'locationFactory'];
	
	function socialFactory( $http, $q, locationFactory ) {
		var foursquare_auth = {
			client_id: 'HQD2GOLKBT40T4ANKBCVI4VLSESIBN1MSOKX1OVX04O2DD4J',
			v: '20140808',
			m: 'swarm'
		};	
		var foursquare_search = 'https://api.foursquare.com/v2/venues/search';
		
		var o = {};
		
		o.sample_json = {
			twitter: {
				list: 'twitter-list.json',
				user: [
					'twitter-statuses-BPbrewing.json'
				]
			},
			instagram: {
				loc: 'instagram-location-ballastpointoldgrove.json',
				user: [
					'instagram-user-ballastpointbrewing.json',
					'instagram-user-moderntimesbeer.json',
					'instagram-user-stonebrewingco.json'
				]
			}
		};
		// stub out saving sample responses
		o.sample_output = {
			twitter: {
				list: false,
				user: [],
			},
			instagram: {
				loc: false,
				user: []
			}
		};
		o.newsfeed = [];
		/**
		 * caches $http.get requests?
		 */
		o.getSampleFeed = function( socialnetwork, type, sample ) {
			//console.log('gg getSampleFeed for [ '+ socialnetwork +' ][ '+ type +' ][ '+ sample +' ]');
			var sample_feed = o.sample_json[socialnetwork][type]; // maybe error check for correct values?!
			if ( type == 'user' ) {
				if ( ( sample >= 0 ) && ( sample < sample_feed.length ) ) {
					sample_feed = sample_feed[sample];
				} else {
					sample_feed = sample_feed[0];
				}
				// check if its already been loaded = whether its a string or an obj
				if ( sample_feed === sample_feed + '' ) {
					//console.log('loading '+ beerURL);
					sample_feed = $http.get('app/sample-json/'+ sample_feed);
					o.sample_json[socialnetwork][type][sample] = sample_feed;
				} else {
					//console.log('loading sample_json for '+ socialnetwork +' > '+ type +' from stored version?!');
				}
			} else {
				// check if its already been loaded = whether its a string or an obj
				if ( sample_feed === sample_feed + '' ) {
					//console.log('loading '+ beerURL);
					sample_feed = $http.get('app/sample-json/'+ sample_feed);
					this.sample_json[socialnetwork][type] = sample_feed;
				} else {
					//console.log('loading sample_json for '+ socialnetwork +' > '+ type +' from stored version?!');
				}
			}
			return sample_feed;
		};
		/**
		 * gets response from getSampleFeed and does some parsing to conglomerate feeds together?
		 */
		o.loadSampleFeed = function( socialnetwork, type, sample ) {
			var defer = $q.defer();
			// alert("right now this doesnt do anything to the DOM.\nbut you can check your console.logs");
			//console.log('getSampleFeed for [ '+ socialnetwork +' ][ '+ type +' ][ '+ sample +' ] ?');
			o.getSampleFeed( socialnetwork, type, sample ).then(function(result) {
				var ar = [];
				//console.log('social search complete');
				//console.log(result);
				// translate response objects to a more general form
				switch ( socialnetwork ) {
					case 'twitter':
						// cleanup twitter response objects & push to news
						// think this could maybe be a different better iterator
						var c = result.data.length;
						for ( var i = 0; i < c; i++ ) {
							var obj = o.generalizeTwitterObject( result.data[i] );
							ar.push(obj);
						}
						break;
					case 'instagram':
						var c = result.data.data.length; // yes double data
						for ( var i = 0; i < c; i++ ) {
							var obj = o.generalizeInstagramObject( result.data.data[i] );
							ar.push(obj);
						}
						break;
				}
				// pass the data back upstream
				defer.resolve( ar );
			},
			function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};
		/**
		 * set $scope with (fake) array of results from twitter list + ?
		 */
		o.loadSampleNews = function( scope ) {
			// only load if its not been loaded yet
			if ( angular.isArray( scope.newsfeed ) === false ) {
				// initialize
				scope.newsLoaded = false;
				scope.newsfeed = [];
				o.loadSampleFeed( 'twitter', 'list' ).then(
					function( data ) {
						scope.newsfeed = data;
						//console.log(':: NEWS FEED LOADED ::');
						//console.log(scope.newsfeed);
						scope.newsLoaded = true;
					},
					function( err ) {
						console.log('Error loading sample news : '+ err.message);
					}
				);
			}
		};
		/**
		 * given an object returned from Twitter, generalize it in to a more standard format
		 *
		 * #todo :
		 * deeplinking between feed item object & markers?!
		 * distance from current location
		 * replace entities in body with links ?
		 * replace prettyTime with "time ago" ?
		 */
		o.generalizeTwitterObject = function( twobj ) {
			var parsedate = new Date( Date.parse( twobj.created_at ) );
			var obj = {
				body: twobj.text,
				entities: twobj.entities,
				img: false,
				originID: twobj.id_str,
				source: 'Twitter',
				sourceLink: 'https://twitter.com/'+ twobj.user.screen_name +'/status/'+ twobj.id_str, 
				timestamp: parsedate.getTime(),
				prettyTime: parsedate.toLocaleDateString() +' '+ parsedate.toLocaleTimeString(),
				user: twobj.user, // for now
			};
			return obj;
		};
		// generalize an instagram object too
		o.generalizeInstagramObject = function ( insta ) {
			var timestamp = insta.created_time * 1000; // instagram time is in seconds not ms
			var parsedate = new Date( timestamp );
			var img = insta.images.standard_resolution.url;
			var caption = angular.isObject(insta.caption) ? insta.caption.text : '';
			// #todo : probably make this better HTML / styling?
			var body = '<a href="'+ insta.link +'" target="_blank"><img src="'+ img +'" alt=""></a><br />' + caption;
			
			var obj = {
				body: body,
				entities: insta.tags,
				img: img,
				originID: insta.id,
				source: 'Instagram',
				sourceLink: insta.link, 
				timestamp: timestamp,
				prettyTime: parsedate.toLocaleDateString() +' '+ parsedate.toLocaleTimeString(),
				user: {
					name: insta.user.full_name,
					profile_image_url: insta.user.profile_picture,
					screen_name: insta.user.username,
				},
			};
			return obj;
		};
		/**
		 * foursquare search API for a name query string + near address
		 * something like
		 * client_id={client_id}&ll=32.78997072, -117.2557908&query=Amplified Ale Works&v=20140806&m=swarm'
		 */
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
		// given a marker location object, call the $http GET foursquareSearchCall
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
		// return our factory
		return o;
	}
})();