'use strict';

angular.module('mean.articles').controller('ArticlesController', ['$scope', '$rootScope', '$stateParams', '$location', '$window', '$http', 'Global', 'Articles', 'Places', 'Feeds', 'PlacesFromSpreadsheet', 'uiGmapGoogleMapApi',
  function($scope, $rootScope, $stateParams, $location, $window, $http, Global, Articles, Places, Feeds, PlacesFromSpreadsheet, GoogleMapApi ) {
    $scope.global = Global;
    // map marker icons?!
    var icon_reddot = '/articles/assets/img/dot-red.png';
    $scope.bluedot = '/articles/assets/img/dot-blue.png';
    $scope.hideDistances = true;
    $rootScope.myCoords = false;
    
    // (outdated) check if user is able to access an Article?!
    $scope.hasAuthorization = function(article) {
      if (!article || !article.user) return false;
      return $scope.global.isAdmin || article.user._id === $scope.global.user._id;
    };
    // (outdated) create a new Article
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
    // (outdated) delete/remove an Article
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
    // (outdated) update an Article
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
    // (outdated) "find" articles, with a map. why?!
    $scope.find = function() {
      $scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 8 };
      Articles.query(function(articles) {
        $scope.articles = articles;
      });
    };
    // main function called by the main /public/views/map.html template
    $scope.mainmap = function() {
      $scope.uiRoute = 'map';
      $scope.map = {center: {latitude: 32.93, longitude: -117.16 }, zoom: 10, bounds: {}, control: {}, markerControl: {} };
      $scope.options = { mapTypeControl: false, panControl: false, streetViewControl: false, zoomControl: false };//scrollwheel: false};
      $scope.coordsUpdates = 0;
      $scope.dynamicMoveCtr = 0;
      
      $scope.markers = [];
      $scope.loaded = false;
      
      if ( $rootScope.hasOwnProperty('previousMapZoom') ) {
        $scope.map.zoom = $rootScope.previousMapZoom;
      }
      if ( $rootScope.hasOwnProperty('previousMapCenter') ) {
        $scope.map.center = $rootScope.previousMapCenter;
      }
      
      if ( $rootScope.hasOwnProperty('highlightPlace') ) {
        // re-center map at that place?
        $scope.map.center = {
          latitude: $rootScope.highlightPlace.latitude,
          longitude: $rootScope.highlightPlace.longitude
        };
        // zoom in a bit?
        $scope.map.zoom = 12;
      }
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
        
        $rootScope.distanceMatrixService = new maps.DistanceMatrixService();
        // really initialize 400ms after gmap, which should be enough time
        setTimeout(function() {
          var gmapd = $scope.map.control.getGMap();
          // on home screen, add some map listener(s)
          var refilterTimeout = null;
          var refilter = function() {
            // get the 2 boundary corners LatLng objects from the bounds
            var bounds = gmapd.getBounds();
            // https://developers.google.com/maps/documentation/javascript/reference#LatLngBounds
            var ne = bounds.getNorthEast();
            var sw = bounds.getSouthWest();
            // combine in to 1 String to pass to server
            var bounds_corners = ne.toString() +','+ sw.toString();
            // and then query to find all Places within current bounds
            Places.query({
              articleId: bounds_corners
            }, function(newplaces) {
              // check to reset old marker?
              var oldhighlight_id = false;
              if ( $rootScope.hasOwnProperty( 'highlightPlace' ) ) {
                oldhighlight_id = $rootScope.highlightPlace._id;
              }
              //console.log('queried Places : got :');
              //console.log(places);
              var newmarkers = [];
              var latlngs = [];
              var morelatlngs = [];
              var latlngloopcount = 0;
              angular.forEach(newplaces, function( marker, k ) {
                // set our default icon here?!
                marker.icon = icon_reddot;
                if ( oldhighlight_id === marker._id ) {
                  //marker.icon = icon_bluedot;
                  $rootScope.highlightPlace = marker;
                  $scope.highlightPlaceHasImg = ( marker.twit.img !== '' );
                  $scope.loadHighlightPlaceFeed();
                }
                newmarkers.push(marker);
                // create LatLng object too for distance calculating
                latlngs.push( new maps.LatLng( marker.latitude, marker.longitude ) );
              });
              $scope.markers = newmarkers;
              $scope.loaded = true;
              //console.log('-- markers : ');
              //console.log($scope.markers);
              // recalculate distances too
              if ( ( $rootScope.myCoords !== false ) && ( newmarkers.length > 0 ) ) {
                var myLatLng = new maps.LatLng( $rootScope.myCoords.latitude, $rootScope.myCoords.longitude );
                
                if ( latlngs.length > 25 ) {
                  // actually can only calc up to 25 distances at a time
                  morelatlngs = latlngs.slice( 25 );
                  latlngs = latlngs.slice( 0, 25 );
                }
                // set up as a quick little function so we can recurse loop
                $scope.recalcDistances = function() {
                  $rootScope.distanceMatrixService.getDistanceMatrix({
                    origins: [ myLatLng ],
                    destinations: latlngs,
                    travelMode: maps.TravelMode.DRIVING,
                    unitSystem: maps.UnitSystem.IMPERIAL,
                    avoidHighways: false,
                    avoidTolls: false
                  }, function( response, status ) {
                    if (status !== maps.DistanceMatrixStatus.OK) {
                      console.log('Distance Matrix Error was: ' + status);
                      $scope.hideDistances = true;
                    } else {
                      // success!
                      angular.forEach( response.rows[0].elements, function( d, k ) {
                        var ind = ( 25 * latlngloopcount ) + k;
                        $scope.markers[ ind ].distance = d.distance.text;
                      });
                      $scope.hideDistances = false;
                      // see about looping
                      if ( morelatlngs.length > 0 ) {
                        latlngs = morelatlngs.slice( 0, 25 );
                        morelatlngs = morelatlngs.slice( 25 );
                        latlngloopcount += 1;
                        $scope.recalcDistances();
                      }
                    }
                  });
                };
                // and fire it
                $scope.recalcDistances();
              } else {
                // we don't have current user's location so hide all distances?
                $scope.hideDistances = true;
              }
            });
          };
          
          // throttle the refilter call so we don't call the server too much
          var refilterThrottle = function() {
            clearTimeout( refilterTimeout );
            // add throttled call to filter map markers in the area
            refilterTimeout = setTimeout( refilter, 200 );
            // and unhighlight if there is one?
            $scope.unhighlight();
          };
          // listen for map center/zoom : this returns an object but
          maps.event.addListener( gmapd, 'center_changed', refilterThrottle );
          maps.event.addListener( gmapd, 'zoom_changed', refilterThrottle );
          // initial check for markers in the area, too
          refilterThrottle();
          // add map click listener to close the highlight?
          maps.event.addListener( gmapd, 'click', function( event ) {
            //console.log('clicked ::');
            //console.log(event);
            // close the current highlight
            $scope.unhighlight();
            $scope.$apply();
          });
          // geolocation
          $scope.getGeolocation();

          // listen to when we are leaving this View to go to a different one
          $scope.$on( '$destroy', function() {
            // wipe the refilterTimeout just in case
            clearTimeout( refilterTimeout );
            // wipe whatever the "on" highlightPlace may have been
            //$scope.unhighlight();
            // save the current map center
            var mapcenter = gmapd.getCenter();
            $rootScope.previousMapCenter = {
              latitude: mapcenter.lat(),
              longitude: mapcenter.lng(),
            };
            // save current map zoom too
            $rootScope.previousMapZoom = gmapd.getZoom();
            // wipe map event listeners too?
            maps.event.clearListeners( gmapd );
            // question : should we cache markers as we cache map settings?
            $window.navigator.geolocation.clearWatch($scope.geoWatch);
          });
        }, 400);
      });
      
      // set up our click / mouse events?
      $scope.markerClick = function( result, event ) {
        // can't figure out how to run a filter soooooooo
        angular.forEach( $scope.markers, function( marker, n ) {
          if ( marker.id === result.key ) {
            $rootScope.highlightPlace = marker;
            $scope.highlightPlaceHasImg = ( marker.twit.img !== '' );
            $scope.loadHighlightPlaceFeed();
          }
        });
        //console.log('clicked _id '+ result.key +' : '+ $rootScope.highlightPlace.nameFull);
        // #todo : now somehow social factory to get couple feed items from server?!
      };
      $scope.clickEventsObject = {
        click: $scope.markerClick
        /*,
        mouseover: $scope.markerMouseOver,
        mouseout: $scope.markerMouseOut,
        */
      };
    };
    // if a Place was set as $rootScope.highlightPlace, wipe it out
    $scope.unhighlight = function() {
      if ( $scope.loaded ) {
        // remove the highlightPlace
        delete $rootScope.highlightPlace;
      }
    };
    // find one article, given an articleId
    $scope.findOne = function() {
      Articles.get({
        articleId: $stateParams.articleId
      }, function(article) {
        $scope.article = article;
      });
    };
    // main function for /feed aka "latest feed" aka articles/views/feed.html
    $scope.loadFeed = function() {
      $scope.newsLoading = true;
      $scope.newsFeed = [];
      Feeds.query(function(items) {
        var news = [];
        angular.forEach(items, function( item, n ) {
          item.bodyClass = 'media-body';
          if ( item.img ) {
            item.hasMedia = true;
            item.bodyClass += ' has-media';
          } else {
            item.hasMedia = false;
          }
          news.push(item);
        });
        
        $scope.newsFeed = news;
        $scope.newsLoading = false;
        $scope.noNews = !news.length;
        $scope.loaded = !$scope.newsLoading;
        // quick fix for BEER-49
        // check distances?
        $scope.unhighlight();
        //console.log('Feed loaded : check distances for..');
        //console.log($scope.newsFeed);
        if ( !$scope.noNews ) {
          GoogleMapApi.then(function(maps) {
            // need to wait for GoogleMaps to be ready..
            $rootScope.distanceMatrixService = new maps.DistanceMatrixService();
            // check distance after geolocation is there
            $scope.$on('geolocation set', function(event, data) {
              //console.log('geolocation set : load distances?');
              // with no pagination, we know 0 < # of items <= 20
              if ( $rootScope.myCoords !== false ) {
                // recalc distances
                var myLatLng = new maps.LatLng( $rootScope.myCoords.latitude, $rootScope.myCoords.longitude );
                var latlngs = [];
                angular.forEach( $scope.newsFeed, function( item, n ) {
                  // create LatLng object for distance calculating
                  latlngs.push( new maps.LatLng( item.author.lat, item.author.lng ) );
                });
                //console.log('check distances from '+ myLatLng +' to :');
                //console.log(latlngs);
                /**
                 * if we had pagination/infiniteScroll & more than 25 items
                 * then would need something more like $scope.recalcDistances
                 * from $scope.mainmap function above. but now, just
                 */
                $rootScope.distanceMatrixService.getDistanceMatrix({
                  origins: [ myLatLng ],
                  destinations: latlngs,
                  travelMode: maps.TravelMode.DRIVING,
                  unitSystem: maps.UnitSystem.IMPERIAL,
                  avoidHighways: false,
                  avoidTolls: false
                }, function( response, status ) {
                  //console.log('DISTANCE MATRIX RESPONSE');
                  //console.log(response.rows[0].elements);
                  if (status !== maps.DistanceMatrixStatus.OK) {
                    console.log('gMaps Distance Matrix Error ' + status);
                    $scope.hideDistances = true;
                  } else {
                    // success!
                    angular.forEach( response.rows[0].elements, function( d, k ) {
                      $scope.newsFeed[ k ].author.distance = d.distance.text;
                    });
                    $scope.hideDistances = false;
                    $scope.$apply();
                  }
                });
              }
            });
            // getGeolocation will trigger $on('geolocation set' above
            $scope.getGeolocation();
          });
        }
      });
    };
    // assuming $rootScope.highlightPlace = some Place, load that Feed
    $scope.loadHighlightPlaceFeed = function() {
      // wipe old info before we re query
      delete $rootScope.highlightPlace.newsFeed;
      $rootScope.highlightPlace.newsLoading = true;
      $rootScope.highlightPlace.noNews = false;
      // re query
      var query = $rootScope.highlightPlace._id;
      if ( $rootScope.highlightPlace.hasOwnProperty('main_loc') ) {
        query += ','+ $rootScope.highlightPlace.main_loc;
      }
      Feeds.query({
        'articleId': query
      }, function(items) {
        if ( items.length ) {
          var news = [];
          angular.forEach(items, function( item, n ) {
            item.bodyClass = 'media-body';
            if ( item.img ) {
              item.hasMedia = true;
              item.bodyClass += ' has-media';
            } else {
              item.hasMedia = false;
            }
            news.push(item);
          });
          $rootScope.highlightPlace.newsLoading = false;
          $rootScope.highlightPlace.noNews = false;
          $rootScope.highlightPlace.newsFeed = news;
        } else {
          $rootScope.highlightPlace.noNews = true;
        }
      });
    };
    // html5 browser geolocation & emit an event when its set
    $scope.getGeolocation = function() {
      function geo_success(position) {
        $scope.$apply(function(){
          $rootScope.myCoords = position.coords;
          $scope.$emit('geolocation set', position.coords);
        });
        // clear the watchPosition at least for now
        $window.navigator.geolocation.clearWatch($scope.geoWatch);
      }
      function geo_error(err){
        console.log('eee geolocation error');
        console.log(err);
        $rootScope.myCoords = false;
      }
      $scope.geoWatch = $window.navigator.geolocation.watchPosition(
        geo_success,
        geo_error,
      {
        enableHighAccuracy: false
      });
    };
    // calculate distance from provided myCoords to the current highlightPlace
    $scope.loadHighlightDistance = function(maps) {
      if ( $rootScope.hasOwnProperty('highlightPlace') ) {
        if ( !$rootScope.highlightPlace.distance ) {
          if ( $rootScope.myCoords !== false ) {
            // recalc distance for this 1 place
            var myLatLng = new maps.LatLng( $rootScope.myCoords.latitude, $rootScope.myCoords.longitude );
            var dLatLng = new maps.LatLng( $rootScope.highlightPlace.latitude, $rootScope.highlightPlace.longitude );
            //console.log( 'calc distance from '+ myLatLng +' to '+ dLatLng );
            $rootScope.distanceMatrixService.getDistanceMatrix({
              origins: [ myLatLng ],
              destinations: [ dLatLng ],
              travelMode: maps.TravelMode.DRIVING,
              unitSystem: maps.UnitSystem.IMPERIAL,
              avoidHighways: false,
              avoidTolls: false
            }, function( response, status ) {
              if (status !== maps.DistanceMatrixStatus.OK) {
                console.log('Distance Matrix Error was: ' + status);
                $scope.hideDistances = true;
              } else {
                // success!
                //console.log('DISTANCE SUCCESS');
                $rootScope.highlightPlace.distance = response.rows[0].elements[0].distance.text;
                $scope.hideDistances = false;
              }
            });
          }
        }
      }
    };
    // main function for /place/{slug} to load a Place details view
    $scope.placeDetails = function() {
      $rootScope.bodyClass = 'place-details';
      $scope.loaded = false;
      var requery = true;
      if ( $rootScope.hasOwnProperty('highlightPlace') ) {
        if ( $rootScope.highlightPlace.slug === $stateParams.articleId ) {
          // for example, coming from map overlay, we should be already all set
          requery = false;
        }
      }
      // in the event we need to (re)load / (re)calculate distance to place..
      GoogleMapApi.then(function(maps) {
        // need to wait for GoogleMaps to be ready..
        $rootScope.distanceMatrixService = new maps.DistanceMatrixService();
        // check distance after geolocation is there
        $scope.$on('geolocation set', function(event, data) {
          //console.log('geolocation set : load distance');
          $scope.loadHighlightDistance( maps );
        });
        // only GET the details if we don't already have them
        if ( requery ) {
          Places.get({
            articleId: $stateParams.articleId
          }, function(place) {
            $rootScope.highlightPlace = place;
            $scope.loaded = true;
            // load place's latest news feed too
            $rootScope.highlightPlace.newsLoading = true;
            $scope.loadHighlightPlaceFeed();
            // check geoloc : will auto trigger the loadHighlightDistance call
            $scope.getGeolocation();
          });
        } else {
          $scope.loaded = true;
          // reload news anyways just in case
          $rootScope.highlightPlace.newsLoading = true;
          $scope.loadHighlightPlaceFeed();
          // check geoloc : will auto trigger the loadHighlightDistance call
          $scope.getGeolocation();
        }
      });
      $scope.$on( '$destroy', function() {
        // when we leave this view, reset
        $scope.unhighlight();
        // and remove our "place-details" body class..
        $rootScope.bodyClass = '';
      });
    };
    // go back to the main "map" view, optionally with a Place overlay open
    $scope.goBackToMap = function( highlightPlace ) {
      $rootScope.highlightPlace = highlightPlace;
      $location.path('map');
      return false;
    };
    // redirect to Place details
    $scope.goToDetails = function() {
      $location.path('/places/'+ $rootScope.highlightPlace.slug);
      return false;
    };
    // main function for /contact setup
    $scope.contactForm = function() {
      // initialize formData
      $scope.formData = {};
      $scope.message = '';
      $scope.error = '';
      $scope.submitting = false;
      $scope.bear = false;
      $scope.year = new Date().getFullYear();
      // contact form submit handler
      $scope.processContact = function() {
        $scope.error = '';
        $scope.message = '';
        $scope.submitting = true;
        //console.log($scope.formData);
        // #todo : front-side VALIDATION before sending?!
        $http
        .post('/contact', $scope.formData)
        .success(function(data) {
          //console.log(data);
          if (data.err) {
            // if not successful, bind error message to error
            $scope.error = data.msg;
          } else {
            // if successful, bind success message to message
            $scope.message = data.msg;
            // and wipe formData?
            $scope.formData = {};
          }
          // hide submitting after another slight delay
          $scope.submitting = false;
        });
      };
    };
  }
]);