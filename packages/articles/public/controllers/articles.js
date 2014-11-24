'use strict';

angular.module('mean.articles').controller('ArticlesController', ['$scope', '$stateParams', '$location', '$window', 'Global', 'Articles', 'Places', 'PlacesFromSpreadsheet', 'uiGmapGoogleMapApi',
  function($scope, $stateParams, $location, $window, Global, Articles, Places, PlacesFromSpreadsheet, GoogleMapApi) {
    $scope.global = Global;
	// map marker icons?!
	var icon_reddot = '/articles/assets/img/dot-red.png';
	//var icon_bluedot = '/articles/assets/img/dot-blue.png';
	
    $scope.hasAuthorization = function(article) {
      if (!article || !article.user) return false;
      return $scope.global.isAdmin || article.user._id === $scope.global.user._id;
    };

    $scope.create = function(isValid) {
      if (isValid) {
        var article = new Articles({
          title: this.title,
          content: this.content
        });
        article.$save(function(response) {
          $location.path('articles/' + response._id);
        });

        this.title = '';
        this.content = '';
      } else {
        $scope.submitted = true;
      }
    };

    $scope.remove = function(article) {
      if (article) {
        article.$remove(function(response) {
          for (var i in $scope.articles) {
            if ($scope.articles[i] === article) {
              $scope.articles.splice(i, 1);
            }
          }
          $location.path('articles');
        });
      } else {
        $scope.article.$remove(function(response) {
          $location.path('articles');
        });
      }
    };

    $scope.update = function(isValid) {
      if (isValid) {
        var article = $scope.article;
        if (!article.updated) {
          article.updated = [];
        }
        article.updated.push(new Date().getTime());

        article.$update(function() {
          $location.path('articles/' + article._id);
        });
      } else {
        $scope.submitted = true;
      }
    };

    $scope.find = function() {
		$scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 8 };
      Articles.query(function(articles) {
        $scope.articles = articles;
      });
    };
	
    $scope.mainmap = function() {
		$scope.map = {center: {latitude: 32.95, longitude: -117 }, zoom: 10, bounds: {}, control: {}, markerControl: {} };
		$scope.options = {};//scrollwheel: false};
		$scope.coordsUpdates = 0;
		$scope.dynamicMoveCtr = 0;
		
		$scope.highlightPlace = $scope.highlightNumber = false;
		$scope.markers = [];
		//	Map Styles : not sure how to inject otherwise..
		$scope.styles = [{'featureType':'water','elementType':'all','stylers':[{'hue':'#e9ebed'},{'saturation':-78},{'lightness':67},{'visibility':'simplified'}]},{'featureType':'landscape','elementType':'all','stylers':[{'hue':'#ffffff'},{'saturation':-100},{'lightness':100},{'visibility':'simplified'}]},{'featureType':'road','elementType':'geometry','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':31},{'visibility':'simplified'}]},{'featureType':'poi','elementType':'all','stylers':[{'hue':'#ffffff'},{'saturation':-100},{'lightness':100},{'visibility':'off'}]},{'featureType':'road.local','elementType':'geometry','stylers':[{'hue':'#e9ebed'},{'saturation':-90},{'lightness':-8},{'visibility':'simplified'}]},{'featureType':'transit','elementType':'all','stylers':[{'hue':'#e9ebed'},{'saturation':10},{'lightness':69},{'visibility':'on'}]},{'featureType':'administrative.locality','elementType':'all','stylers':[{'hue':'#2c2e33'},{'saturation':7},{'lightness':19},{'visibility':'on'}]},{'featureType':'road','elementType':'labels','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':31},{'visibility':'on'}]},{'featureType':'road.arterial','elementType':'labels','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':-2},{'visibility':'simplified'}]}];
		
		/**
         * SUCCESS!! GoogleMapApi is a promise with then callback of google.maps obj
         */
        GoogleMapApi.then(function(maps) {
			// trigger gmap.resize when windows resize
			var w = angular.element($window);
			w.bind('resize', function() {
				var gmapd = $scope.map.control.getGMap();
				maps.event.trigger( gmapd, 'resize' );
			});
			
			setTimeout(function() {
				var gmapd = $scope.map.control.getGMap();
				// on home screen, add some map listener(s)
				$scope.refilterTimeout = null;
				$scope.refilter = function() {
					var gmapd = $scope.map.control.getGMap();
					var bounds = gmapd.getBounds();
					// get the 2 boundary corners LatLng objects from the bounds
					// https://developers.google.com/maps/documentation/javascript/reference#LatLngBounds
					var ne = bounds.getNorthEast();
					var sw = bounds.getSouthWest();
					// combine in to 1 object to send to the server
					var bounds_corners = ne.toString() +','+ sw.toString();
					//console.log(':: map bounds update ::');
					//console.log(bounds_corners);
					//console.log(':: querying Places now?! ::');
					Places.query({
						articleId: bounds_corners
					}, function(newplaces) {
						//console.log('queried Places : got :');
						//console.log(places);
						var newmarkers = [];
						angular.forEach(newplaces, function( marker, k ) {
							// set our default icon here?!
							marker.icon = icon_reddot;
							
							newmarkers.push(marker);
						});
						$scope.markers = newmarkers;
						//console.log('-- markers : ');
						//console.log($scope.markers);
					});
				};
				// listen when the center has manually been moved
				$scope.mapMoveListener = maps.event.addListener(gmapd, 'center_changed', function() {
					clearTimeout( $scope.refilterTimeout );
					// add throttled call to filter map markers in the area
					$scope.refilterTimeout = setTimeout( $scope.refilter, 200 );
				});
				$scope.mapZoomListener = maps.event.addListener(gmapd, 'zoom_changed', function() {
					clearTimeout( $scope.refilterTimeout );
					// add throttled call to filter map markers in the area
					$scope.refilterTimeout = setTimeout( $scope.refilter, 200 );
				});
				// initial check for markers in the area, too
				$scope.refilterTimeout = setTimeout( $scope.refilter, 100 );
				
				Places.query({
					articleId: 'findbad'
				}, function(newplaces) {
					//console.log('queried Places : got :');
					//console.log(places);
					var badmarkers = [];
					
					angular.forEach(newplaces, function( marker, k ) {
						// set our default icon here?!
						if ( !marker.hasOwnProperty('lat') || !marker.hasOwnProperty('lng') ) {
							badmarkers.push(marker);
						}
					});
					$scope.badMarkers = badmarkers;
					if ( badmarkers.length > 0 ) {
						placeCheckStep();
					}
					//console.log('-- markers : ');
					//console.log($scope.markers);
				});
			}, 400);
			
			var geocoder = new maps.Geocoder();
			function placeCheckStep() {
				if ( $scope.badMarkers.length > 0 ) {
					var marker = $scope.badMarkers.shift();
					var addr = marker.fullAddr;
					if ( addr === ', ,  ' ) {
						console.log('address totally blank for '+ marker.name +' '+ marker.sublocation);
						// and repeat
						setTimeout(placeCheckStep, 300);
					} else {
						console.log('geocoding for '+ marker.name + ' (which was missing its lat lng in the db) : ' + addr);
						geocoder.geocode( { 'address': addr }, function(results, status) {
							if (status === maps.GeocoderStatus.OK) {
								var newlatlng = results[0].geometry.location;
								console.log(newlatlng.toString());
								marker.lat = parseFloat( newlatlng.lat() );
								marker.lng = parseFloat( newlatlng.lng() );
								marker.comment = 'should lat lng update to '+ marker.lat +','+ marker.lng + ' but can\'t figure out the save/update';
								/*
								Places.update(
									{ _id: marker.id },
									{
										lat: 10,
										lng: 20
									},
									{},
									function( err, numAffected ) {
										console.log('lat lng update saved for '+ marker.name +' #' + marker.id +' = updated '+ numAffected);
									}
								);
								*/
								console.log(marker);
							} else {
								console.log('Geocode was not successful for the following reason: ' + status);
							}
							// and repeat
							//setTimeout(placeCheckStep, 300);
						});
					}
				}
			}
		});
		
		// set up our click / mouse events?
		$scope.markerClick = function( result, event ) {
			// can't figure out how to run a filter soooooooo
			var clickedon = false;
			angular.forEach( $scope.markers, function( item, n ) {
				if ( item.id === result.key ) {
					clickedon = item;
					$scope.highlightNumber = n;
				}
			});
			$scope.highlightPlace = clickedon;
			console.log('clicked #'+ $scope.highlightNumber +' = _id: '+ result.key +' : '+ clickedon.fullName);
			// #todo : now somehow social factory to get couple feed items from server?!
		};
		$scope.markerMouseOver = function( result, event ) {
			// in case we want to change color on rollover or do something
			//console.log('markerMouseOver '+ result.key);
		};
		$scope.markerMouseOut = function( result, event ) {
			// the opposite of mouseover
			//console.log('markerMouseOut '+ result.key);
		};
		$scope.clickEventsObject = {
			click: $scope.markerClick,
			mouseover: $scope.markerMouseOver,
			mouseout: $scope.markerMouseOut,
		};
    };
	
    $scope.findOne = function() {
      Articles.get({
        articleId: $stateParams.articleId
      }, function(article) {
        $scope.article = article;
      });
    };
  }
]);
