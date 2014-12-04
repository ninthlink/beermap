'use strict';

angular.module('mean.articles').controller('ArticlesController', ['$scope', '$rootScope', '$stateParams', '$location', '$window', 'Global', 'Articles', 'Places', 'Feeds', 'PlacesFromSpreadsheet', 'uiGmapGoogleMapApi',
  function($scope, $rootScope, $stateParams, $location, $window, Global, Articles, Places, Feeds, PlacesFromSpreadsheet, GoogleMapApi ) {
    $scope.global = Global;
    // map marker icons?!
    var icon_reddot = '/articles/assets/img/dot-red.png';
    $scope.bluedot = '/articles/assets/img/dot-blue.png';
    $scope.hideDistances = true;
    $rootScope.myCoords = false;
    
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
      $scope.uiRoute = 'map';
      $scope.map = {center: {latitude: 32.95, longitude: -117 }, zoom: 10, bounds: {}, control: {}, markerControl: {} };
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
              });
              $scope.markers = newmarkers;
              $scope.loaded = true;
              //console.log('-- markers : ');
              //console.log($scope.markers);
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
          function geo_success(position) {
            $scope.$apply(function(){
              $rootScope.myCoords = position.coords;
            });
            // clear the watchPosition at least for now
            $window.navigator.geolocation.clearWatch($scope.geolocationwatchID);
          }
          function geo_error(err){
            console.log('eee geolocation error');
            console.log(err);
            $rootScope.myCoords = false;
          }
          $scope.geolocationwatchID = $window.navigator.geolocation.watchPosition( geo_success, geo_error, { enableHighAccuracy: false });

          // listen to when we are leaving this View to go to a different one
          $scope.$on( '$destroy', function() {
            // wipe the refilterTimeout just in case
            clearTimeout( refilterTimeout );
            // wipe whatever the "on" highlightPlace may have been
            $scope.unhighlight();
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
            $window.navigator.geolocation.clearWatch($scope.geolocationwatchID);
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
      
      $scope.unhighlight = function() {
        if ( $scope.loaded ) {
          // remove the highlightPlace
          delete $rootScope.highlightPlace;
        }
      };
    };
	
    $scope.findOne = function() {
      Articles.get({
        articleId: $stateParams.articleId
      }, function(article) {
        $scope.article = article;
      });
    };
    
    $scope.loadFeed = function() {
      $scope.newsLoaded = false;
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
        $scope.newsLoaded = true;
      });
    };
    
    $scope.loadHighlightPlaceFeed = function() {
      $rootScope.highlightPlace.newsLoading = true;
      Feeds.query({
        'articleId': $rootScope.highlightPlace._id
      }, function(items) {
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
        //console.log('Feed loaded?!');
        //console.log(news);
        $rootScope.highlightPlace.newsLoading = false;
        $rootScope.highlightPlace.newsFeed = news;
        $rootScope.highlightPlace.noNews = !news.length;
      });
    };
    
    $scope.goBackToMap = function( highlightPlace ) {
      $rootScope.highlightPlace = highlightPlace;
      $location.path('map');
      return false;
    };
  }
]);
