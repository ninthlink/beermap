'use strict';

angular.module('mean.articles').controller('ArticlesController', ['$scope', '$stateParams', '$location', '$window', 'Global', 'Articles', 'Places', 'PlacesFromSpreadsheet', 'uiGmapGoogleMapApi',
  function($scope, $stateParams, $location, $window, Global, Articles, Places, PlacesFromSpreadsheet, GoogleMapApi) {
    $scope.global = Global;

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
		$scope.map = {center: {latitude: 32.95, longitude: -117 }, zoom: 10, control: {}, markerControl: {} };
		$scope.options = {};//scrollwheel: false};
		$scope.coordsUpdates = 0;
		$scope.dynamicMoveCtr = 0;
		//	Map Styles : not sure how to inject otherwise..
		$scope.styles = [{'featureType':'water','elementType':'all','stylers':[{'hue':'#e9ebed'},{'saturation':-78},{'lightness':67},{'visibility':'simplified'}]},{'featureType':'landscape','elementType':'all','stylers':[{'hue':'#ffffff'},{'saturation':-100},{'lightness':100},{'visibility':'simplified'}]},{'featureType':'road','elementType':'geometry','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':31},{'visibility':'simplified'}]},{'featureType':'poi','elementType':'all','stylers':[{'hue':'#ffffff'},{'saturation':-100},{'lightness':100},{'visibility':'off'}]},{'featureType':'road.local','elementType':'geometry','stylers':[{'hue':'#e9ebed'},{'saturation':-90},{'lightness':-8},{'visibility':'simplified'}]},{'featureType':'transit','elementType':'all','stylers':[{'hue':'#e9ebed'},{'saturation':10},{'lightness':69},{'visibility':'on'}]},{'featureType':'administrative.locality','elementType':'all','stylers':[{'hue':'#2c2e33'},{'saturation':7},{'lightness':19},{'visibility':'on'}]},{'featureType':'road','elementType':'labels','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':31},{'visibility':'on'}]},{'featureType':'road.arterial','elementType':'labels','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':-2},{'visibility':'simplified'}]}];
		
		$scope.markers = [];
		
		/**
         * SUCCESS!! GoogleMapApi is a promise with a
         * then callback of the google.maps object
         *   @pram: maps = google.maps
         */
        GoogleMapApi.then(function(maps) {
			// trigger gmap.resize when windows resize
			var w = angular.element($window);
			w.bind('resize', function() {
				var gmapd = $scope.map.control.getGMap();
				maps.event.trigger(gmapd, "resize");
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
					$scope.markers = [];
					Places.query({
						articleId: bounds_corners
					}, function(places) {
						//console.log('queried Places : got :');
						//console.log(places);
						angular.forEach(places, function( marker, k ) {
							marker.coords = {
								latitude: marker.latitude,
								longitude: marker.longitude
							};
							marker.id = k;
							$scope.markers.push(marker);
						});
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
			}, 400);
		});
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
